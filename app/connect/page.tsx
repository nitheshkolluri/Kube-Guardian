'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/ui/Navigation';
import ConnectionMethods from '@/components/connector/ConnectionMethods';
import SecurityCompliance from '@/components/connector/SecurityCompliance';
import { Shield, CheckCircle } from 'lucide-react';

export default function ConnectPage() {
    const [connected, setConnected] = useState(false);

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                            <Shield className="w-4 h-4 text-primary-400" />
                            <span className="text-sm font-medium">Secure Connection</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="gradient-text">Connect Your Cluster</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Securely integrate your Kubernetes clusters in minutes. All connections are encrypted and compliant with industry standards.
                        </p>
                    </motion.div>

                    {!connected ? (
                        <>
                            {/* Connection Methods */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mb-12"
                            >
                                <ConnectionMethods onConnect={() => setConnected(true)} />
                            </motion.div>

                            {/* Security Compliance */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <SecurityCompliance />
                            </motion.div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-2xl p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Successfully Connected!</h2>
                            <p className="text-gray-400 mb-8">
                                Your cluster is now being monitored. Redirecting to dashboard...
                            </p>
                            <motion.a
                                href="/dashboard"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-block btn-primary"
                            >
                                Go to Dashboard
                            </motion.a>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
