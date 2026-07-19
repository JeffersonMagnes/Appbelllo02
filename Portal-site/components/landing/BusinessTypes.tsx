import Link from 'next/link';
import { ArrowRight, Scissor, MagicStar, Tree, Star1 } from 'iconsax-react';

const types = [
  {
    title: 'Salão de Beleza',
    slug: 'salao-de-beleza',
    description: 'Controle total de agendamentos, equipe e fidelização de clientes.',
    image: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=700',
    tag: 'Mais popular',
    features: ['Agendamento online 24h', 'Gestão de equipe', 'Fidelização de clientes'],
    icon: Scissor,
    color: 'from-pink-500 to-rose-400',
  },
  {
    title: 'Barbearia',
    slug: 'barbearia',
    description: 'Organize sua agenda e equipe para vender mais com menos esforço.',
    image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=700',
    tag: 'Trending',
    features: ['Fila de espera digital', 'Controle de comissões', 'App para clientes'],
    icon: Star1,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Clínica de Estética',
    slug: 'clinica-de-estetica',
    description: 'Gerencie profissionais e atraia mais clientes para sua clínica.',
    image: 'https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=700',
    tag: 'Completo',
    features: ['Prontuário digital', 'Lembretes automáticos', 'Relatórios financeiros'],
    icon: Tree,
    color: 'from-emerald-500 to-teal-400',
  },
  {
    title: 'Studios',
    slug: 'studios',
    description: 'Perfeito para studios de pilates, yoga, nail art e muito mais.',
    image: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=700',
    tag: 'Novo',
    features: ['Aulas em grupo', 'Pacotes e mensalidades', 'Check-in digital'],
    icon: MagicStar,
    color: 'from-amber-500 to-orange-400',
  },
];

export default function BusinessTypes() {
  return (
    <section id="negocios" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Para o seu negócio
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Feito para todos os negócios<br className="hidden sm:block" /> de beleza e bem-estar
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Escolha o seu tipo de negócio e descubra como o Appbello pode transformar sua gestão.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.title}
                href={`/negocios/${type.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/2' }}>
                  <img
                    src={type.image}
                    alt={type.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-3 left-3 text-xs font-bold text-white bg-gradient-to-r ${type.color} px-2.5 py-1 rounded-full`}>
                    {type.tag}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{type.title}</h3>
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed mb-3">{type.description}</p>

                  <ul className="space-y-1.5 mb-4 flex-1">
                    {type.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <div className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs group-hover:gap-2 transition-all mt-auto">
                    Ver detalhes <ArrowRight className="w-3 h-3"  variant="Outline" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
