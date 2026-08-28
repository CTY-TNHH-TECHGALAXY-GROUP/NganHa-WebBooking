'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, Loader } from '@react-three/drei';
import Scene from './Scene';
import { useCinematicStore } from '@/store/useCinematicStore';

export default function CinematicServiceBook() {
  const setQuality = useCinematicStore((state) => state.setQuality);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#07111F' }}>
      <Suspense fallback={null}>
        <Canvas
          shadows
          dpr={[1, 2]} // Will be adjusted by PerformanceMonitor
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 5, 12], fov: 45 }}
        >
          <PerformanceMonitor
            onIncline={() => setQuality('high')}
            onDecline={() => setQuality('low')}
          >
            <Scene />
          </PerformanceMonitor>
        </Canvas>
      </Suspense>
      <Loader
        containerStyles={{ background: '#07111F' }}
        innerStyles={{ background: '#0C1B30', width: '300px' }}
        barStyles={{ background: '#D6AD60' }}
        dataStyles={{ color: '#F4E8CE', fontFamily: 'sans-serif' }}
      />
    </div>
  );
}
