import type { Service } from "@/types";

export type ServiceCategory = {
  id: string;
  name: string;
  subtitle: string;
  position: [number, number, number];
  services: SpaService[];
};

export type SpaService = {
  id: string;
  categoryId: string;
  name: string;
  duration: number;
  price: number;
  currency: "VND";
  shortDescription: string;
  description: string;
  image?: string;
  featured?: boolean;
};

// Use an elegant formatter in the UI:
// new Intl.NumberFormat("vi-VN").format(price)

export const MOCK_CATEGORIES: ServiceCategory[] = [
  {
    id: "massage",
    name: "Massage Therapy",
    subtitle: "Healing & Relaxation",
    position: [-3, 1, -2],
    services: [
      {
        id: "m-1",
        categoryId: "massage",
        name: "Aroma Therapy",
        duration: 90,
        price: 1500000,
        currency: "VND",
        shortDescription: "Essential oil body massage",
        description: "A deeply relaxing full-body massage using warm essential oils to release tension and restore inner balance.",
        featured: true,
      },
      {
        id: "m-2",
        categoryId: "massage",
        name: "Deep Tissue",
        duration: 90,
        price: 1800000,
        currency: "VND",
        shortDescription: "Muscle recovery & tension relief",
        description: "Intensive therapy focusing on deeper layers of muscle tissue to relieve chronic aches and pains.",
      },
      {
        id: "m-3",
        categoryId: "massage",
        name: "Hot Stone Oasis",
        duration: 120,
        price: 2200000,
        currency: "VND",
        shortDescription: "Volcanic stone therapy",
        description: "Smooth, heated volcanic stones are placed on key points of the body to melt away knots and improve circulation.",
      }
    ]
  },
  {
    id: "facial",
    name: "Facial Care",
    subtitle: "Radiance & Rejuvenation",
    position: [0, 1.5, -3],
    services: [
      {
        id: "f-1",
        categoryId: "facial",
        name: "Signature Glow",
        duration: 60,
        price: 1200000,
        currency: "VND",
        shortDescription: "Deep cleanse & hydration",
        description: "Our signature facial treatment customized for your skin type, leaving your face radiant and deeply hydrated.",
        featured: true,
      },
      {
        id: "f-2",
        categoryId: "facial",
        name: "Gold Leaf Anti-Aging",
        duration: 90,
        price: 2500000,
        currency: "VND",
        shortDescription: "24k Gold anti-aging treatment",
        description: "A luxurious treatment utilizing 24k gold leaf to stimulate collagen production and visibly reduce fine lines.",
      },
      {
        id: "f-3",
        categoryId: "facial",
        name: "Detox Purify",
        duration: 60,
        price: 1100000,
        currency: "VND",
        shortDescription: "Deep pore cleansing",
        description: "A clarifying facial that extracts impurities and balances oil production for a clear, healthy complexion.",
      }
    ]
  },
  {
    id: "barbershop",
    name: "Barbershop",
    subtitle: "Classic Grooming",
    position: [3, 1, -2],
    services: [
      {
        id: "b-1",
        categoryId: "barbershop",
        name: "Gentleman's Cut",
        duration: 45,
        price: 500000,
        currency: "VND",
        shortDescription: "Precision haircut & styling",
        description: "A tailored haircut experience complete with a hot towel finish and premium styling products.",
        featured: true,
      },
      {
        id: "b-2",
        categoryId: "barbershop",
        name: "Royal Hot Towel Shave",
        duration: 30,
        price: 400000,
        currency: "VND",
        shortDescription: "Traditional straight razor shave",
        description: "Experience the ultimate smooth shave with pre-shave oils, hot towels, and a straight razor finish.",
      },
      {
        id: "b-3",
        categoryId: "barbershop",
        name: "Ear Cleaning Ritual",
        duration: 30,
        price: 350000,
        currency: "VND",
        shortDescription: "Traditional Vietnamese ear cleaning",
        description: "A deeply relaxing traditional ear cleaning service that relieves stress and improves clarity.",
      }
    ]
  }
];

const VND_PER_USD = 25000;

const toAppService = (service: SpaService, category: ServiceCategory): Service => ({
  id: service.id,
  code: service.id.toUpperCase(),
  nameVN: service.name,
  nameEN: service.name,
  nameCN: null,
  nameJP: null,
  nameKR: null,
  description: {
    en: service.description,
    vi: service.description,
  },
  hint: {
    en: service.shortDescription,
    vi: service.shortDescription,
  },
  priceVND: service.price,
  priceUSD: Math.round(service.price / VND_PER_USD),
  duration: service.duration,
  category: category.id,
  imageUrl: service.image || null,
  isActive: true,
  isBestChoice: Boolean(service.featured),
  isBestSeller: Boolean(service.featured),
  focusConfig: null,
  tags: service.featured ? ["featured"] : null,
  procedure: null,
  service_description: service.description,
});

export const fetchServices = async (): Promise<Service[]> =>
  MOCK_CATEGORIES.flatMap((category) =>
    category.services.map((service) => toAppService(service, category))
  );
