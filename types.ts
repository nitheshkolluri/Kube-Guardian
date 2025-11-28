
export type PodStatus = 'Running' | 'Pending' | 'CrashLoopBackOff' | 'ImagePullBackOff' | 'OOMKilled' | 'Error';

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  status: PodStatus;
  restarts: number;
  image: string;
  cpuUsage: string;
  memoryUsage: string;
  logs: string[]; 
  manifest: string;
  cloudProvider: 'AWS' | 'GCP' | 'Azure' | 'Generic';
}

export interface ClusterEvent {
  id: string;
  timestamp: Date;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  object: string;
}

export interface AnalysisResult {
  rootCause: string;
  explanation: string;
  suggestedFixDescription: string;
  fixedYaml: string;
  confidence: number;
}

export interface SecurityConfig {
  redactionLevel: 'NONE' | 'BASIC' | 'STRICT';
  requireHumanApproval: boolean;
  auditLoggingEnabled: boolean;
  dataResidency: 'US' | 'EU' | 'GLOBAL';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type PricingTier = 'COMMUNITY' | 'PRO' | 'ENTERPRISE';
