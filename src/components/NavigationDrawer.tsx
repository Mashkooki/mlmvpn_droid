import React from 'react';
import {
  X,
  Settings,
  BarChart3,
  Globe,
  MapPin,
  Server,
  ShieldCheck,
  Link2,
  BookOpen,
  Info,
  AlertTriangle,
  Flame,
  Lock,
} from 'lucide-react';
import { TabType } from '../types';
import { useVpn } from '../context/VpnContext';
import { getTranslation } from '../i18n';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onSelectEmergency: (type: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onSelectEmergency,
}) => {
  const { language } = useVpn();
  const t = getTranslation(language);

  if (!isOpen) return null;

  const menuItems: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'settings', label: t.drawerSettings, icon: <Settings className="w-4 h-4" /> },
    { id: 'usage', label: t.drawerUsage, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'vpngate', label: 'گیت‌وی MLM (VPN Gate)', icon: <Globe className="w-4 h-4" />, badge: 'Public' },
    { id: 'fixed_ip', label: t.drawerFixedIp, icon: <MapPin className="w-4 h-4" /> },
    { id: 'workers_list', label: t.drawerWorkersList, icon: <Server className="w-4 h-4" /> },
    { id: 'antisanction', label: t.drawerAntiSanction, icon: <ShieldCheck className="w-4 h-4" />, badge: 'DNS' },
    { id: 'sublink', label: t.drawerSubLink, icon: <Link2 className="w-4 h-4" /> },
    { id: 'tutorial', label: t.drawerTutorial, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'about', label: t.drawerAbout, icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-80 max-w-[85vw] h-full bg-[#18181b] border-e border-zinc-800 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                MLM
              </div>
              <h2 className="text-base font-bold text-white">{t.drawerMainMenu}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Standard Navigation Items */}
          <div className="p-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-indigo-400' : 'text-zinc-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Tunnels Section (Matching AppScreen.kt EmergencyDrawerItem) */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40">
          <div className="px-2 mb-2 text-xs font-bold text-red-400 tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>حالت‌های اضطراری ضد فیلترینگ</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectEmergency('emergency_vercel');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-950/20 text-red-300 hover:bg-red-900/30 border border-red-500/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="text-start">
                <div className="font-semibold">{t.drawerEmergency1}</div>
                <div className="text-[10px] text-zinc-400">پل پشتیبان Vercel Edge Tunnel</div>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectEmergency('emergency_2');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-amber-950/20 text-amber-300 hover:bg-amber-900/30 border border-amber-500/20 transition-colors"
            >
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-start">
                <div className="font-semibold">{t.drawerEmergency2}</div>
                <div className="text-[10px] text-zinc-400">فرانتینگ دامنه از طریق CDN جهانی</div>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectEmergency('emergency_3');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-rose-950/20 text-rose-300 hover:bg-rose-900/30 border border-rose-500/20 transition-colors"
            >
              <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="text-start">
                <div className="font-semibold">{t.drawerEmergency3}</div>
                <div className="text-[10px] text-zinc-400">بقا در اختلال شدید اینترنت ملی</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
