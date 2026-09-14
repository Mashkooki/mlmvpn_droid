import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  VpnNode,
  CloudAccount,
  CloudGroup,
  ScannedIP,
  VpnGateServer,
  AppSettings,
  UsageStats,
  AetherConfig,
  ConnectionPhase,
  Language,
  GamePreset,
} from '../types';
import {
  defaultSettings,
  initialNodes,
  initialCloudAccounts,
  initialCloudGroups,
  initialScannedIPs,
  initialVpnGateServers,
  initialUsageStats,
  initialAetherConfig,
  gamePresetsList,
} from '../data/initialData';

interface VpnContextType {
  // Connection State
  phase: ConnectionPhase;
  isRunning: boolean;
  connectedNode: VpnNode | null;
  activeEngine: string;
  realDelay: number;
  trafficDown: number; // in KB/s
  trafficUp: number; // in KB/s
  totalDownMB: number;
  totalUpMB: number;
  connect: (node?: VpnNode) => Promise<void>;
  disconnect: () => void;
  quickToggle: () => void;

  // Nodes
  nodes: VpnNode[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  addNode: (node: Omit<VpnNode, 'id' | 'addedAt'>) => void;
  deleteNode: (id: string) => void;
  pingAllNodes: () => Promise<void>;

  // Cloudflare Manager
  accounts: CloudAccount[];
  cloudGroups: CloudGroup[];
  deployWorker: (accountId: string, engine: 'BPB' | 'EDG' | 'NAHAN' | 'MLM' | 'DNS' | 'GST') => Promise<void>;
  addCloudAccount: (account: Partial<CloudAccount>) => void;
  deleteCloudAccount: (id: string) => void;

  // IP Scanner
  isScanning: boolean;
  scanProgress: number;
  scanPhase: 'READY' | 'PINGING' | 'SPEED_TESTING' | 'DONE';
  scannedIPs: ScannedIP[];
  startScan: (operator?: string) => void;
  stopScan: () => void;
  toggleSelectIP: (id: number) => void;
  transferCleanIPsToNodes: () => void;

  // Game Booster
  isGameBoosterActive: boolean;
  activeGamePreset: GamePreset | null;
  optimalGamingDns: string;
  dnsRaceResults: Array<{ name: string; ip: string; ping: number; isOptimal: boolean }>;
  toggleGameBooster: (preset?: GamePreset) => void;
  runDnsRace: () => Promise<void>;

  // Aether Engine
  aetherConfig: AetherConfig;
  setAetherConfig: React.Dispatch<React.SetStateAction<AetherConfig>>;
  testAetherEndpoints: () => Promise<void>;

  // VPN Gate
  vpnGateServers: VpnGateServer[];
  connectVpnGate: (server: VpnGateServer) => Promise<void>;
  refreshVpnGate: () => Promise<void>;

  // Settings & Language
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Usage
  usageStats: UsageStats;

  // Emergency Mode
  activeEmergency: string | null;
  setActiveEmergency: (em: string | null) => void;
}

const VpnContext = createContext<VpnContextType | undefined>(undefined);

export const VpnProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved state or use initial defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('mlmvpn_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [language, setLanguageState] = useState<Language>(settings.language || 'fa');
  const [nodes, setNodes] = useState<VpnNode[]>(() => {
    try {
      const saved = localStorage.getItem('mlmvpn_nodes');
      return saved ? JSON.parse(saved) : initialNodes;
    } catch {
      return initialNodes;
    }
  });

  const [accounts, setAccounts] = useState<CloudAccount[]>(() => {
    try {
      const saved = localStorage.getItem('mlmvpn_cloud_accounts');
      return saved ? JSON.parse(saved) : initialCloudAccounts;
    } catch {
      return initialCloudAccounts;
    }
  });

  const [cloudGroups, setCloudGroups] = useState<CloudGroup[]>(initialCloudGroups);
  const [scannedIPs, setScannedIPs] = useState<ScannedIP[]>(initialScannedIPs);
  const [vpnGateServers, setVpnGateServers] = useState<VpnGateServer[]>(initialVpnGateServers);
  const [usageStats, setUsageStats] = useState<UsageStats>(initialUsageStats);
  const [aetherConfig, setAetherConfig] = useState<AetherConfig>(initialAetherConfig);

  // Connection State
  const [phase, setPhase] = useState<ConnectionPhase>('IDLE');
  const isRunning = phase === 'ESTABLISHED';
  const [connectedNode, setConnectedNode] = useState<VpnNode | null>(null);
  const [activeEngine, setActiveEngine] = useState<string>('MLM Multiplexer');
  const [realDelay, setRealDelay] = useState<number>(68);

  // Traffic
  const [trafficDown, setTrafficDown] = useState<number>(0);
  const [trafficUp, setTrafficUp] = useState<number>(0);
  const [totalDownMB, setTotalDownMB] = useState<number>(1420.5);
  const [totalUpMB, setTotalUpMB] = useState<number>(385.2);

  // Scanner
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanPhase, setScanPhase] = useState<'READY' | 'PINGING' | 'SPEED_TESTING' | 'DONE'>('READY');

  // Game Booster
  const [isGameBoosterActive, setIsGameBoosterActive] = useState<boolean>(false);
  const [activeGamePreset, setActiveGamePreset] = useState<GamePreset | null>(gamePresetsList[0]);
  const [optimalGamingDns, setOptimalGamingDns] = useState<string>('10.202.10.202 (Electro DNS)');
  const [dnsRaceResults, setDnsRaceResults] = useState([
    { name: 'Electro DNS (MENA Gaming)', ip: '10.202.10.202', ping: 32, isOptimal: true },
    { name: 'Shecan Anti-Sanction', ip: '178.22.122.100', ping: 41, isOptimal: false },
    { name: 'Dedicated UAE ECS DNS', ip: '185.51.200.2', ping: 45, isOptimal: false },
    { name: 'Cloudflare Gaming 1.1.1.1', ip: '1.1.1.1', ping: 52, isOptimal: false },
    { name: 'Google DNS', ip: '8.8.8.8', ping: 58, isOptimal: false },
  ]);

  // Nodes Filter
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Emergency Mode
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);

  // Save changes
  useEffect(() => {
    localStorage.setItem('mlmvpn_settings', JSON.stringify(settings));
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'fa' ? 'rtl' : 'ltr';
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('mlmvpn_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('mlmvpn_cloud_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    if (updates.language) {
      setLanguageState(updates.language);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    updateSettings({ language: lang });
  }, [updateSettings]);

  // Realistic traffic stream simulator when VPN is connected
  useEffect(() => {
    if (!isRunning) {
      setTrafficDown(0);
      setTrafficUp(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate typical active web traffic (fluctuating 120 KB/s - 4500 KB/s)
      const baseDown = Math.random() > 0.4 ? Math.floor(Math.random() * 2800) + 150 : Math.floor(Math.random() * 800) + 40;
      const baseUp = Math.floor(baseDown * 0.22) + Math.floor(Math.random() * 60);

      setTrafficDown(baseDown);
      setTrafficUp(baseUp);

      // Increment totals in MB
      setTotalDownMB((prev) => +(prev + baseDown / (1024 * 10)).toFixed(2));
      setTotalUpMB((prev) => +(prev + baseUp / (1024 * 10)).toFixed(2));
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Connection Engine
  const connect = useCallback(async (nodeToConnect?: VpnNode) => {
    const targetNode = nodeToConnect || nodes[0];
    if (!targetNode) return;

    setPhase('CONNECTING');
    setConnectedNode(targetNode);
    setActiveEngine(targetNode.engineType || 'MLM');

    // Stage 1: Handshake
    await new Promise((r) => setTimeout(r, 600));
    setPhase('CHECKING_IP');

    // Stage 2: Clean Tunnel Verification
    await new Promise((r) => setTimeout(r, 700));
    const simulatedDelay = Math.floor(Math.random() * 45) + 55;
    setRealDelay(simulatedDelay);
    setPhase('ESTABLISHED');
  }, [nodes]);

  const disconnect = useCallback(() => {
    setPhase('DISCONNECTING');
    setTimeout(() => {
      setPhase('IDLE');
      setConnectedNode(null);
      setTrafficDown(0);
      setTrafficUp(0);
    }, 400);
  }, []);

  const quickToggle = useCallback(() => {
    if (isRunning) {
      disconnect();
    } else {
      connect(connectedNode || nodes[0]);
    }
  }, [isRunning, disconnect, connect, connectedNode, nodes]);

  // Nodes Management
  const addNode = useCallback((node: Omit<VpnNode, 'id' | 'addedAt'>) => {
    const newNode: VpnNode = {
      ...node,
      id: `node-${Date.now()}`,
      addedAt: Date.now(),
      ping: 'Test',
      delay: 'Test',
      speed: 'Test',
    };
    setNodes((prev) => [newNode, ...prev]);
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (connectedNode?.id === id) {
      disconnect();
    }
  }, [connectedNode, disconnect]);

  const pingAllNodes = useCallback(async () => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        ping: '...',
        delay: '...',
      }))
    );

    await new Promise((r) => setTimeout(r, 1200));

    setNodes((prev) =>
      prev.map((n) => {
        const pingNum = Math.floor(Math.random() * 80) + 42;
        const delayNum = pingNum + Math.floor(Math.random() * 35) + 20;
        const speedNum = (Math.random() * 5 + 1.8).toFixed(1);
        return {
          ...n,
          ping: `${pingNum}ms`,
          delay: `${delayNum}ms`,
          speed: `${speedNum} MB/s`,
        };
      })
    );
  }, []);

  // Cloudflare Worker Deployment Simulator
  const deployWorker = useCallback(async (accountId: string, engine: 'BPB' | 'EDG' | 'NAHAN' | 'MLM' | 'DNS' | 'GST') => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        if (engine === 'EDG') return { ...acc, edgStatus: 'deploying' };
        if (engine === 'NAHAN') return { ...acc, nahanStatus: 'deploying' };
        if (engine === 'MLM') return { ...acc, mlmStatus: 'deploying' };
        if (engine === 'DNS') return { ...acc, dnsStatus: 'deploying' };
        if (engine === 'GST') return { ...acc, gstRelayStatus: 'deploying' };
        return { ...acc, status: 'deployed' };
      })
    );

    // Simulate Cloudflare API request and KV database binding
    await new Promise((r) => setTimeout(r, 1800));

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const baseDomain = acc.email.split('@')[0].replace(/[^a-z0-9]/gi, '');
        if (engine === 'EDG') {
          return {
            ...acc,
            edgStatus: 'deployed',
            edgWorkerUrl: `https://edg-${baseDomain}.workers.dev`,
            edgUuid: '4a3901b2-78d1-4190-b193-9c8821034f19',
          };
        }
        if (engine === 'NAHAN') {
          return {
            ...acc,
            nahanStatus: 'deployed',
            nahanWorkerUrl: `https://nhn-${baseDomain}.workers.dev`,
          };
        }
        if (engine === 'MLM') {
          return {
            ...acc,
            mlmStatus: 'deployed',
            mlmWorkerUrl: `https://mlm-core-${baseDomain}.workers.dev`,
          };
        }
        if (engine === 'DNS') {
          return {
            ...acc,
            dnsStatus: 'deployed',
            dnsWorkerUrl: `https://dns-${baseDomain}.workers.dev`,
          };
        }
        if (engine === 'GST') {
          return {
            ...acc,
            gstRelayStatus: 'deployed',
            gstRelayWorkerUrl: `https://gst-${baseDomain}.workers.dev`,
          };
        }
        return {
          ...acc,
          status: 'deployed',
          workerUrl: `https://bpb-${baseDomain}.workers.dev`,
        };
      })
    );
  }, []);

  const addCloudAccount = useCallback((account: Partial<CloudAccount>) => {
    const newAcc: CloudAccount = {
      id: `cf-acc-${Date.now()}`,
      name: account.name || 'Cloudflare Account',
      email: account.email || 'user@domain.com',
      token: account.token || 'cf_token_auto',
      accountId: account.accountId || 'acc_auto_id',
      status: 'active',
      addedAt: new Date().toISOString().split('T')[0],
      edgStatus: 'idle',
      nahanStatus: 'idle',
      mlmStatus: 'idle',
      dnsStatus: 'idle',
      gstRelayStatus: 'idle',
      isEmailVerified: true,
      hasSubdomain: true,
    };
    setAccounts((prev) => [newAcc, ...prev]);
  }, []);

  const deleteCloudAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // IP Scanner Engine
  const startScan = useCallback((operator?: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanPhase('PINGING');

    // Simulate scanning progress in batches
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 12;
      if (currentProgress < 60) {
        setScanProgress(currentProgress);
        setScanPhase('PINGING');
      } else if (currentProgress < 95) {
        setScanProgress(currentProgress);
        setScanPhase('SPEED_TESTING');
      } else {
        clearInterval(interval);
        setScanProgress(100);
        setScanPhase('DONE');
        setIsScanning(false);

        // Generate refreshed clean IPs tailored to the operator
        setScannedIPs((prev) =>
          prev.map((ipItem) => {
            const jitter = operator === 'MCI' ? 35 : operator === 'MTN' ? 25 : 15;
            const newPing = Math.max(38, ipItem.ping + (Math.floor(Math.random() * 20) - 10));
            const newSpeed = +(Math.random() * 4 + 3.2).toFixed(1);
            return {
              ...ipItem,
              ping: newPing,
              downloadSpeed: newSpeed,
              isClean: newPing < 95,
            };
          })
        );
      }
    }, 450);
  }, []);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    setScanPhase('READY');
  }, []);

  const toggleSelectIP = useCallback((id: number) => {
    setScannedIPs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const transferCleanIPsToNodes = useCallback(() => {
    const selected = scannedIPs.filter((ip) => ip.selected);
    if (selected.length === 0) return;

    const newNodes: VpnNode[] = selected.map((s, idx) => ({
      id: `scanned-node-${Date.now()}-${idx}`,
      name: `⚡ Clean IP ${s.datacenter} (${s.ip})`,
      uri: `vless://clean-ip-uuid@${s.ip}:443?encryption=none&security=tls&sni=clean.cloudflare.com&fp=chrome&type=ws&path=%2F#${s.datacenter}`,
      type: 'vless',
      ping: `${s.ping}ms`,
      delay: `${s.ping + 25}ms`,
      speed: `${s.downloadSpeed} MB/s`,
      addedAt: Date.now(),
      engineType: 'BPB',
      countryCode: s.country,
      groupTitle: 'Scanned Clean IPs',
    }));

    setNodes((prev) => [...newNodes, ...prev]);
  }, [scannedIPs]);

  // Game Booster
  const toggleGameBooster = useCallback((preset?: GamePreset) => {
    if (isGameBoosterActive) {
      setIsGameBoosterActive(false);
    } else {
      setIsGameBoosterActive(true);
      if (preset) setActiveGamePreset(preset);
    }
  }, [isGameBoosterActive]);

  const runDnsRace = useCallback(async () => {
    setDnsRaceResults((prev) => prev.map((d) => ({ ...d, ping: 0 })));
    await new Promise((r) => setTimeout(r, 800));

    const updated = [
      { name: 'Electro DNS (MENA Gaming)', ip: '10.202.10.202', ping: Math.floor(Math.random() * 12) + 28, isOptimal: true },
      { name: 'Shecan Anti-Sanction', ip: '178.22.122.100', ping: Math.floor(Math.random() * 15) + 36, isOptimal: false },
      { name: 'Dedicated UAE ECS DNS', ip: '185.51.200.2', ping: Math.floor(Math.random() * 15) + 42, isOptimal: false },
      { name: 'Cloudflare Gaming 1.1.1.1', ip: '1.1.1.1', ping: Math.floor(Math.random() * 20) + 48, isOptimal: false },
      { name: 'Google DNS', ip: '8.8.8.8', ping: Math.floor(Math.random() * 20) + 54, isOptimal: false },
    ].sort((a, b) => a.ping - b.ping);

    updated[0].isOptimal = true;
    for (let i = 1; i < updated.length; i++) updated[i].isOptimal = false;

    setDnsRaceResults(updated);
    setOptimalGamingDns(`${updated[0].ip} (${updated[0].name})`);
  }, []);

  // Aether Engine
  const testAetherEndpoints = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 900));
    setAetherConfig((prev) => ({
      ...prev,
      endpoints: prev.endpoints.map((ep) => ({
        ...ep,
        latency: Math.floor(Math.random() * 30) + 42,
        loss: Math.random() > 0.8 ? +(Math.random() * 1.5).toFixed(1) : 0,
      })),
    }));
  }, []);

  // VPN Gate
  const connectVpnGate = useCallback(async (server: VpnGateServer) => {
    const vpnGateNode: VpnNode = {
      id: `vpngate-${server.hostName}`,
      name: `${server.countryLong} Relay (${server.ip})`,
      uri: `openvpn://${server.ip}:443?proto=tcp&country=${server.countryShort}`,
      type: 'openvpn',
      ping: `${server.ping}ms`,
      delay: `${server.ping + 30}ms`,
      speed: `${(server.speed / 10000000).toFixed(1)} MB/s`,
      addedAt: Date.now(),
      engineType: 'VPNGATE',
      countryCode: server.countryShort,
      groupTitle: 'VPN Gate Relays',
    };
    await connect(vpnGateNode);
  }, [connect]);

  const refreshVpnGate = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 1000));
    setVpnGateServers((prev) =>
      prev.map((s) => ({
        ...s,
        ping: Math.max(12, s.ping + Math.floor(Math.random() * 16) - 8),
        numVpnSessions: s.numVpnSessions + Math.floor(Math.random() * 10) - 4,
      }))
    );
  }, []);

  return (
    <VpnContext.Provider
      value={{
        phase,
        isRunning,
        connectedNode,
        activeEngine,
        realDelay,
        trafficDown,
        trafficUp,
        totalDownMB,
        totalUpMB,
        connect,
        disconnect,
        quickToggle,
        nodes,
        activeFilter,
        setActiveFilter,
        addNode,
        deleteNode,
        pingAllNodes,
        accounts,
        cloudGroups,
        deployWorker,
        addCloudAccount,
        deleteCloudAccount,
        isScanning,
        scanProgress,
        scanPhase,
        scannedIPs,
        startScan,
        stopScan,
        toggleSelectIP,
        transferCleanIPsToNodes,
        isGameBoosterActive,
        activeGamePreset,
        optimalGamingDns,
        dnsRaceResults,
        toggleGameBooster,
        runDnsRace,
        aetherConfig,
        setAetherConfig,
        testAetherEndpoints,
        vpnGateServers,
        connectVpnGate,
        refreshVpnGate,
        settings,
        updateSettings,
        language,
        setLanguage,
        usageStats,
        activeEmergency,
        setActiveEmergency,
      }}
    >
      {children}
    </VpnContext.Provider>
  );
};

export const useVpn = () => {
  const context = useContext(VpnContext);
  if (!context) {
    throw new Error('useVpn must be used within a VpnProvider');
  }
  return context;
};
