import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import BusinessTypes from '@/components/landing/BusinessTypes';
import BenefitsTabs from '@/components/landing/BenefitsTabs';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import Blog from '@/components/landing/Blog';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen font-outfit">
      <Navbar />
      <Hero />
      <BusinessTypes />
      <BenefitsTabs />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Blog />
      <CTA />
      <Footer />
    </main>
  );
}
