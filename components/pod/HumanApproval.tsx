'use client';

import { motion } from 'framer-motion';
import { AIFixSuggestion } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';

interface HumanApprovalProps {
    fix: AIFixSuggestion;
    onApprove: () => void;
    onReject: () => void;
}

export default function HumanApproval({ fix, onApprove, onReject }: HumanApprovalProps) {
    return (
        <div className="glass rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">Human Approval Required</h2>
                    <p className="text-gray-400">
                        Please review the AI-suggested fix before applying it to your cluster. This ensures safety and gives you full control over changes.
                    </p>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-400 mb-1">Review Carefully</h3>
                        <p className="text-sm text-gray-300">
                            This fix will modify your cluster configuration. Please ensure you understand the changes before approving.
                            Consider testing in a staging environment first.
                        </p>
                    </div>
                </div>
            </div>

            {/* Review checklist */}
            <div className="bg-dark-800 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-white mb-4">Review Checklist</h3>
                <div className="space-y-3">
                    {[
                        'I have reviewed the root cause analysis',
                        'I understand the proposed changes',
                        'The fix aligns with our infrastructure standards',
                        'I have considered potential side effects',
                        'I am authorized to make this change',
                    ].map((item, index) => (
                        <label key={index} className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded border-dark-600 bg-dark-900 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                                {item}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onApprove}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <CheckCircle className="w-5 h-5" />
                    Approve & Apply Fix
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onReject}
                    className="flex-1 bg-dark-800 hover:bg-dark-700 border-2 border-red-500/50 hover:border-red-500 text-red-400 font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <XCircle className="w-5 h-5" />
                    Reject Fix
                </motion.button>
            </div>

            {/* Additional info */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                    Need help? <a href="#" className="text-primary-400 hover:text-primary-300">Contact support</a> or{' '}
                    <a href="#" className="text-primary-400 hover:text-primary-300">view documentation</a>
                </p>
            </div>
        </div>
    );
}
