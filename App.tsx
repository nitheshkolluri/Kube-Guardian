
import React, { useState, useEffect, useRef } from 'react';
import { Pod, ClusterEvent, AnalysisResult, PodStatus, ChatMessage } from './types';
import { generateInitialPods, injectFailure, applyFixToPod, fetchClusterHeartbeat, fetchRealPodLogs, generateMockEvents, generateNetworkTopology } from './services/kubernetesService';
import { analyzePodFailure, sanitizeLogs, chatWithAgent } from './services/geminiService';
import { 
    CubeIcon, TerminalIcon, ActivityIcon, ServerIcon, BrainIcon, 
    AlertTriangleIcon, CheckCircleIcon, ShieldIcon, LockIcon, 
    PlusIcon, AWSIcon, AzureIcon, GCPIcon, CopyIcon, XIcon,
    NorthwindIcon, LuminaIcon, HyperNovaIcon, ApexIcon, BlueOrbitIcon,
    GlobeIcon, CpuIcon, LayoutIcon, SettingsIcon,
    TwitterIcon, GithubIcon, LinkedinIcon, UsersIcon, ShareIcon,
    LogOutIcon, ArrowLeftIcon
} from './components/icons';

// --- ANIMATIONS & STYLES ---
const styles = `
  @keyframes scan {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.5; }
    100% { top: 100%; opacity: 0; }
  }
  .animate-scan {
    animation: scan 4s linear infinite;
  }
  .glass-panel {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .glass-card {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-card:hover {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 0 0 40px rgba(6, 182, 212, 0.15);
    transform: translateY(-5px) scale(1.01);
  }
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    display: flex;
    animation: marquee 40s linear infinite; 
  }
  .text-glow {
    text-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(71, 85, 105, 0.5);
    border-radius: 3px;
  }
  .fade-in-section {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    will-change: opacity, transform;
  }
  .fade-in-section.is-visible {
    opacity: 1;
    transform: none;
  }
  .grid-bg {
    background-size: 50px 50px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }
`;

// --- HOOKS ---

const useScrollReveal = () => {
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
};

// --- HELPER COMPONENTS ---

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
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['Error']} backdrop-blur-sm whitespace-nowrap`}>
            {status}
        </span>
    );
};

// --- INFO PAGES (Content) ---

const PageLayout: React.FC<{ title: string; children: React.ReactNode; onBack: () => void }> = ({ title, children, onBack }) => (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden flex flex-col">
        <style>{styles}</style>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.1),transparent_40%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

        <nav className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center px-8 sticky top-0 z-50">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-5 h-5" /> Back
            </button>
            <div className="ml-auto font-cinzel font-bold text-xl text-white tracking-wider">KubeGuardian</div>
        </nav>

        <div className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-12 font-cinzel text-glow border-l-4 border-cyan-500 pl-6">
                {title}
            </h1>
            {children}
        </div>
    </div>
);

const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <PageLayout title="Our Mission" onBack={onBack}>
        <div className="space-y-8 text-lg text-slate-400 leading-relaxed">
            <p>
                At <span className="text-cyan-400 font-bold">KubeGuardian</span>, we believe that infrastructure should be invisible. 
                Founded by former Site Reliability Engineers from Fortune 500 cloud providers, our goal is to eliminate 
                "pager fatigue" through autonomous intelligence.
            </p>
            <p>
                Traditional monitoring tools are passive; they watch your systems fail and send you an alert. 
                <span className="text-white font-bold"> Guardian is active.</span> It anticipates failure, analyzes root causes using state-of-the-art LLMs, 
                and proposes remediation strategies before your customers even notice a glitch.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                    { label: 'Uptime Protected', val: '99.999%' },
                    { label: 'Incidents Resolved', val: '14,000+' },
                    { label: 'Enterprise Clients', val: '500+' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center">
                        <div className="text-3xl font-bold text-white mb-2">{stat.val}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    </PageLayout>
);

const ContactPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <PageLayout title="Contact Support" onBack={onBack}>
        <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
                <p className="text-slate-400">
                    Our team of reliability engineers is distributed across 3 continents to provide 24/7 coverage.
                    For enterprise inquiries, please reach out directly to our dedicated channel.
                </p>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyan-900/20 rounded-lg text-cyan-400"><GlobeIcon className="w-6 h-6"/></div>
                        <div>
                            <h3 className="font-bold text-white">Global HQ</h3>
                            <p className="text-slate-500 text-sm">Level 42, 120 Collins Street<br/>Melbourne, VIC 3000<br/>Australia</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyan-900/20 rounded-lg text-cyan-400"><TerminalIcon className="w-6 h-6"/></div>
                        <div>
                            <h3 className="font-bold text-white">Email & Sales</h3>
                            <p className="text-slate-500 text-sm">enterprise@kubeguardian.fictional<br/>support@kubeguardian.fictional</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs">
                    <span className="font-bold">Disclaimer:</span> This is a demonstration application. The contact details above are fictional placeholders for the UI design.
                </div>
            </div>
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-white mb-6">Send us a message</h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Work Email</label>
                        <input className="w-full bg-black border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none" placeholder="you@company.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Inquiry</label>
                        <textarea className="w-full h-32 bg-black border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none resize-none" placeholder="How can we help your infrastructure?" />
                    </div>
                    <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">
                        Submit Ticket
                    </button>
                </form>
            </div>
        </div>
    </PageLayout>
);

const BlogPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <PageLayout title="Engineering Blog" onBack={onBack}>
        <div className="grid gap-8">
            {[
                { title: "The Day the Pods Stood Still: Anatomy of a CrashLoop", date: "Oct 12, 2024", tag: "Post-Mortem" },
                { title: "Zero Trust Architecture in Multi-Cloud Environments", date: "Sep 28, 2024", tag: "Security" },
                { title: "Why We Switched from Prometheus to Neural Networks", date: "Sep 15, 2024", tag: "AI/ML" },
                { title: "Optimizing Cost with Spot Instances and Guardian Auto-Scaler", date: "Aug 02, 2024", tag: "CostOps" }
            ].map((post, i) => (
                <div key={i} className="group cursor-pointer p-6 bg-slate-900/30 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all hover:bg-slate-900/50">
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 rounded-full bg-cyan-900/20 text-cyan-400 text-xs font-bold border border-cyan-500/20">{post.tag}</span>
                        <span className="text-xs text-slate-500 font-mono">{post.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{post.title}</h3>
                    <p className="text-slate-400 text-sm">Read the full technical breakdown on how KubeGuardian's engineering team tackles these complex challenges...</p>
                </div>
            ))}
        </div>
    </PageLayout>
);

const ApiDocsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <PageLayout title="API Reference" onBack={onBack}>
        <div className="space-y-8">
            <p className="text-slate-400">
                Integrate Guardian's intelligence directly into your CI/CD pipelines. All endpoints require a valid Bearer token generated from the Enterprise Console.
            </p>
            
            <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">POST</span>
                            <span className="font-mono text-sm text-white">/v1/analyze</span>
                        </div>
                        <span className="text-xs text-slate-500">Root Cause Analysis</span>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-400">Submit pod logs and manifest for instant AI diagnosis.</p>
                        <div className="font-mono text-xs text-blue-300 bg-black p-4 rounded-lg border border-slate-800 overflow-x-auto">
{`curl -X POST https://api.kubeguardian.fictional/v1/analyze \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "podName": "frontend-x92",
    "logs": "Error: connection refused...",
    "manifest": "..."
  }'`}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">GET</span>
                            <span className="font-mono text-sm text-white">/v1/health</span>
                        </div>
                        <span className="text-xs text-slate-500">System Status</span>
                    </div>
                    <div className="p-6">
                         <div className="font-mono text-xs text-blue-300 bg-black p-4 rounded-lg border border-slate-800">
{`{
  "status": "healthy",
  "version": "2.5.0",
  "agent_connected": true
}`}
                        </div>
                    </div>
                </div>
            </div>
            
             <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs">
                    <span className="font-bold">Note:</span> These endpoints are for simulation purposes within the demo environment.
            </div>
        </div>
    </PageLayout>
);

const Footer: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
    <footer className="bg-[#0b1120] border-t border-slate-800 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ShieldIcon className="w-6 h-6 text-cyan-400" />
                        <span className="font-cinzel font-bold text-xl text-white">KubeGuardian</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        The industry standard for AI-driven Kubernetes reliability. Trusted by Fortune 500 enterprises to maintain 99.99% uptime.
                    </p>
                    <div className="flex gap-4">
                        <button className="text-slate-400 hover:text-white transition-colors"><TwitterIcon className="w-5 h-5"/></button>
                        <button className="text-slate-400 hover:text-white transition-colors"><GithubIcon className="w-5 h-5"/></button>
                        <button className="text-slate-400 hover:text-white transition-colors"><LinkedinIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div>
                    <h3 className="font-bold text-white mb-4">Product</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><button onClick={() => onNavigate('about')} className="hover:text-cyan-400 transition-colors text-left">Features</button></li>
                        <li><button onClick={() => onNavigate('api')} className="hover:text-cyan-400 transition-colors text-left">Integrations</button></li>
                        <li><button onClick={() => onNavigate('about')} className="hover:text-cyan-400 transition-colors text-left">Enterprise Security</button></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold text-white mb-4">Resources</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><button onClick={() => onNavigate('api')} className="hover:text-cyan-400 transition-colors text-left">Documentation</button></li>
                        <li><button onClick={() => onNavigate('api')} className="hover:text-cyan-400 transition-colors text-left">API Reference</button></li>
                        <li><button onClick={() => onNavigate('blog')} className="hover:text-cyan-400 transition-colors text-left">Blog</button></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold text-white mb-4">Company</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><button onClick={() => onNavigate('about')} className="hover:text-cyan-400 transition-colors text-left">About Us</button></li>
                        <li><button onClick={() => onNavigate('contact')} className="hover:text-cyan-400 transition-colors text-left">Careers</button></li>
                        <li><button onClick={() => onNavigate('contact')} className="hover:text-cyan-400 transition-colors text-left">Contact Support</button></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
                &copy; 2024 KubeGuardian Inc. All rights reserved. | Privacy Policy | Terms of Service
            </div>
        </div>
    </footer>
);

// --- DASHBOARD VIEWS ---

const NetworkMapView: React.FC<{ pods: Pod[] }> = ({ pods }) => {
    const { nodes, links } = generateNetworkTopology(pods);

    return (
        <div className="h-full flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]"></div>
             <div className="relative z-10 w-full max-w-4xl h-[600px] border border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur-sm p-8">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><GlobeIcon className="w-5 h-5 text-cyan-400"/> Multi-Cloud Topology</h3>
                 
                 <div className="flex justify-around items-center h-full pb-20">
                     {/* Simplified Mock Visualization using Flexbox for demo purposes instead of D3 */}
                     {['AWS Sydney', 'GCP Melbourne', 'Azure Canberra'].map((region, i) => (
                         <div key={i} className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700 delay-100">
                             <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group">
                                 {i === 0 && <AWSIcon className="w-10 h-10 text-[#FF9900]" />}
                                 {i === 1 && <GCPIcon className="w-10 h-10 text-[#4285F4]" />}
                                 {i === 2 && <AzureIcon className="w-10 h-10 text-[#0089D6]" />}
                                 
                                 {/* Connection Lines (CSS) */}
                                 <div className="absolute top-1/2 left-full w-20 h-0.5 bg-gradient-to-r from-slate-600 to-transparent opacity-20"></div>
                             </div>
                             <div className="text-sm font-bold text-slate-400">{region}</div>
                             
                             <div className="grid grid-cols-2 gap-2 mt-4">
                                 {pods.filter(p => (i === 0 && p.cloudProvider === 'AWS') || (i === 1 && p.cloudProvider === 'GCP') || (i === 2 && p.cloudProvider === 'Azure')).slice(0, 4).map(pod => (
                                     <div key={pod.id} className={`w-3 h-3 rounded-full ${pod.status === 'Running' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse'}`} title={pod.name}></div>
                                 ))}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
};

const EventsView: React.FC<{ events: ClusterEvent[] }> = ({ events }) => (
    <div className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ActivityIcon className="w-5 h-5 text-cyan-400"/> Audit Log</h3>
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-xs">
                    <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Object</th>
                        <th className="p-4">Reason</th>
                        <th className="p-4">Message</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {events.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-mono text-slate-500">{e.timestamp.toLocaleTimeString()}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${e.type === 'Warning' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-700/30 text-slate-300'}`}>
                                    {e.type}
                                </span>
                            </td>
                            <td className="p-4 font-mono text-cyan-300">{e.object}</td>
                            <td className="p-4 text-white font-medium">{e.reason}</td>
                            <td className="p-4 text-slate-400 truncate max-w-md">{e.message}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const SettingsView: React.FC = () => (
    <div className="max-w-2xl mx-auto space-y-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-cyan-400"/> System Configuration</h3>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h4 className="font-bold text-white mb-4">Privacy & Security</h4>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-sm font-medium text-slate-200">PII Redaction Layer</div>
                        <div className="text-xs text-slate-500">Automatically mask IPs and Emails in logs</div>
                    </div>
                    <div className="w-12 h-6 bg-cyan-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-sm font-medium text-slate-200">Local Processing Only</div>
                        <div className="text-xs text-slate-500">Do not send telemetry to Cloud (Demo Mode)</div>
                    </div>
                    <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full shadow-sm"></div></div>
                </div>
            </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h4 className="font-bold text-white mb-4">Agent Connection</h4>
            <div className="space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                     <CheckCircleIcon className="w-4 h-4" /> Connected via Secure Gateway v2.1
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Polling Interval</label>
                         <select className="w-full mt-1 bg-black border border-slate-700 rounded p-2 text-sm">
                             <option>5 Seconds (Real-time)</option>
                             <option>30 Seconds</option>
                             <option>1 Minute</option>
                         </select>
                     </div>
                 </div>
            </div>
        </div>
    </div>
);


const PodHex: React.FC<{ pod: Pod; onClick: () => void }> = ({ pod, onClick }) => {
    const isError = pod.status !== 'Running' && pod.status !== 'Pending';
    return (
        <div onClick={onClick} className={`relative group cursor-pointer transition-all duration-300 ${isError ? 'animate-pulse' : ''}`}>
            <div className={`h-32 rounded-2xl border bg-gradient-to-br p-4 flex flex-col justify-between backdrop-blur-md transition-all
                ${isError 
                    ? 'border-rose-500/50 from-rose-900/20 to-slate-900 shadow-[0_0_20px_rgba(244,63,94,0.2)]' 
                    : 'border-slate-700/50 from-slate-800/40 to-slate-900 hover:border-cyan-500/50 hover:from-cyan-900/10'}
            `}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                         {pod.cloudProvider === 'AWS' && <AWSIcon className="w-4 h-4 text-[#FF9900]" />}
                         {pod.cloudProvider === 'GCP' && <GCPIcon className="w-4 h-4 text-[#4285F4]" />}
                         {pod.cloudProvider === 'Azure' && <AzureIcon className="w-4 h-4 text-[#0089D6]" />}
                         {pod.cloudProvider === 'Generic' && <ServerIcon className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isError ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                </div>
                
                <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-200 truncate" title={pod.name}>{pod.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{pod.namespace}</div>
                </div>

                <div className="flex gap-1 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                     <div className="h-1 bg-slate-700 flex-1 rounded overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: Math.min(parseInt(pod.memoryUsage), 100) + '%' }}></div>
                     </div>
                     <div className="h-1 bg-slate-700 flex-1 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: Math.min(parseInt(pod.cpuUsage), 100) + '%' }}></div>
                     </div>
                </div>
            </div>
        </div>
    );
};

const OpsSidebar: React.FC<{ 
    connectionMode: string, 
    currentView: string, 
    setView: (v: string) => void,
    onLogout: () => void 
}> = ({ connectionMode, currentView, setView, onLogout }) => (
    <div className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col p-4 z-20">
        <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer" onClick={() => setView('overview')}>
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-900/20">
                <ShieldIcon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="font-cinzel font-bold text-white tracking-wide">Guardian</h1>
                <div className="text-[10px] text-slate-500 font-mono">V2.5.0 ENTERPRISE</div>
            </div>
        </div>

        <div className="space-y-2 flex-1">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2">Monitoring</div>
            <button onClick={() => setView('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'overview' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}>
                <LayoutIcon className="w-4 h-4" /> <span className="text-sm font-bold">Cluster Overview</span>
            </button>
            <button onClick={() => setView('events')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'events' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}>
                <ActivityIcon className="w-4 h-4" /> <span className="text-sm font-medium">Live Events</span>
            </button>
            <button onClick={() => setView('network')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'network' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}>
                <GlobeIcon className="w-4 h-4" /> <span className="text-sm font-medium">Network Map</span>
            </button>
             <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'settings' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}>
                <SettingsIcon className="w-4 h-4" /> <span className="text-sm font-medium">Settings</span>
            </button>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 space-y-4">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">Agent Status</span>
                    <span className={`w-2 h-2 rounded-full ${connectionMode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                    {connectionMode === 'live' ? 'Connected: Secure GW' : 'Simulation Mode'}
                </div>
            </div>
            
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all border border-transparent hover:border-rose-500/20">
                <LogOutIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
            </button>
        </div>
    </div>
);

const AnalysisPanel: React.FC<{ 
    pod: Pod; 
    onClose: () => void; 
    onApplyFix: (yaml: string) => void; 
    connectionMode: string;
    agentConfig: { url: string, token: string };
}> = ({ pod, onClose, onApplyFix, connectionMode, agentConfig }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'manifest' | 'fix'>('logs');
    const [redactedLogs, setRedactedLogs] = useState<string>('');
    
    useEffect(() => {
        const load = async () => {
            let rawLogs = pod.logs.join('\n');
            if (connectionMode === 'live' && agentConfig.url) {
                try {
                    const lines = await fetchRealPodLogs(agentConfig.url, agentConfig.token, pod.name, pod.namespace);
                    rawLogs = lines.join('\n');
                } catch (e) {
                    rawLogs += "\n[System] Failed to fetch live logs. Showing cached state.";
                }
            }
            const safe = sanitizeLogs(rawLogs);
            setRedactedLogs(safe);
        };
        load();
    }, [pod, connectionMode, agentConfig]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const analysis = await analyzePodFailure(pod, redactedLogs);
            setResult(analysis);
            setActiveTab('fix');
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-[#020617]/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50">
                <div>
                    <h2 className="font-bold text-lg text-white flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-cyan-400" /> {pod.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <StatusBadge status={pod.status} />
                        <span className="font-mono opacity-50">{pod.id}</span>
                    </div>
                </div>
                <button onClick={onClose}><XIcon className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>

            <div className="flex border-b border-slate-800">
                <button onClick={() => setActiveTab('logs')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-slate-400 hover:text-white'}`}>Logs (Redacted)</button>
                <button onClick={() => setActiveTab('manifest')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'manifest' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-slate-400 hover:text-white'}`}>Manifest</button>
                <button onClick={() => setActiveTab('fix')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fix' ? 'border-cyan-500 text-cyan-400 bg-cyan-900/10' : 'border-transparent text-slate-400 hover:text-white'}`}>AI Analysis</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#020617]">
                {activeTab === 'logs' && (
                    <div className="font-mono text-xs leading-relaxed space-y-1">
                        {redactedLogs.split('\n').map((line, i) => (
                            <div key={i} className="text-slate-400 hover:bg-slate-800/50 px-2 rounded flex">
                                <span className="text-slate-700 select-none mr-3 w-6 text-right shrink-0">{i+1}</span>
                                <span className="break-all">{line.includes('{{') ? <span className="text-amber-300">{line}</span> : line}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {activeTab === 'manifest' && (
                    <pre className="font-mono text-xs text-emerald-300 bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
                        {pod.manifest}
                    </pre>
                )}

                {activeTab === 'fix' && (
                    <div className="space-y-6">
                        {!result && !analyzing && (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BrainIcon className="w-10 h-10 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Root Cause Analysis</h3>
                                <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">Gemini AI will scan the redacted logs and manifest to diagnose the failure.</p>
                                <button onClick={handleAnalyze} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 mx-auto">
                                    <ActivityIcon className="w-5 h-5" /> Initiate Diagnostics
                                </button>
                            </div>
                        )}
                        
                        {analyzing && (
                            <div className="text-center py-20">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"></div>
                                </div>
                                <h3 className="text-lg font-bold text-white animate-pulse">Running Neural Diagnostics...</h3>
                                <p className="text-xs text-slate-500 mt-2">Correlating telemetry with known failure patterns</p>
                            </div>
                        )}

                        {result && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-rose-950/20 border border-rose-500/30 p-5 rounded-xl mb-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none"></div>
                                    <div className="flex items-start gap-3 relative z-10">
                                        <AlertTriangleIcon className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-rose-400 text-sm uppercase tracking-wider mb-2">Detected Anomaly</h4>
                                            <p className="text-lg font-bold text-white mb-2">{result.rootCause}</p>
                                            <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-xl mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-emerald-400 text-sm uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4" /> Remediation Plan
                                        </h4>
                                        <div className="px-2 py-1 bg-emerald-900/30 rounded text-xs text-emerald-400 font-mono border border-emerald-500/20">
                                            Confidence: {result.confidence}%
                                        </div>
                                    </div>
                                    <p className="text-sm text-white mb-4">{result.suggestedFixDescription}</p>
                                    <div className="relative group">
                                        <pre className="font-mono text-xs text-emerald-200 bg-black/50 p-4 rounded-lg border border-slate-800 overflow-x-auto max-h-60 custom-scrollbar">
                                            {result.fixedYaml}
                                        </pre>
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 bg-slate-700 rounded text-white hover:bg-slate-600" title="Copy"><CopyIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-800">
                                    <button onClick={() => onApplyFix(result.fixedYaml)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2">
                                        <TerminalIcon className="w-5 h-5" /> Apply Patch
                                    </button>
                                    <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700">
                                        Dry Run
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Guardian AI Online. Reporting systems nominal. How can I assist with your cluster operations?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            const responseText = await chatWithAgent(history, userMsg.text);
            const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-96 h-[500px] bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 backdrop-blur-3xl">
                    <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                            <span className="font-bold text-white text-sm tracking-wide">Guardian Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)}><XIcon className="w-4 h-4 text-slate-400 hover:text-white" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 custom-scrollbar">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-mono leading-relaxed shadow-lg ${
                                    msg.role === 'user' 
                                    ? 'bg-cyan-900/30 text-cyan-100 border border-cyan-500/30 rounded-br-none' 
                                    : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1">
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800">
                        <div className="relative">
                            <input 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Query neural network..."
                                className="w-full bg-black border border-slate-700 text-white text-xs font-mono rounded-lg py-3 pl-4 pr-12 focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
                            />
                            <button type="submit" disabled={!input.trim() || loading} className="absolute right-2 top-2 p-1.5 bg-cyan-900/50 text-cyan-400 rounded hover:bg-cyan-500 hover:text-white transition-colors">
                                <TerminalIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`p-4 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-rose-500 rotate-90' : 'bg-cyan-500 hover:bg-cyan-400'}`}
            >
                {isOpen ? <XIcon className="w-6 h-6 text-white" /> : <BrainIcon className="w-6 h-6 text-black" />}
            </button>
        </div>
    );
};

// --- SINGLE ROBUST ONBOARDING (DNS/PRODUCTION) ---

const generateYaml = (domain: string) => `# KubeGuardian Agent Proxy (Production)
# Deploys a secure Nginx reverse proxy exposed via Ingress with TLS.
apiVersion: v1
kind: Namespace
metadata:
  name: guardian-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: guardian-viewer
  namespace: guardian-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: guardian-read-only
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "events", "namespaces"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: guardian-viewer-binding
subjects:
- kind: ServiceAccount
  name: guardian-viewer
  namespace: guardian-system
roleRef:
  kind: ClusterRole
  name: guardian-read-only
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-conf
  namespace: guardian-system
data:
  nginx.conf: |
    events {}
    http {
      server {
        listen 80;
        client_max_body_size 10M;
        location / {
          # CORS Configuration for Dashboard Access
          if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin' always;
            add_header 'Content-Length' 0;
            return 204;
          }
          add_header 'Access-Control-Allow-Origin' '*' always;
          add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin' always;
          
          proxy_pass https://kubernetes.default.svc;
          proxy_ssl_verify off;
          proxy_set_header Authorization $http_authorization;
        }
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guardian-proxy
  namespace: guardian-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: guardian-proxy
  template:
    metadata:
      labels:
        app: guardian-proxy
    spec:
      serviceAccountName: guardian-viewer
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-conf
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
      volumes:
      - name: nginx-conf
        configMap:
          name: nginx-conf
---
apiVersion: v1
kind: Service
metadata:
  name: guardian-service
  namespace: guardian-system
spec:
  type: ClusterIP
  selector:
    app: guardian-proxy
  ports:
  - port: 80
    targetPort: 80
---
# INGRESS CONFIGURATION
# Assumes Cert-Manager is installed for TLS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: guardian-ingress
  namespace: guardian-system
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - ${domain}
    secretName: guardian-tls
  rules:
  - host: ${domain}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: guardian-service
            port:
              number: 80
`;

const AgentOnboarding: React.FC<{ onClose: () => void; onConnect: (url: string, token: string) => void }> = ({ onClose, onConnect }) => {
    const [domain, setDomain] = useState('');
    const [agentToken, setAgentToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [step, setStep] = useState(1);

    const handleConnect = async () => {
        setStatus('checking');
        setErrorMsg('');
        
        const cleanedDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const fullUrl = `https://${cleanedDomain}`;
        const cleanedToken = agentToken.trim();

        if (!cleanedDomain) {
            setErrorMsg("Please enter a valid domain name.");
            setStatus('error');
            return;
        }

        try {
            await fetchClusterHeartbeat(fullUrl, cleanedToken);
            onConnect(fullUrl, cleanedToken);
        } catch (e: any) {
            setStatus('error');
            let msg = e.message || "Failed to reach Agent.";
            if (msg.includes("Failed to fetch")) {
                msg = "Connection Refused: Verify your DNS settings and ensure an SSL certificate is active on the Ingress.";
            }
            setErrorMsg(msg);
        }
    };

    const copyYaml = () => {
        const yaml = generateYaml(domain || 'guardian.your-company.com');
        navigator.clipboard.writeText(yaml);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#0b1120] w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
                
                <div className="flex flex-1 min-h-0">
                    {/* Left Panel: Instructions */}
                    <div className="w-1/3 bg-slate-900/50 p-8 border-r border-slate-800 flex flex-col">
                        <h2 className="text-2xl font-cinzel font-bold text-white mb-6">Setup Guardian</h2>
                        
                        <div className="space-y-6">
                            <div className={`cursor-pointer transition-colors ${step === 1 ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} onClick={() => setStep(1)}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}>1</div>
                                    <h3 className="font-bold text-white">DNS & Ingress</h3>
                                </div>
                                <p className="text-xs text-slate-400 pl-11">Configure your external domain and generate manifests.</p>
                            </div>

                            <div className={`cursor-pointer transition-colors ${step === 2 ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} onClick={() => setStep(2)}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}>2</div>
                                    <h3 className="font-bold text-white">Secure Link</h3>
                                </div>
                                <p className="text-xs text-slate-400 pl-11">Authenticate via your secure HTTPS endpoint.</p>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-800">
                            <button onClick={onClose} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
                                <XIcon className="w-4 h-4"/> Cancel Setup
                            </button>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 p-8 bg-[#020617] overflow-y-auto">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">1. Define Cluster Domain</h3>
                                    <p className="text-sm text-slate-400 mb-4">Enter the DNS name where you will expose the Guardian Agent (e.g., <code>ops.corp.com</code>).</p>
                                    <input 
                                        value={domain}
                                        onChange={e => setDomain(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none font-mono"
                                        placeholder="guardian.your-domain.com"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">2. Deploy Manifests</h3>
                                    <p className="text-sm text-slate-400 mb-2">This configures a read-only agent, an Nginx CORS proxy, and an Ingress with TLS.</p>
                                    
                                    <div className="relative group">
                                        <pre className="font-mono text-[10px] text-emerald-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto h-48 custom-scrollbar">
                                            {generateYaml(domain || 'guardian.your-company.com')}
                                        </pre>
                                        <button onClick={copyYaml} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700">
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bg-black p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 break-all">
                                    kubectl create token guardian-viewer -n guardian-system --duration=8760h
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button onClick={() => setStep(2)} disabled={!domain} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        Next Step &rarr;
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Authenticate Connection</h3>
                                    <p className="text-sm text-slate-400 mb-6">Enter the Service Account token generated in the previous step.</p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Agent Endpoint</label>
                                            <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-400 text-sm font-mono flex items-center gap-2">
                                                <LockIcon className="w-4 h-4 text-emerald-500" />
                                                https://{domain || 'your-domain.com'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Service Account Token</label>
                                            <textarea 
                                                value={agentToken}
                                                onChange={e => setAgentToken(e.target.value)}
                                                placeholder="Paste token here..."
                                                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs focus:border-cyan-500 outline-none font-mono resize-none custom-scrollbar"
                                            />
                                        </div>
                                        
                                        {status === 'error' && (
                                            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-3 animate-in fade-in">
                                                <AlertTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" /> 
                                                <div>
                                                    <div className="font-bold">Connection Failed</div>
                                                    <div className="text-xs opacity-80 mt-1">{errorMsg}</div>
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleConnect}
                                            disabled={status === 'checking'}
                                            className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {status === 'checking' ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Handshaking...</>
                                            ) : (
                                                "Establish Secure Uplink"
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-start">
                                    <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-white transition-colors">
                                        &larr; Back to DNS Config
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- AUTH PORTAL ---

const AuthPortal: React.FC<{ onBack: () => void; onLogin: () => void }> = ({ onBack, onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate auth delay
        setTimeout(() => {
            setLoading(false);
            onLogin();
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden">
            <style>{styles}</style>
             {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

            <button onClick={onBack} className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-20">
                <ArrowLeftIcon className="w-5 h-5" /> Back to Home
            </button>

            <div className="w-full max-w-5xl h-[600px] bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl flex overflow-hidden z-10 animate-in fade-in zoom-in duration-500">
                {/* Left Panel: Branding */}
                <div className="w-1/2 bg-gradient-to-br from-slate-950 to-slate-900 p-12 flex flex-col justify-between relative border-r border-slate-800">
                     <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20"></div>
                     
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-cyan-500 rounded-lg">
                                <ShieldIcon className="w-6 h-6 text-black" />
                            </div>
                            <h1 className="font-cinzel font-bold text-2xl text-white tracking-wide">Guardian</h1>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                            Secure your infrastructure with AI-driven intelligence.
                        </h2>
                        <p className="text-slate-400">Join 500+ enterprises managing critical workloads with Zero Trust architecture.</p>
                     </div>

                     <div className="relative z-10 flex gap-4 text-slate-500">
                         <NorthwindIcon className="w-8 h-8 opacity-50" />
                         <LuminaIcon className="w-8 h-8 opacity-50" />
                         <HyperNovaIcon className="w-8 h-8 opacity-50" />
                     </div>
                </div>

                {/* Right Panel: Form */}
                <div className="w-1/2 p-12 flex flex-col justify-center bg-[#0b1120]">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Sign In to Portal' : 'Create Account'}</h3>
                        <p className="text-sm text-slate-400">Enter your corporate credentials to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none transition-colors" placeholder="Acme Corp" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Work Email</label>
                            <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none transition-colors" placeholder="name@company.com" />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <input type="password" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none transition-colors" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all shadow-lg flex justify-center items-center gap-2">
                             {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isLogin ? 'Sign In' : 'Get Started')}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <span className="text-xs text-slate-500 uppercase">Or continue with</span>
                        <div className="h-px bg-slate-800 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="py-2.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2">
                            <GCPIcon className="w-4 h-4" /> Google Workspace
                        </button>
                        <button type="button" className="py-2.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2">
                            <AzureIcon className="w-4 h-4" /> Microsoft SSO
                        </button>
                    </div>

                    <p className="mt-8 text-center text-xs text-slate-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-400 hover:underline font-bold">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- LANDING PAGE ---

const LandingPage: React.FC<{ onLaunch: () => void, onSignin: () => void, onNavigate: (page: string) => void }> = ({ onLaunch, onSignin, onNavigate }) => {
    useScrollReveal();

    const scrollToPricing = () => {
        const el = document.getElementById('pricing');
        el?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans overflow-x-hidden relative selection:bg-cyan-500/30 flex flex-col">
            <style>{styles}</style>
            
            {/* Background Animation */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                 <div className="absolute inset-0 grid-bg opacity-30"></div>
                 <div className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] bg-purple-900/10 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                 <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-3xl opacity-20"></div>
            </div>

            <nav className="fixed w-full z-50 glass-panel border-b-0 top-0 h-20">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                         <div className="p-2 bg-cyan-500 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                             <ShieldIcon className="w-6 h-6 text-black" />
                        </div>
                        <h1 className="font-cinzel font-bold text-xl tracking-wider text-white">KubeGuardian</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={scrollToPricing} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Pricing</button>
                        <button onClick={() => onNavigate('blog')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Blog</button>
                        <button onClick={onLaunch} className="hidden md:block text-sm font-bold text-slate-400 hover:text-white transition-colors">Demo</button>
                        <button onClick={onSignin} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105">
                            Enterprise Access
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-48 pb-32 px-6 text-center z-10 overflow-hidden flex flex-col justify-center min-h-[90vh]">
                <div className="fade-in-section">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                        AI-Powered SRE Operations
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-tight max-w-5xl mx-auto font-cinzel">
                        Autonomous <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-glow">Cluster Defense</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Detect anomalies. Redact sensitive data. Patch incidents automatically.
                        <br/>The Zero-Trust Agent for the modern cloud.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button onClick={onSignin} className="px-8 py-4 bg-white text-black font-bold rounded-full transition-all flex items-center gap-2 hover:scale-110 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                            <PlusIcon className="w-5 h-5"/> Deploy Gateway
                        </button>
                        <button onClick={onLaunch} className="px-8 py-4 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white font-bold rounded-full transition-all flex items-center gap-2 backdrop-blur-sm">
                            <TerminalIcon className="w-5 h-5"/> View Documentation
                        </button>
                    </div>
                </div>

                <div className="mt-32 pt-10 border-t border-white/5 max-w-full overflow-hidden">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] mb-8">Securing Infrastructure At</p>
                    <div className="animate-marquee flex gap-16 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        {[...Array(3)].map((_, i) => (
                            <React.Fragment key={i}>
                                <div className="flex items-center gap-2"><NorthwindIcon className="w-8 h-8"/><span className="font-cinzel font-bold text-xl">Northwind</span></div>
                                <div className="flex items-center gap-2"><LuminaIcon className="w-8 h-8"/><span className="font-cinzel font-bold text-xl">Lumina</span></div>
                                <div className="flex items-center gap-2"><HyperNovaIcon className="w-8 h-8"/><span className="font-cinzel font-bold text-xl">HyperNova</span></div>
                                <div className="flex items-center gap-2"><ApexIcon className="w-8 h-8"/><span className="font-cinzel font-bold text-xl">Apex</span></div>
                                <div className="flex items-center gap-2"><BlueOrbitIcon className="w-8 h-8"/><span className="font-cinzel font-bold text-xl">BlueOrbit</span></div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-32 px-6 relative z-10 bg-[#020617]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center mb-32 fade-in-section">
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-6 font-cinzel">Neural Analysis Engine</h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                KubeGuardian doesn't just read logs; it understands them. Using advanced LLMs, it correlates `CrashLoopBackOff` events with recent deployments, redacts PII on-the-fly, and generates ready-to-apply YAML patches.
                            </p>
                            <ul className="space-y-4">
                                {['Context-Aware Diagnostics', 'PII/Secret Redaction Layer', 'Multi-Cloud Support (AWS/GCP/Azure)'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-cyan-400 font-bold p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <CheckCircleIcon className="w-5 h-5"/> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl border border-slate-800 p-2 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 group">
                             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative bg-black rounded-xl p-6 font-mono text-xs overflow-hidden h-[300px]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan"></div>
                                <div className="text-slate-500"># Analysis Result</div>
                                <div className="text-rose-400 mt-2">Error: OOMKilled</div>
                                <div className="text-emerald-400 mt-2">{`> Suggestions:`}</div>
                                <div className="text-slate-300 ml-4">- Increase memory limits to 512Mi</div>
                                <div className="text-slate-300 ml-4">- Check memory leak in worker.py</div>
                                <div className="mt-8 p-4 border border-slate-800 rounded bg-slate-900/50 text-cyan-300">
                                    <span className="text-slate-500">Confidence:</span> 98.4%
                                    <div className="h-1 bg-slate-700 mt-2 rounded overflow-hidden"><div className="w-[98%] h-full bg-cyan-500"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* Integrated Pricing Section */}
             <section id="pricing" className="py-32 px-6 relative z-10 bg-gradient-to-b from-[#020617] to-[#0b1120]">
                <div className="max-w-7xl mx-auto fade-in-section">
                    <div className="text-center mb-20 space-y-4">
                        <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-900/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">Plans & Billing</div>
                        <h2 className="text-4xl md:text-5xl font-black text-white font-cinzel">Transparent Pricing</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Invest in resilience. Scale as you grow.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Community Tier */}
                        <div className="glass-card rounded-3xl p-8 flex flex-col relative group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-700 group-hover:bg-slate-500 transition-colors"></div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">Community</h3>
                                <div className="text-4xl font-black text-white">$0 <span className="text-sm font-normal text-slate-500">/ mo</span></div>
                                <p className="text-sm text-slate-400 mt-4">For individual developers.</p>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Up to 3 Nodes', 'Basic Anomaly Detection', '3-Day Retention'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> {feat}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onSignin} className="w-full py-3 border border-slate-600 hover:border-white text-white font-bold rounded-xl transition-all">Get Started</button>
                        </div>

                        {/* Pro Tier */}
                        <div className="glass-card rounded-3xl p-8 flex flex-col relative group overflow-hidden bg-[#0b1120] border-cyan-500/30 transform md:-translate-y-4">
                            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]"></div>
                            <div className="absolute -right-12 top-6 bg-cyan-500 text-black text-[10px] font-bold px-12 py-1 rotate-45">POPULAR</div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-cyan-400 mb-2">Professional</h3>
                                <div className="text-4xl font-black text-white">$29 <span className="text-sm font-normal text-slate-500">/ node</span></div>
                                <p className="text-sm text-slate-400 mt-4">For scaling engineering teams.</p>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Unlimited Nodes', 'GenAI RCA Engine', 'Auto-Remediation YAML', 'Slack/PagerDuty Alerts'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                                        <CheckCircleIcon className="w-5 h-5 text-cyan-400" /> {feat}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onSignin} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all">Start Free Trial</button>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="glass-card rounded-3xl p-8 flex flex-col relative group overflow-hidden border-amber-500/20">
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"></div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-amber-500 mb-2">Enterprise</h3>
                                <div className="text-4xl font-black text-white">Custom</div>
                                <p className="text-sm text-slate-400 mt-4">For mission-critical workloads.</p>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Self-Hosted Models (VPC)', 'Zero-Data Egress', 'SSO & RBAC', '99.99% SLA'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {feat}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer onNavigate={onNavigate} />
            <ChatWidget />
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
    // New state management for navigation flows
    const [viewState, setViewState] = useState<'landing' | 'auth' | 'dashboard' | 'about' | 'contact' | 'blog' | 'api' | 'pricing'>('landing');
    
    const [connectionMode, setConnectionMode] = useState<'simulated' | 'live'>('simulated');
    const [currentView, setCurrentView] = useState('overview'); // overview, events, network, settings
    const [pods, setPods] = useState<Pod[]>([]);
    const [events, setEvents] = useState<ClusterEvent[]>([]);
    const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
    const [agentConfig, setAgentConfig] = useState({ url: '', token: '' });
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    // Initial Simulation Data
    useEffect(() => {
        if (viewState === 'dashboard' && connectionMode === 'simulated') {
            const initialPods = generateInitialPods(12);
            setPods(initialPods);
            setEvents(generateMockEvents(8));
            
            const interval = setInterval(() => {
                const { updatedPods, event } = injectFailure(initialPods);
                setPods(updatedPods);
                if (event) setEvents(prev => [event, ...prev].slice(0, 50));
            }, 15000); 

            return () => clearInterval(interval);
        }
    }, [viewState, connectionMode]);

    // Live Polling
    useEffect(() => {
        if (viewState === 'dashboard' && connectionMode === 'live' && agentConfig.url) {
            const poll = async () => {
                try {
                    const data = await fetchClusterHeartbeat(agentConfig.url, agentConfig.token);
                    setPods(data.pods);
                    setEvents(data.events || []);
                } catch (e) {
                    console.error("Heartbeat missed", e);
                }
            };
            poll();
            const interval = setInterval(poll, 5000);
            return () => clearInterval(interval);
        }
    }, [viewState, connectionMode, agentConfig]);

    const handleConnectAgent = (url: string, token: string) => {
        setAgentConfig({ url, token });
        setConnectionMode('live');
        setShowOnboarding(false);
    };

    // Navigation Handlers
    const goToAuth = () => setViewState('auth');
    const goToDashboard = () => setViewState('dashboard');
    const goHome = () => setViewState('landing');
    const handleLogout = () => {
        setViewState('landing');
        setConnectionMode('simulated');
        setAgentConfig({ url: '', token: '' });
    };

    // Render Logic based on viewState
    if (viewState === 'landing') return <LandingPage onLaunch={goToDashboard} onSignin={goToAuth} onNavigate={(page: any) => setViewState(page)} />;
    if (viewState === 'auth') return <AuthPortal onBack={goHome} onLogin={goToDashboard} />;
    if (viewState === 'about') return <AboutPage onBack={goHome} />;
    if (viewState === 'contact') return <ContactPage onBack={goHome} />;
    if (viewState === 'blog') return <BlogPage onBack={goHome} />;
    if (viewState === 'api') return <ApiDocsPage onBack={goHome} />;
    // Pricing is now embedded in Landing, but route kept for direct links if needed, redirects to home or specific view
    if (viewState === 'pricing') return <LandingPage onLaunch={goToDashboard} onSignin={goToAuth} onNavigate={(page: any) => setViewState(page)} />;

    return (
        <div className="h-screen bg-[#020617] text-slate-200 font-sans flex overflow-hidden">
            <style>{styles}</style>
            
            {/* Sidebar */}
            <OpsSidebar 
                connectionMode={connectionMode} 
                currentView={currentView} 
                setView={setCurrentView} 
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-white capitalize">{currentView.replace('-', ' ')}</h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">Healthy</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <div className="text-xs font-bold text-slate-400">UPTIME</div>
                             <div className="text-sm font-mono text-white">99.98%</div>
                        </div>
                        <button onClick={() => setShowOnboarding(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                            <PlusIcon className="w-4 h-4"/> Connect Node
                        </button>
                    </div>
                </header>

                {/* Dashboard Canvas */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
                    
                    {currentView === 'overview' && (
                        <>
                            {/* Stats Ticker */}
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Total Pods', val: pods.length, icon: CubeIcon, color: 'text-blue-400' },
                                    { label: 'CPU Usage', val: '42%', icon: CpuIcon, color: 'text-indigo-400' },
                                    { label: 'Mem Usage', val: '68%', icon: ServerIcon, color: 'text-purple-400' },
                                    { label: 'Errors', val: pods.filter(p => p.status !== 'Running').length, icon: AlertTriangleIcon, color: 'text-rose-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                                        <div className={`p-3 rounded-lg bg-slate-950 ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">{stat.val}</div>
                                            <div className="text-xs text-slate-500 font-bold uppercase">{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Active Workloads</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {pods.map(pod => (
                                    <PodHex key={pod.id} pod={pod} onClick={() => setSelectedPod(pod)} />
                                ))}
                            </div>
                        </>
                    )}

                    {currentView === 'events' && <EventsView events={events} />}
                    {currentView === 'network' && <NetworkMapView pods={pods} />}
                    {currentView === 'settings' && <SettingsView />}
                </main>
            </div>

            {selectedPod && (
                <AnalysisPanel 
                    pod={selectedPod} 
                    onClose={() => setSelectedPod(null)} 
                    onApplyFix={(yaml) => {
                        const newPods = applyFixToPod(pods, selectedPod.id, yaml);
                        setPods(newPods);
                        setSelectedPod(null);
                    }}
                    connectionMode={connectionMode}
                    agentConfig={agentConfig}
                />
            )}

            {showOnboarding && (
                <AgentOnboarding 
                    onClose={() => setShowOnboarding(false)}
                    onConnect={handleConnectAgent}
                />
            )}
            
            <ChatWidget />
        </div>
    );
};

export default App;
