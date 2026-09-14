import React from 'react';
import { X, Settings, Globe, Shield, Wifi, Radio, Sliders } from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import { getTranslation } from '../../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { settings, updateSettings, language, setLanguage } = useVpn();
  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.settingsTitle}</h3>
              <p className="text-xs text-zinc-400">تنظیمات هسته پروکسی، شبکه محلی و زبان برنامه</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 max-h-96 overflow-y-auto p-1">
          {/* Language */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs font-bold text-white">{t.settingsLanguage}</div>
                <div className="text-[10px] text-zinc-400">تغییر زبان رابط کاربری به فارسی یا انگلیسی</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setLanguage('fa')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'fa' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                فارسی
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'en' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Backend DNS */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1.5">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>سرورهای DNS پشتیبان (Backend DNS)</span>
            </div>
            <input
              type="text"
              value={settings.backendDns}
              onChange={(e) => updateSettings({ backendDns: e.target.value })}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Proxy Only Mode */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{t.settingsProxyMode}</div>
              <div className="text-[10px] text-zinc-400">
                ایجاد پورت محلی SOCKS5 / HTTP بدون اعمال تونل VPN روی کل سیستم
              </div>
            </div>
            <button
              onClick={() => updateSettings({ proxyMode: !settings.proxyMode })}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.proxyMode ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.proxyMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Allow LAN */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{t.settingsAllowLan}</div>
              <div className="text-[10px] text-zinc-400">
                امکان اتصال سایر دستگاه‌های داخل شبکه وای‌فای به پروکسی این سیستم
              </div>
            </div>
            <button
              onClick={() => updateSettings({ allowLan: !settings.allowLan })}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.allowLan ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.allowLan ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Realtime Traffic Header */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{t.settingsRealtimeTraffic}</div>
              <div className="text-[10px] text-zinc-400">نمایش پویای سرعت ارسال و دریافت در هدر اصلی</div>
            </div>
            <button
              onClick={() => updateSettings({ showRealtimeTraffic: !settings.showRealtimeTraffic })}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.showRealtimeTraffic ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.showRealtimeTraffic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
        >
          {t.settingsSave}
        </button>
      </div>
    </div>
  );
};
