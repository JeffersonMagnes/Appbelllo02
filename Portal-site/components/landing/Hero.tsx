import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative bg-[#f8f8fc] pt-28 pb-10 sm:pt-32 sm:pb-14 lg:pt-36 lg:pb-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dedeee] bg-white px-3 py-1.5 text-xs font-medium text-[#5555aa]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#287a78]" />Gestão para negócios de beleza e bem-estar</p>
            <h1 className="text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#23233f] sm:text-6xl lg:text-[3.75rem]">Mais tempo para cuidar.<br />
              <span className="text-[#6666cc]">Mais clareza para gerir.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">O AppBello é a plataforma de gestão para beleza e estética. Reúna agenda, clientes, equipe, comandas, financeiro e estoque na rotina do seu negócio.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>Começar teste grátis<ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="#produto" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Conhecer o sistema</a>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">{['Sem cartão de crédito', 'No computador e no celular'].map(text =>
              <span key={text} className="flex items-center gap-1.5">
                <Check size={14} className="text-[#287a78]" aria-hidden="true" />{text}</span>)}</div>
          </div>
          <figure className="min-w-0"><a href="/product/agenda.webp" target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-[#dedeee] bg-white shadow-sm"><div className="border-b px-4 py-3 text-xs font-medium text-[#5959b5]">AppBello / Sua operação em uma só plataforma</div><Image src="/product/agenda.webp" alt="Agenda real do AppBello com horários e profissionais. Abrir imagem ampliada." width={1440} height={950} priority sizes="(max-width:1023px) 100vw, 660px" className="h-auto w-full" /></a><figcaption className="mt-3 text-xs text-gray-500">Interface real · dados demonstrativos · toque para ampliar</figcaption></figure>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-[#e2e2ee] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-700">Seu talento cuida da beleza.<br className="sm:hidden" /> O AppBello organiza o resto.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            <span>Salões de beleza</span>
            <span>Barbearias</span>
            <span>Clínicas de estética</span>
            <span>Studios</span>
          </div>
        </div>
      </div>
    </section>
  );
}
