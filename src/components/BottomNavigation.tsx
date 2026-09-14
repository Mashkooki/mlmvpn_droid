import React from 'react';
import { Radar, Cloud, Zap, Shield, Gamepad2, Layers } from 'lucide-react';
import { TabType } from '../types';
import { useVpn } from '../context/VpnContext';
import { getTranslation } from '../i18n';

interface BottomNavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onSelectTab }) => {
  const { isRunning, phase, language, settings } = useVpn();
  const t = getTranslation(language);

  const isConnecting = phase === 'CONNECTING' || phase === 'CHECKING_IP';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto bg-[#18181b]/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/80 px-2 py-1.5 flex items-center justify-around">
        {/* Tab 1: Scanner */}
        <button
          onClick={() => onSelectTab('scanner')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'scanner'
              ? 'text-indigo-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t.navScanner}</span>
        </button>

        {/* Tab 2: Cloud */}
        <button
          onClick={() => onSelectTab('cloud')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'cloud'
              ? 'text-indigo-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cloud className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t.navCloud}</span>
        </button>

        {/* Center: Quick Connect Button */}
        <button
          onClick={() => onSelectTab('quick')}
          className="relative -top-5 flex flex-col items-center group focus:outline-none"
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform group-active:scale-95 ${
              isRunning
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                : isConnecting
                ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/40 ring-4 ring-amber-500/20 animate-pulse'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/30 ring-4 ring-indigo-500/20'
            }`}
          >
            <Zap className={`w-7 h-7 ${isRunning ? 'fill-current' : ''}`} />
          </div>
          <span
            className={`text-[10px] font-bold mt-1 ${
              activeTab === 'quick' ? 'text-indigo-400' : 'text-zinc-300'
            }`}
          >
            {t.navQuick}
          </span>
        </button>

        {/* Tab 3: Aether MASQUE (if enabled) */}
        {settings.enableAetherTab && (
          <button
            onClick={() => onSelectTab('aether')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
              activeTab === 'aether'
                ? 'text-indigo-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{t.navAether}</span>
          </button>
        )}

        {/* Tab 4: Game Booster (if enabled) */}
        {settings.enableGameTab && (
          <button
            onClick={() => onSelectTab('game')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
              activeTab === 'game'
                ? 'text-indigo-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{t.navGame}</span>
          </button>
        )}

        {/* Tab 5: Nodes */}
        <button
          onClick={() => onSelectTab('nodes')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'nodes'
              ? 'text-indigo-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t.navNodes}</span>
        </button>
      </div>
    </div>
  );
};
