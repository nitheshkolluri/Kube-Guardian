'use client';

import { useState } from 'react';
import Navigation from '@/components/ui/Navigation';
import ClusterOverview from '@/components/dashboard/ClusterOverview';
import PodList from '@/components/dashboard/PodList';
import AlertConfig from '@/components/dashboard/AlertConfig';
import { mockClusters, mockPods, mockAlerts } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Bell, Settings } from 'lucide-react';

export default function DashboardPage() {
    const [showAlertConfig, setShowAlertConfig] = useState(false);
    const unacknowledgedAlerts = mockAlerts.filter(a => !a.acknowledged).length;

    return (
        <div className="min-h-screen bg-dark-950">
            <Navigation />

            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                Dashboard
                            </h1>
                            <p className="text-gray-400">Monitor your Kubernetes clusters in real-time</p>
                        </div>
                        <div className="flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative glass rounded-lg p-3 hover:bg-dark-800 transition-colors"
                            >
                                <Bell className="w-5 h-5 text-gray-300" />
                                {unacknowledgedAlerts > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                                        {unacknowledgedAlerts}
                                    </span>
                                )}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAlertConfig(!showAlertConfig)}
                                className="glass rounded-lg px-4 py-3 hover:bg-dark-800 transition-colors flex items-center gap-2"
                            >
                                <Settings className="w-5 h-5 text-gray-300" />
                                <span className="text-gray-300 font-medium">Alert Settings</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Alert Config Panel */}
                    {showAlertConfig && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8"
                        >
                            <AlertConfig />
                        </motion.div>
                    )}

                    {/* Cluster Overview */}
                    <div className="mb-8">
                        <ClusterOverview clusters={mockClusters} />
                    </div>

                    {/* Pod List */}
                    <div>
                        <PodList pods={mockPods} />
                    </div>
                </div>
            </div>
        </div>
    );
}
