'use client';

import { motion } from 'framer-motion';
import { mockCompanies } from '@/lib/mockData';

export default function TrustedBy() {
    // Duplicate companies for seamless loop
    const companies = [...mockCompanies, ...mockCompanies];

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        <span className="gradient-text">Trusted by Industry Leaders</span>
                    </h2>
                    <p className="text-gray-400">
                        Join hundreds of companies monitoring their Kubernetes clusters with KubeGuardian
                    </p>
                </motion.div>

                {/* Animated company carousel */}
                <div className="relative">
                    <div className="overflow-hidden">
                        <motion.div
                            animate={{
                                x: [0, -50 * mockCompanies.length + '%'],
                            }}
                            transition={{
                                x: {
                                    repeat: Infinity,
                                    repeatType: 'loop',
                                    duration: 30,
                                    ease: 'linear',
                                },
                            }}
                            className="flex gap-8"
                        >
                            {companies.map((company, index) => (
                                <motion.div
                                    key={`${company.name}-${index}`}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-shrink-0 glass rounded-xl p-6 w-64 card-hover"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{company.logo}</div>
                                        <div>
                                            <h3 className="font-semibold text-white">{company.name}</h3>
                                            <p className="text-sm text-gray-400">{company.industry}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Gradient overlays for fade effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-950 to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-950 to-transparent pointer-events-none"></div>
                </div>
            </div>
        </section>
    );
}
