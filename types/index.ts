export interface Cluster {
    id: string;
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    provider: 'aws' | 'gcp' | 'azure' | 'on-premise';
    region: string;
    totalPods: number;
    runningPods: number;
    failedPods: number;
    cpuUsage: number;
    memoryUsage: number;
    connectedAt: string;
}

export interface Pod {
    id: string;
    name: string;
    namespace: string;
    clusterId: string;
    status: 'running' | 'pending' | 'failed' | 'crashloopbackoff' | 'unknown';
    restarts: number;
    age: string;
    cpuUsage: number;
    memoryUsage: number;
    image: string;
    node: string;
    hasError: boolean;
    errorMessage?: string;
}

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    hasPII: boolean;
    redactedMessage?: string;
}

export interface AIFixSuggestion {
    id: string;
    podId: string;
    analysis: string;
    rootCause: string;
    suggestedFix: string;
    codeSnippet?: string;
    confidence: number;
    estimatedImpact: 'low' | 'medium' | 'high';
    createdAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'applied';
    reviewedBy?: string;
    reviewedAt?: string;
}

export interface Alert {
    id: string;
    type: 'pod_down' | 'pod_error' | 'high_cpu' | 'high_memory' | 'crash_loop';
    severity: 'info' | 'warning' | 'critical';
    podId: string;
    podName: string;
    clusterId: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
}

export interface AlertPreferences {
    enabled: boolean;
    channels: {
        email: boolean;
        slack: boolean;
        webhook: boolean;
    };
    thresholds: {
        cpuPercent: number;
        memoryPercent: number;
        restartCount: number;
    };
    notifyOn: {
        podDown: boolean;
        podError: boolean;
        highCpu: boolean;
        highMemory: boolean;
        crashLoop: boolean;
    };
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface Company {
    name: string;
    logo: string;
    industry: string;
}
