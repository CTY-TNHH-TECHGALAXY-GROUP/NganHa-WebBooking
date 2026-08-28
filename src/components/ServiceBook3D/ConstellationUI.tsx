'use client';

import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useCinematicStore } from '@/store/useCinematicStore';
import { ServiceCategory } from '@/data/services';
import * as THREE from 'three';

interface ConstellationUIProps {
  category: ServiceCategory;
}

export default function ConstellationUI({ category }: ConstellationUIProps) {
  const { phase, setPhase, setActiveCategory, activeCategory } = useCinematicStore();
  const isActive = activeCategory?.id === category.id;
  const isHidden = phase === 'category_focused' && !isActive;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      // Go back
      setPhase('idle');
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
      setPhase('category_focused');
    }
  };

  return (
    <group position={new THREE.Vector3(...category.position)}>
      {/* The glowing star/node */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial 
          color="#D6AD60" 
          transparent 
          opacity={isHidden ? 0.2 : 1} 
        />
      </mesh>

      {/* HTML Overlay */}
      <Html 
        center 
        distanceFactor={10} 
        style={{
          transition: 'all 0.5s',
          opacity: isHidden ? 0 : 1,
          pointerEvents: isHidden ? 'none' : 'auto',
          transform: isActive ? 'scale(1.2) translateY(-20px)' : 'scale(1) translateY(20px)',
          cursor: 'pointer'
        }}
        zIndexRange={[100, 0]}
      >
        <div 
          onClick={handleClick}
          style={{
            background: isActive ? 'rgba(12, 27, 48, 0.9)' : 'rgba(7, 17, 31, 0.6)',
            border: `1px solid ${isActive ? '#F3D799' : '#D6AD60'}`,
            padding: '8px 16px',
            borderRadius: '20px',
            backdropFilter: 'blur(8px)',
            color: '#F4E8CE',
            fontFamily: 'serif',
            textAlign: 'center',
            minWidth: 'max-content',
            boxShadow: isActive ? '0 0 20px rgba(214, 173, 96, 0.4)' : 'none',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{category.name}</div>
          {isActive && (
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              {category.subtitle}
            </div>
          )}
        </div>

        {/* Render Services if active */}
        {isActive && (
          <div style={{ 
            marginTop: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            width: '300px'
          }}>
            {category.services.map((srv) => (
              <div 
                key={srv.id}
                style={{
                  background: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid rgba(214, 173, 96, 0.3)',
                  padding: '12px',
                  borderRadius: '12px',
                  color: '#fff',
                  fontFamily: 'sans-serif'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#D6AD60' }}>{srv.name}</span>
                  <span style={{ fontSize: '14px' }}>
                    {new Intl.NumberFormat("vi-VN").format(srv.price)} {srv.currency}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
                  ⏱ {srv.duration} mins • {srv.shortDescription}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {srv.description}
                </div>
                <button
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px',
                    background: '#D6AD60',
                    color: '#07111F',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}
      </Html>
    </group>
  );
}
