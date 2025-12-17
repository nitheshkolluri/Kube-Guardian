import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "KubeGuardian - Enterprise Kubernetes Monitoring",
    description: "AI-powered Kubernetes monitoring and troubleshooting platform with intelligent log analysis and automated fix suggestions",
    keywords: ["kubernetes", "monitoring", "AI", "devops", "cloud", "containers"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
