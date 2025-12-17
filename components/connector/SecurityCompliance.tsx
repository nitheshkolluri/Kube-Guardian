'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, FileCheck, Globe } from 'lucide-react';

const certifications = [
    {
        icon: Shield,
        name: 'SOC 2 Type II',
        description: 'Certified for security, availability, and confidentiality',
    },
    {
        icon: FileCheck,
        name: 'ISO 27001',
        description: 'Information security management certified',
    },
    {
        icon: Globe,
        name: 'GDPR Compliant',
        description: 'Full compliance with EU data protection regulations',
    },
    {
        icon: Lock,
        name: 'AES-256 Encryption',
        description: 'Bank-grade encryption for all data in transit and at rest',
    },
];

export default function SecurityCompliance() {
    return (
        <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Security & Compliance</h2>
            <p className="text-gray-400 mb-8">
                Your data security is our top priority. We maintain the highest standards of security and compliance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certifications.map((cert, index) => (
                    <motion.div
                        key={cert.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <cert.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">{cert.name}</h3>
                                <p className="text-sm text-gray-400">{cert.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 bg-dark-800 rounded-lg p-6 border border-dark-700">
                <h3 className="font-semibold text-white mb-4">Security Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        End-to-end encryption
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        Role-based access control
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        Audit logging
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        Data residency options
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        Regular security audits
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        Zero-trust architecture
                    </div>
                </div>
            </div>
        </div>
    );
}
