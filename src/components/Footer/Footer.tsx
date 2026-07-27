import React from 'react';

const Footer = () => {
  return (
    <footer id="footer" className="bg-[#0A0A0A] border-t border-[rgba(212,175,55,0.1)] py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl text-[#D4AF37]">✦</span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#E7AA51] to-[#8D5A1B]">NGÂN HÀ</span>
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] italic uppercase tracking-widest">Barbershop & Spa</span>
            </div>
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed mt-2">
            Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm Quận 1, TP.HCM.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-[#D4AF37] text-lg font-semibold tracking-wide">Chi nhánh</h4>
          <ul className="text-sm text-[rgba(255,255,255,0.6)] space-y-3">
            <li>
              <strong className="text-white">ORIA SPA Barbershop</strong><br/>
              11 Ngô Đức Kế, Q.1, TP.HCM<br/>
              9:00 AM - 12:00 AM
            </li>
            <li>
              <strong className="text-white">ORIA SPA</strong><br/>
              6B Thi Sách, Q.1, TP.HCM<br/>
              9:00 AM - 12:00 AM
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-[#D4AF37] text-lg font-semibold tracking-wide">Liên hệ</h4>
          <ul className="text-sm text-[rgba(255,255,255,0.6)] space-y-3">
            <li>Hotline: <a href="tel:+84" className="text-[#D4AF37] hover:underline">+84</a></li>
            <li>Fanpage: ORIA SPA</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[rgba(255,255,255,0.05)] text-center">
        <p className="text-xs text-[rgba(255,255,255,0.4)]">
          &copy; {new Date().getFullYear()} ORIA SPA. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
