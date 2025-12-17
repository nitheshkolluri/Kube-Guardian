'use client';

import { motion } from 'framer-motion';
import { AIFixSuggestion as AIFix } from '@/types';
import { Brain, Target, Lightbulb, TrendingUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface AIFixSuggestionProps {
    fix: AIFix;
}

export default function AIFixSuggestion({ fix }: AIFixSuggestionProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (fix.codeSnippet) {
            navigator.clipboard.writeText(fix.codeSnippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-400';
        if (confidence >= 60) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const getImpactBadge = (impact: string) => {
        const colors = {
            low: 'bg-blue-500/20 text-blue-400',
            medium: 'bg-yellow-500/20 text-yellow-400',
            high: 'bg-red-500/20 text-red-400',
        };
        return colors[impact as keyof typeof colors] || colors.medium;
    };

    return (
        <div className="glass rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">AI-Generated Fix Suggestion</h2>
                </div>
                <p className="text-primary-100">
                    Our AI has analyzed the pod logs and identified a potential solution
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Confidence & Impact */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-dark-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">Confidence Score</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${getConfidenceColor(fix.confidence)}`}>
                                {fix.confidence}%
                            </span>
                            <span className="text-gray-400 text-sm">accuracy</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-dark-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">Estimated Impact</span>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getImpactBadge(fix.estimatedImpact)}`}>
                            {fix.estimatedImpact.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Analysis */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-primary-400" />
                        <h3 className="text-lg font-semibold text-white">Analysis</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{fix.analysis}</p>
                </div>

                {/* Root Cause */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-accent-400" />
                        <h3 className="text-lg font-semibold text-white">Root Cause</h3>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-4 border-l-4 border-accent-500">
                        <p className="text-gray-300 leading-relaxed">{fix.rootCause}</p>
                    </div>
                </div>

                {/* Suggested Fix */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">Suggested Fix</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">{fix.suggestedFix}</p>

                    {/* Code snippet */}
                    {fix.codeSnippet && (
                        <div className="relative">
                            <div className="absolute top-3 right-3 z-10">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCopy}
                                    className="bg-dark-700 hover:bg-dark-600 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-sm text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-400">Copy</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                            <pre className="code-block overflow-x-auto">
                                <code className="text-gray-300">{fix.codeSnippet}</code>
                            </pre>
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="bg-dark-800 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Generated:</span>
                            <span className="text-white ml-2">
                                {new Date(fix.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">Status:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${fix.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    fix.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-blue-500/20 text-blue-400'
                                }`}>
                                {fix.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
