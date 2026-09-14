import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import BusinessTypes from '@/components/landing/BusinessTypes';
import BenefitsTabs from '@/components/landing/BenefitsTabs';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Pricing from '@/components/landing/Pricing';
import OperationModules from '@/components/landing/OperationModules';
import WebMobile from '@/components/landing/WebMobile';
import CTA from '@/components/landing/CTA';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="marketing-site min-h-screen font-outfit">
      <Navbar />
      <Hero />
      <Features />
      <BenefitsTabs />
      <OperationModules />
      <WebMobile />
      <BusinessTypes />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
