'use client';

import Link from 'next/link';
import { Clock, Tag } from 'iconsax-react';

const posts = [
  {
    category: 'Gestão',
    readTime: '5 min',
    date: '18 abr 2026',
    title: 'Planejamento estratégico para salão: metas e como aplicar!',
    excerpt:
      '2026 já está na porta. Se você sente que o seu negócio de beleza está pronto para crescer, esse é o momento de encarar a gestão de frente.',
    image:
      'https://images.pexels.com/photos/3992869/pexels-photo-3992869.jpeg?auto=compress&cs=tinysrgb&w=600',
    href: '#',
  },
  {
    category: 'Marketing',
    readTime: '7 min',
    date: '12 abr 2026',
    title: 'O que é Marketing Digital? Guia completo para sucesso online!',
    excerpt:
      'Marketing Digital é tudo o que você faz na internet para atrair clientes e manter sua agenda cheia: posts, agendamento online, WhatsApp e muito mais.',
    image:
      'https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=600',
    href: '#',
  },
  {
    category: 'Gestão',
    readTime: '6 min',
    date: '05 abr 2026',
    title: 'Benchmarking: o que é e como aplicar em seu negócio!',
    excerpt:
      'Se você olha pro seu negócio de beleza e sente que dá pra crescer mais, mas não sabe por onde começar, o benchmarking pode ser a virada de chave.',
    image:
      'https://images.pexels.com/photos/3760373/pexels-photo-3760373.jpeg?auto=compress&cs=tinysrgb&w=600',
    href: '#',
  },
];

export default function Blog() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Últimos conteúdos do nosso blog
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gray-300" />
            <div className="w-2 h-2 rounded-full bg-[#6666cc]" />
            <div className="h-px w-12 bg-gray-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {posts.map((post) => (
            <article
              key={post.title}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#6666cc] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3"  variant="Outline" />
                  {post.category}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3"  variant="Outline" />
                    {post.readTime} de leitura
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-3">
                  {post.excerpt}
                </p>
                <Link
                  href={post.href}
                  className="text-xs font-semibold text-[#6666cc] hover:text-[#5555aa] transition-colors">
                  Continuar leitura →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="#"
            className="inline-block bg-[#6666cc] hover:bg-[#5555aa] text-white font-bold text-sm px-8 py-3 rounded-full transition-colors">
            Confira mais conteúdos exclusivos
          </Link>
        </div>
      </div>
    </section>
  );
}
