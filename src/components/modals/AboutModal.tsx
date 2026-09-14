import React from 'react';
import { X, Info, Shield, Layers, Code2, Heart, Send } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-center">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white text-start">درباره MLM VPN Core</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
          <span className="text-white font-black text-2xl tracking-wider">MLM</span>
        </div>

        <div>
          <h4 className="text-base font-bold text-white">MLM VPN (Multi-Layer Multiplexer)</h4>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">نسخه ۲.۸.۴ وب و اندروید</p>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed text-start bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
          پروژه <strong>MLM VPN</strong> یک سیستم ضد فیلترینگ چند لایه و تجمیع‌کننده ترافیک است که با ترکیب هوشمند ورکر‌های لبه کلودفلر (BPB و EdgeTunnel)، پروتکل‌های MASQUE بر بستر HTTP/3، گیت‌وی‌های آکادمیک SoftEther و اسکنر آی‌پی‌های تمیز، پایداری مداوم ارتباط در شدیدترین سناریوهای فیلترینگ را فراهم می‌آورد.
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="https://github.com/Mashkooki/mlmvpn_droid"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center justify-center gap-2 font-medium"
          >
            <Code2 className="w-4 h-4" />
            <span>گیت‌هاب پروژه</span>
          </a>
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center gap-2 font-medium">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            <span>متن‌باز و رایگان</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
        >
          بستن
        </button>
      </div>
    </div>
  );
};
