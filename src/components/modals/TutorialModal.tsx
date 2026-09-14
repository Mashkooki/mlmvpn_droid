import React from 'react';
import { X, BookOpen, CheckCircle2, Cloud, Radar, Shield, Gamepad2, ArrowLeft } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: '۱. یافتن آی‌پی تمیز با اسکنر',
      desc: 'وارد تب اسکنر شوید، اپراتور خود را انتخاب کنید (همراه اول، ایرانسل یا وای‌فای) و اسکن هوشمند را شروع کنید تا سالم‌ترین آی‌پی‌های بدون اختلال شناسایی شوند.',
      icon: <Radar className="w-4 h-4 text-indigo-400" />,
    },
    {
      title: '۲. اتصال به ورکر کلودفلر',
      desc: 'در تب کلودفلر، توکن اختصاصی کلودفلر خود را اضافه کنید یا از نودهای پیش‌فرض استفاده کنید. سیستم به صورت خودکار ترافیک شما را از لبه امن کلودفلر عبور می‌دهد.',
      icon: <Cloud className="w-4 h-4 text-amber-400" />,
    },
    {
      title: '۳. حالت توربو بازی (Game Booster)',
      desc: 'اگر اهل بازی‌های آنلاین هستید، تب بوستر بازی را فعال کنید تا پکت‌های بازی از طریق سریع‌ترین DNSهای خاورمیانه و کمترین جیتر هدایت شوند.',
      icon: <Gamepad2 className="w-4 h-4 text-rose-400" />,
    },
    {
      title: '۴. شرایط اختلال شدید (حالت اضطراری)',
      desc: 'در صورت فیلترینگ شدید، از منوی اصلی حالت‌های اضطراری ۱ (Vercel Relay) یا ۲ (Domain Fronting) را برگزینید تا با پنهان‌سازی SNI ارتباط برقرار بماند.',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">آموزش و راهنمای گام‌به‌گام</h3>
              <p className="text-xs text-zinc-400">چگونه حداکثر کارایی و پایداری را از MLM VPN به دست آوریم</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto p-1">
          {steps.map((st, idx) => (
            <div key={idx} className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                {st.icon}
                <span>{st.title}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed ps-6">{st.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};
