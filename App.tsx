
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
    const styles = {
        'Running': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'CrashLoopBackOff': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        'OOMKilled': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        'ImagePullBackOff': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Error': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['Error']} backdrop-blur-sm`}>
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
                group relative p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                ${isSelected 
                    ? 'border-blue-500/50 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50' 
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/60 hover:shadow-lg hover:-translate-y-1'
                }
            `}
        >
            {/* Gradient overlay for hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/50 border border-slate-800 px-1.5 py-0.5 rounded uppercase tracking-widest">{pod.cloudProvider}</span>
                 {!isHealthy && (
                   <div className="animate-pulse"><AlertTriangleIcon className="w-4 h-4 text-rose-500" /></div>
                )}
            </div>
            
            <div className="flex items-center mb-4 mt-1">
                <div className={`p-2 rounded-lg mr-3 ${isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    <CubeIcon className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-200 truncate text-sm font-cinzel tracking-wide" title={pod.name}>{pod.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{pod.namespace}</p>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                    <div className="bg-slate-950/50 rounded px-2 py-1.5 border border-slate-800/50 flex justify-between items-center">
                        <span className="text-[10px] uppercase text-slate-600">CPU</span>
                        <span className={parseInt(pod.cpuUsage) > 800 ? 'text-amber-400' : 'text-slate-300'}>{pod.cpuUsage}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded px-2 py-1.5 border border-slate-800/50 flex justify-between items-center">
                         <span className="text-[10px] uppercase text-slate-600">MEM</span>
                        <span className="text-slate-300">{pod.memoryUsage}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <StatusBadge status={pod.status} />
                </div>
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
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl h-56 flex flex-col font-mono text-xs shadow-lg">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center text-slate-400">
                <TerminalIcon className="w-4 h-4 mr-2 text-blue-400" />
                <span className="uppercase tracking-wider font-bold text-[10px]">System Events Stream</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {events.map(e => (
                    <div key={e.id} className="flex gap-3 opacity-80 hover:opacity-100 group">
                        <span className="text-slate-600 shrink-0 w-20">[{e.timestamp.toLocaleTimeString()}]</span>
                        <span className={`shrink-0 font-bold ${e.type === 'Warning' ? 'text-amber-500' : 'text-blue-400'}`}>{e.type}</span>
                        <div className="flex-1">
                             <span className="text-slate-400 mr-2 group-hover:text-slate-300">{e.object}</span>
                             <span className="text-slate-500 group-hover:text-slate-400">- {e.message}</span>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <span className="text-slate-700 italic">Waiting for events...</span>}
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full overflow-hidden relative flex flex-col shadow-2xl shadow-black/50">
                <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                     <h2 className="text-2xl font-bold text-white font-cinzel">Connect Cluster</h2>
                     <p className="text-slate-400 text-sm mt-1">Install the Kube-Guardian Agent to start monitoring.</p>
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
                                        className={`p-6 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                                            provider === p 
                                            ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                                        }`}
                                    >
                                        {p === 'AWS' && <AWSIcon className="w-12 h-12 text-white"/>}
                                        {p === 'Azure' && <AzureIcon className="w-12 h-12 text-white"/>}
                                        {p === 'GCP' && <GCPIcon className="w-12 h-12 text-white"/>}
                                        <span className="font-bold text-slate-200">{p}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end mt-4">
                                <button 
                                    disabled={!provider}
                                    onClick={() => setStep(2)}
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/20 transition-all"
                                >
                                    Next: Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-medium text-white">Install Agent</h3>
                            <div className="bg-black border border-slate-800 rounded-lg p-4 relative group shadow-inner">
                                <div className="absolute top-2 right-2 text-slate-500 hover:text-white cursor-pointer">
                                    <CopyIcon className="w-5 h-5"/>
                                </div>
                                <code className="text-emerald-400 text-sm font-mono break-all">
                                    helm repo add kube-guardian https://charts.kubeguardian.io<br/>
                                    helm install guardian kube-guardian/agent \<br/>
                                    &nbsp;&nbsp;--set provider={provider?.toLowerCase()} \<br/>
                                    &nbsp;&nbsp;--set apiKey=kg_live_{Math.random().toString(36).substring(7)} \<br/>
                                    &nbsp;&nbsp;--namespace kube-system
                                </code>
                            </div>
                            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded text-sm text-blue-300 flex gap-3">
                                <InfoIcon className="w-5 h-5 shrink-0"/>
                                <p>This agent runs as a DaemonSet. It includes the PII Redaction Engine, ensuring sensitive logs never leave your cluster's perimeter in raw format.</p>
                            </div>
                            <div className="flex justify-between items-center mt-6">
                                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition-colors">Back</button>
                                <button 
                                    onClick={handleInstall}
                                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-500 flex items-center gap-2 font-bold shadow-lg shadow-emerald-900/20 transition-all"
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
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'RAW' | 'SANITIZED'>('RAW');
    const [applying, setApplying] = useState(false);
    const [cpuLimit, setCpuLimit] = useState<string>("");
    const [memLimit, setMemLimit] = useState<string>("");

    // Compute the sanitized version for preview
    const logsStr = pod.logs.join('\n');
    const sanitizedStr = sanitizeLogs(logsStr);

    const runAnalysis = async () => {
        setAnalyzing(true);
        setError(null);
        setResult(null);
        onAudit('ANALYSIS_REQUEST', `Initiated AI RCA for pod ${pod.name}`);
        
        try {
            const analysis = await analyzePodFailure(pod, sanitizedStr);
            if (!analysis) throw new Error("No analysis returned from AI service.");
            
            const cpuMatch = analysis.fixedYaml.match(/cpu:\s*"?([^"\n]+)"?/);
            const memMatch = analysis.fixedYaml.match(/memory:\s*"?([^"\n]+)"?/);
            
            setCpuLimit(cpuMatch ? cpuMatch[1] : "500m");
            setMemLimit(memMatch ? memMatch[1] : "256Mi");

            setResult(analysis);
            onAudit('ANALYSIS_COMPLETE', `Gemini returned confidence score: ${analysis.confidence}`);
        } catch (e: any) {
            console.error(e);
            let errorMessage = "Failed to contact AI Gateway";
            if (e.message?.includes('JSON')) {
                errorMessage = "AI Response Parsing Error: The model returned invalid JSON.";
            } else if (e.message?.includes('API_KEY')) {
                errorMessage = "Authentication Error: API Key missing or invalid. Check your .env file.";
            } else if (e.message?.includes('429')) {
                errorMessage = "Rate Limit Exceeded: Please wait before retrying.";
            } else if (e.message) {
                errorMessage = `AI Error: ${e.message}`;
            }
            setError(errorMessage);
            onAudit('ANALYSIS_ERROR', errorMessage);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleResourceUpdate = (type: 'cpu' | 'memory', value: string) => {
        if (type === 'cpu') setCpuLimit(value);
        if (type === 'memory') setMemLimit(value);
        
        if (!result) return;

        let newYaml = result.fixedYaml;
        if (type === 'cpu') {
            newYaml = newYaml.replace(/cpu:\s*"?([^"\n]+)"?/, `cpu: "${value}"`);
        } else {
            newYaml = newYaml.replace(/memory:\s*"?([^"\n]+)"?/, `memory: "${value}"`);
        }
        
        setResult({ ...result, fixedYaml: newYaml });
    };

    const handleApply = async () => {
        if (!result) return;
        setApplying(true);
        try {
             await new Promise(resolve => setTimeout(resolve, 1000));
             
             if (!result.fixedYaml) {
                 throw new Error("Cannot apply empty patch.");
             }
             
             onAudit('PATCH_APPLIED', `Applied AI suggested fix for ${result.rootCause}`);
             onApplyFix(result.fixedYaml);
             onClose();
        } catch (e: any) {
            setError(`Cluster Operation Failed: ${e.message}`);
            onAudit('PATCH_FAILED', `Failed to apply fix: ${e.message}`);
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black">
                
                {/* Security Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${pod.status === 'Running' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                             {pod.status === 'Running' ? <CheckCircleIcon className="w-6 h-6"/> : <AlertTriangleIcon className="w-6 h-6"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white font-cinzel flex items-center gap-3">
                                {pod.name} 
                                <span className="text-[10px] uppercase font-sans font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{pod.cloudProvider}</span>
                            </h2>
                            <div className="flex items-center gap-3 text-xs font-medium mt-1">
                                <span className="flex items-center gap-1.5 text-emerald-400"><ShieldIcon className="w-3 h-3" /> Secure Enclave: Active</span>
                                <span className="text-slate-700">|</span>
                                <span className="text-slate-400">Redaction: <span className="text-slate-200">{config.redactionLevel}</span></span>
                                <span className="text-slate-700">|</span>
                                <span className={`${config.requireHumanApproval ? 'text-blue-400' : 'text-amber-500'} font-bold uppercase tracking-wide`}>
                                    {config.requireHumanApproval ? 'Human Verify' : 'Auto-Pilot'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium">Close Console</button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* Left: Data Loss Prevention (DLP) Preview */}
                    <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto flex flex-col h-full bg-slate-900/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FileDiffIcon className="w-4 h-4" />
                                Log Payload Preview
                            </h3>
                            
                            {/* Toggle Switch */}
                            <div className="flex bg-black/40 rounded-lg p-1 border border-slate-800">
                                <button 
                                    onClick={() => setViewMode('RAW')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${viewMode === 'RAW' ? 'bg-rose-900/40 text-rose-400 shadow-inner' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                    RAW (UNSAFE)
                                </button>
                                <button 
                                    onClick={() => setViewMode('SANITIZED')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${viewMode === 'SANITIZED' ? 'bg-emerald-900/40 text-emerald-400 shadow-inner' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                    SANITIZED (SAFE)
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative bg-black rounded-lg border border-slate-800 overflow-hidden flex flex-col shadow-inner">
                            {/* Security Banner */}
                            <div className={`w-full h-0.5 ${viewMode === 'RAW' ? 'bg-rose-600' : 'bg-emerald-500'}`}></div>
                            
                            <div className="p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-slate-300 flex-1 leading-relaxed">
                                {viewMode === 'RAW' ? logsStr : sanitizedStr}
                            </div>

                            <div className="bg-slate-950 p-2 text-[10px] font-mono text-slate-600 border-t border-slate-900 flex justify-between items-center">
                                <span>HASH: {viewMode === 'RAW' ? 'e29c...raw' : '88f2...clean'}</span>
                                {viewMode === 'SANITIZED' && <span className="text-emerald-500 flex items-center gap-1 font-bold"><ShieldIcon className="w-3 h-3"/> READY FOR TRANSIT</span>}
                                {viewMode === 'RAW' && <span className="text-rose-500 flex items-center gap-1 font-bold"><LockIcon className="w-3 h-3"/> INTERNAL ONLY</span>}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cluster Manifest</h3>
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-blue-300/90 overflow-x-auto whitespace-pre shadow-inner">
                                {pod.manifest}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Analysis */}
                    <div className="lg:col-span-5 p-6 overflow-y-auto bg-slate-800/20 flex flex-col">
                        {error ? (
                             <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                                <div className="p-4 bg-rose-900/20 rounded-full border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                    <AlertTriangleIcon className="w-12 h-12 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Operation Failed</h3>
                                    <p className="text-rose-300 mt-2 max-w-xs mx-auto text-sm">{error}</p>
                                </div>
                                <button 
                                    onClick={runAnalysis}
                                    className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-bold border border-slate-600 transition-colors"
                                >
                                    Retry Analysis
                                </button>
                             </div>
                        ) : !result ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full transition-all duration-1000 ${analyzing ? 'opacity-40 scale-125' : ''}`}></div>
                                    <BrainIcon className={`w-20 h-20 relative z-10 transition-all duration-1000 ${analyzing ? 'text-purple-400 animate-pulse' : 'text-slate-700'}`} />
                                </div>
                                
                                {analyzing ? (
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white font-cinzel animate-pulse">Diagnosing...</h3>
                                        <div className="flex flex-col gap-1 items-center text-xs font-mono text-purple-400/80">
                                            <span>ESTABLISHING SECURE TUNNEL</span>
                                            <span>SANITIZING PII PAYLOAD</span>
                                            <span>QUERYING LLM ENDPOINT</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-sm">
                                        <h3 className="text-xl font-bold text-white mb-2 font-cinzel">AI Ops Copilot</h3>
                                        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                                            Send sanitized logs to Gemini 1.5 Flash to automatically identify the root cause and generate a YAML patch.
                                        </p>
                                        <button 
                                            onClick={runAnalysis}
                                            className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-purple-600 font-lg rounded-lg hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:ring-offset-slate-900"
                                        >
                                            <ShieldIcon className="w-5 h-5 mr-2" />
                                            Analyze Pod
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
                                <div className="bg-purple-950/30 border border-purple-500/20 p-5 rounded-xl relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-purple-700"></div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-purple-300 font-bold text-lg flex items-center gap-2">
                                            <BrainIcon className="w-5 h-5" />
                                            Diagnosis
                                        </h3>
                                        <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">CONFIDENCE: {result.confidence}%</span>
                                    </div>
                                    <p className="text-white text-lg font-medium mb-2 font-cinzel">{result.rootCause}</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">{result.explanation}</p>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Remediation Strategy</h3>
                                    <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col">
                                        <p className="text-slate-300 mb-5 text-sm border-b border-slate-800 pb-4">{result.suggestedFixDescription}</p>
                                        
                                        {/* Resource Tuning Inputs */}
                                        <div className="flex items-center gap-4 mb-4 bg-black/40 p-3 rounded-lg border border-slate-800">
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">CPU Limit</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={cpuLimit}
                                                        onChange={(e) => handleResourceUpdate('cpu', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-blue-400 font-mono focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Memory Limit</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={memLimit}
                                                        onChange={(e) => handleResourceUpdate('memory', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-blue-400 font-mono focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative group flex-1 min-h-[100px]">
                                            <div className="absolute top-0 right-0 bg-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded-bl border-b border-l border-slate-700 font-mono">patch.yaml</div>
                                            <pre className="bg-black h-full p-4 rounded-lg border border-slate-800 text-xs text-emerald-400 overflow-x-auto font-mono">
                                                {result.fixedYaml}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {applying ? (
                                        <>
                                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                            Applying Patch to Cluster...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            Approve & Execute Fix
                                        </>
                                    )}
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
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full overflow-hidden relative flex flex-col max-h-[90vh] shadow-2xl shadow-black">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-900/20 rounded-xl text-blue-400 border border-blue-500/20">
                        <ShieldIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white font-cinzel">Compliance Audit Log</h2>
                        <p className="text-xs text-slate-500">Immutable Ledger of AI Interactions (SOC2 Compliant)</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-[10px] uppercase font-bold bg-slate-950 text-slate-500 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 border-b border-slate-800">Timestamp</th>
                            <th className="px-6 py-4 border-b border-slate-800">Action</th>
                            <th className="px-6 py-4 border-b border-slate-800">User</th>
                            <th className="px-6 py-4 border-b border-slate-800">Hash</th>
                            <th className="px-6 py-4 border-b border-slate-800">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.timestamp.toLocaleTimeString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                        log.action === 'PATCH_APPLIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        log.action === 'ANALYSIS_REQUEST' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                        {log.action.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300">{log.user}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-[120px]">{log.complianceHash}</td>
                                <td className="px-6 py-4 text-slate-400">{log.details}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">No audit records found. Initiate an action to generate logs.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-[10px] text-slate-600 flex justify-between items-center font-mono">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Data Residency: US-East (N. Virginia)</span>
                <span>REF: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
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
        <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-300 font-sans selection:bg-blue-500/30">
            
            {/* Top Navigation */}
            <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-lg shadow-black/20">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                        <ServerIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-3 font-cinzel">
                            KUBE-GUARDIAN 
                            <span className="text-[10px] uppercase font-sans font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-lg shadow-blue-900/50 tracking-wider">Enterprise</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">Privacy-First SRE Copilot</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setShowOnboarding(true)}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Cluster
                    </button>
                    <div className="h-6 w-px bg-slate-800 mx-2"></div>
                    <button 
                        onClick={() => setShowAudit(true)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                        <ShieldIcon className="w-4 h-4 text-emerald-500" />
                        Audit Logs
                    </button>

                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                             <span className="text-xs font-mono font-bold text-slate-300">{healthyCount}</span>
                        </div>
                        <span className="text-slate-700">/</span>
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-ping' : 'bg-slate-600'}`}></div>
                             <span className="text-xs font-mono font-bold text-slate-300">{errorCount}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSecurityConfig(prev => ({ ...prev, requireHumanApproval: !prev.requireHumanApproval }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                            securityConfig.requireHumanApproval 
                            ? 'bg-blue-900/10 text-blue-400 border-blue-500/30 hover:bg-blue-900/20' 
                            : 'bg-amber-900/10 text-amber-400 border-amber-500/30 hover:bg-amber-900/20'
                        }`}
                    >
                        <LockIcon className="w-3 h-3" />
                        {securityConfig.requireHumanApproval ? 'APPROVAL: ON' : 'APPROVAL: OFF'}
                    </button>

                    <button 
                        onClick={() => setAutoChaos(!autoChaos)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border shadow-lg ${
                            autoChaos ? 'bg-rose-900/20 text-rose-400 border-rose-500/50 shadow-rose-900/20 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {autoChaos ? 'STOP CHAOS' : 'SIMULATE CHAOS'}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-8 max-w-[1600px] mx-auto space-y-8">
                
                {/* Cluster Grid */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4" />
                            Active Workloads
                        </h2>
                        <div className="flex gap-6 text-xs text-slate-500 font-mono font-medium">
                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>AWS: us-east-1</span>
                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>GCP: us-central1</span>
                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>Azure: eastus2</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
