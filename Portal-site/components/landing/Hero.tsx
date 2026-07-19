'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'iconsax-react';

export default function Hero() {
  return (
    <section className="bg-white pt-16 min-h-screen flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          {/* Left — text */}
          <div className="space-y-7 py-16">
            <h1 className="text-5xl lg:text-6xl xl:text-[4rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              <span className="text-[#6666cc]">da correria da rotina</span>{' '}
              <span className="text-[#6666cc]">ao controle da gestão</span>
              <br />
              <span className="text-gray-900">o Appbello simplifica</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              Dê adeus às complicações na agenda, finanças, pagamentos e marketing. Aqui a sua gestão acontece num piscar de olhos. Bora?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 gradient-primary text-white font-bold text-sm px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#6666cc]/25 group">
                Teste grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"  variant="Outline" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold text-sm px-8 py-4 rounded-xl hover:border-[#6666cc] hover:text-[#6666cc] transition-colors">
                Já sou cliente
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              {[
                { value: '5.000+', label: 'estabelecimentos' },
                { value: '200k+', label: 'agendamentos/mês' },
                { value: '4.9★', label: 'avaliação' },
              ].map((s, i) => (
                <div key={i} className={i > 0 ? 'pl-8 border-l border-gray-200' : ''}>
                  <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — photo with floating device */}
          <div className="relative hidden lg:flex items-center justify-end h-full">
            <div className="relative w-full max-w-xl">
              {/* Banner */}
              <div className="relative rounded-[2rem] overflow-hidden">
                <Image
                  src="/Banner.png"
                  alt="A sua parceira dos negócios de beleza"
                  width={900}
                  height={900}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>

              {/* Floating app screenshot card */}
              <div className="absolute -left-16 bottom-24 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-56">
                <div className="text-xs text-gray-500 mb-2 font-medium">Hoje — Salon Bella Vista</div>
                <div className="space-y-1.5">
                  {[
                    { name: 'Maria S.', time: '09:00', service: 'Corte + Escova' },
                    { name: 'João P.', time: '09:30', service: 'Barba' },
                    { name: 'Carla M.', time: '10:00', service: 'Manicure' },
                  ].map((apt) => (
                    <div key={apt.name} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6666cc] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{apt.name}</div>
                        <div className="text-xs text-gray-400 truncate">{apt.service}</div>
                      </div>
                      <div className="text-xs font-semibold text-[#6666cc]">{apt.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating revenue card */}
              <div className="absolute -right-6 top-16 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">Receita do mês</div>
                <div className="text-xl font-extrabold text-gray-900">R$ 18.340</div>
                <div className="text-xs text-green-600 font-semibold">+23% vs mês anterior</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="max-w-3xl mx-auto px-4 pb-8 text-center">
          <p className="text-lg font-bold text-gray-800">
            Sistema para salão de beleza, barbearia, clínica de estética, studios e muito mais.
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-24 bg-gray-200" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#6666cc]" />
            <div className="h-px w-24 bg-gray-200" />
          </div>
        </div>
      </div>
    </section>
  );
}
