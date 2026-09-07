import SmartLogo from '@/components/SmartLogo';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9990] bg-[#0c0b0a] flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.12), transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with gentle pulse */}
        <div className="w-36 md:w-44 mb-6 opacity-90 animate-pulse">
          <SmartLogo theme="dark" alt="Oria Spa" />
        </div>

        {/* Elegant gold spinner ring */}
        <div className="relative w-8 h-8">
          <div className="w-8 h-8 rounded-full border border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
        </div>

        <p className="mt-4 font-serif text-[11px] text-[#c6a55f] tracking-[0.25em] uppercase opacity-70">
          Oria Spa
        </p>
      </div>
    </div>
  );
}
