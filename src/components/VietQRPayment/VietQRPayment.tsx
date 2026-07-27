'use client';

import React from 'react';
import { motion } from 'framer-motion';

type VietQRPaymentProps = {
  amount: number;
  orderInfo: string;
};

const VietQRPayment = ({ amount, orderInfo }: VietQRPaymentProps) => {

  const bankCode = process.env.NEXT_PUBLIC_VIETQR_BANK || 'MB';
  const accountNo = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT || '0123456789';
  const accountName = process.env.NEXT_PUBLIC_VIETQR_NAME || 'ORIA SPA';
  const template = 'qr_only'; 
  
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(orderInfo)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
      className="bg-[#111111]/90 backdrop-blur-xl border border-[rgba(212,175,55,0.2)] rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
    >
      {/* Animated Top Gradient Bar */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#E7AA51] via-[#FFE499] to-[#8D5A1B] origin-left" 
      />
      
      <div className="text-center mt-2">
        <h3 className="text-2xl font-bold font-serif text-[#D4AF37] mb-2 tracking-wide uppercase">Thanh Toán VietQR</h3>
        <p className="text-sm text-[rgba(255,255,255,0.5)] leading-relaxed">Vui lòng quét mã QR bằng ứng dụng ngân hàng<br/>để hoàn tất thủ tục đặt lịch.</p>
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        className="bg-white p-3 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.2)] border-[3px] border-[#D4AF37] relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl mix-blend-overlay pointer-events-none" />
        <img 
          src={qrUrl} 
          alt="VietQR Payment" 
          width={280} 
          height={280}
          className="w-full max-w-[280px] h-auto rounded-xl"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full space-y-4 bg-[#0A0A0A] p-5 rounded-2xl border border-[rgba(212,175,55,0.15)] shadow-inner"
      >
        <div className="flex justify-between items-center text-sm border-b border-[rgba(255,255,255,0.05)] pb-4">
          <span className="text-[rgba(255,255,255,0.5)] uppercase tracking-wider text-xs font-semibold">Tổng Tiền</span>
          <span className="font-bold text-[#D4AF37] text-2xl tracking-tight">{amount.toLocaleString()}<span className="text-sm ml-1 text-[#D4AF37]/70">VND</span></span>
        </div>
        <div className="flex justify-between items-center text-sm pt-1">
          <span className="text-[rgba(255,255,255,0.5)] uppercase tracking-wider text-xs font-semibold">Mã Đơn</span>
          <span className="font-mono text-white text-right font-medium max-w-[65%] truncate bg-[#1A1A1A] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.05)]">{orderInfo}</span>
        </div>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-[rgba(255,255,255,0.4)] text-center mt-2 leading-relaxed italic"
      >
        Giao dịch sẽ được chi nhánh xác nhận trong ít phút.<br />Nhân viên tư vấn sẽ gọi lại qua SĐT để hỗ trợ thêm.
      </motion.p>
    </motion.div>
  );
};

export default VietQRPayment;
