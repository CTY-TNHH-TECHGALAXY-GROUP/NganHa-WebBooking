// ═══════════════════════════════════════
// BookingForm Logic Hook — v2 (Curator Redesign)
// Intent filter + Accordion + Multi-service selection
// ═══════════════════════════════════════

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Service } from '@/types';
import { fetchServices } from '@/data/services';
import { BRANCH_LIST } from '@/data/branches';
import {
  GroupedService,
  DurationVariant,
  groupServices,
  getGroupedServiceName,
} from '@/lib/groupServices';
import { INTENT_FILTERS, IntentKey } from '@/data/categoryImages';

// 🔧 CONFIGURATION
const MAX_GUESTS = 10;
const MIN_GUESTS = 1;
const TOTAL_STEPS = 3; // Step 1 = Services, Step 2 = Details, Step 3 = Confirm
const ALL_CATEGORY = 'all';

/** One selected service = grouped service + chosen variant */
export type ServiceCustomOptions = {
  bodyParts: { focus: string[]; avoid: string[] };
  strength?: 'light' | 'medium' | 'strong';
  therapist: 'male' | 'female' | 'random';
  notes: string;
};

export type SelectedServiceItem = {
  groupKey: string;
  variantId: string;
  name: string;
  duration: number;
  priceVND: number;
  priceUSD: number;
  quantity: number;
  customOptions?: ServiceCustomOptions;
};

export type StaffGender = 'any' | 'male' | 'female';
export type CustomerLang = 'vi' | 'en' | 'ko' | 'zh' | 'jp';

export type BookingFormData = {
  selectedServices: SelectedServiceItem[];
  branchId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  guests: number;
  staffGender: StaffGender;
  lang: CustomerLang;
  agreeTerms: boolean;
};

export type BookingSummary = {
  services: SelectedServiceItem[];
  totalDuration: number;
  totalPriceVND: number;
  totalPriceUSD: number;
  date: string;
  time: string;
  branchName: string;
  guests: number;
  staffGender: StaffGender;
};

export type BookingResult = {
  bookingId: string;
  billCode: string;
  customerName: string;
  customerPhone: string | null;
  date: string;
  time: string;
  branchName: string;
  services: SelectedServiceItem[];
  totalAmount: number;
  lang: CustomerLang;
};

export const useBookingForm = () => {
  // ─── Raw Services ───
  const [rawServices, setRawServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // ─── Intent Filter (Curator concept - B) ───
  const [intentFilter, setIntentFilterState] = useState<IntentKey | null>(null);
  const [hasPassedIntentScreen, setHasPassedIntentScreen] = useState(false);

  // ─── Accordion: only 1 category open at a time ───
  const [openCategoryKey, setOpenCategoryKey] = useState<string | null>(null);
  const [activeServiceForSheet, setActiveServiceForSheet] = useState<GroupedService | null>(null);

  // ─── Step State ───
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);

  // ─── Form State ───
  const [formData, setFormData] = useState<BookingFormData>({
    selectedServices: [],
    branchId: BRANCH_LIST[0]?.id || '',
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    note: '',
    guests: 1,
    staffGender: 'any',
    lang: 'vi',
    agreeTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Grouped Services ───
  const groupedServices = useMemo(() => groupServices(rawServices), [rawServices]);

  // ─── All Categories ───
  const categories = useMemo(() => {
    const cats = [...new Set(groupedServices.map(g => g.category))];
    return cats.sort();
  }, [groupedServices]);

  // ─── Intent-filtered categories ───
  const visibleCategories = useMemo(() => {
    if (!intentFilter) return categories;
    const allowedCats = INTENT_FILTERS[intentFilter] as readonly string[];
    // Filter categories that exist in our data
    const filtered = categories.filter(c => allowedCats.includes(c));
    // If intent doesn't match any existing categories, fallback to all
    return filtered.length > 0 ? filtered : categories;
  }, [categories, intentFilter]);

  // ─── Services grouped by category (for accordion) ───
  const groupedByCategory = useMemo(() => {
    const result: Record<string, GroupedService[]> = {};
    for (const cat of visibleCategories) {
      result[cat] = groupedServices.filter(g => g.category === cat);
    }
    return result;
  }, [groupedServices, visibleCategories]);

  // ─── Fetch Services ───
  useEffect(() => {
    const loadServices = async () => {
      setIsLoadingServices(true);
      const data = await fetchServices();
      setRawServices(data);
      setIsLoadingServices(false);
    };
    loadServices();
  }, []);

  // Auto-open first visible category when categories change
  useEffect(() => {
    if (visibleCategories.length > 0 && !openCategoryKey) {
      setOpenCategoryKey(visibleCategories[0]);
    }
  }, [visibleCategories]);

  // ─── Intent Handlers ───
  const setIntent = useCallback((key: IntentKey | null) => {
    setIntentFilterState(key);
    setHasPassedIntentScreen(true);
    setOpenCategoryKey(null); // Reset accordion — will auto-open first visible
  }, []);

  const skipIntent = useCallback(() => {
    setIntentFilterState(null);
    setHasPassedIntentScreen(true);
    setOpenCategoryKey(null);
  }, []);

  // ─── Accordion Handler ───
  const toggleCategory = useCallback((cat: string) => {
    setOpenCategoryKey(prev => (prev === cat ? null : cat));
  }, []);

  const openServiceSheet = useCallback((group: GroupedService) => {
    setActiveServiceForSheet(group);
  }, []);

  const closeServiceSheet = useCallback(() => {
    setActiveServiceForSheet(null);
  }, []);

  // ─── Form Handlers ───
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  /**
   * Toggle a service: add/remove from selected list.
   * When adding, picks default variant (first / shortest duration).
   */
  const toggleService = useCallback((group: GroupedService) => {
    setFormData(prev => {
      const exists = prev.selectedServices.find(s => s.groupKey === group.groupKey);
      if (exists) {
        // If exists, just open the sheet to edit/add more, doesn't automatically remove anymore
        // However, for single-click logic from outside, maybe we don't do anything here
        // and let openServiceSheet handle it.
        return prev;
      } else {
        const defaultVariant = group.variants[0];
        const newItem: SelectedServiceItem = {
          groupKey: group.groupKey,
          variantId: defaultVariant.id,
          name: getGroupedServiceName(group, 'vi'),
          duration: defaultVariant.duration,
          priceVND: defaultVariant.priceVND,
          priceUSD: defaultVariant.priceUSD,
          quantity: 1, // Default quantity
        };
        return {
          ...prev,
          selectedServices: [...prev.selectedServices, newItem],
        };
      }
    });
  }, []);

  /**
   * Update or Add a service selection from the Sheet
   */
  const updateServiceSelection = useCallback((group: GroupedService, variant: DurationVariant, quantity: number) => {
    setFormData(prev => {
      const existingIndex = prev.selectedServices.findIndex(
        s => s.groupKey === group.groupKey && s.variantId === variant.id
      );

      if (quantity <= 0) {
        // Remove if quantity is 0
        return {
          ...prev,
          selectedServices: prev.selectedServices.filter(
            s => !(s.groupKey === group.groupKey && s.variantId === variant.id)
          ),
        };
      }

      const newItem: SelectedServiceItem = {
        groupKey: group.groupKey,
        variantId: variant.id,
        name: getGroupedServiceName(group, 'vi'),
        duration: variant.duration,
        priceVND: variant.priceVND,
        priceUSD: variant.priceUSD,
        quantity,
      };

      if (existingIndex >= 0) {
        // Replace existing variant selection
        const newList = [...prev.selectedServices];
        newList[existingIndex] = newItem;
        return { ...prev, selectedServices: newList };
      } else {
        // Add as new variant selection
        return { ...prev, selectedServices: [...prev.selectedServices, newItem] };
      }
    });
  }, []);

  /**
   * Change duration variant for an already-selected service
   */
  const changeVariant = useCallback((groupKey: string, variant: DurationVariant, groupName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.groupKey === groupKey
          ? {
              ...s,
              variantId: variant.id,
              name: groupName,
              duration: variant.duration,
              priceVND: variant.priceVND,
              priceUSD: variant.priceUSD,
            }
          : s
      ),
    }));
  }, []);

  /**
   * Update custom options (body map, strength, therapist) for a selected service
   */
  const updateServiceCustomOptions = useCallback((groupKey: string, variantId: string, options: ServiceCustomOptions) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.groupKey === groupKey && s.variantId === variantId
          ? { ...s, customOptions: options }
          : s
      ),
    }));
  }, []);

  const isServiceSelected = useCallback(
    (groupKey: string) => formData.selectedServices.some(s => s.groupKey === groupKey),
    [formData.selectedServices]
  );

  const getServiceQuantity = useCallback(
    (groupKey: string) =>
      formData.selectedServices
        .filter(s => s.groupKey === groupKey)
        .reduce((sum, s) => sum + s.quantity, 0),
    [formData.selectedServices]
  );

  const getSelectedVariantId = useCallback(
    (groupKey: string) => formData.selectedServices.find(s => s.groupKey === groupKey)?.variantId || null,
    [formData.selectedServices]
  );

  const updateGuests = useCallback((delta: number) => {
    setFormData(prev => {
      const newGuests = prev.guests + delta;
      if (newGuests >= MIN_GUESTS && newGuests <= MAX_GUESTS) {
        return { ...prev, guests: newGuests };
      }
      return prev;
    });
  }, []);

  // ─── Step Navigation ───
  const canProceedFromStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return formData.selectedServices.length > 0;
        case 2:
          return !!(formData.name.trim() && formData.phone.trim());
        case 3:
          return !!(formData.date && formData.time && formData.agreeTerms);
        default:
          return false;
      }
    },
    [formData]
  );

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS && canProceedFromStep(currentStep)) {
      setStepDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, canProceedFromStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setStepDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= TOTAL_STEPS) {
        setStepDirection(step > currentStep ? 1 : -1);
        setCurrentStep(step);
      }
    },
    [currentStep]
  );

  // ─── Booking Summary ───
  const bookingSummary = useMemo((): BookingSummary => {
    const selectedBranch = BRANCH_LIST.find(b => b.id === formData.branchId);
    const totalDuration = formData.selectedServices.reduce((sum, s) => sum + s.duration * s.quantity, 0);
    const totalPriceVND = formData.selectedServices.reduce((sum, s) => sum + s.priceVND * s.quantity, 0);
    const totalPriceUSD = formData.selectedServices.reduce((sum, s) => sum + s.priceUSD * s.quantity, 0);
    return {
      services: formData.selectedServices,
      totalDuration,
      totalPriceVND,
      totalPriceUSD,
      date: formData.date,
      time: formData.time,
      branchName: selectedBranch?.name || '',
      guests: formData.guests,
      staffGender: formData.staffGender,
    };
  }, [formData]);

  const stepProgress = currentStep / TOTAL_STEPS;

  // ─── Submit ───
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.agreeTerms) {
        alert('Vui lòng đồng ý với các Điều khoản và Điều kiện.');
        return;
      }
      if (formData.selectedServices.length === 0) {
        alert('Vui lòng chọn ít nhất 1 dịch vụ.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const selectedBranch = BRANCH_LIST.find(b => b.id === formData.branchId);
        const payload = {
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          note: formData.note,
          date: formData.date,
          time: formData.time,
          branchId: formData.branchId,
          branchName: selectedBranch?.name || 'ORIA SPA',
          guests: formData.guests,
          staffGender: formData.staffGender,
          lang: formData.lang,
          selectedServices: formData.selectedServices,
        };

        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Đặt lịch thất bại, vui lòng thử lại.');
        }

        setBookingResult(json.data as BookingResult);
        setIsSuccess(true);
      } catch (err: any) {
        console.error('[BookingForm] Submit error:', err);
        setSubmitError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        alert(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  return {
    // Services & categories
    rawServices,
    groupedServices,
    groupedByCategory,
    isLoadingServices,
    categories,
    visibleCategories,
    // Intent (Curator B)
    intentFilter,
    hasPassedIntentScreen,
    setIntent,
    skipIntent,
    // Accordion
    openCategoryKey,
    toggleCategory,
    // Service Sheet
    activeServiceForSheet,
    openServiceSheet,
    closeServiceSheet,
    // Form
    formData,
    handleChange,
    toggleService,
    updateServiceSelection,
    changeVariant,
    updateServiceCustomOptions,
    isServiceSelected,
    getServiceQuantity,
    getSelectedVariantId,
    updateGuests,
    handleSubmit,
    isSubmitting,
    isSuccess,
    bookingResult,
    submitError,
    // Steps
    currentStep,
    stepDirection,
    stepProgress,
    totalSteps: TOTAL_STEPS,
    nextStep,
    prevStep,
    goToStep,
    canProceedFromStep,
    // Summary
    bookingSummary,
  };
};
