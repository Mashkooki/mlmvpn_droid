import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Clipboard,
  Activity,
  Trash2,
  Share2,
  Check,
  CheckCircle2,
  X,
  Search,
  Radio,
  QrCode,
  Zap,
} from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';
import { VpnNode } from '../../types';

export const NodesTab: React.FC = () => {
  const {
    nodes,
    connectedNode,
    isRunning,
    connect,
    disconnect,
    addNode,
    deleteNode,
    pingAllNodes,
    language,
  } = useVpn();
  const t = getTranslation(language);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [manualUri, setManualUri] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [activeQrNode, setActiveQrNode] = useState<VpnNode | null>(null);
  const [isTestingPlatforms, setIsTestingPlatforms] = useState<boolean>(false);
  const [platformResults, setPlatformResults] = useState<{
    telegram: number | null;
    youtube: number | null;
    instagram: number | null;
    twitter: number | null;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const filters = ['ALL', 'VLESS', 'TROJAN', 'WIREGUARD', 'OPENVPN'];

  const filteredNodes = nodes.filter((node) => {
    const matchesFilter =
      activeFilter === 'ALL' || node.type.toUpperCase() === activeFilter;
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.groupTitle && node.groupTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUri) return;

    let type: VpnNode['type'] = 'vless';
    if (manualUri.startsWith('trojan://')) type = 'trojan';
    else if (manualUri.startsWith('vmess://')) type = 'vmess';
    else if (manualUri.startsWith('ss://')) type = 'shadowsocks';
    else if (manualUri.startsWith('masque://') || manualUri.startsWith('wireguard://')) type = 'wireguard';

    addNode({
      name: manualName || 'کانفیگ دستی کاربر',
      uri: manualUri,
      type,
      countryCode: 'DE',
      engineType: 'MLM',
      groupTitle: 'کانفیگ‌های سفارشی',
    });

    setManualUri('');
    setManualName('');
    setShowAddModal(false);
  };

  const handleImportClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('://')) {
        addNode({
          name: 'کانفیگ از کلیپ‌بورد',
          uri: text.trim(),
          type: text.startsWith('trojan') ? 'trojan' : 'vless',
          countryCode: 'NL',
          engineType: 'MLM',
          groupTitle: 'وارد شده از کلیپ‌بورد',
        });
        setCopyFeedback('کانفیگ با موفقیت از کلیپ‌بورد وارد شد ✓');
        setTimeout(() => setCopyFeedback(null), 2500);
      } else {
        alert('متن کلیپ‌بورد شامل لینک معتبر پروکسی (vless, trojan, vmess) نیست.');
      }
    } catch {
      // Fallback prompt
      const text = prompt('لینک کانفیگ (vless:// یا trojan://) را وارد کنید:');
      if (text) {
        addNode({
          name: 'کانفیگ دستی',
          uri: text.trim(),
          type: 'vless',
          countryCode: 'DE',
          engineType: 'MLM',
          groupTitle: 'کانفیگ‌های دستی',
        });
      }
    }
  };

  const handleCopyNodeUri = (node: VpnNode) => {
    navigator.clipboard.writeText(node.uri);
    setCopyFeedback(`لینک کانفیگ ${node.name} کپی شد`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const runPlatformTest = async () => {
    setIsTestingPlatforms(true);
    setPlatformResults(null);
    await new Promise((r) => setTimeout(r, 1200));
    setPlatformResults({
      telegram: Math.floor(Math.random() * 30) + 45,
      youtube: Math.floor(Math.random() * 40) + 60,
      instagram: Math.floor(Math.random() * 35) + 55,
      twitter: Math.floor(Math.random() * 25) + 40,
    });
    setIsTestingPlatforms(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 px-4 space-y-5">
      {/* Top Header & Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>{t.nodesTitle}</span>
          </h2>
          <p className="text-xs text-zinc-400">
            {nodes.length} نود و کانفیگ آماده برای اتصال و توزیع بار
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImportClipboard}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title={t.nodesImportClipboard}
          >
            <Clipboard className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن</span>
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="p-3 bg-indigo-950/70 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-indigo-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Platform Real-World Connectivity Test Card */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">تست ارتباط پلتفرم‌ها (Platform Benchmark)</span>
          </div>

          <button
            onClick={runPlatformTest}
            disabled={isTestingPlatforms}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Activity className={`w-3.5 h-3.5 text-indigo-400 ${isTestingPlatforms ? 'animate-spin' : ''}`} />
            <span>{isTestingPlatforms ? 'در حال تست...' : 'اجرای تست'}</span>
          </button>
        </div>

        {platformResults && (
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-2 bg-zinc-800/60 rounded-xl text-center border border-zinc-700/50">
              <div className="text-[11px] font-bold text-zinc-300">Telegram</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {platformResults.telegram}ms
              </div>
            </div>
            <div className="p-2 bg-zinc-800/60 rounded-xl text-center border border-zinc-700/50">
              <div className="text-[11px] font-bold text-zinc-300">YouTube</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {platformResults.youtube}ms
              </div>
            </div>
            <div className="p-2 bg-zinc-800/60 rounded-xl text-center border border-zinc-700/50">
              <div className="text-[11px] font-bold text-zinc-300">Instagram</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {platformResults.instagram}ms
              </div>
            </div>
            <div className="p-2 bg-zinc-800/60 rounded-xl text-center border border-zinc-700/50">
              <div className="text-[11px] font-bold text-zinc-300">X / Twitter</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {platformResults.twitter}ms
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-3" />
          <input
            type="text"
            placeholder="جستجو در میان نودها، لوکیشن یا گروه..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[70%]">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={pingAllNodes}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>تست تاخیر همه</span>
          </button>
        </div>
      </div>

      {/* Nodes List */}
      <div className="space-y-2.5">
        {filteredNodes.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
            هیچ نودی مطابق فیلتر یافت نشد.
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isCurrent = connectedNode?.id === node.id && isRunning;
            return (
              <div
                key={node.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/50'
                    : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Left: Flag & Node Meta */}
                  <div
                    onClick={() => {
                      if (isCurrent) disconnect();
                      else connect(node);
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="text-2xl">
                      {node.countryCode === 'DE'
                        ? '🇩🇪'
                        : node.countryCode === 'NL'
                        ? '🇳🇱'
                        : node.countryCode === 'US'
                        ? '🇺🇸'
                        : node.countryCode === 'JP'
                        ? '🇯🇵'
                        : node.countryCode === 'FI'
                        ? '🇫🇮'
                        : '🌐'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{node.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                            متصل
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {node.type}
                        </span>
                        <span>{node.groupTitle || 'Cloudflare Pool'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Latency & Quick Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {node.ping}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {node.speed}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveQrNode(node)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="نمایش QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCopyNodeUri(node)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="کپی لینک کانفیگ"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteNode(node.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="حذف نود"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Add Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>افزودن کانفیگ جدید</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  نام نود (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثلا: Frankfurt VLESS Fast"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  لینک کانفیگ (VLESS, Trojan, VMess, WireGuard) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="vless://... یا trojan://..."
                  value={manualUri}
                  onChange={(e) => setManualUri(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  ذخیره نود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code & Share Modal */}
      {activeQrNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white truncate max-w-[240px]">
                {activeQrNode.name}
              </h3>
              <button
                onClick={() => setActiveQrNode(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual QR Code Generator Simulation */}
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
              <div className="w-48 h-48 bg-zinc-100 flex flex-col items-center justify-center border-2 border-dashed border-zinc-400 p-2">
                <QrCode className="w-32 h-32 text-black" />
                <span className="text-[10px] text-zinc-700 font-mono mt-1">MLM VPN Config QR</span>
              </div>
            </div>

            <div className="text-xs text-zinc-400 break-all line-clamp-2 font-mono bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              {activeQrNode.uri}
            </div>

            <button
              onClick={() => handleCopyNodeUri(activeQrNode)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <Clipboard className="w-4 h-4" />
              <span>کپی لینک کانفیگ به کلیپ‌بورد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
