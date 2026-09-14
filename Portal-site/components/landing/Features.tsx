const benefits = [
  ['01', 'Organize o atendimento', 'Horários, clientes e profissionais reunidos para você preparar o dia com clareza.'],
  ['02', 'Acompanhe a operação', 'Do serviço à comanda, consulte o que está em andamento e os recebimentos registrados.'],
  ['03', 'Decida com contexto', 'Veja entradas, despesas e quantidades em estoque para planejar os próximos passos.'],
];
export default function Features() {
  return <section id="recursos" className="bg-white py-14"><div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-3">{benefits.map(([n,title,text]) => <div key={n} className="border-t border-[#dedeee] pt-5"><span className="text-xs font-semibold text-[#5959b5]">{n} / GESTÃO NA PRÁTICA</span><h2 className="mt-3 text-xl font-semibold text-gray-900">{title}</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p></div>)}</div></section>;
}
