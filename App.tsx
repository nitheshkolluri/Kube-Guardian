import React, { useState, useEffect, useRef } from 'react';
import { Pod, ClusterEvent, AnalysisResult, PodStatus, SecurityConfig, ChatMessage } from './types';
import { generateInitialPods, injectFailure, applyFixToPod } from './services/kubernetesService';
import { analyzePodFailure, sanitizeLogs, chatWithAgent } from './services/geminiService';
import { 
    CubeIcon, TerminalIcon, ActivityIcon, ServerIcon, BrainIcon, 
    AlertTriangleIcon, CheckCircleIcon, ShieldIcon, LockIcon, FileDiffIcon,
    PlusIcon, AWSIcon, AzureIcon, GCPIcon, CopyIcon, XIcon
} from './components/icons';

// --- STYLES & ANIMATIONS ---
const styles = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob {
    animation: blob 10s infinite alternate;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  .glass-panel {
    background: rgba(15, 23, 42, 0.7); /* Slate-900 with opacity */
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }
  .glass-card {
    background: rgba(30, 41, 59, 0.4); /* Slate-800 */
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-card:hover {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(99, 102, 241, 0.4); /* Indigo-500 */
    box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.25);
    transform: translateY(-4px);
  }
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    display: flex;
    animation: marquee 40s linear infinite; 
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  /* Cyber Blue Gradient */
  .text-gradient-cyber {
    background: linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #2dd4bf 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

// --- SHARED COMPONENTS ---

const StatusBadge: React.FC<{ status: PodStatus }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Running': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'CrashLoopBackOff': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        'OOMKilled': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        'ImagePullBackOff': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Error': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['Error']} backdrop-blur-sm whitespace-nowrap`}>
            {status}
        </span>
    );
};

// --- APP DASHBOARD COMPONENTS ---

const PodCard: React.FC<{ pod: Pod; onClick: () => void; isSelected: boolean }> = ({ pod, onClick, isSelected }) => {
    const isHealthy = pod.status === 'Running';
    return (
        <div 
            onClick={onClick}
            className={`
                group relative p-4 md:p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                ${isSelected 
                    ? 'border-indigo-500/50 bg-indigo-900/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' 
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-lg hover:-translate-y-1'
                }
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/50 border border-slate-800 px-1.5 py-0.5 rounded uppercase tracking-widest">{pod.cloudProvider}</span>
                 {!isHealthy && (
                   <div className="animate-pulse"><AlertTriangleIcon className="w-4 h-4 text-rose-500" /></div>
                )}
            </div>
            
            <div className="flex items-center mb-4 mt-1">
                <div className={`p-2 rounded-lg mr-3 shadow-inner ${isHealthy ? 'bg-emerald-900/20 text-emerald-500' : 'bg-rose-900/20 text-rose-500'}`}>
                    <CubeIcon className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-200 truncate text-sm font-cinzel tracking-wide" title={pod.name}>{pod.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{pod.namespace}</p>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                    <div className="bg-slate-950/50 rounded px-2 py-1.5 border border-slate-800/50 flex justify-between items-center">
                        <span className="text-[10px] uppercase text-slate-600 font-bold">CPU</span>
                        <span className={parseInt(pod.cpuUsage) > 800 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{pod.cpuUsage}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded px-2 py-1.5 border border-slate-800/50 flex justify-between items-center">
                         <span className="text-[10px] uppercase text-slate-600 font-bold">MEM</span>
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
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl h-48 md:h-56 flex flex-col font-mono text-xs shadow-xl">
            <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center text-slate-400">
                <TerminalIcon className="w-4 h-4 mr-2 text-indigo-400" />
                <span className="uppercase tracking-wider font-bold text-[10px]">System Events Stream</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {events.map(e => (
                    <div key={e.id} className="flex gap-3 opacity-80 hover:opacity-100 group transition-opacity">
                        <span className="text-slate-600 whitespace-nowrap">[{e.timestamp.toLocaleTimeString()}]</span>
                        <div className="flex-1 break-words">
                            <span className={e.type === 'Warning' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{e.type.toUpperCase()}:</span>{' '}
                            <span className="text-slate-300">{e.message}</span>
                            <span className="text-slate-600 ml-2 group-hover:text-indigo-400 transition-colors cursor-pointer">({e.object})</span>
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="text-slate-600 italic text-center mt-10">No events captured. Cluster is stable.</div>
                )}
            </div>
        </div>
    );
};

const AnalysisPanel: React.FC<{ 
    pod: Pod; 
    onClose: () => void; 
    onApplyFix: (fix: string) => Promise<void>;
    securityConfig: SecurityConfig;
}> = ({ pod, onClose, onApplyFix, securityConfig }) => {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);
    const [cpuLimit, setCpuLimit] = useState("500m");
    const [memLimit, setMemLimit] = useState("256Mi");

    useEffect(() => {
        runAnalysis();
    }, [pod]);

    useEffect(() => {
        if (result && result.fixedYaml) {
            let updatedYaml = result.fixedYaml;
            updatedYaml = updatedYaml.replace(/cpu:\s*"?[0-9]+m"?(?=\s|$)/g, `cpu: "${cpuLimit}"`);
            updatedYaml = updatedYaml.replace(/memory:\s*"?[0-9]+[GMK]i"?(?=\s|$)/g, `memory: "${memLimit}"`);
            
            if (updatedYaml !== result.fixedYaml) {
                setResult(prev => prev ? ({ ...prev, fixedYaml: updatedYaml }) : null);
            }
        }
    }, [cpuLimit, memLimit]);

    const runAnalysis = async () => {
        setAnalyzing(true);
        setError(null);
        try {
            await new Promise(r => setTimeout(r, 1000));
            const logs = pod.logs.join('\n');
            const res = await analyzePodFailure(pod, logs);
            setResult(res);
            
            const cpuMatch = res.fixedYaml.match(/cpu:\s*"?([0-9]+m)"?/);
            if (cpuMatch) setCpuLimit(cpuMatch[1]);
            const memMatch = res.fixedYaml.match(/memory:\s*"?([0-9]+[GMK]i)"?/);
            if (memMatch) setMemLimit(memMatch[1]);

        } catch (e: any) {
            console.error("Analysis failed:", e);
            let msg = "Failed to communicate with AI Agent.";
            if (e.message?.includes("API_KEY")) msg = "Configuration Error: Missing Google Gemini API Key.";
            else if (e.message?.includes("429")) msg = "Rate Limit Exceeded. Please try again later.";
            else if (e.message?.includes("JSON")) msg = "AI Response Parsing Error. The model returned invalid JSON.";
            setError(msg);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApply = async () => {
        if (!result) return;
        setApplying(true);
        try {
            await onApplyFix(result.fixedYaml);
            onClose();
        } catch (e) {
            setError("Failed to apply patch to cluster. Please check Kubernetes connectivity.");
            setApplying(false);
        }
    };

    const copyToClipboard = () => {
        if (result?.fixedYaml) {
            navigator.clipboard.writeText(result.fixedYaml);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-[#020617] w-full h-full md:h-auto md:w-[95%] max-w-6xl md:rounded-2xl border-none md:border md:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <BrainIcon className="w-6 h-6 text-indigo-500 animate-pulse" />
                        <div>
                            <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">AI Root Cause Analysis</h2>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                <span>TARGET: {pod.name}</span>
                                <span className="text-slate-700">|</span>
                                <span className={securityConfig.requireHumanApproval ? "text-amber-500" : "text-emerald-500"}>
                                    MODE: {securityConfig.requireHumanApproval ? "HUMAN VERIFY" : "AUTO-PILOT"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <XIcon className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                    <div className="lg:col-span-2 p-4 md:p-6 bg-slate-900/20 flex flex-col gap-4">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                <ActivityIcon className="w-4 h-4" /> Live Logs (Redacted)
                            </div>
                            <div className="font-mono text-[10px] md:text-xs text-slate-300 space-y-1 h-48 md:h-64 overflow-y-auto p-2">
                                {sanitizeLogs(pod.logs.join('\n')).split('\n').map((line, i) => (
                                    <div key={i} className="break-all border-l-2 border-transparent hover:border-indigo-500 pl-2 py-0.5 hover:bg-white/5 transition-colors">
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                <FileDiffIcon className="w-4 h-4" /> Current Config
                            </div>
                            <pre className="font-mono text-[10px] text-slate-500 overflow-x-auto whitespace-pre-wrap">
                                {pod.manifest}
                            </pre>
                        </div>
                    </div>

                    <div className="lg:col-span-3 p-4 md:p-6 flex flex-col relative">
                        {analyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BrainIcon className="w-6 h-6 text-indigo-500/50" />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-cinzel text-lg text-slate-300">Analyzing Telemetry...</p>
                                    <p className="text-xs font-mono">Comparing against 10M+ failure patterns</p>
                                </div>
                            </div>
                        ) : error ? (
                             <div className="flex-1 flex flex-col items-center justify-center text-rose-500 gap-4">
                                <AlertTriangleIcon className="w-16 h-16 opacity-50" />
                                <div className="text-center">
                                    <h3 className="text-xl font-bold font-cinzel mb-2">Analysis Aborted</h3>
                                    <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
                                </div>
                                <button onClick={runAnalysis} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white font-mono text-xs mt-4 transition-colors">
                                    RETRY DIAGNOSTICS
                                </button>
                            </div>
                        ) : result ? (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 font-cinzel flex items-center gap-2">
                                        <span className="text-rose-500">ROOT CAUSE:</span> {result.rootCause}
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{result.explanation}</p>
                                </div>

                                <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-indigo-400 text-sm uppercase tracking-wider flex items-center gap-2">
                                            <ShieldIcon className="w-4 h-4" /> Recommended Remediation
                                        </h4>
                                        <div className="flex items-center gap-2 bg-indigo-950 rounded px-2 py-1">
                                            <span className="text-[10px] text-indigo-300 font-mono">CONFIDENCE</span>
                                            <span className="text-xs font-bold text-white">{result.confidence}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPU Limit</label>
                                            <input 
                                                type="text" 
                                                value={cpuLimit} 
                                                onChange={(e) => setCpuLimit(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mem Limit</label>
                                            <input 
                                                type="text" 
                                                value={memLimit} 
                                                onChange={(e) => setMemLimit(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <pre className="bg-[#0f172a] p-3 rounded border border-indigo-500/20 text-indigo-100 font-mono text-xs overflow-x-auto">
                                            {result.fixedYaml}
                                        </pre>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Copy YAML"
                                        >
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleApply}
                                    disabled={applying}
                                    className={`w-full py-4 rounded-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2
                                        ${applying 
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                                        }`}
                                >
                                    {applying ? (
                                        <>Applying Fix via Kubernetes API...</>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            {securityConfig.requireHumanApproval ? "Approve & Apply Patch" : "Auto-Remediate"}
                                        </>
                                    )}
                                </button>
                                {securityConfig.requireHumanApproval && (
                                    <p className="text-[10px] text-center text-slate-500">
                                        <LockIcon className="w-3 h-3 inline mr-1" />
                                        Signed with Audit Key: {Math.random().toString(36).substring(7).toUpperCase()}
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OnboardingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 w-full h-full md:h-auto md:w-[600px] md:rounded-2xl border-none md:border md:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="text-xl font-cinzel font-bold text-white">Connect Cluster</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded transition-colors"><XIcon className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="flex gap-4 justify-center">
                    <button className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500 transition-all group">
                        <AWSIcon className="w-8 h-8 text-slate-400 group-hover:text-[#FF9900]" />
                    </button>
                    <button className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500 transition-all group">
                        <AzureIcon className="w-8 h-8 text-slate-400 group-hover:text-[#0089D6]" />
                    </button>
                    <button className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500 transition-all group">
                        <GCPIcon className="w-8 h-8 text-slate-400 group-hover:text-[#4285F4]" />
                    </button>
                </div>
                
                <div className="text-center">
                    <p className="text-sm text-slate-400 mb-2">Install the Kube-Guardian Agent via Helm</p>
                    <div className="bg-black/50 p-3 rounded-lg border border-slate-700 font-mono text-xs text-emerald-400 relative group">
                        helm install kube-guardian oci://registry.kube-guardian.io/charts/agent --set apiKey=$API_KEY
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-slate-800 p-1 rounded cursor-pointer">
                            <CopyIcon className="w-3 h-3 text-white" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <ShieldIcon className="w-6 h-6 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-200">
                        PII Redaction is enabled by default on the agent. No sensitive data will leave your cluster environment.
                    </p>
                </div>
            </div>
            <div className="p-5 border-t border-slate-800 bg-slate-800/50 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-sm">
                    Simulate Connection
                </button>
            </div>
        </div>
    </div>
);

// --- CHAT WIDGET 2.0 ---
const ChatWidget: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hello! I am your Guardian Assistant. Ask me about our Professional plan or how the AI redaction works!', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);

        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const responseText = await chatWithAgent(history, userMsg.text);
        
        const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
        setMessages(prev => [...prev, modelMsg]);
        setTyping(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {open && (
                <div className="mb-4 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 transform origin-bottom-right">
                    <div className="p-4 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 border-b border-white/10 flex justify-between items-center">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                 <BrainIcon className="w-5 h-5 text-white" />
                             </div>
                             <div>
                                 <span className="font-bold text-white text-sm block">Guardian Assistant</span>
                                 <span className="text-[10px] text-indigo-100 flex items-center gap-1">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                                 </span>
                             </div>
                         </div>
                         <button onClick={() => setOpen(false)}><XIcon className="w-5 h-5 text-indigo-100 hover:text-white transition-colors" /></button>
                    </div>
                    
                    <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-900/60">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 text-sm shadow-sm ${
                                    m.role === 'user' 
                                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-none' 
                                        : 'glass-panel text-slate-200 rounded-2xl rounded-bl-none border border-white/10 bg-slate-800/80'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="flex justify-start">
                                <div className="glass-panel rounded-2xl rounded-bl-none px-4 py-2.5 flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animation-delay-200"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animation-delay-400"></span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <form onSubmit={handleSend} className="p-3 bg-slate-900/80 border-t border-white/10 flex gap-2">
                        <input 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-500 transition-all"
                        />
                        <button type="submit" className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30">
                            <TerminalIcon className="w-4 h-4 text-white" />
                        </button>
                    </form>
                </div>
            )}
            <button 
                onClick={() => setOpen(!open)}
                className="group relative flex items-center justify-center"
            >
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 duration-1000"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center justify-center transition-all transform hover:scale-105 border border-white/20">
                    {open ? <XIcon className="w-6 h-6 text-white" /> : <BrainIcon className="w-6 h-6 text-white group-hover:animate-pulse" />}
                </div>
            </button>
        </div>
    );
}

// --- LANDING PAGE COMPONENT ---

const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
    
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
            <style>{styles}</style>
            
            {/* Background Atmosphere - Indigo/Cyan/Purple Theme */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-[600px] h-[600px] bg-cyan-600/10 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed w-full z-40 glass-panel border-b-0 border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                             <ShieldIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="font-cinzel font-bold text-xl tracking-wider text-white drop-shadow-md">
                            Kube-Guardian
                        </h1>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <button onClick={() => scrollToSection('features')} className="hover:text-white hover:scale-105 transition-all">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white hover:scale-105 transition-all">How it Works</button>
                        <button onClick={() => scrollToSection('pricing')} className="hover:text-white hover:scale-105 transition-all">Pricing</button>
                    </div>
                    <button 
                        onClick={onLaunch}
                        className="px-6 py-2.5 bg-white text-indigo-950 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-0.5 border border-white/50"
                    >
                        Launch Console
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-indigo-500/20 text-xs font-mono text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform cursor-default shadow-lg shadow-indigo-500/5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        v2.5 Live: Automated Remediation Engine
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-cinzel font-bold text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 drop-shadow-2xl">
                        Autonomous <span className="text-gradient-cyber">Kubernetes</span><br />
                        Reliability Engineering
                    </h1>
                    
                    <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light">
                        Sleep through the pager alerts. Our AI agent detects issues, sanitizes logs, and patches your pods automatically with surgical precision.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <button onClick={onLaunch} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.4)] transform hover:-translate-y-1">
                            Start Live Simulation <TerminalIcon className="w-5 h-5" />
                        </button>
                        <a href="https://github.com/nitheshkolluri/kube-guardian" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 glass-panel text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                            View Source <CopyIcon className="w-5 h-5" />
                        </a>
                    </div>

                    {/* Fortune 500 Trust Bar */}
                    <div className="mt-24 pt-10 border-t border-white/5">
                        <p className="text-sm text-slate-500 font-mono mb-8 uppercase tracking-widest opacity-70">Trusted by Engineering Teams At</p>
                        <div className="relative flex overflow-x-hidden group">
                            <div className="animate-marquee whitespace-nowrap flex gap-16 items-center opacity-50 hover:opacity-100 transition-opacity duration-700">
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><ServerIcon className="w-6 h-6"/> ACME CORP</span>
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><ShieldIcon className="w-6 h-6"/> GLOBAL BANK</span>
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><CubeIcon className="w-6 h-6"/> TECH GIANT</span>
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><ActivityIcon className="w-6 h-6"/> INNOVATE LTD</span>
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><LockIcon className="w-6 h-6"/> SECURE NET</span>
                                {/* Duplicate for marquee effect */}
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><ServerIcon className="w-6 h-6"/> ACME CORP</span>
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><ShieldIcon className="w-6 h-6"/> GLOBAL BANK</span>
                                <span className="text-xl font-bold font-cinzel text-slate-400 flex items-center gap-2"><CubeIcon className="w-6 h-6"/> TECH GIANT</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Props Grid */}
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                         <h2 className="text-3xl font-cinzel font-bold text-white mb-4">Why Engineering Teams Choose Guardian</h2>
                         <p className="text-slate-400 font-light">We replace "guessing" with cryptographic certainty.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass-card p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 group cursor-default">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                <BrainIcon className="w-7 h-7 text-indigo-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 font-cinzel">Context-Aware AI</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                Standard monitoring tools tell you *what* broke. Guardian tells you *why*. It correlates resource limits, recent config changes, and log stack traces to pinpoint the exact line of code causing the crash.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="glass-card p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 group cursor-default">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                <ShieldIcon className="w-7 h-7 text-emerald-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 font-cinzel">Air-Gapped Privacy</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                We know your logs contain sensitive data. Our local Regex Engine executes inside your infrastructure (or browser), stripping PII, API Keys, and Customer IDs *before* the data ever touches the LLM API.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="glass-card p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 group cursor-default">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                <LockIcon className="w-7 h-7 text-amber-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 font-cinzel">Audit-Proof Logs</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                SOC2 Auditor friendly. Every action taken by the AI is logged to an immutable ledger, signed with a cryptographic hash, and requires explicit human verification by default.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

             {/* How it works */}
             <section id="how-it-works" className="py-24 px-6 relative z-10 bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-white mb-4">From Chaos to Stability</h2>
                        <p className="text-slate-400">The incident lifecycle, automated.</p>
                    </div>

                    <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl border border-white/5">
                         <div className="bg-white/5 border-b border-white/5 p-4 flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                             <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                             <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                         </div>
                         <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center">
                             <div className="space-y-10">
                                 <div className="flex gap-6 group">
                                     <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold shrink-0 border border-rose-500/30 group-hover:scale-110 transition-transform">1</div>
                                     <div>
                                         <h4 className="text-white font-bold text-lg mb-2">Detection</h4>
                                         <p className="text-sm text-slate-400">Agent watches Kubernetes event stream for `Warning` events.</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-6 group">
                                     <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold shrink-0 border border-indigo-500/30 group-hover:scale-110 transition-transform">2</div>
                                     <div>
                                         <h4 className="text-white font-bold text-lg mb-2">Reasoning</h4>
                                         <p className="text-sm text-slate-400">Gemini 2.5 Flash analyzes sanitized logs + YAML manifest.</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-6 group">
                                     <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30 group-hover:scale-110 transition-transform">3</div>
                                     <div>
                                         <h4 className="text-white font-bold text-lg mb-2">Resolution</h4>
                                         <p className="text-sm text-slate-400">Agent drafts a precise JSON Patch for the Deployment.</p>
                                     </div>
                                 </div>
                                 <button onClick={onLaunch} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-indigo-200 font-bold flex items-center gap-3 transition-all">
                                     Try the Interactive Demo <TerminalIcon className="w-4 h-4" />
                                 </button>
                             </div>
                             <div className="bg-[#020617] rounded-xl p-6 font-mono text-xs text-slate-300 border border-white/10 relative shadow-2xl transform hover:rotate-1 transition-transform duration-500">
                                 <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">PATCH READY</div>
                                 <p className="text-slate-500 mb-4 border-b border-white/5 pb-2"># Generated Patch for deployment/payment-service</p>
                                 <div className="space-y-1.5">
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">1</span> <span>apiVersion: apps/v1</span></p>
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">2</span> <span>kind: Deployment</span></p>
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">3</span> <span>spec:</span></p>
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">4</span> <span className="ml-2">template:</span></p>
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">5</span> <span className="ml-4">spec:</span></p>
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">6</span> <span className="ml-6">containers:</span></p>
                                    <p className="flex gap-4"><span className="text-slate-600 w-4">7</span> <span className="ml-6">- name: payment-service</span></p>
                                    <p className="flex gap-4 bg-rose-500/10 -mx-6 px-6"><span className="text-slate-600 w-4">8</span> <span className="text-rose-400 opacity-70 ml-8">-   limits: memory: "128Mi"</span></p>
                                    <p className="flex gap-4 bg-emerald-500/10 -mx-6 px-6"><span className="text-slate-600 w-4">9</span> <span className="text-emerald-400 ml-8">+   limits: memory: "512Mi"</span></p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
             </section>

             {/* Pricing Section */}
             <section id="pricing" className="py-24 px-6 border-t border-white/5 bg-slate-900/50 relative z-10">
                 <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-white mb-4">Pricing for Builders</h2>
                        <p className="text-slate-400">Fair prices. No hidden "Enterprise Tax".</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                         {/* Community */}
                         <div className="p-8 rounded-3xl glass-card flex flex-col hover:-translate-y-2 transition-transform duration-300">
                             <h3 className="text-xl font-bold text-white mb-2 font-cinzel">Community</h3>
                             <p className="text-slate-400 text-sm mb-6">Perfect for side projects & learning.</p>
                             <div className="text-4xl font-bold text-white mb-6">$0 <span className="text-sm font-normal text-slate-500">/ mo</span></div>
                             <ul className="space-y-4 mb-8 flex-1">
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> 1 Cluster License</li>
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> 24h Log Retention</li>
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> Standard Redaction</li>
                             </ul>
                             <button onClick={onLaunch} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all border border-white/5">Get Started Free</button>
                         </div>

                         {/* Professional */}
                         <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/40 to-slate-900 border border-indigo-500/50 flex flex-col relative transform md:-translate-y-6 shadow-2xl hover:-translate-y-8 transition-transform duration-300">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Most Popular</div>
                             <h3 className="text-xl font-bold text-white mb-2 font-cinzel">Professional</h3>
                             <p className="text-indigo-200 text-sm mb-6">For startups shipping to production.</p>
                             <div className="text-4xl font-bold text-white mb-6">$49 <span className="text-sm font-normal text-slate-500">/ mo</span></div>
                             <ul className="space-y-4 mb-8 flex-1">
                                 <li className="flex items-center gap-3 text-sm text-white"><CheckCircleIcon className="w-5 h-5 text-indigo-400" /> Up to 10 Clusters</li>
                                 <li className="flex items-center gap-3 text-sm text-white"><CheckCircleIcon className="w-5 h-5 text-indigo-400" /> 30 Day History</li>
                                 <li className="flex items-center gap-3 text-sm text-white"><CheckCircleIcon className="w-5 h-5 text-indigo-400" /> Custom Redaction Rules</li>
                                 <li className="flex items-center gap-3 text-sm text-white"><CheckCircleIcon className="w-5 h-5 text-indigo-400" /> Slack & Teams Alerts</li>
                             </ul>
                             <button onClick={onLaunch} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">Start 14-Day Trial</button>
                         </div>

                         {/* Enterprise */}
                         <div className="p-8 rounded-3xl glass-card flex flex-col hover:-translate-y-2 transition-transform duration-300">
                             <h3 className="text-xl font-bold text-white mb-2 font-cinzel">Enterprise</h3>
                             <p className="text-slate-400 text-sm mb-6">For regulated industries & scale.</p>
                             <div className="text-4xl font-bold text-white mb-6">Custom</div>
                             <ul className="space-y-4 mb-8 flex-1">
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> Unlimited Clusters</li>
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> Self-Hosted LLM (On-Prem)</li>
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> SSO / SAML Enforcement</li>
                                 <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /> Dedicated Support Engineer</li>
                             </ul>
                             <button onClick={onLaunch} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all border border-white/5">Contact Sales</button>
                         </div>
                    </div>
                 </div>
             </section>

             {/* Footer with Prototype Data */}
             <footer className="py-16 border-t border-white/5 bg-[#020617] relative z-10">
                 <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
                     <div className="space-y-6">
                         <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                 <ShieldIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-cinzel font-bold text-white text-lg">Kube-Guardian</span>
                         </div>
                         <p className="text-slate-400 text-sm leading-relaxed">
                             Empowering DevOps teams with AI-driven reliability. Built for the cloud-native era with privacy at its core.
                         </p>
                         <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><span className="text-xs font-bold">in</span></div>
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><span className="text-xs font-bold">𝕏</span></div>
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><span className="text-xs font-bold">G</span></div>
                         </div>
                     </div>
                     
                     <div>
                         <h4 className="font-bold text-white mb-6 font-cinzel">Product</h4>
                         <ul className="space-y-4 text-sm text-slate-400">
                             <li className="hover:text-white cursor-pointer transition-colors">Features</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Integrations</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Pricing</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Changelog</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Docs</li>
                         </ul>
                     </div>
                     
                     <div>
                         <h4 className="font-bold text-white mb-6 font-cinzel">Company</h4>
                         <ul className="space-y-4 text-sm text-slate-400">
                             <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                             <li className="hover:text-white cursor-pointer transition-colors">Partners</li>
                         </ul>
                     </div>

                     <div>
                         <h4 className="font-bold text-white mb-6 font-cinzel">Contact Us</h4>
                         <ul className="space-y-4 text-sm text-slate-400">
                             <li className="flex items-start gap-3">
                                 <span className="text-indigo-400">📍</span>
                                 <span>123 Innovation Dr, Suite 400<br/>Tech City, CA 94000</span>
                             </li>
                             <li className="flex items-center gap-3">
                                 <span className="text-indigo-400">📧</span>
                                 <span>hello@kubeguardian.io</span>
                             </li>
                             <li className="flex items-center gap-3">
                                 <span className="text-indigo-400">📞</span>
                                 <span>+61 434712612</span>
                             </li>
                         </ul>
                     </div>
                 </div>
                 <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                     <p>© 2024 Kube-Guardian Inc. All rights reserved.</p>
                     <div className="flex gap-6 mt-4 md:mt-0">
                         <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                         <span className="hover:text-white cursor-pointer">Terms of Service</span>
                         <span className="hover:text-white cursor-pointer">Cookie Settings</span>
                     </div>
                 </div>
             </footer>
             <ChatWidget />
        </div>
    );
}


// --- MAIN APP ---

export default function App() {
    const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');

    // App State
    const [pods, setPods] = useState<Pod[]>([]);
    const [events, setEvents] = useState<ClusterEvent[]>([]);
    const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
    const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
        redactionLevel: 'STRICT',
        requireHumanApproval: true,
        auditLoggingEnabled: true,
        dataResidency: 'US'
    });
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showPods, setShowPods] = useState(true);

    useEffect(() => {
        setPods(generateInitialPods(8));
        document.title = "Kube-Guardian - Autonomous SRE";
    }, []);

    const handleChaosMonkey = () => {
        const { updatedPods, event } = injectFailure(pods);
        setPods(updatedPods);
        if (event) setEvents(prev => [...prev, event]);
    };

    const handleApplyFix = async (fixedYaml: string) => {
        if (!selectedPod) return;
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const updatedPods = applyFixToPod(pods, selectedPod.id, fixedYaml);
        setPods(updatedPods);
        
        const fixEvent: ClusterEvent = {
            id: Math.random().toString(),
            timestamp: new Date(),
            type: 'Normal',
            reason: 'Remediation',
            object: `pod/${selectedPod.name}`,
            message: `Applied automated patch: Resource limits updated.`
        };
        setEvents(prev => [...prev, fixEvent]);
        setSelectedPod(null);
    };

    // --- VIEW ROUTING ---

    if (viewMode === 'landing') {
        return <LandingPage onLaunch={() => setViewMode('app')} />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
            <style>{styles}</style>
            {/* Navigation */}
            <nav className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('landing')}>
                        <div className="p-1.5 bg-indigo-600 rounded">
                             <ShieldIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-cinzel font-bold text-lg md:text-xl tracking-wider text-white hidden md:block">
                            Kube-Guardian <span className="text-indigo-400 text-[10px] align-top">V2.5</span>
                        </h1>
                        <h1 className="font-cinzel font-bold text-lg text-white md:hidden">Kube-G</h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2">
                        <button 
                            onClick={() => setShowPods(!showPods)}
                            className={`p-2 rounded-lg border flex items-center gap-2 whitespace-nowrap transition-all text-xs font-bold
                                ${showPods 
                                    ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-300' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                        >
                            <CubeIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Workloads</span>
                        </button>

                         <button 
                            onClick={() => setSecurityConfig(prev => ({ ...prev, requireHumanApproval: !prev.requireHumanApproval }))}
                            className={`p-2 rounded-lg border flex items-center gap-2 whitespace-nowrap transition-all text-xs font-bold
                                ${securityConfig.requireHumanApproval 
                                    ? 'bg-amber-900/20 border-amber-500/50 text-amber-300' 
                                    : 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300'}`}
                        >
                            {securityConfig.requireHumanApproval ? <LockIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                            <span className="hidden sm:inline">{securityConfig.requireHumanApproval ? "Human Verify" : "Auto-Pilot"}</span>
                        </button>

                        <button 
                            onClick={handleChaosMonkey}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-600/30 rounded-lg transition-all text-xs font-bold whitespace-nowrap"
                        >
                            <AlertTriangleIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Chaos</span>
                        </button>
                        
                        <button 
                            onClick={() => setShowOnboarding(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 text-xs font-bold whitespace-nowrap"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Connect</span>
                        </button>

                        <button 
                            onClick={() => setViewMode('landing')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all text-xs font-bold whitespace-nowrap ml-2"
                        >
                            <XIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Exit Demo</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto p-3 md:p-6 space-y-6">
                
                {/* Live Infrastructure CTA */}
                <div className="bg-gradient-to-r from-indigo-900/30 to-slate-900 border border-indigo-500/20 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-300">
                            <ServerIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white mb-1">Live Cluster Integration</h2>
                            <p className="text-sm text-slate-400 max-w-lg">
                                Ready to deploy the Guardian Agent? Connect your AWS EKS, Azure AKS, or GCP GKE clusters securely.
                            </p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setShowOnboarding(true)}
                        className="w-full md:w-auto px-6 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg z-10 whitespace-nowrap"
                     >
                        Connect Infrastructure
                     </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Pod Grid */}
                    {showPods && (
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ServerIcon className="w-4 h-4" />
                                    Active Workloads
                                </h2>
                                <span className="text-xs text-slate-600 font-mono">
                                    {pods.filter(p => p.status === 'Running').length} / {pods.length} HEALTHY
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {pods.map(pod => (
                                    <PodCard 
                                        key={pod.id} 
                                        pod={pod} 
                                        isSelected={false}
                                        onClick={() => setSelectedPod(pod)} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Event Stream Sidebar */}
                    <div className={showPods ? "lg:col-span-1" : "lg:col-span-4"}>
                        <div className="sticky top-20">
                             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <ActivityIcon className="w-4 h-4" />
                                Telemetry
                            </h2>
                            <EventStream events={events} />
                            
                            <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Security Posture</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">PII Redaction</span>
                                        <span className="text-teal-400 font-mono font-bold">ACTIVE</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Audit Log</span>
                                        <span className="text-teal-400 font-mono font-bold">ENABLED</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Approval Mode</span>
                                        <span className={`font-mono font-bold ${securityConfig.requireHumanApproval ? 'text-amber-400' : 'text-indigo-400'}`}>
                                            {securityConfig.requireHumanApproval ? 'MANUAL' : 'AUTO'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {selectedPod && (
                <AnalysisPanel 
                    pod={selectedPod} 
                    onClose={() => setSelectedPod(null)} 
                    onApplyFix={handleApplyFix}
                    securityConfig={securityConfig}
                />
            )}

            {showOnboarding && (
                <OnboardingModal onClose={() => setShowOnboarding(false)} />
            )}
            
            {/* Chat Widget only in Dashboard for help */}
            <ChatWidget />
        </div>
    );
}