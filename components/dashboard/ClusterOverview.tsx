'use client';

import { motion } from 'framer-motion';
import { Cluster } from '@/types';
import { Server, Activity, AlertCircle, CheckCircle, Cpu, HardDrive } from 'lucide-react';

interface ClusterOverviewProps {
    clusters: Cluster[];
}

export default function ClusterOverview({ clusters }: ClusterOverviewProps) {
    const totalPods = clusters.reduce((sum, c) => sum + c.totalPods, 0);
    const runningPods = clusters.reduce((sum, c) => sum + c.runningPods, 0);
    const failedPods = clusters.reduce((sum, c) => sum + c.failedPods, 0);
    const avgCpu = Math.round(clusters.reduce((sum, c) => sum + c.cpuUsage, 0) / clusters.length);
    const avgMemory = Math.round(clusters.reduce((sum, c) => sum + c.memoryUsage, 0) / clusters.length);

    const stats = [
        { label: 'Total Clusters', value: clusters.length, icon: Server, color: 'from-blue-500 to-blue-600' },
        { label: 'Running Pods', value: runningPods, icon: CheckCircle, color: 'from-green-500 to-green-600' },
        { label: 'Failed Pods', value: failedPods, icon: AlertCircle, color: 'from-red-500 to-red-600' },
        { label: 'Avg CPU', value: `${avgCpu}%`, icon: Cpu, color: 'from-purple-500 to-purple-600' },
        { label: 'Avg Memory', value: `${avgMemory}%`, icon: HardDrive, color: 'from-orange-500 to-orange-600' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Cluster Overview</h2>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-xl p-6 card-hover"
                    >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Cluster cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clusters.map((cluster, index) => (
                    <motion.div
                        key={cluster.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="glass rounded-xl p-6 card-hover"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">{cluster.name}</h3>
                                <p className="text-sm text-gray-400">{cluster.provider.toUpperCase()} • {cluster.region}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${cluster.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                                    cluster.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {cluster.status}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Pods</span>
                                <span className="text-sm text-white font-medium">
                                    {cluster.runningPods}/{cluster.totalPods} running
                                </span>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-400">CPU Usage</span>
                                    <span className="text-sm text-white font-medium">{cluster.cpuUsage}%</span>
                                </div>
                                <div className="w-full bg-dark-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${cluster.cpuUsage > 80 ? 'bg-red-500' :
                                                cluster.cpuUsage > 60 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                            }`}
                                        style={{ width: `${cluster.cpuUsage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-400">Memory Usage</span>
                                    <span className="text-sm text-white font-medium">{cluster.memoryUsage}%</span>
                                </div>
                                <div className="w-full bg-dark-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${cluster.memoryUsage > 80 ? 'bg-red-500' :
                                                cluster.memoryUsage > 60 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                            }`}
                                        style={{ width: `${cluster.memoryUsage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
