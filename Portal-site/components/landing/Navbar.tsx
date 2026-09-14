'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, ChevronDown, ArrowRight, Scissors, Sparkles, Flower2, CircleUserRound } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';

const businesses = [
  { label: 'Salão de beleza', href: '/negocios/salao-de-beleza', icon: Scissors },
  { label: 'Barbearia', href: '/negocios/barbearia', icon: CircleUserRound },
  { label: 'Clínica de estética', href: '/negocios/clinica-de-estetica', icon: Sparkles },
  { label: 'Studios', href: '/negocios/studios', icon: Flower2 },
];
const links = [['Soluções', '/#recursos'], ['Planos', '/#precos'], ['Sobre o AppBello', '/#sobre']];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e9e9f2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link href="/" aria-label="AppBello — início">
          <Image src="/logo.png" alt="AppBello" width={132} height={54} className="h-auto w-[132px]" priority />
        </Link>
        <nav aria-label="Navegação do site" className="hidden items-center gap-6 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-gray-600 transition-colors hover:text-[#5959b5]">Para seu negócio<ChevronDown size={14} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl p-2">{businesses.map(({ label, href, icon: Icon }) =>
              <DropdownMenuItem key={href} asChild>
                <Link href={href} className="flex min-h-[44px] items-center gap-3 rounded-lg">
                  <Icon size={17} aria-hidden="true" />{label}</Link>
              </DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
          {links.map(([label, href]) =>
            <Link key={href} href={href} className="py-3 text-sm font-medium text-gray-600 transition-colors hover:text-[#5959b5]">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>Entrar</Link>
          <Link href="/cadastro" className={buttonVariants()}>Teste grátis<ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[320px] max-w-[calc(100vw-2rem)] overflow-y-auto">
            <SheetTitle>Conheça o AppBello</SheetTitle>
            <SheetDescription>Seu negócio de beleza, organizado.</SheetDescription>
            <nav aria-label="Navegação mobile" className="mt-6 flex flex-col gap-1">{links.map(([label, href]) =>
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted">{label}</Link>)}<p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Para seu negócio</p>{businesses.map(({ label, href, icon: Icon }) =>
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted">
                  <Icon size={17} />{label}</Link>)}<div className="mt-5 flex flex-col gap-3 border-t pt-5">
                <Link href="/login" onClick={() => setOpen(false)} className={buttonVariants({ variant: 'outline' })}>Entrar na minha conta</Link>
                <Link href="/cadastro" onClick={() => setOpen(false)} className={buttonVariants()}>Começar teste grátis</Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
