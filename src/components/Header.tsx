import React from 'react';
import { Menu, ArrowDown, ArrowUp, ShieldCheck, ShieldAlert, Globe2, AlertTriangle } from 'lucide-react';
import { useVpn } from '../context/VpnContext';
import { getTranslation } from '../i18n';

interface HeaderProps {
  onOpenDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDrawer }) => {
  const {
    isRunning,
    phase,
    trafficDown,
    trafficUp,
    settings,
    language,
    setLanguage,
    activeEmergency,
    setActiveEmergency,
  } = useVpn();
  const t = getTranslation(language);

  const isConnecting = phase === 'CONNECTING' || phase === 'CHECKING_IP';

  return (
    <header className="sticky top-0 z-30 w-full bg-[#18181b]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
      {activeEmergency && (
        <div className="mb-2 px-3 py-1.5 bg-red-950/70 border border-red-500/50 rounded-lg flex items-center justify-between text-xs text-red-200 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="font-medium">
              {activeEmergency === 'emergency_vercel' && 'حالت اضطراری ۱ فعال است (Vercel Edge Relay)'}
              {activeEmergency === 'emergency_2' && 'حالت اضطراری ۲ فعال است (Domain Fronting)'}
              {activeEmergency === 'emergency_3' && 'حالت اضطراری ۳ فعال است (Extreme Tunnel)'}
            </span>
          </div>
          <button
            onClick={() => setActiveEmergency(null)}
            className="px-2 py-0.5 bg-red-800/60 hover:bg-red-700 text-white rounded text-[10px]"
          >
            {t.commonClose}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Drawer Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="btn-open-drawer"
            onClick={onOpenDrawer}
            className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 hover:text-white transition-colors"
            title={t.drawerMainMenu}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <span className="text-white font-black text-sm tracking-wider">MLM</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                {t.appName}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Core v2.8
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Realtime Traffic (if enabled) */}
        {settings.showRealtimeTraffic && (
          <div className="hidden sm:flex items-center gap-4 px-3 py-1 bg-zinc-900/90 rounded-full border border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-1 text-emerald-400">
              <ArrowDown className={`w-3.5 h-3.5 ${isRunning ? 'animate-bounce' : 'opacity-40'}`} />
              <span className="font-semibold">
                {isRunning ? `${(trafficDown / 1024).toFixed(1)} MB/s` : '0.0 KB/s'}
              </span>
            </div>
            <div className="w-[1px] h-3.5 bg-zinc-700" />
            <div className="flex items-center gap-1 text-indigo-400">
              <ArrowUp className={`w-3.5 h-3.5 ${isRunning ? 'animate-bounce' : 'opacity-40'}`} />
              <span className="font-semibold">
                {isRunning ? `${(trafficUp / 1024).toFixed(1)} MB/s` : '0.0 KB/s'}
              </span>
            </div>
          </div>
        )}

        {/* Right Side: Status Badge & Language Switch */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                : isConnecting
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
            }`}
          >
            {isRunning ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.quickConnected}</span>
              </>
            ) : isConnecting ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{t.quickConnecting}</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.quickDisconnected}</span>
              </>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800/70 hover:bg-zinc-700/70 text-zinc-300 text-xs transition-colors"
            title="Switch Language"
          >
            <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold">{language === 'fa' ? 'EN' : 'فا'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
