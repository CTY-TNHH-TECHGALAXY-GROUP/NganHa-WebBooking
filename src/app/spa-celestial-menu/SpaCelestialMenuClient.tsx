'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Clock, Minus, Plus, RotateCcw, ShoppingBag, Trash2, X } from 'lucide-react';
import { create } from 'zustand';
import * as THREE from 'three';

type IconFilterMode =
  | 'gold-mask'
  | 'gold-duotone'
  | 'original'
  | 'monochrome'
  | 'cover';

interface ServiceIconAssetProps {
  src: string;
  alt: string;
  mode?: IconFilterMode;
  fit?: 'contain' | 'cover';
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  opacity?: number;
}

interface MediaAsset extends ServiceIconAssetProps {
  focalPointX?: number;
  focalPointY?: number;
}

interface CategoryTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
}

interface ServiceItem {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  durationMinutes: number;
  price: number;
  image: MediaAsset;
  isFeatured?: boolean;
  isAvailable?: boolean;
}

interface SatelliteItem {
  id: string;
  icon: MediaAsset;
  angle: number;
  distance: number;
  size: number;
  orbitSpeed: number;
  yOffset?: number;
  zOffset?: number;
}

interface ServiceCategory {
  id: string;
  name: string;
  shortName?: string;
  subtitle?: string;
  icon: MediaAsset;
  tags: string[];
  position: {
    desktop: CategoryTransform;
    tablet: CategoryTransform;
    mobile: CategoryTransform;
  };
  medallionSize: number;
  satellites: SatelliteItem[];
  services: ServiceItem[];
}

type BookingStage =
  | 'experience'
  | 'categories'
  | 'services';

interface BookingState {
  stage: BookingStage;
  experienceId: string | null;
  categoryId: string | null;
  serviceId: string | null;
  selectExperience: (experienceId: string) => void;
  selectCategory: (categoryId: string) => void;
  goBack: () => void;
  resetBooking: () => void;
}

interface CartItem {
  serviceId: string;
  categoryId: string;
  experienceId?: string | null;
  name: string;
  durationMinutes: number;
  price: number;
  quantity: number;
  image?: MediaAsset;
}

interface CartState {
  items: CartItem[];
  notice: string;
  drawerOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (serviceId: string) => void;
  increaseQuantity: (serviceId: string) => void;
  decreaseQuantity: (serviceId: string) => void;
  clearCart: () => void;
  setDrawerOpen: (drawerOpen: boolean) => void;
  clearNotice: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

const initialBookingState = {
  stage: 'categories' as BookingStage,
  experienceId: 'luxury-spa',
  categoryId: null,
  serviceId: null,
};

const BOOK_NOW_CONFIG = {
  route: '/booking',
  openMode: 'new-window' as 'same-window' | 'new-window',
};

const CART_DUPLICATE_MODE = 'increase-quantity' as 'increase-quantity' | 'prevent-duplicate';

const useBookingStore = create<BookingState>((set) => ({
  ...initialBookingState,
  selectExperience: (experienceId) =>
    set({ experienceId, stage: 'categories', categoryId: null, serviceId: null }),
  selectCategory: (categoryId) =>
    set({ categoryId, serviceId: null, stage: 'services' }),
  goBack: () =>
    set((state) => {
      const previousStage: Record<BookingStage, BookingStage> = {
        experience: 'experience',
        categories: 'experience',
        services: 'categories',
      };

      return { stage: previousStage[state.stage] };
    }),
  resetBooking: () => set(initialBookingState),
}));

const useCartStore = create<CartState>((set, get) => ({
  items: [],
  notice: '',
  drawerOpen: false,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.serviceId === item.serviceId);
      if (existing) {
        if (CART_DUPLICATE_MODE === 'prevent-duplicate') {
          return { notice: 'Dịch vụ này đã có trong giỏ hàng.' };
        }
        return {
          notice: 'Đã tăng số lượng trong giỏ hàng.',
          items: state.items.map((entry) =>
            entry.serviceId === item.serviceId
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          ),
        };
      }
      return { notice: 'Đã thêm vào giỏ hàng.', items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeItem: (serviceId) =>
    set((state) => ({ items: state.items.filter((item) => item.serviceId !== serviceId) })),
  increaseQuantity: (serviceId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.serviceId === serviceId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    })),
  decreaseQuantity: (serviceId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.serviceId === serviceId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
        )
        .filter((item) => item.quantity > 0),
    })),
  clearCart: () => set({ items: [], notice: '' }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  clearNotice: () => set({ notice: '' }),
  getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getSubtotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
}));

const filterOptions = [
  { id: 'all', label: 'Tất cả' },
  { id: 'relaxation', label: 'Thư giãn' },
  { id: 'body-care', label: 'Chăm sóc cơ thể' },
  { id: 'skin-care', label: 'Chăm sóc da' },
  { id: 'hair-care', label: 'Chăm sóc tóc' },
  { id: 'therapy', label: 'Trị liệu' },
  { id: 'package', label: 'Gói dịch vụ' },
] as const;

const icon = (
  src: string,
  alt: string,
  config: Partial<MediaAsset> = {},
): MediaAsset => ({
  src,
  alt,
  mode: 'gold-mask',
  fit: 'contain',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  opacity: 1,
  ...config,
});

const serviceCategories: ServiceCategory[] = [
  {
    id: 'body-massage',
    name: 'Body Massage',
    subtitle: 'Aroma therapy',
    icon: icon('/assets/icons/body.webp', 'Biểu tượng massage body', {
      scale: 0.86,
      offsetY: 0.02,
    }),
    tags: ['body-care', 'relaxation', 'therapy'],
    medallionSize: 1.58,
    position: {
      desktop: { x: -3.3, y: 1.15, z: 0.72, scale: 1, rotationY: -0.18 },
      tablet: { x: -2.25, y: 1.18, z: 0.35, scale: 0.84, rotationY: -0.15 },
      mobile: { x: -0.1, y: 1.55, z: 0.2, scale: 0.72 },
    },
    satellites: [
      { id: 'lotus', icon: icon('/assets/icons/add-more.webp', 'Hoa sen'), angle: 18, distance: 1.55, size: 0.28, orbitSpeed: 0.08 },
      { id: 'oil', icon: icon('/images/services/aroma-oil.png', 'Tinh dầu'), angle: 152, distance: 1.78, size: 0.25, orbitSpeed: -0.06 },
      { id: 'hand', icon: icon('/images/body-treatment-full.png', 'Bàn tay trị liệu', { mode: 'original' }), angle: 230, distance: 1.5, size: 0.23, orbitSpeed: 0.05 },
    ],
    services: [
      {
        id: 'body-aroma-60',
        name: 'Massage Aroma Thư Giãn',
        shortName: 'Aroma 60',
        description: 'Liệu trình tinh dầu nhẹ nhàng giúp cơ thể thả lỏng và phục hồi năng lượng.',
        durationMinutes: 60,
        price: 520000,
        image: icon('/images/services/aroma-oil.png', 'Massage aroma', { mode: 'original', fit: 'cover', focalPointY: 45 }),
        isFeatured: true,
      },
      {
        id: 'body-deep-90',
        name: 'Massage Body Chuyên Sâu',
        description: 'Tập trung vùng cổ, vai, lưng với lực trị liệu chậm và chắc.',
        durationMinutes: 90,
        price: 780000,
        image: icon('/images/body-treatment-full.png', 'Massage body chuyên sâu', { mode: 'original', fit: 'cover' }),
      },
    ],
  },
  {
    id: 'ear-care',
    name: 'Ráy Tai',
    subtitle: 'Gentle care',
    icon: icon('/assets/icons/earclean.webp', 'Biểu tượng ráy tai', { scale: 0.8 }),
    tags: ['therapy', 'relaxation'],
    medallionSize: 0.88,
    position: {
      desktop: { x: 0, y: 0.93, z: -0.18, scale: 0.95 },
      tablet: { x: 0, y: 1.08, z: -0.2, scale: 0.8 },
      mobile: { x: 0.95, y: 0.64, z: -0.45, scale: 0.6 },
    },
    satellites: [
      { id: 'herbal', icon: icon('/images/ear-clean.png', 'Dụng cụ chăm sóc tai', { mode: 'original' }), angle: 190, distance: 0.98, size: 0.18, orbitSpeed: 0.12 },
      { id: 'leaf', icon: icon('/assets/icons/add-more.webp', 'Lá thảo mộc'), angle: 330, distance: 0.92, size: 0.16, orbitSpeed: -0.09 },
    ],
    services: [
      {
        id: 'ear-clean-soft',
        name: 'Ráy Tai Êm Dịu',
        description: 'Chăm sóc tai bằng kỹ thuật nhẹ, sạch và thư giãn.',
        durationMinutes: 35,
        price: 280000,
        image: icon('/images/services/ear-clean.png', 'Ráy tai êm dịu', { mode: 'original', fit: 'cover' }),
      },
    ],
  },
  {
    id: 'hair-wash',
    name: 'Gội Đầu',
    subtitle: 'Scalp ritual',
    icon: icon('/assets/icons/hairwash.webp', 'Biểu tượng gội đầu', { scale: 0.9 }),
    tags: ['hair-care', 'relaxation'],
    medallionSize: 1.6,
    position: {
      desktop: { x: 3.2, y: 1.2, z: 0.48, scale: 1.02, rotationY: 0.16 },
      tablet: { x: 2.12, y: 1.12, z: 0.2, scale: 0.84, rotationY: 0.12 },
      mobile: { x: -0.95, y: 0.52, z: -0.48, scale: 0.62 },
    },
    satellites: [
      { id: 'comb', icon: icon('/images/barbershop.png', 'Lược chăm sóc tóc', { mode: 'original' }), angle: 170, distance: 1.55, size: 0.23, orbitSpeed: 0.08 },
      { id: 'shampoo', icon: icon('/images/hair-wash.png', 'Dầu gội'), angle: 42, distance: 1.68, size: 0.25, orbitSpeed: -0.06 },
      { id: 'lotus', icon: icon('/assets/icons/add-more.webp', 'Hoa sen'), angle: 350, distance: 1.73, size: 0.25, orbitSpeed: 0.05 },
    ],
    services: [
      {
        id: 'scalp-herbal-70',
        name: 'Gội Đầu Dưỡng Sinh',
        description: 'Làm sạch da đầu, massage cổ vai gáy và ủ thảo mộc.',
        durationMinutes: 70,
        price: 490000,
        image: icon('/images/services/hair-wash.png', 'Gội đầu dưỡng sinh', { mode: 'original', fit: 'cover', focalPointY: 38 }),
        isFeatured: true,
      },
      {
        id: 'scalp-premium-90',
        name: 'Gội Đầu Premium',
        description: 'Trọn gói chăm sóc da đầu, cổ vai gáy và thư giãn mắt.',
        durationMinutes: 90,
        price: 690000,
        image: icon('/images/hair-wash.png', 'Gội đầu premium', { mode: 'original', fit: 'cover' }),
      },
    ],
  },
  {
    id: 'foot-care',
    name: 'Chăm Sóc Chân',
    subtitle: 'Foot therapy',
    icon: icon('/assets/icons/foot.webp', 'Biểu tượng chăm sóc chân', { scale: 0.82 }),
    tags: ['body-care', 'therapy'],
    medallionSize: 1.18,
    position: {
      desktop: { x: -3.05, y: -1.38, z: 0.1, scale: 0.92, rotationY: -0.2 },
      tablet: { x: -1.75, y: -1.28, z: -0.05, scale: 0.76, rotationY: -0.18 },
      mobile: { x: -0.68, y: -0.5, z: -0.18, scale: 0.64 },
    },
    satellites: [
      { id: 'bowl', icon: icon('/images/heel-care.png', 'Ngâm chân thảo dược', { mode: 'original' }), angle: 205, distance: 1.18, size: 0.21, orbitSpeed: 0.08 },
      { id: 'leaf', icon: icon('/assets/icons/add-more.webp', 'Lá thảo mộc'), angle: 350, distance: 1.05, size: 0.18, orbitSpeed: -0.06 },
    ],
    services: [
      {
        id: 'foot-herbal-45',
        name: 'Ngâm Chân Thảo Mộc',
        description: 'Ngâm thảo mộc ấm, massage huyệt bàn chân và chăm sóc gót.',
        durationMinutes: 45,
        price: 360000,
        image: icon('/images/services/foot-massage.png', 'Chăm sóc chân', { mode: 'original', fit: 'cover' }),
      },
    ],
  },
  {
    id: 'facial-care',
    name: 'Chăm Sóc Da Mặt',
    subtitle: 'Radiant skin',
    icon: icon('/assets/icons/facial.webp', 'Biểu tượng chăm sóc da mặt', { scale: 0.9 }),
    tags: ['skin-care', 'relaxation'],
    medallionSize: 1.62,
    position: {
      desktop: { x: 0.35, y: -1.42, z: 0.68, scale: 1.02 },
      tablet: { x: 0.2, y: -1.28, z: 0.35, scale: 0.86 },
      mobile: { x: 0.35, y: -1.56, z: 0.15, scale: 0.7 },
    },
    satellites: [
      { id: 'spark', icon: icon('/assets/icons/add-more.webp', 'Làn da sáng'), angle: 135, distance: 1.48, size: 0.24, orbitSpeed: 0.07 },
      { id: 'cream', icon: icon('/images/services/coconut-oil.png', 'Kem dưỡng'), angle: 207, distance: 1.5, size: 0.22, orbitSpeed: -0.08 },
      { id: 'mask', icon: icon('/images/services/facial.png', 'Mặt nạ chăm sóc da', { mode: 'original' }), angle: 325, distance: 1.5, size: 0.22, orbitSpeed: 0.05 },
    ],
    services: [
      {
        id: 'facial-glow-60',
        name: 'Facial Glow Cấp Ẩm',
        description: 'Làm sạch sâu, massage nâng cơ nhẹ và khóa ẩm dịu da.',
        durationMinutes: 60,
        price: 560000,
        image: icon('/images/services/facial.png', 'Facial glow', { mode: 'original', fit: 'cover' }),
        isFeatured: true,
      },
      {
        id: 'facial-premium-90',
        name: 'Chăm Sóc Da Premium',
        description: 'Liệu trình da mặt cao cấp với mặt nạ và tinh chất phục hồi.',
        durationMinutes: 90,
        price: 860000,
        image: icon('/images/facial.png', 'Chăm sóc da premium', { mode: 'original', fit: 'cover', focalPointY: 42 }),
      },
    ],
  },
  {
    id: 'relaxation-package',
    name: 'Liệu Trình Thư Giãn',
    shortName: 'Liệu Trình',
    subtitle: 'Signature set',
    icon: icon('/assets/icons/combo-king.webp', 'Biểu tượng liệu trình thư giãn', {
      scale: 0.78,
    }),
    tags: ['package', 'relaxation', 'therapy'],
    medallionSize: 1.18,
    position: {
      desktop: { x: 3.05, y: -1.1, z: -0.05, scale: 0.9, rotationY: 0.2 },
      tablet: { x: 1.82, y: -1.16, z: -0.15, scale: 0.74, rotationY: 0.18 },
      mobile: { x: 0.9, y: -0.5, z: -0.35, scale: 0.62 },
    },
    satellites: [
      { id: 'music', icon: icon('/assets/icons/add-more.webp', 'Âm nhạc thư giãn'), angle: 18, distance: 1.23, size: 0.21, orbitSpeed: 0.08 },
      { id: 'warm', icon: icon('/images/services/hotstone.png', 'Đá nóng'), angle: 305, distance: 1.18, size: 0.2, orbitSpeed: -0.07 },
      { id: 'oil', icon: icon('/images/services/coconut-oil.png', 'Tinh dầu'), angle: 158, distance: 1.1, size: 0.18, orbitSpeed: 0.06 },
    ],
    services: [
      {
        id: 'signature-120',
        name: 'Signature Relax 120',
        description: 'Gói thư giãn toàn diện: body, gội đầu, chăm sóc chân và trà nghỉ.',
        durationMinutes: 120,
        price: 1180000,
        image: icon('/images/additional-premium.png', 'Liệu trình thư giãn', { mode: 'original', fit: 'cover' }),
        isFeatured: true,
      },
    ],
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildBookingUrl({
  experienceId,
  categoryId,
  serviceId,
}: {
  experienceId?: string | null;
  categoryId: string;
  serviceId: string;
}) {
  const params = new URLSearchParams({
    categoryId,
    serviceId,
  });
  if (experienceId) params.set('experienceId', experienceId);
  return `${BOOK_NOW_CONFIG.route}?${params.toString()}`;
}

function openBookingPage({
  experienceId,
  categoryId,
  serviceId,
  onBlocked,
}: {
  experienceId?: string | null;
  categoryId: string;
  serviceId: string;
  onBlocked: (message: string) => void;
}) {
  const url = buildBookingUrl({ experienceId, categoryId, serviceId });
  if (BOOK_NOW_CONFIG.openMode === 'new-window') {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) onBlocked('Không thể mở trang đặt lịch. Vui lòng cho phép cửa sổ bật lên hoặc thử lại.');
    return;
  }
  window.location.assign(url);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

function useResponsiveQuality() {
  const [profile, setProfile] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 700) setProfile('mobile');
      else if (width < 1100) setProfile('tablet');
      else setProfile('desktop');
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return profile;
}

function useManagedTexture(src: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setTexture(null);
    setFailed(false);

    if (!src) {
      setFailed(true);
      return undefined;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      src,
      (loadedTexture) => {
        if (!active) {
          loadedTexture.dispose();
          return;
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = true;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (!active) return;
        console.warn(`[ServiceIconAsset] Failed to load asset: ${src}`);
        setFailed(true);
      },
    );

    return () => {
      active = false;
      setTexture((current) => {
        current?.dispose();
        return null;
      });
    };
  }, [src]);

  return { texture, failed };
}

const iconVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const iconFragmentShader = `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uMode;
  uniform vec2 uUvScale;
  uniform vec2 uUvOffset;
  varying vec2 vUv;

  vec3 gradientGold(float y) {
    vec3 topGold = vec3(0.961, 0.871, 0.635);
    vec3 midGold = vec3(0.847, 0.698, 0.404);
    vec3 bottomGold = vec3(0.612, 0.455, 0.180);
    return y > 0.52
      ? mix(midGold, topGold, smoothstep(0.52, 1.0, y))
      : mix(bottomGold, midGold, smoothstep(0.0, 0.52, y));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uUvScale + 0.5 + uUvOffset;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

    vec4 sampleColor = texture2D(uMap, uv);
    float luminance = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
    float alpha = sampleColor.a;
    vec3 color = sampleColor.rgb;

    if (uMode < 0.5) {
      float mask = alpha < 0.99 ? alpha : smoothstep(0.08, 0.82, 1.0 - luminance);
      color = gradientGold(vUv.y);
      alpha = mask;
    } else if (uMode < 1.5) {
      color = mix(vec3(0.557, 0.408, 0.161), gradientGold(vUv.y), smoothstep(0.18, 0.92, luminance));
      alpha = max(alpha, smoothstep(0.05, 0.45, luminance) * 0.92);
    } else if (uMode > 2.5 && uMode < 3.5) {
      color = vec3(luminance);
    }

    float innerGlow = smoothstep(0.02, 0.55, alpha) * 0.08;
    gl_FragColor = vec4(color + innerGlow, alpha * uOpacity);
  }
`;

function getModeValue(mode: IconFilterMode) {
  if (mode === 'gold-mask') return 0;
  if (mode === 'gold-duotone' || mode === 'cover') return 1;
  if (mode === 'monochrome') return 3;
  return 2;
}

function PlaceholderIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.16, 0.008, 8, 48]} />
        <meshBasicMaterial color="#c5a364" transparent opacity={opacity * 0.72} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} rotation={[0, 0, (Math.PI / 2) * index]}>
          <circleGeometry args={[0.075, 24, 0, Math.PI]} />
          <meshBasicMaterial color="#c5a364" transparent opacity={opacity * 0.42} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function ServiceIconAsset({
  src,
  alt,
  mode = 'gold-mask',
  fit = 'contain',
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  rotation = 0,
  opacity = 1,
}: ServiceIconAssetProps) {
  const { texture, failed } = useManagedTexture(src);
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.52, 0.52), []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const { width, height, uvScale } = useMemo(() => {
    const imageWidth = texture?.image?.width || 1;
    const imageHeight = texture?.image?.height || 1;
    const imageAspect = imageWidth / imageHeight;
    const containerWidth = 0.52 * scale;
    const containerHeight = 0.52 * scale;
    const containerAspect = containerWidth / containerHeight;

    if (fit === 'cover') {
      return {
        width: containerWidth,
        height: containerHeight,
        uvScale:
          imageAspect > containerAspect
            ? new THREE.Vector2(containerAspect / imageAspect, 1)
            : new THREE.Vector2(1, imageAspect / containerAspect),
      };
    }

    if (imageAspect >= containerAspect) {
      return {
        width: containerWidth,
        height: containerWidth / imageAspect,
        uvScale: new THREE.Vector2(1, 1),
      };
    }

    return {
      width: containerHeight * imageAspect,
      height: containerHeight,
      uvScale: new THREE.Vector2(1, 1),
    };
  }, [fit, scale, texture]);

  const material = useMemo(() => {
    if (!texture) return null;

    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: opacity },
        uMode: { value: getModeValue(mode) },
        uUvScale: { value: uvScale },
        uUvOffset: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: iconVertexShader,
      fragmentShader: iconFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [mode, opacity, texture, uvScale]);

  useEffect(() => {
    return () => material?.dispose();
  }, [material]);

  if (failed || !src) {
    return <PlaceholderIcon opacity={opacity} />;
  }

  if (!texture || !material) {
    return (
      <mesh scale={[0.42 * scale, 0.42 * scale, 1]}>
        <circleGeometry args={[0.5, 40]} />
        <meshBasicMaterial color="#c5a364" transparent opacity={0.12} />
      </mesh>
    );
  }

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[offsetX, offsetY, 0]}
      rotation={[0, 0, THREE.MathUtils.degToRad(rotation)]}
      scale={[width / 0.52, height / 0.52, 1]}
    />
  );
}

function GalaxyBackground({
  profile,
  reducedMotion,
}: {
  profile: 'desktop' | 'tablet' | 'mobile';
  reducedMotion: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const goldRef = useRef<THREE.Points>(null);
  const starCount = profile === 'desktop' ? 1200 : profile === 'tablet' ? 760 : 420;

  const starGeometry = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let index = 0; index < starCount; index += 1) {
      const i = index * 3;
      positions[i] = (Math.random() - 0.5) * 13;
      positions[i + 1] = (Math.random() - 0.5) * 7.5;
      positions[i + 2] = -5.5 - Math.random() * 5;

      const warmth = Math.random();
      colors[i] = 0.55 + warmth * 0.42;
      colors[i + 1] = 0.66 + warmth * 0.24;
      colors[i + 2] = 0.95;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [starCount]);

  const goldGeometry = useMemo(() => {
    const count = profile === 'mobile' ? 8 : 15;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const i = index * 3;
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 5.5;
      positions[i + 2] = -4.2 - Math.random() * 4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [profile]);

  useEffect(() => {
    return () => {
      starGeometry.dispose();
      goldGeometry.dispose();
    };
  }, [goldGeometry, starGeometry]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const elapsed = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = elapsed * 0.006;
      pointsRef.current.rotation.x = Math.sin(elapsed * 0.06) * 0.015;
    }
    if (goldRef.current) {
      goldRef.current.rotation.z = Math.sin(elapsed * 0.05) * 0.012;
    }
  });

  return (
    <group>
      <mesh position={[0, 0, -9]}>
        <planeGeometry args={[18, 11, 1, 1]} />
        <shaderMaterial
          vertexShader={iconVertexShader}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              vec2 p = vUv - 0.5;
              float r = length(p);
              vec3 deep = vec3(0.008, 0.031, 0.078);
              vec3 navy = vec3(0.027, 0.075, 0.145);
              vec3 violet = vec3(0.105, 0.060, 0.160);
              float nebula = smoothstep(0.58, 0.05, abs(p.y + sin(p.x * 8.0) * 0.08));
              vec3 color = mix(deep, navy, smoothstep(0.72, 0.12, r));
              color += violet * nebula * 0.18;
              color *= 1.0 - smoothstep(0.32, 0.78, r) * 0.62;
              gl_FragColor = vec4(color, 1.0);
            }
          `}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <points ref={pointsRef} geometry={starGeometry}>
        <pointsMaterial
          size={profile === 'mobile' ? 0.012 : 0.015}
          vertexColors
          transparent
          opacity={0.78}
          depthWrite={false}
        />
      </points>
      <points ref={goldRef} geometry={goldGeometry}>
        <pointsMaterial
          size={profile === 'mobile' ? 0.045 : 0.055}
          color="#f5dea2"
          transparent
          opacity={0.88}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[-3, 4, 4]} intensity={1.15} color="#f5dea2" />
      <pointLight position={[3.4, 2.1, 2.2]} intensity={2.2} color="#c79a4b" distance={7} />
      <pointLight position={[-4, -2.3, 2]} intensity={1.2} color="#5073a9" distance={8} />
    </>
  );
}

function CameraController({
  selectedCategory,
  profile,
  reducedMotion,
}: {
  selectedCategory?: ServiceCategory;
  profile: 'desktop' | 'tablet' | 'mobile';
  reducedMotion: boolean;
}) {
  const { camera, pointer } = useThree();
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const parallaxX = reducedMotion ? 0 : pointer.x * 0.18;
    const parallaxY = reducedMotion ? 0 : pointer.y * 0.12;
    const isMobile = profile === 'mobile';

    if (selectedCategory) {
      targetPosition.set(
        isMobile ? parallaxX * 0.35 : 0.35 + parallaxX,
        isMobile ? 0.14 + parallaxY * 0.35 : 0.02 + parallaxY,
        isMobile ? 5.4 : 4.6,
      );
      lookTarget.set(isMobile ? 0 : -0.15, isMobile ? 0.42 : 0.05, 0);
    } else {
      targetPosition.set(parallaxX, parallaxY, isMobile ? 6.7 : 5.7);
      lookTarget.set(parallaxX * 0.22, parallaxY * 0.16, 0);
    }

    camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 2.4));
    camera.lookAt(lookTarget);
  });

  return null;
}

function OrbitalPath({
  radius,
  opacity,
  hovered,
  reducedMotion,
}: {
  radius: number;
  opacity: number;
  hovered: boolean;
  reducedMotion: boolean;
}) {
  const lightRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius * 1.05, radius * 0.38, 0, Math.PI * 2);
    const points = curve.getPoints(160).map((point) => new THREE.Vector3(point.x, point.y, -0.04));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);
  const lineObject = useMemo(
    () => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#c79a4b', transparent: true })),
    [geometry],
  );

  useEffect(() => () => {
    geometry.dispose();
    (lineObject.material as THREE.Material).dispose();
  }, [geometry, lineObject]);

  useFrame(({ clock }) => {
    const material = lineObject.material as THREE.LineBasicMaterial;
    material.opacity = opacity * (hovered ? 0.52 : 0.28);
    if (!lightRef.current || reducedMotion) return;
    const elapsed = clock.getElapsedTime() * (hovered ? 0.42 : 0.24);
    lightRef.current.position.set(
      Math.cos(elapsed) * radius * 1.05,
      Math.sin(elapsed) * radius * 0.38,
      -0.025,
    );
  });

  return (
    <group rotation={[0.06, 0, -0.08]}>
      <primitive object={lineObject} />
      {!reducedMotion && (
        <mesh ref={lightRef}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial color="#ffe7a8" transparent opacity={opacity * 0.8} />
        </mesh>
      )}
    </group>
  );
}

function SatelliteMedallion({
  satellite,
  parentRadius,
  opacity,
  hovered,
  selected,
  reducedMotion,
}: {
  satellite: SatelliteItem;
  parentRadius: number;
  opacity: number;
  hovered: boolean;
  selected: boolean;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lineObject = useMemo(
    () => new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: '#c79a4b', transparent: true, opacity: opacity * 0.24 }),
    ),
    [],
  );
  const baseAngle = THREE.MathUtils.degToRad(satellite.angle);

  useEffect(() => () => {
    lineObject.geometry.dispose();
    (lineObject.material as THREE.Material).dispose();
  }, [lineObject]);

  useFrame(({ clock }) => {
    const elapsed = reducedMotion ? 0 : clock.getElapsedTime() * satellite.orbitSpeed;
    const angle = baseAngle + elapsed;
    const collapse = selected ? 0.42 : hovered ? 1.05 : 1;
    const distance = parentRadius * satellite.distance * collapse;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.62 + (satellite.yOffset || 0);
    const z = satellite.zOffset || -0.02;

    if (groupRef.current) {
      groupRef.current.position.lerp(new THREE.Vector3(x, y, z), 0.08);
    }

    const points = [new THREE.Vector3(0, 0, -0.05), new THREE.Vector3(x, y, z - 0.02)];
    lineObject.geometry.dispose();
    lineObject.geometry = new THREE.BufferGeometry().setFromPoints(points);
    (lineObject.material as THREE.LineBasicMaterial).opacity = opacity * 0.24;
  });

  return (
    <>
      <primitive object={lineObject} />
      <group ref={groupRef}>
        <mesh position={[0.018, -0.018, -0.03]}>
          <circleGeometry args={[satellite.size * 1.05, 36]} />
          <meshBasicMaterial color="#050814" transparent opacity={opacity * 0.52} />
        </mesh>
        <mesh>
          <circleGeometry args={[satellite.size, 48]} />
          <meshStandardMaterial color="#11151d" metalness={0.25} roughness={0.62} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <ringGeometry args={[satellite.size * 0.88, satellite.size, 56]} />
          <meshBasicMaterial color="#c79a4b" transparent opacity={opacity * 0.78} side={THREE.DoubleSide} />
        </mesh>
        <group scale={satellite.size * 1.65} position={[0, 0, 0.02]}>
          <ServiceIconAsset {...satellite.icon} scale={(satellite.icon.scale || 1) * 0.8} opacity={opacity} />
        </group>
      </group>
    </>
  );
}

function CategoryMedallion({
  category,
  transform,
  active,
  dimmed,
  filtered,
  selected,
  onSelect,
  reducedMotion,
}: {
  category: ServiceCategory;
  transform: CategoryTransform;
  active: boolean;
  dimmed: boolean;
  filtered: boolean;
  selected: boolean;
  onSelect: (categoryId: string) => void;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const radius = category.medallionSize * 0.5;
  const opacity = dimmed ? 0.78 : filtered ? 0.18 : 1;
  const title = category.shortName || category.name;

  useFrame(({ clock, pointer }, delta) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    const floatY = reducedMotion ? 0 : Math.sin(elapsed * 0.72 + transform.x) * 0.055;
    const hoverScale = hovered && active ? 1.06 : 1;
    const selectedScale = selected ? 1.08 : 1;
    const filteredScale = filtered ? 0.68 : 1;
    const target = selected
      ? new THREE.Vector3(
          window.innerWidth < 700 ? 0 : -1.72,
          window.innerWidth < 700 ? 0.92 : 0.04,
          1.28,
        )
      : new THREE.Vector3(
          filtered ? transform.x * 0.78 : transform.x,
          (filtered ? transform.y * 0.82 : transform.y) + floatY,
          filtered ? transform.z - 1.2 : transform.z,
        );

    groupRef.current.position.lerp(target, 1 - Math.exp(-delta * 3.2));
    const targetScale = transform.scale * hoverScale * selectedScale * filteredScale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.exp(-delta * 4.2));
    groupRef.current.rotation.x = (transform.rotationX || 0) + (reducedMotion ? 0 : pointer.y * 0.035);
    groupRef.current.rotation.y = (transform.rotationY || 0) + (reducedMotion ? 0 : pointer.x * 0.05) + Math.sin(elapsed * 0.22) * 0.025;
    groupRef.current.rotation.z = transform.rotationZ || 0;
  });

  const handlePointer = (event: ThreeEvent<PointerEvent>, nextHovered: boolean) => {
    event.stopPropagation();
    setHovered(nextHovered);
    document.body.style.cursor = nextHovered ? 'pointer' : 'auto';
  };

  return (
    <group
      ref={groupRef}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (!filtered) onSelect(category.id);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => handlePointer(event, true)}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => handlePointer(event, false)}
    >
      <OrbitalPath radius={radius * 1.75} opacity={opacity} hovered={hovered || selected} reducedMotion={reducedMotion} />
      <mesh position={[0.08, -0.1, -0.16]}>
        <circleGeometry args={[radius * 1.02, 80]} />
        <meshBasicMaterial color="#020814" transparent opacity={opacity * 0.42} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.18, 96]} />
        <meshStandardMaterial
          color="#c79a4b"
          emissive="#5c3e12"
          emissiveIntensity={hovered || selected ? 0.18 : 0.06}
          metalness={0.82}
          roughness={0.32}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0, 0.098]}>
        <circleGeometry args={[radius * 0.935, 96]} />
        <meshStandardMaterial color="#10141d" metalness={0.24} roughness={0.8} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, -0.098]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[radius * 0.92, 96]} />
        <meshStandardMaterial color="#151923" metalness={0.18} roughness={0.85} transparent opacity={opacity * 0.96} />
      </mesh>
      <mesh position={[0, 0, 0.112]}>
        <ringGeometry args={[radius * 0.8, radius * 0.815, 96]} />
        <meshBasicMaterial color={hovered || selected ? '#f5dea2' : '#c79a4b'} transparent opacity={opacity * 0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.116]}>
        <ringGeometry args={[radius * 0.92, radius * 0.945, 96]} />
        <meshBasicMaterial color={hovered || selected ? '#ffeac0' : '#c79a4b'} transparent opacity={opacity * 0.8} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, radius * 0.22, 0.135]} scale={category.medallionSize * 0.9}>
        <ServiceIconAsset {...category.icon} opacity={opacity} />
      </group>
      <Text
        position={[0, -radius * 0.2, 0.14]}
        fontSize={category.medallionSize > 1.35 ? 0.19 : 0.15}
        maxWidth={radius * 1.42}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color={dimmed || filtered ? '#80683f' : '#e8c783'}
        outlineWidth={0.003}
        outlineColor="#3c2910"
      >
        {title}
      </Text>
      {category.subtitle && category.medallionSize > 1.1 && (
        <Text
          position={[0, -radius * 0.47, 0.14]}
          fontSize={0.075}
          maxWidth={radius * 1.2}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color={dimmed || filtered ? '#65533a' : '#c5a364'}
        >
          {category.subtitle}
        </Text>
      )}
      {!dimmed && category.satellites.map((satellite) => (
          <SatelliteMedallion
            key={satellite.id}
            satellite={satellite}
            parentRadius={radius}
            opacity={opacity}
            hovered={hovered}
            selected={selected}
            reducedMotion={reducedMotion}
          />
        ))}
    </group>
  );
}

function focusNavTransform(
  category: ServiceCategory,
  index: number,
  total: number,
  profile: 'desktop' | 'tablet' | 'mobile',
): CategoryTransform {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const arc = Math.sin(t * Math.PI);
  const diameter = profile === 'mobile' ? 0.36 : profile === 'tablet' ? 0.42 : 0.48;

  if (profile === 'mobile') {
    return {
      x: -1.25 + t * 2.5,
      y: 2.1 + arc * 0.12,
      z: 0.95,
      scale: diameter / category.medallionSize,
      rotationY: 0,
    };
  }

  if (profile === 'tablet') {
    return {
      x: -0.9 + t * 3.25,
      y: 2.1 + arc * 0.18,
      z: 0.95,
      scale: diameter / category.medallionSize,
      rotationY: 0,
    };
  }

  return {
    x: -1.18 + t * 4.35,
    y: 2.05 + arc * 0.22,
    z: 0.95,
    scale: diameter / category.medallionSize,
    rotationY: 0,
  };
}

function CategoryUniverse({
  categories,
  profile,
  selectedCategoryId,
  onSelectCategory,
  activeFilter,
  search,
  reducedMotion,
}: {
  categories: ServiceCategory[];
  profile: 'desktop' | 'tablet' | 'mobile';
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  activeFilter: string;
  search: string;
  reducedMotion: boolean;
}) {
  const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN');
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const focusNavCategories = categories.filter((category) => category.id !== selectedCategoryId);

  return (
    <>
      <GalaxyBackground profile={profile} reducedMotion={reducedMotion} />
      <SceneLighting />
      <CameraController selectedCategory={selectedCategory} profile={profile} reducedMotion={reducedMotion} />
      {categories.map((category) => {
        const matchesFilter = activeFilter === 'all' || category.tags.includes(activeFilter);
        const matchesSearch =
          !normalizedSearch ||
          `${category.name} ${category.subtitle || ''} ${category.services.map((service) => service.name).join(' ')}`
            .toLocaleLowerCase('vi-VN')
            .includes(normalizedSearch);
        const filtered = !matchesFilter || !matchesSearch;
        const selected = category.id === selectedCategoryId;
        const dimmed = Boolean(selectedCategoryId && !selected);
        const transform = dimmed
          ? focusNavTransform(category, focusNavCategories.findIndex((item) => item.id === category.id), focusNavCategories.length, profile)
          : category.position[profile];

        return (
          <CategoryMedallion
            key={category.id}
            category={category}
            transform={transform}
            active={!filtered}
            dimmed={dimmed}
            filtered={filtered}
            selected={selected}
            onSelect={onSelectCategory}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </>
  );
}

function CategoryFilter({
  activeFilter,
  setActiveFilter,
  search,
  setSearch,
}: {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  search: string;
  setSearch: (search: string) => void;
}) {
  return (
    <section className="celestial-filter" aria-label="Lọc danh mục dịch vụ">
      <div className="celestial-search">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Bạn đang tìm dịch vụ gì?"
          aria-label="Tìm dịch vụ"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">
            <X size={15} />
          </button>
        )}
      </div>
      <div className="celestial-filter__chips" role="list">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(option.id)}
            className={activeFilter === option.id ? 'is-active' : ''}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function DomServiceImage({ asset }: { asset: MediaAsset }) {
  const [failed, setFailed] = useState(false);
  const objectFit = asset.fit || 'contain';

  if (failed || !asset.src) {
    return <div className="service-image-placeholder" aria-label={`${asset.alt} chưa có ảnh`} />;
  }

  return (
    <img
      src={asset.src}
      alt={asset.alt}
      loading="lazy"
      onError={() => {
        console.warn(`[ServiceIconAsset] Failed to load service image: ${asset.src}`);
        setFailed(true);
      }}
      style={{
        objectFit,
        objectPosition: `${asset.focalPointX ?? 50}% ${asset.focalPointY ?? 50}%`,
        transform: `scale(${asset.scale ?? 1}) translate(${asset.offsetX ?? 0}px, ${asset.offsetY ?? 0}px) rotate(${asset.rotation ?? 0}deg)`,
        opacity: asset.opacity ?? 1,
      }}
    />
  );
}

function ServiceListPanel({ category }: { category: ServiceCategory }) {
  const experienceId = useBookingStore((state) => state.experienceId);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <motion.aside
      className="service-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Dịch vụ trong danh mục ${category.name}`}
    >
      <p className="eyebrow">SERVICE CATEGORIES</p>
      <h2>{category.name}</h2>
      <p className="panel-copy">{category.subtitle || 'Chọn liệu trình phù hợp với trạng thái cơ thể hôm nay.'}</p>
      <div className="service-card-list">
        {category.services.length === 0 && (
          <div className="empty-state">Danh mục này chưa có dịch vụ khả dụng.</div>
        )}
        {category.services.map((service, index) => (
          <motion.article
            key={service.id}
            className="service-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.38 }}
          >
            <div className="service-card__media">
              <DomServiceImage asset={service.image} />
              {service.isFeatured && <span>Đề xuất</span>}
            </div>
            <div className="service-card__body">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span><Clock size={14} /> {service.durationMinutes} phút</span>
                <strong>{formatPrice(service.price)}</strong>
              </div>
              <div className="service-actions">
                <button
                  type="button"
                  className="book-now-button"
                  onClick={() => {
                    useBookingStore.setState({ serviceId: service.id });
                    openBookingPage({
                      experienceId,
                      categoryId: category.id,
                      serviceId: service.id,
                      onBlocked: (message) => useCartStore.setState({ notice: message }),
                    });
                  }}
                >
                  BOOK NOW
                </button>
                <button
                  type="button"
                  className="add-cart-button"
                  aria-label={`Thêm ${service.name} vào giỏ hàng`}
                  onClick={() => {
                    useBookingStore.setState({ serviceId: service.id });
                    addItem({
                      serviceId: service.id,
                      categoryId: category.id,
                      experienceId,
                      name: service.name,
                      durationMinutes: service.durationMinutes,
                      price: service.price,
                      image: service.image,
                    });
                  }}
                >
                  <ShoppingBag size={19} />
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.aside>
  );
}

function ExperiencePanel() {
  const selectExperience = useBookingStore((state) => state.selectExperience);

  return (
    <motion.section className="experience-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <p className="eyebrow">EXPERIENCE SELECTION</p>
      <h1>ORIA SPA Signature Spa</h1>
      <p>Chọn trải nghiệm trước khi bước vào vũ trụ dịch vụ.</p>
      <button type="button" onClick={() => selectExperience('luxury-spa')}>
        Bắt đầu chọn dịch vụ
      </button>
    </motion.section>
  );
}

function CartNavButton() {
  const count = useCartStore((state) => state.getItemCount());
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);

  return (
    <button
      type="button"
      className="cart-nav-button"
      onClick={() => setDrawerOpen(true)}
      aria-label={`Giỏ hàng, ${count} dịch vụ`}
    >
      <ShoppingBag size={18} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function CartNotification() {
  const notice = useCartStore((state) => state.notice);
  const clearNotice = useCartStore((state) => state.clearNotice);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(clearNotice, 2400);
    return () => window.clearTimeout(timer);
  }, [clearNotice, notice]);

  return (
    <div className={`cart-notification${notice ? ' is-visible' : ''}`} role="status" aria-live="polite">
      {notice}
    </div>
  );
}

function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const drawerOpen = useCartStore((state) => state.drawerOpen);
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = useCartStore((state) => state.getSubtotal());

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.aside
          className="cart-drawer"
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 36 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Giỏ hàng dịch vụ"
        >
          <div className="cart-drawer__header">
            <div>
              <p className="eyebrow">CART</p>
              <h2>Giỏ hàng</h2>
            </div>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng giỏ hàng">
              <X size={18} />
            </button>
          </div>
          {items.length === 0 ? (
            <div className="empty-state">Giỏ hàng chưa có dịch vụ.</div>
          ) : (
            <div className="cart-items">
              {items.map((item) => (
                <article key={item.serviceId} className="cart-item">
                  <div className="cart-item__media">
                    {item.image ? <DomServiceImage asset={item.image} /> : null}
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.durationMinutes} phút · {formatPrice(item.price)}</p>
                    <div className="cart-quantity">
                      <button type="button" onClick={() => decreaseQuantity(item.serviceId)} aria-label={`Giảm số lượng ${item.name}`}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => increaseQuantity(item.serviceId)} aria-label={`Tăng số lượng ${item.name}`}>
                        <Plus size={14} />
                      </button>
                      <button type="button" onClick={() => removeItem(item.serviceId)} aria-label={`Xóa ${item.name} khỏi giỏ hàng`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="cart-drawer__footer">
            <span>Tạm tính</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function BookingNavigation({
  stage,
  canReset,
}: {
  stage: BookingStage;
  canReset: boolean;
}) {
  const goBack = useBookingStore((state) => state.goBack);
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const handleBack = () => {
    if (stage === 'services') {
      goBack();
      return;
    }

    window.location.href = '/';
  };
  const stageLabel: Record<BookingStage, string> = {
    experience: 'TRẢI NGHIỆM',
    categories: 'DANH MỤC',
    services: 'DỊCH VỤ',
  };

  return (
    <header className="celestial-nav">
      <button type="button" className="back-pill" onClick={handleBack} aria-label="Trở về">
        <ArrowLeft size={18} />
        <span>TRỞ VỀ</span>
      </button>
      <div className="stage-pill" aria-live="polite">{stageLabel[stage]}</div>
      <CartNavButton />
      {canReset && (
        <button type="button" className="reset-button" onClick={resetBooking} aria-label="Đặt lại">
          <RotateCcw size={17} />
        </button>
      )}
    </header>
  );
}

function BookingOverlay({
  stage,
  category,
}: {
  stage: BookingStage;
  category?: ServiceCategory;
}) {
  return (
    <AnimatePresence mode="wait">
      {stage === 'experience' && <ExperiencePanel key="experience" />}
      {stage === 'services' && category && <ServiceListPanel key="services" category={category} />}
    </AnimatePresence>
  );
}

function AccessibleCategoryFallback({
  categories,
  onSelectCategory,
}: {
  categories: ServiceCategory[];
  onSelectCategory: (categoryId: string) => void;
}) {
  return (
    <nav className="sr-category-fallback" aria-label="Danh sách danh mục dịch vụ">
      {categories.map((category) => (
        <button key={category.id} type="button" onClick={() => onSelectCategory(category.id)}>
          {category.name}
        </button>
      ))}
    </nav>
  );
}

function AssetPreviewPanel() {
  const [asset, setAsset] = useState<MediaAsset>(serviceCategories[0].icon);
  const [background, setBackground] = useState('#10141d');
  const [size, setSize] = useState(1.25);

  return (
    <section className="asset-preview-panel" aria-label="Asset preview panel">
      <div className="asset-preview-panel__canvas" style={{ backgroundColor: background }}>
        <Canvas camera={{ position: [0, 0, 3.3], fov: 42 }} dpr={[1, 1.5]}>
          <ambientLight intensity={1} />
          <pointLight position={[2, 2, 2]} intensity={1.5} color="#f5dea2" />
          <group scale={size}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.16, 96]} />
              <meshStandardMaterial color="#c79a4b" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.09]}>
              <circleGeometry args={[0.5, 96]} />
              <meshStandardMaterial color="#10141d" roughness={0.75} />
            </mesh>
            <group position={[0, 0.05, 0.12]} scale={0.95}>
              <ServiceIconAsset {...asset} />
            </group>
          </group>
        </Canvas>
      </div>
      <div className="asset-controls">
        <label>
          Asset
          <select
            value={asset.src}
            onChange={(event) => {
              const next = serviceCategories
                .flatMap((category) => [category.icon, ...category.satellites.map((satellite) => satellite.icon)])
                .find((item) => item.src === event.target.value);
              if (next) setAsset(next);
            }}
          >
            {serviceCategories.flatMap((category) => [category.icon, ...category.satellites.map((satellite) => satellite.icon)]).map((item) => (
              <option key={`${item.src}-${item.alt}`} value={item.src}>{item.alt}</option>
            ))}
          </select>
        </label>
        <label>
          Filter mode
          <select value={asset.mode} onChange={(event) => setAsset({ ...asset, mode: event.target.value as IconFilterMode })}>
            {['gold-mask', 'gold-duotone', 'original', 'monochrome', 'cover'].map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </label>
        <label>
          Fit
          <select value={asset.fit} onChange={(event) => setAsset({ ...asset, fit: event.target.value as 'contain' | 'cover' })}>
            <option value="contain">contain</option>
            <option value="cover">cover</option>
          </select>
        </label>
        <label>
          Scale
          <input type="range" min="0.45" max="1.45" step="0.01" value={asset.scale ?? 1} onChange={(event) => setAsset({ ...asset, scale: Number(event.target.value) })} />
        </label>
        <label>
          Horizontal offset
          <input type="range" min="-0.2" max="0.2" step="0.01" value={asset.offsetX ?? 0} onChange={(event) => setAsset({ ...asset, offsetX: Number(event.target.value) })} />
        </label>
        <label>
          Vertical offset
          <input type="range" min="-0.2" max="0.2" step="0.01" value={asset.offsetY ?? 0} onChange={(event) => setAsset({ ...asset, offsetY: Number(event.target.value) })} />
        </label>
        <label>
          Rotation
          <input type="range" min="-30" max="30" step="1" value={asset.rotation ?? 0} onChange={(event) => setAsset({ ...asset, rotation: Number(event.target.value) })} />
        </label>
        <label>
          Opacity
          <input type="range" min="0.2" max="1" step="0.01" value={asset.opacity ?? 1} onChange={(event) => setAsset({ ...asset, opacity: Number(event.target.value) })} />
        </label>
        <label>
          Background
          <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
        </label>
        <label>
          Medallion size
          <input type="range" min="0.75" max="1.6" step="0.01" value={size} onChange={(event) => setSize(Number(event.target.value))} />
        </label>
        <pre>{JSON.stringify(asset, null, 2)}</pre>
      </div>
    </section>
  );
}

function WebGLFallback() {
  return (
    <Html center>
      <div className="webgl-fallback">
        <strong>Không thể khởi tạo WebGL.</strong>
        <span>Vẫn có thể chọn dịch vụ bằng danh sách bên dưới.</span>
      </div>
    </Html>
  );
}

function CelestialMenu() {
  const [activeCategories, setActiveCategories] = useState<ServiceCategory[]>(serviceCategories);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data && data.services) {
          const apiServices = data.services;
          const merged = serviceCategories.map(cat => {
            const apiCat = apiServices.find((c: any) => c.id === cat.id);
            if (apiCat) {
              return {
                ...cat,
                name: apiCat.name || cat.name,
                subtitle: apiCat.description || cat.subtitle,
                services: apiCat.items?.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  durationMinutes: item.durationMinutes,
                  price: item.price,
                  image: cat.services[0]?.image || { src: '', alt: '' }
                })) || cat.services
              };
            }
            return cat;
          });
          setActiveCategories(merged);
        }
      })
      .catch(err => console.error('Error fetching services for celestial menu:', err));
  }, []);
  const profile = useResponsiveQuality();
  const reducedMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAssetPreview, setShowAssetPreview] = useState(false);
  const stage = useBookingStore((state) => state.stage);
  const categoryId = useBookingStore((state) => state.categoryId);
  const selectCategory = useBookingStore((state) => state.selectCategory);
  const goBack = useBookingStore((state) => state.goBack);
  const selectedCategory = activeCategories.find((category) => category.id === categoryId);
  const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN');
  const hasMatches = activeCategories.some((category) => {
    const matchesFilter = activeFilter === 'all' || category.tags.includes(activeFilter);
    const matchesSearch =
      !normalizedSearch ||
      `${category.name} ${category.subtitle || ''} ${category.services.map((service) => service.name).join(' ')}`
        .toLocaleLowerCase('vi-VN')
        .includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });

  const handleSelectCategory = useCallback((nextCategoryId: string) => {
    selectCategory(nextCategoryId);
  }, [selectCategory]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goBack();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goBack]);

  useEffect(() => {
    const onPopState = () => goBack();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [goBack]);

  useEffect(() => {
    if (stage !== 'categories') {
      window.history.replaceState({ stage }, '', `#${stage}`);
    }
  }, [stage]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) document.body.style.cursor = 'auto';
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <main className="celestial-shell">
      <BookingNavigation stage={stage} canReset={stage !== 'categories'} />
      <CategoryFilter
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        search={search}
        setSearch={setSearch}
      />
      <AccessibleCategoryFallback categories={activeCategories} onSelectCategory={handleSelectCategory} />
      {stage === 'categories' && !categoryId && hasMatches && (
        <div className="category-guidance" aria-live="polite">
          Chọn một chòm sao để khám phá dịch vụ
        </div>
      )}
      {stage === 'categories' && !hasMatches && (
        <div className="category-guidance category-guidance--warning" role="status" aria-live="polite">
          Không tìm thấy dịch vụ phù hợp.
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, profile === 'mobile' ? 6.7 : 5.7], fov: profile === 'mobile' ? 48 : 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <color attach="background" args={['#020814']} />
        <Suspense fallback={<WebGLFallback />}>
          <CategoryUniverse
            categories={activeCategories}
            profile={profile}
            selectedCategoryId={categoryId}
            onSelectCategory={handleSelectCategory}
            activeFilter={activeFilter}
            search={search}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
      <BookingOverlay stage={stage} category={selectedCategory} />
      <CartDrawer />
      <CartNotification />
      {process.env.NODE_ENV !== 'production' && (
        <button type="button" className="asset-preview-toggle" onClick={() => setShowAssetPreview((value) => !value)}>
          Asset preview
        </button>
      )}
      <AnimatePresence>
        {showAssetPreview && (
          <motion.div className="asset-preview-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" onClick={() => setShowAssetPreview(false)}>Đóng</button>
            <AssetPreviewPanel />
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .celestial-shell {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #020814;
          color: #e8c783;
          font-family: var(--font-body), Inter, Manrope, sans-serif;
        }

        .celestial-shell canvas {
          display: block;
          touch-action: none;
        }

        .celestial-nav {
          position: fixed;
          top: max(env(safe-area-inset-top), 24px);
          left: clamp(18px, 2.1vw, 36px);
          right: clamp(18px, 2.1vw, 36px);
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 12px;
          pointer-events: none;
        }

        .back-pill,
        .stage-pill,
        .reset-button,
        .cart-nav-button {
          pointer-events: auto;
          border: 1px solid rgba(199, 154, 75, 0.7);
          background: rgba(2, 8, 20, 0.62);
          color: #e7c47b;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 0 24px rgba(199, 154, 75, 0.08);
        }

        .back-pill {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          padding: 0 22px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
        }

        .stage-pill {
          border-radius: 999px;
          padding: 12px 16px;
          font-size: 11px;
          letter-spacing: 0.16em;
          opacity: 0.82;
        }

        .reset-button {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          display: grid;
          place-items: center;
        }

        .back-pill:hover,
        .reset-button:hover,
        .cart-nav-button:hover {
          border-color: #f5dea2;
          box-shadow: 0 0 28px rgba(231, 196, 123, 0.22);
        }

        .back-pill:focus-visible,
        .reset-button:focus-visible,
        .cart-nav-button:focus-visible,
        .celestial-filter button:focus-visible,
        .service-panel button:focus-visible,
        .cart-drawer button:focus-visible,
        .experience-panel button:focus-visible,
        .asset-preview-toggle:focus-visible {
          outline: 2px solid #f5dea2;
          outline-offset: 4px;
        }

        .cart-nav-button {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          margin-left: auto;
          color: #f5dea2;
        }

        .cart-nav-button span {
          position: absolute;
          top: -6px;
          right: -5px;
          min-width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #f0d38c;
          color: #141008;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid rgba(2, 8, 20, 0.85);
        }

        .cart-notification {
          pointer-events: none;
          position: fixed;
          z-index: 35;
          top: max(calc(env(safe-area-inset-top) + 84px), 92px);
          right: clamp(18px, 2.1vw, 36px);
          max-width: min(360px, calc(100vw - 36px));
          padding: 12px 16px;
          border: 1px solid rgba(245, 222, 162, 0.42);
          border-radius: 999px;
          background: rgba(2, 8, 20, 0.82);
          color: #f5dea2;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.36);
          opacity: 0;
          transform: translateY(-8px);
          transition: opacity 220ms ease, transform 220ms ease;
        }

        .cart-notification.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .cart-drawer {
          position: fixed;
          z-index: 34;
          top: max(calc(env(safe-area-inset-top) + 86px), 96px);
          right: clamp(18px, 2.1vw, 36px);
          width: min(410px, calc(100vw - 36px));
          max-height: min(72vh, 680px);
          overflow-y: auto;
          border: 1px solid rgba(199, 154, 75, 0.32);
          border-radius: 8px;
          background: linear-gradient(150deg, rgba(7, 20, 38, 0.94), rgba(2, 8, 20, 0.9));
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.48);
          padding: 20px;
        }

        .cart-drawer__header,
        .cart-drawer__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .cart-drawer__header h2 {
          margin: 0;
          color: #f5dea2;
          font-family: var(--font-heading), Cinzel, serif;
          font-weight: 500;
        }

        .cart-drawer__header button,
        .cart-quantity button {
          border: 1px solid rgba(199, 154, 75, 0.32);
          background: rgba(255, 255, 255, 0.035);
          color: #f5dea2;
          border-radius: 999px;
          display: grid;
          place-items: center;
        }

        .cart-drawer__header button {
          width: 42px;
          height: 42px;
        }

        .cart-items {
          display: grid;
          gap: 12px;
          margin: 18px 0;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 12px;
          padding: 10px;
          border: 1px solid rgba(199, 154, 75, 0.16);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
        }

        .cart-item__media {
          min-height: 76px;
          border-radius: 8px;
          overflow: hidden;
          background: #10141d;
        }

        .cart-item__media img {
          width: 100%;
          height: 100%;
          display: block;
        }

        .cart-item h3 {
          margin: 0 0 4px;
          color: #f5dea2;
          font-size: 15px;
          line-height: 1.25;
        }

        .cart-item p {
          margin: 0 0 10px;
          color: rgba(232, 199, 131, 0.72);
          font-size: 12px;
        }

        .cart-quantity {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cart-quantity button {
          width: 30px;
          height: 30px;
        }

        .cart-quantity span {
          min-width: 22px;
          text-align: center;
          color: #f5dea2;
          font-weight: 700;
        }

        .cart-drawer__footer {
          border-top: 1px solid rgba(199, 154, 75, 0.16);
          padding-top: 16px;
          color: #c5a364;
        }

        .cart-drawer__footer strong {
          color: #f5dea2;
          font-size: 18px;
        }

        .celestial-filter {
          position: fixed;
          z-index: 19;
          left: clamp(18px, 2.1vw, 36px);
          right: clamp(18px, 2.1vw, 36px);
          bottom: max(env(safe-area-inset-bottom), 24px);
          display: grid;
          grid-template-columns: minmax(230px, 340px) minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          pointer-events: none;
        }

        .celestial-search {
          pointer-events: auto;
          position: relative;
        }

        .celestial-filter input {
          pointer-events: auto;
          min-height: 46px;
          width: 100%;
          border-radius: 999px;
          border: 1px solid rgba(199, 154, 75, 0.28);
          background: rgba(2, 8, 20, 0.62);
          color: #f5dea2;
          padding: 0 48px 0 18px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .celestial-search button {
          position: absolute;
          top: 50%;
          right: 7px;
          width: 34px;
          height: 34px;
          transform: translateY(-50%);
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(199, 154, 75, 0.22);
          background: rgba(255, 255, 255, 0.035);
          color: #f5dea2;
        }

        .celestial-filter input::placeholder {
          color: rgba(197, 163, 100, 0.74);
        }

        .celestial-filter__chips {
          pointer-events: auto;
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none;
        }

        .celestial-filter__chips::-webkit-scrollbar {
          display: none;
        }

        .celestial-filter button {
          min-height: 42px;
          white-space: nowrap;
          border-radius: 999px;
          border: 1px solid rgba(199, 154, 75, 0.24);
          background: rgba(7, 20, 38, 0.58);
          color: #c5a364;
          padding: 0 15px;
          transition: border-color 220ms ease, color 220ms ease, background 220ms ease;
        }

        .celestial-filter button.is-active {
          color: #f5dea2;
          border-color: rgba(245, 222, 162, 0.78);
          background: rgba(199, 154, 75, 0.12);
        }

        .category-guidance {
          position: fixed;
          z-index: 17;
          left: 50%;
          top: max(calc(env(safe-area-inset-top) + 96px), 104px);
          transform: translateX(-50%);
          max-width: min(520px, calc(100vw - 36px));
          padding: 11px 18px;
          border: 1px solid rgba(199, 154, 75, 0.28);
          border-radius: 999px;
          background: rgba(2, 8, 20, 0.52);
          color: #e8c783;
          text-align: center;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
        }

        .category-guidance--warning {
          color: #f5dea2;
          border-color: rgba(245, 222, 162, 0.42);
        }

        .service-panel,
        .experience-panel {
          position: fixed;
          z-index: 18;
          right: clamp(18px, 5vw, 82px);
          top: 50%;
          width: min(440px, calc(100vw - 36px));
          max-height: min(76vh, 720px);
          transform: translateY(-50%);
          overflow-y: auto;
          border: 1px solid rgba(199, 154, 75, 0.28);
          background: linear-gradient(150deg, rgba(7, 20, 38, 0.86), rgba(2, 8, 20, 0.76));
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
          border-radius: 8px;
          padding: 26px;
        }

        .experience-panel {
          left: 50%;
          right: auto;
          top: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 10px;
          font-size: 11px;
          letter-spacing: 0.24em;
          color: #c5a364;
        }

        .service-panel h2,
        .experience-panel h1 {
          margin: 0 0 10px;
          color: #f5dea2;
          font-family: var(--font-heading), Cinzel, serif;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1;
          font-weight: 500;
        }

        .panel-copy,
        .experience-panel p {
          margin: 0 0 22px;
          color: rgba(232, 199, 131, 0.78);
          line-height: 1.55;
        }

        .service-card-list {
          display: grid;
          gap: 14px;
        }

        .service-card {
          display: grid;
          grid-template-columns: 112px minmax(0, 1fr);
          gap: 14px;
          padding: 12px;
          border: 1px solid rgba(199, 154, 75, 0.18);
          background: rgba(255, 255, 255, 0.035);
          border-radius: 8px;
        }

        .service-card__media {
          position: relative;
          overflow: hidden;
          min-height: 112px;
          border-radius: 8px;
          background: #10141d;
          border: 1px solid rgba(199, 154, 75, 0.14);
        }

        .service-card__media img {
          width: 100%;
          height: 100%;
          display: block;
        }

        .service-card__media span {
          position: absolute;
          left: 8px;
          top: 8px;
          border-radius: 999px;
          padding: 4px 8px;
          background: rgba(2, 8, 20, 0.78);
          color: #f5dea2;
          font-size: 11px;
          border: 1px solid rgba(245, 222, 162, 0.3);
        }

        .service-card h3 {
          margin: 0 0 6px;
          color: #f5dea2;
          font-size: 17px;
          line-height: 1.22;
        }

        .service-card p {
          margin: 0 0 12px;
          color: rgba(232, 199, 131, 0.72);
          font-size: 13px;
          line-height: 1.45;
        }

        .service-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          color: #c5a364;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .service-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .service-meta strong {
          color: #f5dea2;
        }

        .service-actions {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 48px;
          gap: 10px;
        }

        .service-card .book-now-button,
        .experience-panel button {
          min-height: 44px;
          border: 1px solid rgba(245, 222, 162, 0.5);
          background: linear-gradient(180deg, #f0d38c 0%, #c99c4b 100%);
          color: #12100c;
          border-radius: 999px;
          padding: 0 18px;
          font-weight: 650;
          width: 100%;
        }

        .service-card .add-cart-button {
          width: 48px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(222, 181, 98, 0.7);
          background: rgba(9, 13, 22, 0.84);
          color: #e4c178;
          display: grid;
          place-items: center;
        }

        .service-card .book-now-button:hover,
        .service-card .add-cart-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(199, 154, 75, 0.16);
        }

        .asset-controls label {
          display: grid;
          gap: 7px;
          color: #c5a364;
          font-size: 13px;
          margin-bottom: 14px;
        }

        .asset-controls input,
        .asset-controls select {
          min-height: 44px;
          border: 1px solid rgba(199, 154, 75, 0.24);
          background: rgba(2, 8, 20, 0.6);
          color: #f5dea2;
          border-radius: 8px;
          padding: 0 12px;
        }


        .service-image-placeholder {
          width: 100%;
          height: 100%;
          min-height: 112px;
          background:
            radial-gradient(circle at 50% 42%, rgba(197, 163, 100, 0.18), transparent 32%),
            #10141d;
        }

        .empty-state,
        .webgl-fallback {
          color: #e8c783;
          border: 1px solid rgba(199, 154, 75, 0.22);
          background: rgba(2, 8, 20, 0.74);
          padding: 18px;
          border-radius: 8px;
        }

        .webgl-fallback {
          display: grid;
          gap: 6px;
          width: 280px;
          text-align: center;
        }

        .sr-category-fallback {
          position: fixed;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .sr-category-fallback:focus-within {
          z-index: 30;
          width: auto;
          height: auto;
          left: 24px;
          top: 92px;
          clip: auto;
          display: grid;
          gap: 8px;
          background: #020814;
          padding: 12px;
          border: 1px solid #c79a4b;
        }

        .asset-preview-toggle {
          position: fixed;
          z-index: 21;
          right: 24px;
          bottom: 94px;
          border: 1px solid rgba(199, 154, 75, 0.3);
          background: rgba(2, 8, 20, 0.7);
          color: #c5a364;
          min-height: 38px;
          border-radius: 999px;
          padding: 0 14px;
        }

        .asset-preview-modal {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(2, 8, 20, 0.86);
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .asset-preview-modal > button {
          position: fixed;
          top: 22px;
          right: 22px;
          z-index: 2;
          min-height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(199, 154, 75, 0.4);
          background: rgba(2, 8, 20, 0.8);
          color: #f5dea2;
          padding: 0 16px;
        }

        .asset-preview-panel {
          width: min(1080px, 100%);
          max-height: 88vh;
          display: grid;
          grid-template-columns: minmax(320px, 1fr) minmax(280px, 390px);
          gap: 18px;
          overflow: auto;
        }

        .asset-preview-panel__canvas {
          min-height: 560px;
          border: 1px solid rgba(199, 154, 75, 0.3);
          border-radius: 8px;
          overflow: hidden;
        }

        .asset-controls {
          border: 1px solid rgba(199, 154, 75, 0.3);
          background: rgba(7, 20, 38, 0.82);
          border-radius: 8px;
          padding: 18px;
        }

        .asset-controls pre {
          white-space: pre-wrap;
          color: #f5dea2;
          background: rgba(0, 0, 0, 0.28);
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .celestial-filter {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .service-panel,
          .experience-panel {
            top: auto;
            left: 12px;
            right: 12px;
            bottom: max(env(safe-area-inset-bottom), 12px);
            width: auto;
            max-height: 48vh;
            transform: none;
            padding: 20px;
          }

          .service-card {
            grid-template-columns: 92px minmax(0, 1fr);
          }

          .service-card__media {
            min-height: 98px;
          }

          .celestial-filter {
            bottom: calc(max(env(safe-area-inset-bottom), 12px) + 50vh);
          }

          .asset-preview-panel {
            grid-template-columns: 1fr;
          }

          .asset-preview-panel__canvas {
            min-height: 360px;
          }
        }

        @media (max-width: 560px) {
          .celestial-nav {
            top: max(env(safe-area-inset-top), 14px);
            left: 12px;
            right: 12px;
          }

          .back-pill {
            min-height: 44px;
            padding: 0 14px;
            font-size: 12px;
          }

          .stage-pill {
            display: none;
          }

          .celestial-filter {
            left: 12px;
            right: 12px;
          }

          .service-panel,
          .experience-panel {
            max-height: 52vh;
          }

          .cart-drawer {
            left: 12px;
            right: 12px;
            width: auto;
            max-height: 66vh;
          }

          .service-card {
            grid-template-columns: 1fr;
          }

          .service-card__media {
            aspect-ratio: 16 / 8;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .celestial-shell *,
          .celestial-shell *::before,
          .celestial-shell *::after {
            animation-duration: 1ms !important;
            transition-duration: 1ms !important;
          }
        }
      `}</style>
    </main>
  );
}

export default function SpaCelestialMenuPage() {
  return <CelestialMenu />;
}
