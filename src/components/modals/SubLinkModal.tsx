import React, { useState } from 'react';
import { X, Link2, Copy, Check, QrCode, Share2, Layers } from 'lucide-react';
import { useVpn } from '../../context/VpnContext';

interface SubLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubLinkModal: React.FC<SubLinkModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { nodes, accounts } = useVpn();
  const [copied, setCopied] = useState(false);
  const [subFormat, setSubFormat] = useState<'b64' | 'clash' | 'singbox'>('b64');

  const mainAccount = accounts[0];
  const subUrl = mainAccount?.workerUrl
    ? `${mainAccount.workerUrl}/sub/mlm-droid?format=${subFormat}`
    : `https://sub.mlmvpn.network/sub/${Math.random().toString(36).substring(2, 9)}?format=${subFormat}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(subUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-center">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-start">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تولید لینک سابسکریپشن هوشمند</h3>
              <p className="text-xs text-zinc-400">لینک اختصاصی هماهنگ با V2RayNG, Clash, Sing-box</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['b64', 'clash', 'singbox'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSubFormat(fmt)}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-colors ${
                subFormat === fmt
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {fmt === 'b64' ? 'V2Ray (Base64)' : fmt === 'clash' ? 'Clash Meta' : 'Sing-box'}
            </button>
          ))}
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
          <div className="w-44 h-44 bg-zinc-100 flex flex-col items-center justify-center border border-zinc-300 rounded-xl">
            <QrCode className="w-32 h-32 text-black" />
            <span className="text-[9px] text-zinc-600 font-mono mt-1">MLM Subscription QR</span>
          </div>
        </div>

        {/* Link Display Box */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 break-all text-start flex items-center justify-between gap-2">
          <span className="truncate">{subUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white shrink-0"
            title="کپی لینک"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? 'لینک کپی شد ✓' : 'کپی لینک اشتراک'}</span>
        </button>
      </div>
    </div>
  );
};
