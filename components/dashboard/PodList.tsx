'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pod } from '@/types';
import { Search, Filter, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PodListProps {
    pods: Pod[];
}

export default function PodList({ pods }: PodListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredPods = pods.filter(pod => {
        const matchesSearch = pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pod.namespace.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || pod.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-500';
            case 'pending': return 'bg-blue-500';
            case 'failed': return 'bg-red-500';
            case 'crashloopbackoff': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            running: 'bg-green-500/20 text-green-400',
            pending: 'bg-blue-500/20 text-blue-400',
            failed: 'bg-red-500/20 text-red-400',
            crashloopbackoff: 'bg-orange-500/20 text-orange-400',
            unknown: 'bg-gray-500/20 text-gray-400',
        };
        return colors[status as keyof typeof colors] || colors.unknown;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Pods</h2>
                <div className="flex gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search pods..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="running">Running</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="crashloopbackoff">CrashLoopBackOff</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Pod table */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-800 border-b border-dark-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Pod Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Namespace
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Restarts
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Age
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    CPU / Memory
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700">
                            {filteredPods.map((pod, index) => (
                                <motion.tr
                                    key={pod.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-dark-800 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(pod.status)}`}></div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(pod.status)}`}>
                                                {pod.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{pod.name}</span>
                                            {pod.hasError && (
                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                        {pod.namespace}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`${pod.restarts > 5 ? 'text-red-400' : 'text-gray-400'}`}>
                                            {pod.restarts}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                        {pod.age}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                        {pod.cpuUsage}% / {pod.memoryUsage}MB
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/dashboard/pod/${pod.id}`}>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                                            >
                                                <span className="text-sm font-medium">View Details</span>
                                                <ExternalLink className="w-4 h-4" />
                                            </motion.button>
                                        </Link>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPods.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No pods found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
