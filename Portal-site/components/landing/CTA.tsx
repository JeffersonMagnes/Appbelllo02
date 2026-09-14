import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return <section className="bg-white px-5 py-12 sm:px-8 sm:py-16">
    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-2xl bg-[#303052] px-6 py-10 sm:px-10 lg:flex-row lg:items-center">
      <div className="max-w-xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#bfc0f0]">Seu próximo passo</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Uma rotina mais organizada começa aqui.</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#dedeea]">Traga sua agenda, sua equipe e sua gestão para o AppBello.</p>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
        <Link href="/cadastro" className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#434387] transition-colors duration-200 hover:bg-[#eeeef9]">Criar conta de avaliação<ArrowRight size={16} aria-hidden="true" />
        </Link>
        <p className="text-center text-xs text-[#dedeea]">Cadastro sem cartão de crédito.</p>
      </div>
    </div>
  </section>;
}
