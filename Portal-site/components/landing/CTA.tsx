'use client';

import Link from 'next/link';
import { ArrowRight } from 'iconsax-react';

export default function CTA() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative gradient-primary rounded-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 items-center min-h-[240px]">
            {/* Photo */}
            <div className="relative h-48 lg:h-full overflow-hidden">
              <img
                src="/onboarding_2.png"
                alt="Profissional usando Appbello"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#6666cc]/60" />
            </div>

            {/* Text */}
            <div className="px-7 py-8 lg:px-10">
              <p className="text-white/80 font-semibold text-xs mb-2">A sua parceira dos negócios de beleza</p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
                faz parte do grupo que bota pra girar
              </h2>
              <p className="text-white/75 text-sm mb-6 leading-relaxed">
                Organize agenda, clientes e operação em um só lugar. O cadastro não exige cartão de crédito.
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 bg-white text-[#6666cc] font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-lg group">
                Criar conta de avaliação
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"  variant="Outline" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
