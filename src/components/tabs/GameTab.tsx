import React from 'react';
import {
  Gamepad2,
  Zap,
  Activity,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';
import { gamePresetsList } from '../../data/initialData';
import { GamePreset } from '../../types';

export const GameTab: React.FC = () => {
  const {
    isGameBoosterActive,
    activeGamePreset,
    optimalGamingDns,
    dnsRaceResults,
    toggleGameBooster,
    runDnsRace,
    language,
  } = useVpn();
  const t = getTranslation(language);

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 px-4 space-y-6">
      {/* Header & Turbo Booster Switch */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all ${
                isGameBoosterActive
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-600 shadow-rose-500/30 ring-4 ring-rose-500/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Gamepad2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.gameTitle}</span>
                {isGameBoosterActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 animate-pulse">
                    TURBO ACTIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{t.gameDesc}</p>
            </div>
          </div>

          <button
            onClick={() => toggleGameBooster()}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isGameBoosterActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isGameBoosterActive ? 'خاموش کردن بوستر' : 'فعال‌سازی توربو'}
          </button>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
          <div className="p-2 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">میانگین جیتر (Jitter)</div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
              {isGameBoosterActive ? '± 2.4 ms' : '± 18 ms'}
            </div>
          </div>

          <div className="p-2 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">اتلاف بسته (Packet Loss)</div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
              {isGameBoosterActive ? '0.0 %' : '1.4 %'}
            </div>
          </div>

          <div className="p-2 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <div className="text-[10px] text-zinc-400">بهترین سرور گیمینگ</div>
            <div className="text-xs font-bold text-indigo-300 mt-1 truncate">
              {activeGamePreset ? activeGamePreset.servers[0] : 'بحرین (AWS)'}
            </div>
          </div>
        </div>
      </div>

      {/* Game Profiles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>پروفایل‌های بهینه‌سازی بازی‌ها</span>
          </div>
          <span className="text-xs text-zinc-400">پینگ تضمینی خاورمیانه</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {gamePresetsList.map((preset) => {
            const isSelected = activeGamePreset?.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => toggleGameBooster(preset)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected && isGameBoosterActive
                    ? 'bg-rose-950/20 border-rose-500/60 shadow-md shadow-rose-950/40'
                    : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{preset.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{preset.category}</p>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      ~{preset.avgPing} ms
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">پینگ هدف</div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>سرورها: {preset.servers.slice(0, 2).join('، ')}</span>
                  {isSelected && isGameBoosterActive && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      فعال
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DNS Racing Benchmark Card */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white">{t.gameDnsRacing}</h3>
          </div>

          <button
            onClick={runDnsRace}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>مسابقه مجدد</span>
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          تست خودکار سریع‌ترین DNS ضد تحریم برای کاهش زمان پاسخ‌دهی پکت‌های بازی:
        </p>

        <div className="space-y-2">
          {dnsRaceResults.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                item.isOptimal
                  ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-500">{idx + 1}.</span>
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-[10px] font-mono text-zinc-400">{item.ip}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="font-mono font-bold text-emerald-400">{item.ping} ms</div>
                {item.isOptimal && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    بهترین
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
