import React from 'react';
import { X, Server, ExternalLink, ShieldCheck, Check, Zap } from 'lucide-react';
import { useVpn } from '../../context/VpnContext';

interface WorkersListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkersListModal: React.FC<WorkersListModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { accounts } = useVpn();
  const mainAccount = accounts[0];

  const workers = [
    {
      name: 'BPB Edge Worker',
      type: 'VLESS + Trojan',
      url: mainAccount?.workerUrl || 'https://bpb.workers.dev',
      status: 'Active',
      color: 'amber',
    },
    {
      name: 'EdgeTunnel EDG Worker',
      type: 'KV Proxy Cache',
      url: mainAccount?.edgWorkerUrl || 'https://edg.workers.dev',
      status: 'Active',
      color: 'cyan',
    },
    {
      name: 'Nahan Core Worker',
      type: 'D1 Cluster Sync',
      url: mainAccount?.nahanWorkerUrl || 'https://nhn.workers.dev',
      status: 'Active',
      color: 'purple',
    },
    {
      name: 'MLM Multi-Layer Worker',
      type: 'Multi-Path Relay',
      url: mainAccount?.mlmWorkerUrl || 'https://mlm.workers.dev',
      status: 'Active',
      color: 'emerald',
    },
    {
      name: 'Dedicated DNS Resolver',
      type: 'DoH / ECS Steer',
      url: mainAccount?.dnsWorkerUrl || 'https://dns.workers.dev',
      status: 'Active',
      color: 'indigo',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">لیست و وضعیت ورکرهای کلودفلر</h3>
              <p className="text-xs text-zinc-400">ورکرهای دیپلوی‌شده در حساب شما جهت عبور از سانسور</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto p-1">
          {workers.map((w, idx) => (
            <div
              key={idx}
              className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{w.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                    {w.type}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-1 truncate max-w-[240px]">
                  {w.url}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  فعال
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
        >
          بستن
        </button>
      </div>
    </div>
  );
};
