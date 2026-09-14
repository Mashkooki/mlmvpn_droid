import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Zap,
  Sliders,
  Activity,
  RefreshCw,
  Cpu,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';

export const AetherTab: React.FC = () => {
  const {
    aetherConfig,
    setAetherConfig,
    testAetherEndpoints,
    isRunning,
    connect,
    disconnect,
    language,
  } = useVpn();
  const t = getTranslation(language);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [activeProtocol, setActiveProtocol] = useState<'MASQUE' | 'WIREGUARD' | 'WARP'>('MASQUE');

  const handleTestEndpoints = async () => {
    setIsTesting(true);
    await testAetherEndpoints();
    setIsTesting(false);
  };

  const handleToggleAether = () => {
    if (isRunning) {
      disconnect();
    } else {
      const activeEp = aetherConfig.endpoints.find((e) => e.active) || aetherConfig.endpoints[0];
      connect({
        id: 'aether-active-tunnel',
        name: `Aether MASQUE (${activeEp.tag})`,
        uri: `masque://${activeEp.ip}:${activeEp.port}?protocol=${activeProtocol}&mtu=${aetherConfig.mtu}`,
        type: 'wireguard',
        ping: `${activeEp.latency}ms`,
        delay: `${activeEp.latency + 20}ms`,
        speed: '5.4 MB/s',
        addedAt: Date.now(),
        engineType: 'AETHER',
        countryCode: 'US',
        groupTitle: 'Aether MASQUE Core',
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.aetherTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  HTTP/3 QUIC
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{t.aetherDesc}</p>
            </div>
          </div>

          <button
            onClick={handleToggleAether}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isRunning ? 'قطع اتصال Aether' : 'اتصال با Aether'}
          </button>
        </div>

        {/* Protocol Switcher */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
          {(['MASQUE', 'WIREGUARD', 'WARP'] as const).map((proto) => (
            <button
              key={proto}
              onClick={() => setActiveProtocol(proto)}
              className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-colors ${
                activeProtocol === proto
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {proto === 'MASQUE' && 'MASQUE (HTTP/3)'}
              {proto === 'WIREGUARD' && 'Amnezia WireGuard'}
              {proto === 'WARP' && 'WARP in WARP'}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Obfuscation Settings */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">تنظیمات مبهم‌سازی پیشرفته (Obfuscation)</h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">DPI Bypass Layer</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">MTU Size</div>
            <input
              type="number"
              value={aetherConfig.mtu}
              onChange={(e) =>
                setAetherConfig((prev) => ({ ...prev, mtu: parseInt(e.target.value) || 1280 }))
              }
              className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">Keepalive (sec)</div>
            <input
              type="number"
              value={aetherConfig.keepalive}
              onChange={(e) =>
                setAetherConfig((prev) => ({ ...prev, keepalive: parseInt(e.target.value) || 25 }))
              }
              className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">Junk Packets (Jc)</div>
            <input
              type="number"
              value={aetherConfig.obfuscation.jc}
              onChange={(e) =>
                setAetherConfig((prev) => ({
                  ...prev,
                  obfuscation: { ...prev.obfuscation, jc: parseInt(e.target.value) || 4 },
                }))
              }
              className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">Init Padding (S1)</div>
            <input
              type="number"
              value={aetherConfig.obfuscation.s1}
              onChange={(e) =>
                setAetherConfig((prev) => ({
                  ...prev,
                  obfuscation: { ...prev.obfuscation, s1: parseInt(e.target.value) || 15 },
                }))
              }
              className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Endpoints Latency Scanner */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">نقاط دسترسی لبه Aether (Edge Endpoints)</h3>
          </div>

          <button
            onClick={handleTestEndpoints}
            disabled={isTesting}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
            <span>تست تاخیر نقاط</span>
          </button>
        </div>

        <div className="space-y-2">
          {aetherConfig.endpoints.map((ep, idx) => (
            <div
              key={idx}
              onClick={() => {
                setAetherConfig((prev) => ({
                  ...prev,
                  endpoints: prev.endpoints.map((e, i) => ({ ...e, active: i === idx })),
                }));
              }}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                ep.active
                  ? 'bg-emerald-950/20 border-emerald-500/60 shadow-sm'
                  : 'bg-zinc-800/40 border-zinc-700/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    ep.active ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-zinc-600'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-white">{ep.tag}</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {ep.ip}:{ep.port}
                  </div>
                </div>
              </div>

              <div className="text-end">
                <div className="text-xs font-mono font-bold text-emerald-400">{ep.latency} ms</div>
                <div className="text-[10px] text-zinc-500">Loss: {ep.loss}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
