'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// We must dynamically import the 3D Canvas component to prevent SSR issues with Three.js
const CinematicServiceBook = dynamic(
  () => import('@/components/ServiceBook3D'),
  { ssr: false, loading: () => <div style={{ width: '100vw', height: '100vh', background: '#07111F' }} /> }
);

export default function Demo3DPage() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CinematicServiceBook />
      
      {/* HUD overlay for demo instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#D6AD60',
        fontFamily: 'sans-serif',
        background: 'rgba(7, 17, 31, 0.8)',
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid rgba(214, 173, 96, 0.3)',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Cinematic 3D Demo</h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
          Move mouse to parallax.<br/>
          Click a glowing node to focus.<br/>
          Click the active node again to zoom out.
        </p>
      </div>
    </main>
  );
}
