import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex font-outfit">

      {/* ── Painel esquerdo ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] h-screen sticky top-0 bg-white flex-col px-10 py-10 relative overflow-hidden">

        {/* Card da imagem — ocupa todo o espaço com margem harmoniosa */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[85%] rounded-3xl overflow-hidden shadow-xl" style={{ height: '85%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Banner.png"
              alt="Profissional Appbello"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

      </div>

      {/* ── Painel direito — formulário ─────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white border-l border-gray-100">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center px-6 py-4 border-b border-gray-100">
          <Link href="/">
            <Image src="/logo.png" alt="Appbello" width={110} height={36} className="h-9 w-auto" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-10 lg:px-16">
          <div className="w-full max-w-[400px]">

            <div className="hidden lg:block mb-8">
              <Link href="/">
                <Image src="/logo.png" alt="Appbello" width={180} height={60} className="h-16 w-auto" />
              </Link>
            </div>

            <div className="mb-7">
              <h1 className="text-[28px] font-extrabold text-gray-900 mb-1.5 tracking-tight">{title}</h1>
              <p className="text-gray-500 text-sm">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>

    </div>
  );
}
