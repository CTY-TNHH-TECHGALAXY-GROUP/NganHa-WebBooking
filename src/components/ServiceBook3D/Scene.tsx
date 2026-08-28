'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { useCinematicStore } from '@/store/useCinematicStore';
import { MOCK_CATEGORIES } from '@/data/services';
import ConstellationUI from './ConstellationUI';
import BookModel from './BookModel';

gsap.registerPlugin(useGSAP);

export default function Scene() {
  const { camera, size, gl } = useThree();
  const quality = useCinematicStore((state) => state.quality);
  const phase = useCinematicStore((state) => state.phase);
  const activeCategory = useCinematicStore((state) => state.activeCategory);

  const groupRef = useRef<THREE.Group>(null);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Responsive values based on window width
  const isMobile = size.width < 768;
  const cameraZ = isMobile ? 18 : 12;

  // Parallax handling
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse to -1 to 1
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    // Micro-motion and Parallax when idle
    if (phase === 'intro' || phase === 'idle' || phase === 'book_hover') {
      const parallaxX = mouse.current.x * (isMobile ? 0.5 : 1.5);
      const parallaxY = mouse.current.y * (isMobile ? 0.5 : 1.5);

      // Dampen camera position
      state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, parallaxX, 4, delta);
      state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 5 + parallaxY, 4, delta);
      
      // Look at target
      state.camera.lookAt(cameraTargetRef.current);
    }
  });

  useGSAP(() => {
    const tl = gsap.timeline();

    if (phase === 'intro') {
      // Intro transition
      tl.fromTo(camera.position, 
        { y: 20, z: 25 }, 
        { y: 5, z: cameraZ, duration: 2.5, ease: 'power3.inOut' }
      );
      useCinematicStore.getState().setPhase('idle');
    }

    if (phase === 'category_focused' && activeCategory) {
      // Move camera to category
      const targetPos = new THREE.Vector3(...activeCategory.position);
      
      tl.to(camera.position, {
        x: targetPos.x * 0.5,
        y: targetPos.y + 2,
        z: targetPos.z + (isMobile ? 12 : 8),
        duration: 1.5,
        ease: 'expo.inOut',
        onUpdate: () => {
          camera.lookAt(cameraTargetRef.current);
        }
      }, 0);

      tl.to(cameraTargetRef.current, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'expo.inOut'
      }, 0);
    }

    if (phase === 'idle') {
      // Return to center
      tl.to(camera.position, {
        x: 0,
        y: 5,
        z: cameraZ,
        duration: 1.5,
        ease: 'expo.inOut',
      }, 0);
      tl.to(cameraTargetRef.current, {
        x: 0, y: 0, z: 0, duration: 1.5, ease: 'expo.inOut'
      }, 0);
    }

  }, [phase, activeCategory, cameraZ]);

  // Adjust particles based on quality
  const particleCount = quality === 'high' ? 5000 : quality === 'medium' ? 2000 : 500;

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#0C1B30" />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#F4E8CE" castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#D6AD60" />

      {/* Environment */}
      <Stars radius={100} depth={50} count={particleCount} factor={4} saturation={0} fade speed={1} />
      
      {/* Book & Pedestal */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <BookModel />
      </Float>
      
      <ContactShadows position={[0, -2, 0]} opacity={0.7} scale={20} blur={2.5} far={4} color="#000" />
      
      {/* Categories */}
      {MOCK_CATEGORIES.map((category) => (
        <ConstellationUI key={category.id} category={category} />
      ))}
    </group>
  );
}
