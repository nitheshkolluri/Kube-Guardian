
import React, { useState, useEffect, useRef } from 'react';
import { Pod, ClusterEvent, AnalysisResult, PodStatus, SecurityConfig, AuditLog } from './types';
import { generateInitialPods, injectFailure, applyFixToPod } from './services/kubernetesService';
import { analyzePodFailure, sanitizeLogs } from './services/geminiService';
import { 
    CubeIcon, TerminalIcon, ActivityIcon, ServerIcon, BrainIcon, 
    AlertTriangleIcon, CheckCircleIcon, ShieldIcon, LockIcon, FileDiffIcon,
    PlusIcon, AWSIcon, AzureIcon, GCPIcon, CopyIcon
} from './components/icons';

// --- Components ---

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const StatusBadge: React.FC<{ status: PodStatus }> = ({ status }) => {
    const colors = {
        'Running': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        'CrashLoopBackOff': 'bg-red-500/20 text-red-400 border-red-500/50',
        'OOMKilled': 'bg-red-500/20 text-red-400 border-red-500/50',
        'ImagePullBackOff': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
        'Error': 'bg-red-500/20 text-red-400 border-red-500/50',
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-mono border ${colors[status] || colors['Error']}`}>
            {status}
        </span>
    );
};

const PodCard: React.FC<{ pod: Pod; onClick: () => void; isSelected: boolean }> = ({ pod, onClick, isSelected }) => {
    const isHealthy = pod.status === 'Running';
    return (
        <div 
            onClick={onClick}
            className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 relative overflow-hidden
                ${isSelected ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}
            `}
        >
            <div className="absolute top-2 right-2 flex gap-1">
                <span className="text-[10px] font-bold text-gray-500 border border-gray-600 px-1 rounded">{pod.cloudProvider}</span>
                {!isHealthy && (
                   <AlertTriangleIcon className="w-4 h-4 text-red-500" />
                )}
            </div>
            
            <div className="flex items-center mb-3 mt-2">
                <CubeIcon className={`w-5 h-5 mr-2 ${isHealthy ? 'text-gray-400' : 'text-red-400'}`} />
                <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-gray-200 truncate" title={pod.name}>{pod.name}</h3>
                    <p className="text-xs text-gray-500">{pod.namespace}</p>
                </div>
            </div>
            <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500 font-mono space-y-1">
                    <div>CPU: {pod.cpuUsage}</div>
                    <div>MEM: {pod.memoryUsage}</div>
                </div>
                <StatusBadge status={pod.status} />
            </div>
        </div>
    );
};

const EventStream: React.FC<{ events: ClusterEvent[] }> = ({ events }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    return (
        <div className="bg-black border border-gray-800 rounded-lg h-48 flex flex-col font-mono text-xs">
            <div className="bg-gray-900 px-3 py-2 border-b border-gray-800 flex items-center text-gray-400">
                <TerminalIcon className="w-4 h-4 mr-2" />
                <span>Security & Cluster Events</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
                {events.map(e => (
                    <div key={e.id} className="flex gap-2 opacity-80 hover:opacity-100">
                        <span className="text-gray-600">[{e.timestamp.toLocaleTimeString()}]</span>
                        <span className={e.type === 'Warning' ? 'text-yellow-500' : 'text-blue-400'}>{e.type}</span>
                        <span className="text-gray-300">{e.object}</span>
                        <span className="text-gray-500">- {e.message}</span>
                    </div>
                ))}
                {events.length === 0 && <span className="text-gray-700 italic">Waiting for events...</span>}
            </div>
        </div>
    );
};

// --- ONBOARDING MODAL ---

const OnboardingModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [provider, setProvider] = useState<string | null>(null);
    const [installing, setInstalling] = useState(false);

    const handleInstall = () => {
        setInstalling(true);
        setTimeout(() => {
            setInstalling(false);
            onComplete();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full overflow-hidden relative flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-800">
                     <h2 className="text-2xl font-bold text-white font-cinzel">Connect Cluster</h2>
                     <p className="text-gray-400 text-sm mt-1">Install the Kube-Guardian Agent to start monitoring.</p>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-white">Select Provider</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {['AWS', 'Azure', 'GCP'].map((p) => (
                                    <button 
                                        key={p}
                                        onClick={() => setProvider(p)}
                                        className={`p-6 border rounded-lg flex flex-col items-center gap-3 transition-all ${
                                            provider === p 
                                            ? 'border-blue-500 bg-blue-900/20' 
                                            : 'border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                                        }`}
                                    >
                                        {p === 'AWS' && <AWSIcon className="w-12 h-12 text-white"/>}
                                        {p === 'Azure' && <AzureIcon className="w-12 h-12 text-white"/>}
                                        {p === 'GCP' && <GCPIcon className="w-12 h-12 text-white"/>}
                                        <span className="font-bold">{p}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end mt-4">
                                <button 
                                    disabled={!provider}
                                    onClick={() => setStep(2)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
                                >
                                    Next: Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-medium text-white">Install Agent</h3>
                            <div className="bg-black border border-gray-800 rounded-lg p-4 relative group">
                                <div className="absolute top-2 right-2 text-gray-500 hover:text-white cursor-pointer">
                                    <CopyIcon className="w-5 h-5"/>
                                </div>
                                <code className="text-green-400 text-sm font-mono break-all">
                                    helm repo add kube-guardian https://charts.kubeguardian.io<br/>
                                    helm install guardian kube-guardian/agent \<br/>
                                    &nbsp;&nbsp;--set provider={provider?.toLowerCase()} \<br/>
                                    &nbsp;&nbsp;--set apiKey=kg_live_{Math.random().toString(36).substring(7)} \<br/>
                                    &nbsp;&nbsp;--namespace kube-system
                                </code>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded text-sm text-blue-300 flex gap-3">
                                <InfoIcon className="w-5 h-5 shrink-0"/>
                                <p>This agent runs as a DaemonSet. It includes the PII Redaction Engine, ensuring sensitive logs never leave your cluster's perimeter in raw format.</p>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white">Back</button>
                                <button 
                                    onClick={handleInstall}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-500 flex items-center gap-2"
                                >
                                    {installing ? (
                                        <>
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                            Verifying Connection...
                                        </>
                                    ) : (
                                        'Verify Installation'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SECURE ANALYSIS PANEL ---

const AnalysisPanel: React.FC<{ 
    pod: Pod; 
    onClose: () => void; 
    onApplyFix: (yaml: string) => void;
    onAudit: (action: string, details: string) => void;
    config: SecurityConfig 
}> = ({ pod, onClose, onApplyFix, onAudit, config }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [viewMode, setViewMode] = useState<'RAW' | 'SANITIZED'>('RAW');

    // Compute the sanitized version for preview
    const logsStr = pod.logs.join('\n');
    const sanitizedStr = sanitizeLogs(logsStr);

    const runAnalysis = async () => {
        setAnalyzing(true);
        onAudit('ANALYSIS_REQUEST', `Initiated AI RCA for pod ${pod.name}`);
        try {
            // We pass the SANITIZED string to the AI service
            const analysis = await analyzePodFailure(pod, sanitizedStr);
            setResult(analysis);
            onAudit('ANALYSIS_COMPLETE', `Gemini returned confidence score: ${analysis.confidence}`);
        } catch (e) {
            console.error(e);
            onAudit('ANALYSIS_ERROR', `Failed to contact AI Gateway`);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Security Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${pod.status === 'Running' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                             {pod.status === 'Running' ? <CheckCircleIcon className="text-green-500 w-6 h-6"/> : <AlertTriangleIcon className="text-red-500 w-6 h-6"/>}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                                {pod.name} 
                                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{pod.cloudProvider}</span>
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <ShieldIcon className="w-3 h-3 text-green-500" />
                                <span>Secure Enclave: Active</span>
                                <span className="text-gray-600">|</span>
                                <span>Redaction: {config.redactionLevel}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white px-4 py-2 hover:bg-gray-800 rounded">Close Console</button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                    
                    {/* Left: Data Loss Prevention (DLP) Preview */}
                    <div className="p-6 border-r border-gray-800 overflow-y-auto flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <FileDiffIcon className="w-4 h-4" />
                                Log Payload Preview
                            </h3>
                            
                            {/* Toggle Switch */}
                            <div className="flex bg-black rounded-lg p-1 border border-gray-700">
                                <button 
                                    onClick={() => setViewMode('RAW')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'RAW' ? 'bg-red-900/50 text-red-300' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    RAW (Unsafe)
                                </button>
                                <button 
                                    onClick={() => setViewMode('SANITIZED')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'SANITIZED' ? 'bg-green-900/50 text-green-300' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    SANITIZED (Safe)
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative bg-black rounded border border-gray-800 overflow-hidden flex flex-col">
                            {/* Security Banner */}
                            <div className={`w-full h-1 ${viewMode === 'RAW' ? 'bg-red-600' : 'bg-green-500'}`}></div>
                            
                            <div className="p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-gray-300 flex-1">
                                {viewMode === 'RAW' ? logsStr : sanitizedStr}
                            </div>

                            <div className="bg-gray-900 p-2 text-[10px] text-gray-500 border-t border-gray-800 flex justify-between">
                                <span>MD5: {viewMode === 'RAW' ? 'e29c...raw' : '88f2...clean'}</span>
                                {viewMode === 'SANITIZED' && <span className="text-green-500 flex items-center gap-1"><ShieldIcon className="w-3 h-3"/> Ready for Transit</span>}
                                {viewMode === 'RAW' && <span className="text-red-500 flex items-center gap-1"><LockIcon className="w-3 h-3"/> Internal Only</span>}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Cluster Manifest</h3>
                            <div className="bg-gray-900 p-4 rounded border border-gray-800 font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre">
                                {pod.manifest}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Analysis */}
                    <div className="p-6 overflow-y-auto bg-gray-900/30">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 rounded-full"></div>
                                    <BrainIcon className={`w-16 h-16 relative z-10 ${analyzing ? 'text-purple-500 animate-pulse' : 'text-gray-600'}`} />
                                </div>
                                
                                {analyzing ? (
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Secure Gateway Handshake...</h3>
                                        <p className="text-gray-400 text-sm">Establishing encrypted tunnel.</p>
                                        <p className="text-gray-400 text-sm mt-1">Sanitizing PII...</p>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">AI Ops Agent</h3>
                                        <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                                            The sanitized logs will be sent to the private LLM endpoint for Root Cause Analysis.
                                        </p>
                                        <button 
                                            onClick={runAnalysis}
                                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold flex items-center mx-auto transition-colors shadow-lg shadow-purple-900/20 border border-purple-500/50"
                                        >
                                            <ShieldIcon className="w-5 h-5 mr-2" />
                                            Analyze (Safe Mode)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-purple-400 font-bold text-lg">RCA Findings</h3>
                                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Conf: {result.confidence}%</span>
                                    </div>
                                    <p className="text-white text-lg font-medium mb-2">{result.rootCause}</p>
                                    <p className="text-gray-400 text-sm leading-relaxed">{result.explanation}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Remediation Plan</h3>
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                        <p className="text-gray-300 mb-4 text-sm">{result.suggestedFixDescription}</p>
                                        <div className="relative group">
                                            <div className="absolute top-0 right-0 bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-bl">YAML PATCH</div>
                                            <pre className="bg-black p-4 rounded border border-gray-700 text-xs text-green-400 overflow-x-auto">
                                                {result.fixedYaml}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        onAudit('PATCH_APPLIED', `Applied AI suggested fix for ${result.rootCause}`);
                                        onApplyFix(result.fixedYaml);
                                        onClose();
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center justify-center transition-all"
                                >
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Approve & Apply Fix
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SecurityDashboard: React.FC<{ onClose: () => void, logs: AuditLog[] }> = ({ onClose, logs }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400">
                        <ShieldIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Compliance Audit Log</h2>
                        <p className="text-xs text-gray-500">Immutable Ledger of AI Interactions</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-gray-800 text-gray-300">
                        <tr>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Hash</th>
                            <th className="px-4 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-800/50">
                                <td className="px-4 py-3 font-mono text-xs">{log.timestamp.toLocaleTimeString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        log.action === 'PATCH_APPLIED' ? 'bg-green-900/50 text-green-400' :
                                        log.action === 'ANALYSIS_REQUEST' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{log.user}</td>
                                <td className="px-4 py-3 font-mono text-xs truncate max-w-[100px]">{log.complianceHash}</td>
                                <td className="px-4 py-3">{log.details}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-600 italic">No audit records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-gray-800/30 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
                <span>Data Residency: US-East (N. Virginia)</span>
                <span>Compliance Standard: SOC2 Type II</span>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
    const [pods, setPods] = useState<Pod[]>([]);
    const [events, setEvents] = useState<ClusterEvent[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
    const [autoChaos, setAutoChaos] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
        redactionLevel: 'STRICT',
        requireHumanApproval: true,
        auditLoggingEnabled: true,
        dataResidency: 'US'
    });

    // Initialization
    useEffect(() => {
        document.title = "Kube-Guardian";
        setPods(generateInitialPods(12));
        const initialEvent: ClusterEvent = {
            id: 'init',
            timestamp: new Date(),
            type: 'Normal',
            reason: 'NodeReady',
            object: 'node/worker-1',
            message: 'Cluster initialized. Security protocols active.'
        };
        setEvents([initialEvent]);
    }, []);

    // Chaos Monkey Loop
    useEffect(() => {
        if (!autoChaos) return;

        const interval = setInterval(() => {
            setPods(currentPods => {
                const { updatedPods, event } = injectFailure(currentPods);
                if (event) {
                    setEvents(prev => [...prev, event]);
                }
                return updatedPods;
            });
        }, 8000);

        return () => clearInterval(interval);
    }, [autoChaos]);

    const handleAudit = (action: string, details: string) => {
        const newLog: AuditLog = {
            id: Math.random().toString(),
            timestamp: new Date(),
            action: action as any,
            user: 'devops-admin@corp.local',
            resource: selectedPod ? selectedPod.name : 'system',
            details: details,
            complianceHash: 'sha256:' + Math.random().toString(36).substring(2)
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    const handleFixApply = (fixedYaml: string) => {
        if (!selectedPod) return;
        
        setPods(currentPods => applyFixToPod(currentPods, selectedPod.id, fixedYaml));
        
        setEvents(prev => [...prev, {
            id: Math.random().toString(),
            timestamp: new Date(),
            type: 'Normal',
            reason: 'PatchApplied',
            object: `pod/${selectedPod.name}`,
            message: 'AI Remediation applied. Verification passed.'
        }]);
    };

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        const newEvent: ClusterEvent = {
            id: Math.random().toString(),
            timestamp: new Date(),
            type: 'Normal',
            reason: 'AgentConnected',
            object: 'daemonset/guardian-agent',
            message: 'New cluster connected successfully. Streaming logs securely.'
        };
        setEvents(prev => [...prev, newEvent]);
    };

    // Calculate stats
    const healthyCount = pods.filter(p => p.status === 'Running').length;
    const errorCount = pods.length - healthyCount;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-blue-500/30">
            
            {/* Top Navigation */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                    <ServerIcon className="w-6 h-6 text-blue-500" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                            Kube-Guardian 
                            <span className="text-[10px] uppercase bg-blue-900/50 border border-blue-500/30 px-1.5 py-0.5 rounded text-blue-300">Enterprise</span>
                        </h1>
                        <p className="text-xs text-gray-500">Privacy-First SRE Copilot</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setShowOnboarding(true)}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Cluster
                    </button>
                    <div className="h-6 w-px bg-gray-700 mx-2"></div>
                    <button 
                        onClick={() => setShowAudit(true)}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors px-3 py-2 rounded hover:bg-gray-800"
                    >
                        <ShieldIcon className="w-4 h-4 text-green-500" />
                        Logs
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-black border border-gray-800">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-mono text-gray-400">{healthyCount}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-black border border-gray-800">
                        <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-red-500 animate-ping' : 'bg-gray-600'}`}></div>
                        <span className="text-sm font-mono text-gray-400">{errorCount}</span>
                    </div>
                    <button 
                        onClick={() => setAutoChaos(!autoChaos)}
                        className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                            autoChaos ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                    >
                        {autoChaos ? 'Stop Chaos' : 'Simulate Chaos'}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-6 max-w-7xl mx-auto space-y-6">
                
                {/* Cluster Grid */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider">Multi-Cloud Workloads</h2>
                        <div className="flex gap-4 text-xs text-gray-600 font-mono">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div>AWS: us-east-1</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>GCP: us-central1</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-300 rounded-full"></div>Azure: eastus2</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {pods.map(pod => (
                            <PodCard 
                                key={pod.id} 
                                pod={pod} 
                                isSelected={false} 
                                onClick={() => setSelectedPod(pod)}
                            />
                        ))}
                    </div>
                </section>

                {/* Event Stream */}
                <section>
                    <EventStream events={events} />
                </section>

            </main>

            {/* Modals */}
            {selectedPod && (
                <AnalysisPanel 
                    pod={selectedPod} 
                    config={securityConfig}
                    onClose={() => setSelectedPod(null)} 
                    onApplyFix={handleFixApply}
                    onAudit={handleAudit}
                />
            )}

            {showAudit && (
                <SecurityDashboard onClose={() => setShowAudit(false)} logs={auditLogs} />
            )}

            {showOnboarding && (
                <OnboardingModal onClose={() => setShowOnboarding(false)} onComplete={handleOnboardingComplete} />
            )}
        </div>
    );
};

export default App;
