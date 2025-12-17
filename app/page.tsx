import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import Pricing from '@/components/marketing/Pricing';
import TrustedBy from '@/components/marketing/TrustedBy';
import Footer from '@/components/marketing/Footer';
import Chatbot from '@/components/marketing/Chatbot';
import Navigation from '@/components/ui/Navigation';

export default function Home() {
    return (
        <main className="min-h-screen">
            <Navigation />
            <Hero />
            <div id="features">
                <Features />
            </div>
            <TrustedBy />
            <div id="pricing">
                <Pricing />
            </div>
            <Footer />
            <Chatbot />
        </main>
    );
}
