'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Building2, Crown } from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        name: 'Free Trial',
        icon: Zap,
        price: '$0',
        period: '7 days',
        description: 'Perfect for testing and evaluation',
        features: [
            '1 cluster connection',
            'Up to 50 pods',
            '7-day log retention',
            'Basic AI analysis',
            'Email support',
            'PII redaction',
        ],
        cta: 'Start Free Trial',
        popular: false,
        gradient: 'from-gray-600 to-gray-700',
    },
    {
        name: 'Professional',
        icon: Building2,
        price: '$299',
        period: 'per month',
        description: 'For growing teams and production workloads',
        features: [
            'Up to 5 clusters',
            'Unlimited pods',
            '30-day log retention',
            'Advanced AI analysis',
            'Priority support',
            'Advanced analytics',
            'Slack integration',
            'Custom alerts',
        ],
        cta: 'Get Started',
        popular: true,
        gradient: 'from-primary-600 to-primary-700',
    },
    {
        name: 'Enterprise',
        icon: Crown,
        price: 'Custom',
        period: 'contact sales',
        description: 'For large-scale deployments',
        features: [
            'Unlimited clusters',
            'Unlimited pods',
            'Custom log retention',
            'Dedicated AI models',
            '24/7 dedicated support',
            'Custom integrations',
            'SLA guarantees',
            'On-premise deployment',
            'Advanced security',
        ],
        cta: 'Contact Sales',
        popular: false,
        gradient: 'from-accent-600 to-accent-700',
    },
];

export default function Pricing() {
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
                        <span className="gradient-text">Simple, Transparent Pricing</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Choose the plan that fits your needs. All plans include core features.
                    </p>
                </motion.div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`relative glass rounded-2xl p-8 ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
                                } card-hover`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                                <plan.icon className="w-6 h-6 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <p className="text-gray-400 mb-6">{plan.description}</p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                {plan.price !== 'Custom' && (
                                    <span className="text-gray-400 ml-2">/ {plan.period}</span>
                                )}
                                {plan.price === 'Custom' && (
                                    <span className="text-gray-400 ml-2 block text-sm">{plan.period}</span>
                                )}
                            </div>

                            <Link href="/connect">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${plan.popular
                                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg'
                                            : 'bg-dark-800 hover:bg-dark-700 text-white border border-dark-600'
                                        }`}
                                >
                                    {plan.cta}
                                </motion.button>
                            </Link>

                            <div className="mt-8 space-y-3">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-gray-400 mt-12"
                >
                    All plans include PII redaction, human approval workflow, and enterprise-grade security.
                    <br />
                    Need a custom solution? <Link href="#contact" className="text-primary-400 hover:text-primary-300">Contact our sales team</Link>
                </motion.p>
            </div>
        </section>
    );
}
