import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BookModel() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Very subtle breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      {/* A simple placeholder book shape */}
      <boxGeometry args={[4, 0.5, 6]} />
      <meshStandardMaterial 
        color="#07111F" 
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={1}
      />
      {/* Gold Edge */}
      <mesh position={[1.9, 0, 0]}>
        <boxGeometry args={[0.2, 0.45, 5.9]} />
        <meshStandardMaterial 
          color="#D6AD60" 
          metalness={1}
          roughness={0.1}
          emissive="#D6AD60"
          emissiveIntensity={0.2}
        />
      </mesh>
    </mesh>
  );
}
