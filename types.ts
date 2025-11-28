
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
  logs: string[]; // Simulated log lines
  manifest: string; // The YAML configuration
  cloudProvider: 'AWS' | 'GCP' | 'Azure';
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

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: 'ANALYSIS_REQUEST' | 'PATCH_APPLIED' | 'ACCESS_DENIED';
  user: string;
  resource: string;
  details: string;
  complianceHash: string; // Simulated hash for immutability
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
