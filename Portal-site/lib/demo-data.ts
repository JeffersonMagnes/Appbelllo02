type SupabaseClient = any;

// ──────────────────────────────────────────────
//  Helper: date arithmetic
// ──────────────────────────────────────────────
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const today = () => new Date();

// ──────────────────────────────────────────────
//  Seed
// ──────────────────────────────────────────────
export async function seedDemoData(
  supabase: SupabaseClient,
  establishmentId: string,
): Promise<void> {
  const eid = establishmentId;
  const now = today();

  // 1 ── Service Categories ──────────────────
  const categories = [
    { establishment_id: eid, name: 'Cabelo', icon: 'scissors', is_demo_data: true },
    { establishment_id: eid, name: 'Barba', icon: 'beard', is_demo_data: true },
    { establishment_id: eid, name: 'Unhas', icon: 'nail', is_demo_data: true },
    { establishment_id: eid, name: 'Estética', icon: 'spa', is_demo_data: true },
  ];

  const { data: catRows, error: catErr } = await supabase
    .from('service_categories')
    .insert(categories)
    .select('id, name');
  if (catErr) throw catErr;

  const catMap: Record<string, string> = {};
  for (const c of catRows ?? []) catMap[c.name] = c.id;

  // 2 ── Services ────────────────────────────
  const services = [
    { establishment_id: eid, name: 'Corte Masculino', price: 45, duration: 30, category: catMap['Cabelo'], is_demo_data: true },
    { establishment_id: eid, name: 'Corte Feminino', price: 65, duration: 45, category: catMap['Cabelo'], is_demo_data: true },
    { establishment_id: eid, name: 'Coloração', price: 120, duration: 90, category: catMap['Cabelo'], is_demo_data: true },
    { establishment_id: eid, name: 'Escova Progressiva', price: 180, duration: 120, category: catMap['Cabelo'], is_demo_data: true },
    { establishment_id: eid, name: 'Barba', price: 35, duration: 25, category: catMap['Barba'], is_demo_data: true },
    { establishment_id: eid, name: 'Barba + Bigode', price: 40, duration: 30, category: catMap['Barba'], is_demo_data: true },
    { establishment_id: eid, name: 'Manicure', price: 40, duration: 40, category: catMap['Unhas'], is_demo_data: true },
    { establishment_id: eid, name: 'Pedicure', price: 45, duration: 50, category: catMap['Unhas'], is_demo_data: true },
    { establishment_id: eid, name: 'Limpeza de Pele', price: 90, duration: 60, category: catMap['Estética'], is_demo_data: true },
    { establishment_id: eid, name: 'Hidratação Capilar', price: 70, duration: 45, category: catMap['Cabelo'], is_demo_data: true },
    { establishment_id: eid, name: 'Design de Sobrancelha', price: 30, duration: 20, category: catMap['Estética'], is_demo_data: true },
  ];

  const { data: svcRows, error: svcErr } = await supabase
    .from('services')
    .insert(services)
    .select('id, name');
  if (svcErr) throw svcErr;

  const svcMap: Record<string, string> = {};
  for (const s of svcRows ?? []) svcMap[s.name] = s.id;

  // 3 ── Professionals ───────────────────────
  const professionals = [
    { establishment_id: eid, name: 'Carlos Silva', specialty: 'Barbeiro', rating: 4.8, review_count: 42, is_demo_data: true },
    { establishment_id: eid, name: 'Ana Paula', specialty: 'Cabeleireira', rating: 4.9, review_count: 56, is_demo_data: true },
    { establishment_id: eid, name: 'Ricardo Santos', specialty: 'Barbeiro', rating: 4.7, review_count: 31, is_demo_data: true },
    { establishment_id: eid, name: 'Juliana Costa', specialty: 'Manicure / Estética', rating: 4.6, review_count: 28, is_demo_data: true },
  ];

  const { data: proRows, error: proErr } = await supabase
    .from('professionals')
    .insert(professionals)
    .select('id, name');
  if (proErr) throw proErr;

  const proMap: Record<string, string> = {};
  for (const p of proRows ?? []) proMap[p.name] = p.id;

  // 4 ── Employees ───────────────────────────
  const employees = [
    { establishment_id: eid, name: 'Carlos Silva', role: 'professional' as const, specialty: 'Barbeiro', phone: '(11) 99100-0001', email: 'carlos@demo.com', commission_type: 'percentage' as const, commission_value: 40, is_demo_data: true },
    { establishment_id: eid, name: 'Ana Paula', role: 'professional' as const, specialty: 'Cabeleireira', phone: '(11) 99100-0002', email: 'ana@demo.com', commission_type: 'percentage' as const, commission_value: 45, is_demo_data: true },
    { establishment_id: eid, name: 'Ricardo Santos', role: 'professional' as const, specialty: 'Barbeiro', phone: '(11) 99100-0003', email: 'ricardo@demo.com', commission_type: 'percentage' as const, commission_value: 40, is_demo_data: true },
    { establishment_id: eid, name: 'Juliana Costa', role: 'professional' as const, specialty: 'Manicure / Estética', phone: '(11) 99100-0004', email: 'juliana@demo.com', commission_type: 'percentage' as const, commission_value: 35, is_demo_data: true },
    { establishment_id: eid, name: 'Maria Souza', role: 'receptionist' as const, specialty: null, phone: '(11) 99100-0005', email: 'maria@demo.com', commission_type: 'fixed' as const, commission_value: 0, is_demo_data: true },
  ];

  const { data: empRows, error: empErr } = await supabase
    .from('employees')
    .insert(employees)
    .select('id, name');
  if (empErr) throw empErr;

  const empMap: Record<string, string> = {};
  for (const e of empRows ?? []) empMap[e.name] = e.id;

  // 5 ── Clients ─────────────────────────────
  const clients = [
    { establishment_id: eid, name: 'Lucas Oliveira', phone: '(11) 98200-1001', email: 'lucas.oliveira@email.com', is_demo_data: true },
    { establishment_id: eid, name: 'Fernanda Lima', phone: '(11) 98200-1002', email: 'fernanda.lima@email.com', is_demo_data: true },
    { establishment_id: eid, name: 'Pedro Henrique', phone: '(11) 98200-1003', email: 'pedro.h@email.com', is_demo_data: true },
    { establishment_id: eid, name: 'Camila Rodrigues', phone: '(11) 98200-1004', email: 'camila.r@email.com', is_demo_data: true },
    { establishment_id: eid, name: 'Rafael Almeida', phone: '(11) 98200-1005', email: 'rafael.a@email.com', is_demo_data: true },
  ];

  const { data: cliRows, error: cliErr } = await supabase
    .from('clients')
    .insert(clients)
    .select('id, name');
  if (cliErr) throw cliErr;

  const cliMap: Record<string, string> = {};
  for (const c of cliRows ?? []) cliMap[c.name] = c.id;
  const clientIds = (cliRows ?? []).map((c: any) => c.id);

  // 6 ── Products ────────────────────────────
  const products = [
    { establishment_id: eid, name: 'Pomada Modeladora', price: 45, cost_price: 18, stock: 24, min_stock: 5, category: 'Cabelo', is_demo_data: true },
    { establishment_id: eid, name: 'Óleo para Barba', price: 38, cost_price: 14, stock: 18, min_stock: 4, category: 'Barba', is_demo_data: true },
    { establishment_id: eid, name: 'Shampoo Profissional', price: 32, cost_price: 12, stock: 30, min_stock: 8, category: 'Cabelo', is_demo_data: true },
    { establishment_id: eid, name: 'Condicionador Hidratante', price: 35, cost_price: 13, stock: 22, min_stock: 6, category: 'Cabelo', is_demo_data: true },
    { establishment_id: eid, name: 'Cera Capilar Matte', price: 42, cost_price: 16, stock: 15, min_stock: 4, category: 'Cabelo', is_demo_data: true },
    { establishment_id: eid, name: 'Esmalte Premium', price: 18, cost_price: 7, stock: 40, min_stock: 10, category: 'Unhas', is_demo_data: true },
  ];

  const { data: prodRows, error: prodErr } = await supabase
    .from('products')
    .insert(products)
    .select('id, name, price');
  if (prodErr) throw prodErr;

  const prodMap: Record<string, { id: string; price: number }> = {};
  for (const p of prodRows ?? []) prodMap[p.name] = { id: p.id, price: p.price };

  // 7 ── Appointments ────────────────────────
  const svcList = svcRows ?? [];
  const empIds = Object.values(empMap).filter(
    (id) => id !== empMap['Maria Souza'],
  );
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  const appointments: Array<{
    establishment_id: string;
    client_id: string;
    employee_id: string;
    service_id: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    client_name: string;
    is_demo_data: boolean;
  }> = [];

  // 20 past completed (last 14 days)
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 14) + 1;
    const clientIdx = i % clientIds.length;
    const svc = svcList[i % svcList.length];
    const emp = empIds[i % empIds.length];
    const clientName = (cliRows ?? [])[clientIdx].name;
    appointments.push({
      establishment_id: eid,
      client_id: clientIds[clientIdx],
      employee_id: emp,
      service_id: svc.id,
      date: fmt(addDays(now, -daysAgo)),
      time: times[i % times.length],
      status: 'completed',
      client_name: clientName,
      is_demo_data: true,
    });
  }

  // 5 today confirmed
  for (let i = 0; i < 5; i++) {
    const clientIdx = i % clientIds.length;
    const svc = svcList[(i + 3) % svcList.length];
    const emp = empIds[i % empIds.length];
    const clientName = (cliRows ?? [])[clientIdx].name;
    appointments.push({
      establishment_id: eid,
      client_id: clientIds[clientIdx],
      employee_id: emp,
      service_id: svc.id,
      date: fmt(now),
      time: times[i + 4],
      status: 'confirmed',
      client_name: clientName,
      is_demo_data: true,
    });
  }

  // 5 future pending (next 7 days)
  for (let i = 0; i < 5; i++) {
    const daysAhead = Math.floor(Math.random() * 7) + 1;
    const clientIdx = i % clientIds.length;
    const svc = svcList[(i + 6) % svcList.length];
    const emp = empIds[i % empIds.length];
    const clientName = (cliRows ?? [])[clientIdx].name;
    appointments.push({
      establishment_id: eid,
      client_id: clientIds[clientIdx],
      employee_id: emp,
      service_id: svc.id,
      date: fmt(addDays(now, daysAhead)),
      time: times[i + 8],
      status: 'pending',
      client_name: clientName,
      is_demo_data: true,
    });
  }

  const { error: aptErr } = await supabase.from('appointments').insert(appointments);
  if (aptErr) throw aptErr;

  // 8 ── Transactions (income from completed) ──
  const payMethods: Array<'cash' | 'credit' | 'debit' | 'pix'> = ['pix', 'credit', 'debit', 'cash'];
  const completedApts = appointments.filter((a) => a.status === 'completed');

  const transactions = completedApts.slice(0, 7).map((apt, i) => {
    const svc = svcList.find((s: any) => s.id === apt.service_id);
    const price = services.find((s: any) => s.name === svc?.name)?.price ?? 45;
    return {
      establishment_id: eid,
      type: 'income' as const,
      category: 'Serviço',
      description: `${svc?.name ?? 'Serviço'} - ${apt.client_name}`,
      amount: price,
      payment_method: payMethods[i % payMethods.length],
      date: apt.date,
      employee_id: apt.employee_id,
      client_id: apt.client_id,
      status: 'paid' as const,
      is_demo_data: true,
    };
  });

  const { error: txErr } = await supabase.from('transactions').insert(transactions);
  if (txErr) throw txErr;

  // 9 ── Comandas ────────────────────────────
  const comandas = [
    {
      establishment_id: eid,
      client_id: clientIds[0],
      employee_id: empIds[0],
      status: 'open',
      total: 0, // will be updated after items
      is_demo_data: true,
    },
    {
      establishment_id: eid,
      client_id: clientIds[1],
      employee_id: empIds[1],
      status: 'paid',
      total: 0,
      is_demo_data: true,
    },
  ];

  const { data: cmdRows, error: cmdErr } = await supabase
    .from('comandas')
    .insert(comandas)
    .select('id, status');
  if (cmdErr) throw cmdErr;

  const cmdIds = (cmdRows ?? []).map((c: any) => c.id);

  // 10 ── Comanda Items (3 each) ─────────────
  const svcArr = Object.entries(svcMap);
  const prodArr = Object.entries(prodMap);

  const comandaItems = [
    // Comanda 1 (open): 2 services + 1 product
    { comanda_id: cmdIds[0], service_id: svcArr[0]?.[1] ?? null, product_id: null, name: svcArr[0]?.[0] ?? 'Corte', quantity: 1, price: services[0].price, is_demo_data: true },
    { comanda_id: cmdIds[0], service_id: svcArr[4]?.[1] ?? null, product_id: null, name: svcArr[4]?.[0] ?? 'Barba', quantity: 1, price: services[4].price, is_demo_data: true },
    { comanda_id: cmdIds[0], service_id: null, product_id: prodArr[0]?.[1]?.id ?? null, name: prodArr[0]?.[0] ?? 'Pomada', quantity: 1, price: prodArr[0]?.[1]?.price ?? 45, is_demo_data: true },
    // Comanda 2 (paid): 2 services + 1 product
    { comanda_id: cmdIds[1], service_id: svcArr[1]?.[1] ?? null, product_id: null, name: svcArr[1]?.[0] ?? 'Corte Feminino', quantity: 1, price: services[1].price, is_demo_data: true },
    { comanda_id: cmdIds[1], service_id: svcArr[9]?.[1] ?? null, product_id: null, name: svcArr[9]?.[0] ?? 'Hidratação', quantity: 1, price: services[9].price, is_demo_data: true },
    { comanda_id: cmdIds[1], service_id: null, product_id: prodArr[2]?.[1]?.id ?? null, name: prodArr[2]?.[0] ?? 'Shampoo', quantity: 1, price: prodArr[2]?.[1]?.price ?? 32, is_demo_data: true },
  ];

  const { error: ciErr } = await supabase.from('comanda_items').insert(comandaItems);
  if (ciErr) throw ciErr;

  // Update comanda totals
  const cmd1Total = comandaItems.filter((ci) => ci.comanda_id === cmdIds[0]).reduce((s, ci) => s + ci.price * ci.quantity, 0);
  const cmd2Total = comandaItems.filter((ci) => ci.comanda_id === cmdIds[1]).reduce((s, ci) => s + ci.price * ci.quantity, 0);

  await supabase.from('comandas').update({ total: cmd1Total }).eq('id', cmdIds[0]);
  await supabase.from('comandas').update({ total: cmd2Total }).eq('id', cmdIds[1]);

  // Mark establishment
  await supabase.from('establishments').update({ has_demo_data: true }).eq('id', eid);
}

// ──────────────────────────────────────────────
//  Clear (reverse FK order)
// ──────────────────────────────────────────────
export async function clearDemoData(
  supabase: SupabaseClient,
  establishmentId: string,
): Promise<void> {
  const eid = establishmentId;

  // Comanda items: need comanda ids first
  const { data: demoComandas } = await supabase
    .from('comandas')
    .select('id')
    .eq('establishment_id', eid)
    .eq('is_demo_data', true);

  const comandaIds = (demoComandas ?? []).map((c: any) => c.id);
  if (comandaIds.length > 0) {
    await supabase.from('comanda_items').delete().in('comanda_id', comandaIds);
  }

  // Reverse FK-safe order
  const tables = [
    'comandas',
    'transactions',
    'appointments',
    'products',
    'clients',
    'employees',
    'professionals',
    'services',
    'service_categories',
  ] as const;

  for (const table of tables) {
    await supabase
      .from(table)
      .delete()
      .eq('establishment_id', eid)
      .eq('is_demo_data', true);
  }

  // Unmark establishment
  await supabase
    .from('establishments')
    .update({ has_demo_data: false })
    .eq('id', eid);
}

// ──────────────────────────────────────────────
//  Check
// ──────────────────────────────────────────────
export async function checkHasDemoData(
  supabase: SupabaseClient,
  establishmentId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('establishments')
    .select('has_demo_data')
    .eq('id', establishmentId)
    .single();

  return data?.has_demo_data === true;
}
