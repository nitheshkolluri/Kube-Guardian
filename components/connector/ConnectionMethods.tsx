'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Key, Cloud, Check } from 'lucide-react';

interface ConnectionMethodsProps {
    onConnect: () => void;
}

export default function ConnectionMethods({ onConnect }: ConnectionMethodsProps) {
    const [activeTab, setActiveTab] = useState<'kubeconfig' | 'serviceaccount' | 'cloud'>('kubeconfig');
    const [isConnecting, setIsConnecting] = useState(false);

    const tabs = [
        { id: 'kubeconfig' as const, name: 'Kubeconfig File', icon: Upload },
        { id: 'serviceaccount' as const, name: 'Service Account', icon: Key },
        { id: 'cloud' as const, name: 'Cloud Provider', icon: Cloud },
    ];

    const handleConnect = () => {
        setIsConnecting(true);
        setTimeout(() => {
            setIsConnecting(false);
            onConnect();
        }, 2000);
    };

    return (
        <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Connection Method</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-dark-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${activeTab === tab.id
                                ? 'text-primary-400 border-b-2 border-primary-400'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'kubeconfig' && (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Upload your kubeconfig file to establish a secure connection to your cluster.
                        </p>
                        <div className="border-2 border-dashed border-dark-600 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">Drop your kubeconfig file here</p>
                            <p className="text-sm text-gray-400">or click to browse</p>
                            <input type="file" className="hidden" accept=".yaml,.yml" />
                        </div>
                        <div className="bg-dark-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400">
                                <strong className="text-white">Note:</strong> Your kubeconfig is encrypted and stored securely. We only extract the necessary credentials to connect to your cluster.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'serviceaccount' && (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Create a service account with appropriate permissions and provide the token.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cluster API Endpoint
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://api.cluster.example.com:6443"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Service Account Token
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="bg-dark-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-2">
                                <strong className="text-white">Required permissions:</strong>
                            </p>
                            <ul className="text-sm text-gray-400 space-y-1 ml-4">
                                <li>• pods: get, list, watch</li>
                                <li>• pods/log: get</li>
                                <li>• events: get, list, watch</li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'cloud' && (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Connect directly through your cloud provider for seamless integration.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['AWS EKS', 'Google GKE', 'Azure AKS'].map((provider) => (
                                <motion.button
                                    key={provider}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="glass rounded-lg p-6 text-center hover:ring-2 hover:ring-primary-500 transition-all"
                                >
                                    <Cloud className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                                    <p className="font-medium text-white">{provider}</p>
                                </motion.button>
                            ))}
                        </div>
                        <div className="bg-dark-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400">
                                <strong className="text-white">Note:</strong> Cloud provider integration uses OAuth 2.0 for secure authentication. You&apos;ll be redirected to your provider&apos;s login page.
                            </p>
                        </div>
                    </div>
                )}

                {/* Connect button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full mt-8 btn-primary flex items-center justify-center gap-2"
                >
                    {isConnecting ? (
                        <>
                            <div className="spinner w-5 h-5 border-2"></div>
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Connect Cluster
                        </>
                    )}
                </motion.button>
            </motion.div>
        </div>
    );
}
