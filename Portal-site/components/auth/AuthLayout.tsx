import Link from 'next/link';
import Image from 'next/image';
import ProductPreview from '@/components/landing/ProductPreview';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="auth-shell min-h-screen bg-white font-outfit lg:grid lg:grid-cols-2">
      <aside className="hidden min-h-screen flex-col justify-center border-r border-[#e5e5ef] bg-[#f8f8fc] px-10 py-10 lg:flex xl:px-16">
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5959b5]">Beleza na rotina. Clareza na gestão.</p>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-[#23233f]">Seu negócio merece<br />uma rotina mais leve.</h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-gray-600">Da primeira reserva ao fechamento do dia, organize agenda, clientes e financeiro com o AppBello.</p>
          <ProductPreview />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3 lg:border-0 lg:px-10 lg:py-6">
          <Link href="/" aria-label="AppBello — início">
            <Image src="/logo.png" alt="AppBello" width={132} height={54} className="h-auto w-[132px]" priority />
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-[#5959b5]">Voltar ao site</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-gray-900">{title}</h1>
              <p className="text-sm leading-relaxed text-gray-600">{subtitle}</p>
            </div>{children}</div>
        </div>
        <div className="flex justify-center gap-5 px-5 py-6 text-xs text-gray-500">
          <Link href="/privacidade" className="hover:underline">Privacidade</Link>
          <Link href="/termos" className="hover:underline">Termos de uso</Link>
        </div>
      </div>
    </div>
  );
}
