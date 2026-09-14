import React, { useState } from 'react';
import {
  Power,
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Shield,
  Layers,
  Cpu,
  Flame,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';
import { TabType } from '../../types';

interface QuickConnectTabProps {
  onNavigateToNodes: () => void;
  onNavigateToEmergency: (type: string) => void;
  onNavigateToTab: (tab: TabType) => void;
}

export const QuickConnectTab: React.FC<QuickConnectTabProps> = ({
  onNavigateToNodes,
  onNavigateToEmergency,
  onNavigateToTab,
}) => {
  const {
    isRunning,
    phase,
    connectedNode,
    activeEngine,
    realDelay,
    trafficDown,
    trafficUp,
    quickToggle,
    nodes,
    language,
  } = useVpn();
  const t = getTranslation(language);

  const [selectedEngine, setSelectedEngine] = useState<string>('MLM');

  const isConnecting = phase === 'CONNECTING' || phase === 'CHECKING_IP';

  // Available anti-censorship engines
  const engines = [
    { id: 'MLM', name: 'MLM Multiplexer', desc: 'توزیع بار چند لایه‌ای', color: 'from-indigo-500 to-purple-600' },
    { id: 'BPB', name: 'BPB Cloudflare', desc: 'ورکر VLESS/Trojan', color: 'from-amber-500 to-orange-600' },
    { id: 'EDG', name: 'EdgeTunnel', desc: 'تونل لبه کلودفلر', color: 'from-cyan-500 to-blue-600' },
    { id: 'AETHER', name: 'Aether MASQUE', desc: 'پروتکل امن HTTP/3', color: 'from-emerald-500 to-teal-600' },
    { id: 'VPNGATE', name: 'VPN Gate', desc: 'رله‌های عمومی آکادمیک', color: 'from-rose-500 to-pink-600' },
  ];

  const currentNode = connectedNode || nodes[0];

  return (
    <div className="w-full max-w-lg mx-auto pb-28 pt-2 px-4 space-y-6">
      {/* Top Banner / Engine Status */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">{t.quickActiveEngine}</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{activeEngine}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Real Delay Ping */}
        <div className="text-end">
          <div className="text-xs text-zinc-400 font-medium">{t.quickRealDelay}</div>
          <div className="flex items-center justify-end gap-1.5 text-sm font-bold">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span
              className={
                isRunning
                  ? realDelay < 80
                    ? 'text-emerald-400'
                    : realDelay < 130
                    ? 'text-amber-400'
                    : 'text-rose-400'
                  : 'text-zinc-500'
              }
            >
              {isRunning ? `${realDelay} ms` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Connection Visual & Button */}
      <div className="relative flex flex-col items-center justify-center py-6">
        {/* Radiating Pulse Waves */}
        {isRunning && (
          <>
            <div className="absolute w-64 h-64 rounded-full border border-emerald-500/20 animate-ping pointer-events-none" />
            <div className="absolute w-80 h-80 rounded-full border border-emerald-500/10 pointer-events-none" />
          </>
        )}

        {isConnecting && (
          <div className="absolute w-64 h-64 rounded-full border-2 border-amber-500/40 border-dashed animate-spin pointer-events-none" />
        )}

        {/* Big Interactive Power Button */}
        <button
          onClick={quickToggle}
          disabled={isConnecting}
          className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl focus:outline-none ${
            isRunning
              ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white shadow-emerald-500/40 ring-8 ring-emerald-500/20'
              : isConnecting
              ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-amber-500/40 ring-8 ring-amber-500/20'
              : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-300 hover:text-white shadow-black/80 ring-8 ring-zinc-800/40 hover:ring-zinc-700/60'
          }`}
        >
          <Power className={`w-16 h-16 mb-2 ${isRunning ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isRunning ? t.quickConnected : isConnecting ? t.quickConnecting : t.quickTapToConnect}
          </span>
        </button>

        {/* Subtitle / Tunnel message */}
        <div className="mt-5 text-center">
          <p className="text-xs text-zinc-400">
            {isRunning
              ? t.quickConnectionSuccess
              : isConnecting
              ? 'در حال برقراری تونل TLS و عبور از فیلترینگ...'
              : 'اتصال ایمن با معماری مالتی‌پلکسر چند لایه'}
          </p>
        </div>
      </div>

      {/* Traffic Speed Monitor (when connected) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">سرعت دریافت (Download)</div>
            <div className="text-base font-bold text-white font-mono">
              {isRunning ? `${(trafficDown / 1024).toFixed(2)} MB/s` : '0.00 MB/s'}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ArrowUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">سرعت ارسال (Upload)</div>
            <div className="text-base font-bold text-white font-mono">
              {isRunning ? `${(trafficUp / 1024).toFixed(2)} MB/s` : '0.00 MB/s'}
            </div>
          </div>
        </div>
      </div>

      {/* Currently Selected / Recommended Node Card */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-400" />
            {t.quickBestNode}
          </span>
          <button
            onClick={onNavigateToNodes}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>{t.quickSwitchNode}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentNode && (
          <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {currentNode.countryCode === 'DE'
                  ? '🇩🇪'
                  : currentNode.countryCode === 'NL'
                  ? '🇳🇱'
                  : currentNode.countryCode === 'US'
                  ? '🇺🇸'
                  : currentNode.countryCode === 'JP'
                  ? '🇯🇵'
                  : '🌐'}
              </div>
              <div>
                <div className="text-sm font-semibold text-white truncate max-w-[200px]">
                  {currentNode.name}
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-300">
                    {currentNode.type}
                  </span>
                  <span>{currentNode.groupTitle || 'Cloud Group'}</span>
                </div>
              </div>
            </div>

            <div className="text-end">
              <div className="text-xs font-mono font-semibold text-emerald-400">
                {currentNode.ping}
              </div>
              <div className="text-[10px] text-zinc-400">Delay: {currentNode.delay}</div>
            </div>
          </div>
        )}
      </div>

      {/* Engine Selection Strip */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>انتخاب موتور اتصال ضد سانسور</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {engines.map((eng) => (
            <button
              key={eng.id}
              onClick={() => setSelectedEngine(eng.id)}
              className={`p-3 rounded-xl border text-start transition-all ${
                selectedEngine === eng.id
                  ? 'bg-indigo-900/30 border-indigo-500 text-white shadow-sm'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">{eng.name}</span>
                {selectedEngine === eng.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">{eng.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Shortcut Card */}
      <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">اختلال شدید اینترنت دارید؟</div>
            <div className="text-[11px] text-zinc-400">حالت اضطراری Vercel / فرانتینگ را فعال کنید</div>
          </div>
        </div>

        <button
          onClick={() => onNavigateToEmergency('emergency_vercel')}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
        >
          فعال‌سازی
        </button>
      </div>
    </div>
  );
};
