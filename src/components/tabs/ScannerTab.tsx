import React, { useState } from 'react';
import {
  Radar,
  Play,
  Square,
  CheckSquare,
  SquareDashed,
  Send,
  Copy,
  Layers,
  Sparkles,
  Wifi,
  Smartphone,
  Check,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';

export const ScannerTab: React.FC = () => {
  const {
    isScanning,
    scanProgress,
    scanPhase,
    scannedIPs,
    startScan,
    stopScan,
    toggleSelectIP,
    transferCleanIPsToNodes,
    language,
  } = useVpn();
  const t = getTranslation(language);

  const [selectedOperator, setSelectedOperator] = useState<string>('MCI');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [transferredNotification, setTransferredNotification] = useState<boolean>(false);

  const operators = [
    { id: 'MCI', name: t.scannerFilterMci, icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'MTN', name: t.scannerFilterMtn, icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'WIFI', name: t.scannerFilterWifi, icon: <Wifi className="w-3.5 h-3.5" /> },
  ];

  const handleCopyIps = () => {
    const selected = scannedIPs.filter((i) => i.selected);
    const text = selected.map((i) => i.ip).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleTransfer = () => {
    transferCleanIPsToNodes();
    setTransferredNotification(true);
    setTimeout(() => setTransferredNotification(false), 3000);
  };

  const selectedCount = scannedIPs.filter((i) => i.selected).length;

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 px-4 space-y-6">
      {/* Radar Animation & Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Radar Circles */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/20" />
          <div className="absolute inset-4 rounded-full border border-indigo-500/30" />
          <div className="absolute inset-8 rounded-full border border-indigo-500/40" />

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-indigo-500/20" />
          <div className="absolute h-full w-[1px] bg-indigo-500/20" />

          {/* Rotating Radar Sweep when active */}
          {isScanning ? (
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-indigo-500/30 animate-radar" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Radar className="w-8 h-8" />
            </div>
          )}

          {isScanning && (
            <div className="relative z-10 w-4 h-4 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500 animate-pulse" />
          )}
        </div>

        <h2 className="text-lg font-bold text-white mt-4">{t.scannerTitle}</h2>
        <p className="text-xs text-zinc-400 max-w-md mt-1 leading-relaxed">
          {t.scannerDesc}
        </p>
      </div>

      {/* Operator Selection */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3">
        <div className="text-xs font-semibold text-zinc-400 mb-2">انتخاب اپراتور برای اسکن بهینه:</div>
        <div className="grid grid-cols-3 gap-2">
          {operators.map((op) => (
            <button
              key={op.id}
              onClick={() => setSelectedOperator(op.id)}
              className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                selectedOperator === op.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {op.icon}
              <span>{op.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scanner Progress Card */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-zinc-300">
            {scanPhase === 'PINGING' && `در حال ارزیابی پینگ و تست سلامت... (${scanProgress}%)`}
            {scanPhase === 'SPEED_TESTING' && `تست پهنای باند دانلود بر بستر Edge... (${scanProgress}%)`}
            {scanPhase === 'DONE' && t.scannerPhaseDone}
            {scanPhase === 'READY' && 'آماده برای اسکن هوشمند'}
          </div>
          <span className="font-mono font-bold text-indigo-400">{scanProgress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 rounded-full"
            style={{ width: `${scanProgress}%` }}
          />
        </div>

        {/* Scan Trigger Button */}
        <div className="pt-2 flex gap-3">
          {!isScanning ? (
            <button
              onClick={() => startScan(selectedOperator)}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.scannerStart}</span>
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{t.scannerStop}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {copiedNotification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>آی‌پی‌های انتخاب‌شده در کلیپ‌بورد کپی شدند.</span>
        </div>
      )}

      {transferredNotification && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-indigo-400" />
          <span>نودهای تمیز به لیست اتصال اصلی شما منتقل شدند!</span>
        </div>
      )}

      {/* Results Header & Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t.scannerCleanFound}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            {scannedIPs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyIps}
            disabled={selectedCount === 0}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>کپی ({selectedCount})</span>
          </button>

          <button
            onClick={handleTransfer}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-sm shadow-indigo-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.scannerTransferHealthy}</span>
          </button>
        </div>
      </div>

      {/* Scanned IP Table / List */}
      <div className="space-y-2">
        {scannedIPs.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleSelectIP(item.id)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              item.selected
                ? 'bg-indigo-950/20 border-indigo-500/60 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-indigo-400">
                {item.selected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                ) : (
                  <SquareDashed className="w-5 h-5 text-zinc-500" />
                )}
              </div>

              <div>
                <div className="text-sm font-mono font-bold text-white tracking-wide">
                  {item.ip}
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span>{item.datacenter}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {item.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-end">
                <div
                  className={`text-xs font-mono font-bold ${
                    item.ping < 65
                      ? 'text-emerald-400'
                      : item.ping < 95
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {item.ping} ms
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {item.downloadSpeed} MB/s
                </div>
              </div>

              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  item.isClean ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
