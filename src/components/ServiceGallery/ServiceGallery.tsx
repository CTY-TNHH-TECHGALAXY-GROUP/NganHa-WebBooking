'use client';

import React from 'react';
import { motion } from 'framer-motion';

const images = [
  { src: 'https://images.unsplash.com/photo-1540555700887-37fbdfcff294?q=80&w=600&auto=format&fit=crop', alt: 'Spa massage', angle: -3 },
  { src: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=600&auto=format&fit=crop', alt: 'Facial therapy', angle: 4 },
  { src: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=600&auto=format&fit=crop', alt: 'Relaxing environment', angle: -2 },
  { src: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=600&auto=format&fit=crop', alt: 'Barbershop', angle: 5 }
];

const ServiceGallery = () => {
  return (
    <section id="gallery" className="py-24 px-6 bg-[#050505] relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif text-white tracking-wider"
          >
            A Glimpse of <span className="text-[#D4AF37] italic">Paradise</span>
          </motion.h2>
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 mt-12 justify-items-center">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className="bg-zinc-100 p-3 pb-12 shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded relative"
              style={{ transform: `rotate(${img.angle}deg)` }}
            >
              <div className="overflow-hidden relative border border-zinc-200 w-[240px] h-[300px]">
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(212,175,55,0.3)] to-transparent mix-blend-overlay pointer-events-none" />
                <div className="media-watermark" />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center font-serif text-zinc-800 text-lg font-bold uppercase tracking-wider">
                {img.alt}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceGallery;
