import React, { useState } from 'react';
import { X, AlertTriangle, Flame, ShieldAlert, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { useVpn } from '../../context/VpnContext';

interface EmergencyModalProps {
  isOpen: boolean;
  emergencyType: string | null;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  emergencyType,
  onClose,
}) => {
  const { setActiveEmergency, connect, nodes } = useVpn();
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen || !emergencyType) return null;

  const modeDetails = {
    emergency_vercel: {
      title: 'حالت اضطراری ۱ (Vercel Edge Relay)',
      desc: 'انتقال ترافیک از طریق سرورهای لبه Vercel به عنوان لایه پشتیبان در صورت مسدود شدن مستقیم ورکر‌های کلودفلر.',
      tech: 'Vercel Serverless Function Reverse Proxy + TLS SNI Cloaking',
      color: 'red',
    },
    emergency_2: {
      title: 'حالت اضطراری ۲ (Domain Fronting پیشرفته)',
      desc: 'پنهان‌سازی آدرس مقصد در داخل هدرهای رمزنگاری‌شده TLS با ظاهر دامنه معتبر بین‌المللی جهت عبور از سیستم بازرسی عمیق بسته‌ها (DPI).',
      tech: 'SNI Spoofing + CDN Multiplexing v23',
      color: 'amber',
    },
    emergency_3: {
      title: 'حالت اضطراری ۳ (Clean Tunnel Extreme)',
      desc: 'حالت بقا برای شرایط قطع اینترنت بین‌الملل یا اعمال فیلترینگ سفید. اتصال همزمان به چندین رله و ارسال بسته‌های پوششی.',
      tech: 'Dynamic Clean IP Hopping + Obfuscated WireGuard Junk Packets',
      color: 'rose',
    },
  }[emergencyType] || {
    title: 'حالت اضطراری',
    desc: 'مسیریابی از طریق پل‌های جایگزین ضد فیلترینگ.',
    tech: 'Multi-layer Proxy Tunnel',
    color: 'red',
  };

  const handleActivate = async () => {
    setIsActivating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setActiveEmergency(emergencyType);
    setIsActivating(false);
    onClose();

    // Automatically trigger connection through resilient node
    const resilientNode = nodes[0];
    if (resilientNode) {
      connect({
        ...resilientNode,
        name: `🚨 ${modeDetails.title}`,
        engineType: 'EMERGENCY',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#18181b] border border-red-500/40 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl shadow-red-950/50">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{modeDetails.title}</h3>
              <p className="text-[11px] text-red-400 font-mono">Bypass Emergency Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
          {modeDetails.desc}
        </p>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 text-xs">
          <span className="text-zinc-400">مکانیزم فنی هسته:</span>
          <div className="font-mono text-emerald-400 font-semibold">{modeDetails.tech}</div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActivating}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isActivating ? (
              <span>در حال برقراری رله...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>فعال‌سازی حالت اضطراری</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
