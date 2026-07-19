import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://appbello-portal.netlify.app'),
  title: 'Appbello — Gerencie seu salão com inteligência',
  description: 'Plataforma completa de gestão para salões de beleza, barbearias e clínicas estéticas. Agendamentos, clientes, financeiro e muito mais.',
  manifest: '/manifest.json',
  themeColor: '#5333ED',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Appbello',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Appbello — Gerencie seu salão com inteligência',
    description: 'Plataforma completa de gestão para salões de beleza, barbearias e clínicas estéticas.',
    images: [{ url: '/Banner.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/Banner.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-outfit antialiased">{children}</body>
    </html>
  );
}
