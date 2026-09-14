import React, { useState } from 'react';
import { X, MapPin, Copy, Check, Search, ShieldCheck } from 'lucide-react';
import { proxyCountriesList } from '../../data/initialData';
import { ProxyCountryInfo } from '../../types';

interface FixedIpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FixedIpModal: React.FC<FixedIpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<ProxyCountryInfo>(proxyCountriesList[0]);
  const [selectedPort, setSelectedPort] = useState('443');
  const [copied, setCopied] = useState(false);

  const filteredCountries = proxyCountriesList.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const cleanIpSample = `${selectedCountry.code.toLowerCase()}-edge.mlmvpn.net`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${cleanIpSample}:${selectedPort}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">انتخاب آی‌پی تمیز و ثابت (Fixed IP)</h3>
              <p className="text-xs text-zinc-400">آی‌پی‌های تمیز تایید شده بیش از ۵۰ کشور جهان برای پروکسی کلودفلر</p>
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
            placeholder="جستجوی کشور یا کد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Countries Grid */}
        <div className="max-h-56 overflow-y-auto grid grid-cols-2 gap-2 p-1">
          {filteredCountries.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c)}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs text-start transition-colors ${
                selectedCountry.code === c.code
                  ? 'bg-indigo-900/30 border-indigo-500 text-white font-bold'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="text-xl">{c.flag}</span>
              <div className="truncate">
                <div className="truncate">{c.name}</div>
                <div className="text-[10px] text-zinc-500">{c.fileLength} رنج IP تمیز</div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Country Output */}
        <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">پورت پروکسی کلودفلر:</span>
            <div className="flex gap-1.5">
              {['443', '8443', '2053', '2083', '2087'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPort(p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    selectedPort === p ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs text-emerald-400">
            <span>
              {cleanIpSample}:{selectedPort}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 text-zinc-400 hover:text-white flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
        >
          تایید و بستن
        </button>
      </div>
    </div>
  );
};
