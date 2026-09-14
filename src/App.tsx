import React, { useState } from 'react';
import { useVpn } from './context/VpnContext';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { BottomNavigation } from './components/BottomNavigation';
import { QuickConnectTab } from './components/tabs/QuickConnectTab';
import { ScannerTab } from './components/tabs/ScannerTab';
import { CloudTab } from './components/tabs/CloudTab';
import { NodesTab } from './components/tabs/NodesTab';
import { GameTab } from './components/tabs/GameTab';
import { AetherTab } from './components/tabs/AetherTab';
import { VpnGateTab } from './components/tabs/VpnGateTab';

// Modals
import { SettingsModal } from './components/modals/SettingsModal';
import { UsageModal } from './components/modals/UsageModal';
import { FixedIpModal } from './components/modals/FixedIpModal';
import { WorkersListModal } from './components/modals/WorkersListModal';
import { AntiSanctionModal } from './components/modals/AntiSanctionModal';
import { SubLinkModal } from './components/modals/SubLinkModal';
import { TutorialModal } from './components/modals/TutorialModal';
import { AboutModal } from './components/modals/AboutModal';
import { EmergencyModal } from './components/modals/EmergencyModal';

import { TabType } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('quick');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Modals state
  const [modalType, setModalType] = useState<
    | null
    | 'settings'
    | 'usage'
    | 'fixed_ip'
    | 'workers_list'
    | 'antisanction'
    | 'sublink'
    | 'tutorial'
    | 'about'
    | 'emergency'
  >(null);

  const [activeEmergencyType, setActiveEmergencyType] = useState<string | null>(null);

  const handleSelectDrawerTab = (tab: TabType) => {
    if (
      tab === 'settings' ||
      tab === 'usage' ||
      tab === 'fixed_ip' ||
      tab === 'workers_list' ||
      tab === 'antisanction' ||
      tab === 'sublink' ||
      tab === 'tutorial' ||
      tab === 'about'
    ) {
      setModalType(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handleOpenEmergency = (type: string) => {
    setActiveEmergencyType(type);
    setModalType('emergency');
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-zinc-100 flex flex-col font-sans">
      {/* Top Bar */}
      <Header onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectDrawerTab}
        onSelectEmergency={handleOpenEmergency}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto pt-4 px-2 sm:px-4">
        {activeTab === 'quick' && (
          <QuickConnectTab
            onNavigateToNodes={() => setActiveTab('nodes')}
            onNavigateToEmergency={handleOpenEmergency}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'scanner' && <ScannerTab />}

        {activeTab === 'cloud' && (
          <CloudTab onNavigateToScanner={() => setActiveTab('scanner')} />
        )}

        {activeTab === 'nodes' && <NodesTab />}

        {activeTab === 'game' && <GameTab />}

        {activeTab === 'aether' && <AetherTab />}

        {activeTab === 'vpngate' && <VpnGateTab />}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Modals */}
      <SettingsModal isOpen={modalType === 'settings'} onClose={() => setModalType(null)} />
      <UsageModal isOpen={modalType === 'usage'} onClose={() => setModalType(null)} />
      <FixedIpModal isOpen={modalType === 'fixed_ip'} onClose={() => setModalType(null)} />
      <WorkersListModal isOpen={modalType === 'workers_list'} onClose={() => setModalType(null)} />
      <AntiSanctionModal isOpen={modalType === 'antisanction'} onClose={() => setModalType(null)} />
      <SubLinkModal isOpen={modalType === 'sublink'} onClose={() => setModalType(null)} />
      <TutorialModal isOpen={modalType === 'tutorial'} onClose={() => setModalType(null)} />
      <AboutModal isOpen={modalType === 'about'} onClose={() => setModalType(null)} />
      <EmergencyModal
        isOpen={modalType === 'emergency'}
        emergencyType={activeEmergencyType}
        onClose={() => {
          setModalType(null);
          setActiveEmergencyType(null);
        }}
      />
    </div>
  );
};

export default App;
