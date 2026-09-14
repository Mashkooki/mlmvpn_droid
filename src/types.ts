export type ConnectionPhase =
  | 'IDLE'
  | 'CONNECTING'
  | 'CHECKING_IP'
  | 'ESTABLISHED'
  | 'DISCONNECTING'
  | 'FAILED';

export type Language = 'fa' | 'en';

export type TabType =
  | 'quick'
  | 'scanner'
  | 'cloud'
  | 'nodes'
  | 'game'
  | 'aether'
  | 'vpngate'
  | 'settings'
  | 'usage'
  | 'fixed_ip'
  | 'workers_list'
  | 'antisanction'
  | 'sublink'
  | 'tutorial'
  | 'about'
  | 'emergency_vercel'
  | 'emergency_2'
  | 'emergency_3';

export interface VpnNode {
  id: string;
  name: string;
  uri: string;
  type: 'vless' | 'trojan' | 'vmess' | 'shadowsocks' | 'wireguard' | 'openvpn';
  ping?: string;
  delay?: string;
  speed?: string;
  addedAt: number;
  engineType?: string;
  countryCode?: string;
  groupTitle?: string;
}

export interface CloudAccount {
  id: string;
  name: string;
  email: string;
  token: string;
  accountId: string;
  status: 'active' | 'deploying' | 'deployed' | 'error';
  addedAt: string;
  workerUrl?: string;
  uuid?: string;
  trPass?: string;
  subPath?: string;
  edgWorkerUrl?: string;
  edgUuid?: string;
  edgAdminPass?: string;
  edgStatus?: 'idle' | 'deploying' | 'deployed' | 'error';
  nahanWorkerUrl?: string;
  nahanStatus?: 'idle' | 'deploying' | 'deployed' | 'error';
  mlmWorkerUrl?: string;
  mlmStatus?: 'idle' | 'deploying' | 'deployed' | 'error';
  dnsWorkerUrl?: string;
  dnsStatus?: 'idle' | 'deploying' | 'deployed' | 'error';
  gstRelayWorkerUrl?: string;
  gstRelayStatus?: 'idle' | 'deploying' | 'deployed' | 'error';
  isEmailVerified: boolean;
  hasSubdomain: boolean;
}

export interface CloudGroup {
  id: string;
  name: string;
  accountId: string;
  type: 'BPB' | 'EDG' | 'NAHAN' | 'MLM';
  nodeCount: number;
  cleanIp: string;
  proxyIp: string;
}

export interface ScannedIP {
  id: number;
  ip: string;
  ping: number;
  downloadSpeed: number;
  selected: boolean;
  datacenter: string;
  country: string;
  isClean: boolean;
}

export interface VpnGateServer {
  hostName: string;
  ip: string;
  score: number;
  ping: number;
  speed: number;
  countryLong: string;
  countryShort: string;
  numVpnSessions: number;
  uptime: number;
  operator: string;
}

export interface ProxyCountryInfo {
  code: string;
  name: string;
  flag: string;
  fileLength: number;
}

export interface GamePreset {
  id: string;
  name: string;
  category: string;
  servers: string[];
  optimalDns: string;
  avgPing: number;
  icon: string;
}

export interface DayUsage {
  date: string;
  dayLabel: string;
  download: number; // in MB
  upload: number; // in MB
}

export interface UsageStats {
  todayDownload: number;
  todayUpload: number;
  history30DaysTotal: number;
  history7Days: DayUsage[];
}

export interface AetherEndpoint {
  ip: string;
  port: number;
  latency: number;
  loss: number;
  active: boolean;
  tag: string;
}

export interface AetherConfig {
  protocol: 'MASQUE' | 'WIREGUARD' | 'WARP';
  stage: 'idle' | 'resolving' | 'handshake' | 'connected';
  mtu: number;
  keepalive: number;
  obfuscation: {
    jc: number;
    jmin: number;
    jmax: number;
    s1: number;
    s2: number;
    h1: string;
    h2: string;
  };
  endpoints: AetherEndpoint[];
}

export interface AppSettings {
  language: Language;
  backendDns: string;
  proxyMode: boolean;
  localPort: string;
  allowLan: boolean;
  showRealtimeTraffic: boolean;
  trackUsage: boolean;
  enableAetherTab: boolean;
  enableGameTab: boolean;
  enableWarpTab: boolean;
  screenOffTimeout: number;
}
