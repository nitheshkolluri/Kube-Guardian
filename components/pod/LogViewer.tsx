'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogEntry } from '@/types';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { redactPII } from '@/lib/piiRedaction';

interface LogViewerProps {
    logs: LogEntry[];
    onRequestFix: () => void;
}

export default function LogViewer({ logs, onRequestFix }: LogViewerProps) {
    const [viewMode, setViewMode] = useState<'raw' | 'sanitized'>('raw');

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'info': return 'text-blue-400';
            case 'debug': return 'text-gray-400';
            default: return 'text-gray-300';
        }
    };

    const getLevelBg = (level: string) => {
        switch (level) {
            case 'error': return 'bg-red-500/20';
            case 'warn': return 'bg-yellow-500/20';
            case 'info': return 'bg-blue-500/20';
            case 'debug': return 'bg-gray-500/20';
            default: return 'bg-gray-500/20';
        }
    };

    return (
        <div className="glass rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-dark-800 p-4 border-b border-dark-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Pod Logs</h2>
                <div className="flex gap-4">
                    {/* View mode toggle */}
                    <div className="flex gap-2 bg-dark-900 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('raw')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'raw'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Raw Logs
                            </div>
                        </button>
                        <button
                            onClick={() => setViewMode('sanitized')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'sanitized'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <EyeOff className="w-4 h-4" />
                                Sanitized (PII Redacted)
                            </div>
                        </button>
                    </div>

                    {/* Request AI Fix button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRequestFix}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Request AI Fix
                    </motion.button>
                </div>
            </div>

            {/* Logs */}
            <div className="bg-dark-900 p-4 max-h-[500px] overflow-y-auto font-mono text-sm">
                {logs.map((log, index) => {
                    const displayMessage = viewMode === 'sanitized' && log.hasPII && log.redactedMessage
                        ? log.redactedMessage
                        : log.message;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`mb-2 p-3 rounded-lg ${getLevelBg(log.level)} border-l-4 ${log.level === 'error' ? 'border-red-500' :
                                    log.level === 'warn' ? 'border-yellow-500' :
                                        log.level === 'info' ? 'border-blue-500' :
                                            'border-gray-500'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`${getLevelColor(log.level)} font-semibold text-xs uppercase min-w-[50px]`}>
                                    {log.level}
                                </span>
                                <span className="text-gray-300 flex-1">
                                    {displayMessage}
                                    {viewMode === 'sanitized' && log.hasPII && (
                                        <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                            PII REDACTED
                                        </span>
                                    )}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Info banner */}
            {viewMode === 'sanitized' && (
                <div className="bg-primary-500/10 border-t border-primary-500/30 p-3">
                    <p className="text-sm text-primary-300">
                        🔒 Viewing sanitized logs with automatic PII redaction enabled. Sensitive information like emails, IPs, and credentials are masked.
                    </p>
                </div>
            )}
        </div>
    );
}
