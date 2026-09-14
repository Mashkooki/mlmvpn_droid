import React, { useState } from 'react';
import { X, ShieldCheck, Check, Search, Globe, Shield } from 'lucide-react';
import { sanctionedDomainsList } from '../../data/initialData';

interface AntiSanctionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AntiSanctionModal: React.FC<AntiSanctionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [bypassedServices, setBypassedServices] = useState<Record<string, boolean>>({
    'openai.com': true,
    'claude.ai': true,
    'gemini.google.com': true,
    'github.com': true,
    'docker.com': true,
    'nvidia.com': true,
    'epicgames.com': true,
  });

  const filtered = sanctionedDomainsList.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.domain.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBypass = (domain: string) => {
    setBypassedServices((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">DNS ضد تحریم اختصاصی (Anti-Sanction)</h3>
              <p className="text-xs text-zinc-400">دور زدن تحریم‌های خارجی بدون نیاز به افت سرعت یا تغییر آی‌پی کل سیستم</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-3" />
          <input
            type="text"
            placeholder="جستجوی سرویس (OpenAI، Docker، GitHub...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Domains List */}
        <div className="max-h-64 overflow-y-auto space-y-2 p-1">
          {filtered.map((item) => {
            const isEnabled = bypassedServices[item.domain];
            return (
              <div
                key={item.domain}
                onClick={() => toggleBypass(item.domain)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  isEnabled
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : 'bg-zinc-900/60 border-zinc-800/80'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{item.domain}</div>
                </div>

                <div
                  className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex gap-2">
          <button
            onClick={() => {
              const all: Record<string, boolean> = {};
              sanctionedDomainsList.forEach((d) => (all[d.domain] = true));
              setBypassedServices(all);
            }}
            className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
          >
            فعال‌سازی همه
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            ذخیره تنظیمات
          </button>
        </div>
      </div>
    </div>
  );
};
