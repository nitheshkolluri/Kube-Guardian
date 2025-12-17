'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertPreferences } from '@/types';
import { Mail, MessageSquare, Webhook, Save } from 'lucide-react';

export default function AlertConfig() {
    const [preferences, setPreferences] = useState<AlertPreferences>({
        enabled: true,
        channels: {
            email: true,
            slack: false,
            webhook: false,
        },
        thresholds: {
            cpuPercent: 80,
            memoryPercent: 80,
            restartCount: 5,
        },
        notifyOn: {
            podDown: true,
            podError: true,
            highCpu: true,
            highMemory: true,
            crashLoop: true,
        },
    });

    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="glass rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Alert Configuration</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saved ? 'Saved!' : 'Save Changes'}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Notification Channels */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.channels.email}
                                onChange={(e) => setPreferences({
                                    ...preferences,
                                    channels: { ...preferences.channels, email: e.target.checked }
                                })}
                                className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-300">Email Notifications</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.channels.slack}
                                onChange={(e) => setPreferences({
                                    ...preferences,
                                    channels: { ...preferences.channels, slack: e.target.checked }
                                })}
                                className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <MessageSquare className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-300">Slack Integration</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.channels.webhook}
                                onChange={(e) => setPreferences({
                                    ...preferences,
                                    channels: { ...preferences.channels, webhook: e.target.checked }
                                })}
                                className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <Webhook className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-300">Webhook</span>
                        </label>
                    </div>
                </div>

                {/* Alert Types */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Alert Types</h3>
                    <div className="space-y-4">
                        {Object.entries(preferences.notifyOn).map(([key, value]) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setPreferences({
                                        ...preferences,
                                        notifyOn: { ...preferences.notifyOn, [key]: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-gray-300 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Thresholds */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            CPU Usage (%)
                        </label>
                        <input
                            type="number"
                            value={preferences.thresholds.cpuPercent}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                thresholds: { ...preferences.thresholds, cpuPercent: parseInt(e.target.value) }
                            })}
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Memory Usage (%)
                        </label>
                        <input
                            type="number"
                            value={preferences.thresholds.memoryPercent}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                thresholds: { ...preferences.thresholds, memoryPercent: parseInt(e.target.value) }
                            })}
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Restart Count
                        </label>
                        <input
                            type="number"
                            value={preferences.thresholds.restartCount}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                thresholds: { ...preferences.thresholds, restartCount: parseInt(e.target.value) }
                            })}
                            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
