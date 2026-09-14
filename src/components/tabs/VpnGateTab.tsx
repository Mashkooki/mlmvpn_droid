import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  Zap,
  Activity,
  Shield,
  Download,
  Users,
  Clock,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';
import { VpnGateServer } from '../../types';

export const VpnGateTab: React.FC = () => {
  const { vpnGateServers, connectVpnGate, refreshVpnGate, isRunning, connectedNode, language } = useVpn();
  const t = getTranslation(language);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshVpnGate();
    setIsRefreshing(false);
  };

  const filteredServers = vpnGateServers.filter((s) => {
    if (selectedCountry === 'ALL') return true;
    return s.countryShort === selectedCountry;
  });

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 px-4 space-y-5">
      {/* Top Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t.vpngateTitle}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-medium">
                  University of Tsukuba
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{t.vpngateDesc}</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="بروزرسانی لیست سرورها"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {['ALL', 'JP', 'KR', 'US', 'DE'].map((code) => (
            <button
              key={code}
              onClick={() => setSelectedCountry(code)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCountry === code
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {code === 'ALL' && 'همه کشورها'}
              {code === 'JP' && '🇯🇵 ژاپن (Japan)'}
              {code === 'KR' && '🇰🇷 کره جنوبی (Korea)'}
              {code === 'US' && '🇺🇸 آمریکا (USA)'}
              {code === 'DE' && '🇩🇪 آلمان (Germany)'}
            </button>
          ))}
        </div>
      </div>

      {/* Servers List */}
      <div className="space-y-2.5">
        {filteredServers.map((server) => {
          const isCurrent = isRunning && connectedNode?.uri.includes(server.ip);
          return (
            <div
              key={server.hostName}
              className={`p-3.5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md'
                  : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {server.countryShort === 'JP'
                      ? '🇯🇵'
                      : server.countryShort === 'KR'
                      ? '🇰🇷'
                      : server.countryShort === 'US'
                      ? '🇺🇸'
                      : '🇩🇪'}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-white">{server.countryLong}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">{server.ip}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-400" />
                        {server.numVpnSessions} کاربر فعال
                      </span>
                      <span>{server.operator.substring(0, 28)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-end">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {server.ping} ms
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {(server.speed / 10000000).toFixed(1)} MB/s
                    </div>
                  </div>

                  <button
                    onClick={() => connectVpnGate(server)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                    }`}
                  >
                    {isCurrent ? 'متصل' : 'اتصال'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
