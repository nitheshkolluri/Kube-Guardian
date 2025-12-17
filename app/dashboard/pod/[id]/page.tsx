'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import LogViewer from '@/components/pod/LogViewer';
import AIFixSuggestion from '@/components/pod/AIFixSuggestion';
import HumanApproval from '@/components/pod/HumanApproval';
import { mockPods, mockLogs, mockAIFix } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PodDetailPage() {
    const params = useParams();
    const podId = params.id as string;
    const pod = mockPods.find(p => p.id === podId);
    const [showAIFix, setShowAIFix] = useState(false);
    const [fixStatus, setFixStatus] = useState(mockAIFix.status);

    if (!pod) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Pod Not Found</h1>
                    <Link href="/dashboard" className="text-primary-400 hover:text-primary-300">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusIcon = () => {
        switch (pod.status) {
            case 'running':
                return <CheckCircle className="w-6 h-6 text-green-400" />;
            case 'failed':
            case 'crashloopbackoff':
                return <AlertCircle className="w-6 h-6 text-red-400" />;
            default:
                return <Activity className="w-6 h-6 text-blue-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navigation />

            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Back button */}
                    <Link href="/dashboard">
                        <motion.button
                            whileHover={{ x: -4 }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </motion.button>
                    </Link>

                    {/* Pod header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-6 mb-8"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                {getStatusIcon()}
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-2">{pod.name}</h1>
                                    <div className="flex gap-4 text-sm text-gray-400">
                                        <span>Namespace: <span className="text-white">{pod.namespace}</span></span>
                                        <span>Node: <span className="text-white">{pod.node}</span></span>
                                        <span>Age: <span className="text-white">{pod.age}</span></span>
                                        <span>Restarts: <span className={pod.restarts > 5 ? 'text-red-400' : 'text-white'}>{pod.restarts}</span></span>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-medium ${pod.status === 'running' ? 'bg-green-500/20 text-green-400' :
                                    pod.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {pod.status}
                            </div>
                        </div>

                        {pod.hasError && pod.errorMessage && (
                            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-red-400 mb-1">Error Detected</h3>
                                        <p className="text-sm text-gray-300">{pod.errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Log Viewer */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <LogViewer logs={mockLogs} onRequestFix={() => setShowAIFix(true)} />
                    </motion.div>

                    {/* AI Fix Suggestion */}
                    {showAIFix && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8"
                        >
                            <AIFixSuggestion fix={{ ...mockAIFix, status: fixStatus }} />
                        </motion.div>
                    )}

                    {/* Human Approval */}
                    {showAIFix && fixStatus === 'pending' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <HumanApproval
                                fix={{ ...mockAIFix, status: fixStatus }}
                                onApprove={() => setFixStatus('approved')}
                                onReject={() => setFixStatus('rejected')}
                            />
                        </motion.div>
                    )}

                    {/* Status messages */}
                    {fixStatus === 'approved' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-xl p-6 bg-green-500/10 border border-green-500/30"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                                <div>
                                    <h3 className="font-semibold text-green-400 mb-1">Fix Approved & Applied</h3>
                                    <p className="text-sm text-gray-300">
                                        The suggested fix has been applied to your cluster. Monitor the pod status for improvements.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {fixStatus === 'rejected' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-xl p-6 bg-red-500/10 border border-red-500/30"
                        >
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                                <div>
                                    <h3 className="font-semibold text-red-400 mb-1">Fix Rejected</h3>
                                    <p className="text-sm text-gray-300">
                                        You can request a new analysis or manually fix the issue.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
