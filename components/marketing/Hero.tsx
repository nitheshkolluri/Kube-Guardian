'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Brain, Bell } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 animated-gradient opacity-20"></div>

            {/* Floating orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-accent-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
                    >
                        <Zap className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-medium">AI-Powered Kubernetes Monitoring</span>
                    </motion.div>

                    {/* Main heading */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="gradient-text">KubeGuardian</span>
                        <br />
                        <span className="text-white">Intelligent Pod Monitoring</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                        Enterprise-grade Kubernetes monitoring with AI-powered log analysis,
                        automatic PII redaction, and intelligent fix suggestions.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Link href="/connect">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-primary w-full sm:w-auto"
                            >
                                Start Free Trial
                            </motion.button>
                        </Link>
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-outline w-full sm:w-auto"
                            >
                                View Demo Dashboard
                            </motion.button>
                        </Link>
                    </div>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {[
                            { icon: Brain, title: 'AI Analysis', desc: 'Intelligent log analysis' },
                            { icon: Shield, title: 'PII Redaction', desc: 'Automatic data protection' },
                            { icon: Zap, title: 'Auto Fixes', desc: 'AI-suggested solutions' },
                            { icon: Bell, title: 'Real-time Alerts', desc: 'Instant notifications' },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="glass rounded-xl p-6 card-hover"
                            >
                                <feature.icon className="w-8 h-8 text-primary-400 mb-3 mx-auto" />
                                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-400">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2"
                >
                    <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                </motion.div>
            </motion.div>
        </div>
    );
}
