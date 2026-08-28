'use client';

import React from 'react';
import { motion } from 'framer-motion';

const blogPosts = [
  {
    id: 1,
    title: "5 Lợi ích tuyệt vời của gội đầu dưỡng sinh",
    date: "Mars 15, 2026",
    category: "Wellness",
    image: "https://images.unsplash.com/photo-1540555700887-37fbdfcff294?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Cách chăm sóc da mặt chuẩn Spa tại nhà",
    date: "Mars 10, 2026",
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Trải nghiệm dịch vụ lấy ráy tai phong cách Hoàng gia",
    date: "Mars 05, 2026",
    category: "Experience",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Bí quyết giữ nếp tóc nam luôn bồng bềnh",
    date: "Feb 28, 2026",
    category: "Barber",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=400&auto=format&fit=crop"
  }
];

const BlogSection = () => {
  return (
    <section id="blogs" className="py-24 px-6 bg-[#0A0A0A] relative border-t border-[#D4AF37]/10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <span className="text-[#D4AF37] tracking-widest uppercase text-sm font-semibold mb-2 block">News & Articles</span>
            <h2 className="text-4xl md:text-5xl font-serif text-white tracking-wide">Latest From <span className="italic text-[#D4AF37]">Blog</span></h2>
          </div>
          <a href="#all-blogs" className="mt-6 md:mt-0 text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/50 px-6 py-2 rounded-full transition-all uppercase tracking-widest text-sm">
            View All
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post, i) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111] rounded-2xl overflow-hidden shadow-lg border border-white/5 group hover:border-[#D4AF37]/50 transition-colors"
            >
              <div className="h-48 overflow-hidden relative">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="media-watermark" />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs text-[#D4AF37] uppercase tracking-wider border border-[#D4AF37]/30">
                  {post.category}
                </div>
              </div>
              <div className="p-6">
                <div className="text-white/40 text-sm mb-3 font-light">{post.date}</div>
                <h3 className="text-white font-serif text-xl group-hover:text-[#D4AF37] transition-colors leading-snug">
                  {post.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
