import React, { useState } from 'react';
import {
  Cloud,
  Plus,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2,
  Settings,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Database,
  Link,
  Shield,
  X,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';
import { CloudAccount } from '../../types';

interface CloudTabProps {
  onNavigateToScanner: () => void;
}

export const CloudTab: React.FC<CloudTabProps> = ({ onNavigateToScanner }) => {
  const {
    accounts,
    cloudGroups,
    deployWorker,
    addCloudAccount,
    deleteCloudAccount,
    nodes,
    language,
  } = useVpn();
  const t = getTranslation(language);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newToken, setNewToken] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [deployingEngines, setDeployingEngines] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleDeploy = async (accountId: string, engine: 'BPB' | 'EDG' | 'NAHAN' | 'MLM' | 'DNS' | 'GST') => {
    const key = `${accountId}-${engine}`;
    setDeployingEngines((prev) => ({ ...prev, [key]: true }));
    await deployWorker(accountId, engine);
    setDeployingEngines((prev) => ({ ...prev, [key]: false }));
    setSuccessToast(`ورکر ${engine} با موفقیت در لبه کلودفلر مستقر شد ✓`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newToken) return;
    addCloudAccount({
      name: newName || 'اکانت کلودفلر جدید',
      email: newEmail,
      token: newToken,
      accountId: 'cf_' + Math.random().toString(36).substring(2, 10),
    });
    setNewEmail('');
    setNewToken('');
    setNewName('');
    setShowAddModal(false);
    setSuccessToast('اکانت کلودفلر با موفقیت اضافه شد!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-28 pt-2 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <span>{t.cloudTitle}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            استقرار مستقیم سرورهای بدون فیلتر در شبکه جهانی کلودفلر (Workers & Pages)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.cloudAddAccount}</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cloud Accounts List */}
      {accounts.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-3">
          <Cloud className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-white">{t.cloudNoAccount}</div>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            با افزودن API Token کلودفلر خود، بدون نیاز به سرور اختصاصی، نودهای VLESS و تروجان را روی وورکرهای اختصاصی بسازید.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            {t.cloudAddAccount}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 space-y-5 shadow-lg"
            >
              {/* Account Meta Bar */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{account.name}</h3>
                    <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{account.email}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        ID: {account.accountId.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => deleteCloudAccount(account.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="حذف اکانت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Free Daily Limit Gauge */}
              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">{t.cloudDailyUsage} (Workers Free Plan)</span>
                  <span className="font-mono text-white font-bold">14,280 / 100,000 reqs</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '14.2%' }} />
                </div>
              </div>

              {/* Deployed Engines Grid */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ورکرهای پیشرفته ضد فیلترینگ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* BPB Worker */}
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>BPB Cloudflare</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          VLESS + Trojan
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                        {account.workerUrl || 'آماده استقرار'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeploy(account.id, 'BPB')}
                      disabled={deployingEngines[`${account.id}-BPB`]}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {deployingEngines[`${account.id}-BPB`] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>{account.workerUrl ? 'بروزرسانی' : 'دیپلوی'}</span>
                    </button>
                  </div>

                  {/* EdgeTunnel EDG Worker */}
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>EdgeTunnel (EDG)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                          KV Cache
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                        {account.edgWorkerUrl || 'آماده استقرار'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeploy(account.id, 'EDG')}
                      disabled={deployingEngines[`${account.id}-EDG`]}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {deployingEngines[`${account.id}-EDG`] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>{account.edgWorkerUrl ? 'بروزرسانی' : 'دیپلوی'}</span>
                    </button>
                  </div>

                  {/* Nahan NHN Worker */}
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Nahan (NHN)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                          D1 Sync
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                        {account.nahanWorkerUrl || 'آماده استقرار'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeploy(account.id, 'NAHAN')}
                      disabled={deployingEngines[`${account.id}-NAHAN`]}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {deployingEngines[`${account.id}-NAHAN`] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>{account.nahanWorkerUrl ? 'بروزرسانی' : 'دیپلوی'}</span>
                    </button>
                  </div>

                  {/* MLM Multi-Layer Multiplexer */}
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>MLM Multiplexer</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          Multi-Path
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                        {account.mlmWorkerUrl || 'آماده استقرار'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeploy(account.id, 'MLM')}
                      disabled={deployingEngines[`${account.id}-MLM`]}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {deployingEngines[`${account.id}-MLM`] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>{account.mlmWorkerUrl ? 'بروزرسانی' : 'دیپلوی'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Associated Cloud Groups & Clean IPs */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  ۳ گروه کانفیگ متصل به شبکه لبه کلودفلر
                </span>
                <button
                  onClick={onNavigateToScanner}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>ترکیب با آی‌پی تمیز اسکنر</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-400" />
                <span>{t.cloudAddAccount}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  نام نمایشی اکانت (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثلا: Cloudflare Personal"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  آدرس ایمیل کلودفلر <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Cloudflare API Token / Global API Key <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="توکن ساخته‌شده با دسترسی Workers & D1"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  راهنما: در پنل کلودفلر به بخش My Profile &gt; API Tokens رفته و یک توکن با دسترسی Workers Scripts ایجاد کنید.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  {t.commonCancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  ذخیره و اتصال اکانت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
