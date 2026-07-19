const testimonials = [
  {
    quote: 'O Appbello transformou completamente minha rotina. Antes eu perdia horas com agendamentos no telefone. Agora tudo é automático e meus clientes adoram poder agendar online!',
    name: 'ANA PAULA FERREIRA',
    business: 'Salão Beleza & Arte',
  },
  {
    quote: 'O controle financeiro é incrível. Agora sei exatamente quanto ganhei, quais serviços vendem mais e onde posso melhorar. Meu faturamento cresceu 40% em 3 meses com o Appbello!',
    name: 'CARLOS EDUARDO MENDES',
    business: 'Barbearia Vintage',
  },
  {
    quote: 'A gestão de equipe com comissões automáticas me economiza horas por semana. E o suporte é excelente — qualquer dúvida é respondida rapidamente.',
    name: 'MARIANA COSTA',
    business: 'Clínica Estética Harmonia',
  },
];

let current = 0;

export default function Testimonials() {
  const t = testimonials[0];

  return (
    <section id="depoimentos" className="py-20 bg-[#fdf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left heading */}
          <div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Quem inova em beleza e bem-estar conta com o Appbello
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#6666cc]" />
            </div>
          </div>

          {/* Right — testimonial card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-5xl text-[#6666cc] font-serif leading-none mb-4">&ldquo;</div>
            <p className="text-gray-700 text-lg leading-relaxed mb-8 italic">
              {t.quote}
            </p>
            <div className="flex items-center gap-4">
              <div>
                <div className="font-bold text-gray-900 text-sm tracking-wide">{t.name}</div>
                <div className="text-gray-500 text-sm">{t.business}</div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === 0 ? 'w-6 h-2 bg-[#6666cc]' : 'w-2 h-2 bg-gray-200'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
