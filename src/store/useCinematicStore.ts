import { create } from 'zustand';
import { MOCK_CATEGORIES, ServiceCategory, SpaService } from '@/data/services';

export type CinematicState = 'loading' | 'intro' | 'idle' | 'book_hover' | 'category_focused' | 'service_detail';

interface CinematicStore {
  phase: CinematicState;
  setPhase: (phase: CinematicState) => void;
  
  activeCategory: ServiceCategory | null;
  setActiveCategory: (category: ServiceCategory | null) => void;

  activeService: SpaService | null;
  setActiveService: (service: SpaService | null) => void;

  // Quality settings controlled by PerformanceMonitor
  quality: 'low' | 'medium' | 'high';
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
}

export const useCinematicStore = create<CinematicStore>((set) => ({
  phase: 'intro',
  setPhase: (phase) => set({ phase }),

  activeCategory: null,
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  activeService: null,
  setActiveService: (activeService) => set({ activeService }),

  quality: 'high',
  setQuality: (quality) => set({ quality }),
}));
