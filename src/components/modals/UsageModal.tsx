import React from 'react';
import { X, BarChart3, ArrowDown, ArrowUp, Calendar, HardDrive } from 'lucide-react';
import { useVpn } from '../../context/VpnContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { usageStats, totalDownMB, totalUpMB } = useVpn();

  const chartData = usageStats.history7Days.map((d) => ({
    name: d.dayLabel,
    download: +(d.download / 1024).toFixed(2), // GB
    upload: +(d.upload / 1024).toFixed(2), // GB
  }));

  const todayDownGB = (totalDownMB / 1024).toFixed(2);
  const todayUpGB = (totalUpMB / 1024).toFixed(2);
  const totalMonthGB = (usageStats.history30DaysTotal / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">آمار و گزارش مصرف اینترنت</h3>
              <p className="text-xs text-zinc-400">ثبت داده‌های ارسالی و دریافتی از طریق تونل‌های MLM VPN</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>دریافت امروز</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1">
              {todayDownGB} <span className="text-xs font-normal text-zinc-400">GB</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-400 text-xs font-semibold">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>ارسال امروز</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1">
              {todayUpGB} <span className="text-xs font-normal text-zinc-400">GB</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5" />
              <span>۳۰ روز اخیر</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1">
              {totalMonthGB} <span className="text-xs font-normal text-zinc-400">GB</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>نمودار مصرف ۷ روز گذشته (گیگابایت)</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>هفته جاری</span>
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="download" name="دانلود (GB)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="upload" name="آپلود (GB)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
