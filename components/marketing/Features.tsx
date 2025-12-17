'use client';

import { motion } from 'framer-motion';
import { Brain, Shield, Users, Bell, BarChart3, Lock, Zap, Cloud } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'AI-Powered Log Analysis',
        description: 'Advanced machine learning algorithms analyze your pod logs in real-time, identifying issues and root causes automatically.',
        color: 'from-primary-500 to-primary-700',
    },
    {
        icon: Shield,
        title: 'Automatic PII Redaction',
        description: 'Protect sensitive data with intelligent PII detection and redaction. GDPR and SOC 2 compliant out of the box.',
        color: 'from-accent-500 to-accent-700',
    },
    {
        icon: Users,
        title: 'Human Approval Workflow',
        description: 'Review and approve AI-suggested fixes before deployment. Maintain full control with human-in-the-loop validation.',
        color: 'from-blue-500 to-blue-700',
    },
    {
        icon: Bell,
        title: 'Real-time Alerts',
        description: 'Get instant notifications when pods fail or encounter errors. Configure alerts via email, Slack, or webhooks.',
        color: 'from-orange-500 to-orange-700',
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Comprehensive dashboards with cluster health metrics, resource utilization, and historical trend analysis.',
        color: 'from-green-500 to-green-700',
    },
    {
        icon: Lock,
        title: 'Enterprise Security',
        description: 'Bank-grade encryption, role-based access control, and audit logging. SOC 2, ISO 27001, and GDPR certified.',
        color: 'from-red-500 to-red-700',
    },
    {
        icon: Zap,
        title: 'Instant Deployment',
        description: 'Connect your clusters in minutes with our simple integration. Support for AWS, GCP, Azure, and on-premise.',
        color: 'from-yellow-500 to-yellow-700',
    },
    {
        icon: Cloud,
        title: 'Multi-Cloud Support',
        description: 'Monitor clusters across all major cloud providers from a single unified dashboard. No vendor lock-in.',
        color: 'from-purple-500 to-purple-700',
    },
];

export default function Features() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="gradient-text">Powerful Features</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Everything you need to monitor, analyze, and fix Kubernetes pod issues with confidence
                    </p>
                </motion.div>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -8 }}
                            className="glass rounded-xl p-6 card-hover group"
                        >
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
