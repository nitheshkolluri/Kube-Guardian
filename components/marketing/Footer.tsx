'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
    product: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Demo', href: '/dashboard' },
        { name: 'Documentation', href: '#docs' },
    ],
    resources: [
        { name: 'Blog', href: '#blog' },
        { name: 'Guides', href: '#guides' },
        { name: 'API Reference', href: '#api' },
        { name: 'Status', href: '#status' },
    ],
    company: [
        { name: 'About', href: '#about' },
        { name: 'Careers', href: '#careers' },
        { name: 'Security', href: '#security' },
        { name: 'Privacy', href: '#privacy' },
    ],
    support: [
        { name: 'Help Center', href: '#help' },
        { name: 'Contact Sales', href: '#contact' },
        { name: 'Community', href: '#community' },
        { name: 'Terms of Service', href: '#terms' },
    ],
};

export default function Footer() {
    return (
        <footer id="contact" className="border-t border-dark-800 bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
                    {/* Brand column */}
                    <div className="md:col-span-1">
                        <h3 className="text-2xl font-bold gradient-text mb-4">KubeGuardian</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            AI-powered Kubernetes monitoring for modern enterprises
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links columns */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Support</h4>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-dark-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-sm">
                        © 2024 KubeGuardian. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <Link href="#privacy" className="text-gray-400 hover:text-primary-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#terms" className="text-gray-400 hover:text-primary-400 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="#cookies" className="text-gray-400 hover:text-primary-400 transition-colors">
                            Cookie Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
