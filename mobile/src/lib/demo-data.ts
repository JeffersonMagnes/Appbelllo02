// Appbello - Demo Data Seed / Clear / Check
//
// Inserts realistic Brazilian-Portuguese demo data into Supabase for a given
// establishment, and provides utilities to clear it or check if it exists.
//
// Every row inserted carries `is_demo_data: true` so it can be surgically
// removed without affecting real data.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Return a random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

/** Generate a time string HH:MM between 08:00 and 18:00 in 30-min slots */
function randomTimeSlot(): string {
  const slots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00',
  ];
  return pick(slots);
}

/** Subtract `days` from now and return a new Date */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Add `days` to now and return a new Date */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
// seedDemoData
// ---------------------------------------------------------------------------

export async function seedDemoData(
  supabase: any,
  establishmentId: string,
): Promise<void> {
  // ------------------------------------------------------------------
  // 1. Service Categories (4)
  // ------------------------------------------------------------------
  const { data: categories, error: catErr } = await supabase
    .from('service_categories')
    .insert([
      { establishment_id: establishmentId, name: 'Cabelo', icon: 'scissors', is_demo_data: true },
      { establishment_id: establishmentId, name: 'Barba', icon: 'user', is_demo_data: true },
      { establishment_id: establishmentId, name: 'Unhas', icon: 'sparkles', is_demo_data: true },
      { establishment_id: establishmentId, name: 'Estética', icon: 'heart', is_demo_data: true },
    ])
    .select();

  if (catErr) throw new Error(`seed service_categories: ${catErr.message}`);

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    catMap[c.name] = c.id;
  }

  // ------------------------------------------------------------------
  // 2. Services (11)
  // ------------------------------------------------------------------
  const serviceRows = [
    { name: 'Corte Masculino', description: 'Corte moderno com acabamento perfeito', duration: 30, price: 45, category: catMap['Cabelo'] },
    { name: 'Corte Feminino', description: 'Corte personalizado de acordo com seu estilo', duration: 45, price: 65, category: catMap['Cabelo'] },
    { name: 'Escova Modeladora', description: 'Escova com finalização profissional', duration: 40, price: 50, category: catMap['Cabelo'] },
    { name: 'Coloração', description: 'Tintura completa com produtos de qualidade', duration: 90, price: 120, category: catMap['Cabelo'] },
    { name: 'Barba Completa', description: 'Barba modelada com toalha quente e produtos premium', duration: 25, price: 35, category: catMap['Barba'] },
    { name: 'Corte + Barba', description: 'Combo completo para você ficar impecável', duration: 60, price: 70, category: catMap['Barba'] },
    { name: 'Pigmentação de Barba', description: 'Cobertura de falhas e fios brancos', duration: 45, price: 55, category: catMap['Barba'] },
    { name: 'Manicure', description: 'Cuidado completo para suas unhas', duration: 40, price: 40, category: catMap['Unhas'] },
    { name: 'Pedicure', description: 'Tratamento completo para os pés', duration: 50, price: 50, category: catMap['Unhas'] },
    { name: 'Mani + Pedi', description: 'Combo completo mãos e pés', duration: 90, price: 80, category: catMap['Unhas'] },
    { name: 'Hidratação Profunda', description: 'Tratamento intensivo para fios danificados', duration: 60, price: 80, category: catMap['Estética'] },
  ];

  const { data: services, error: svcErr } = await supabase
    .from('services')
    .insert(
      serviceRows.map((s) => ({
        establishment_id: establishmentId,
        is_demo_data: true,
        ...s,
      })),
    )
    .select();

  if (svcErr) throw new Error(`seed services: ${svcErr.message}`);

  // Build a name->id lookup for services
  const svcByName: Record<string, string> = {};
  for (const s of services) {
    svcByName[s.name] = s.id;
  }

  // ------------------------------------------------------------------
  // 3. Professionals (4)
  // ------------------------------------------------------------------
  const profRows = [
    { name: 'Carlos Silva', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', specialty: 'Barbeiro Master', rating: 4.9, review_count: 127 },
    { name: 'Ana Paula', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', specialty: 'Hair Stylist', rating: 4.8, review_count: 89 },
    { name: 'Ricardo Santos', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', specialty: 'Barbeiro', rating: 4.7, review_count: 64 },
    { name: 'Juliana Costa', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', specialty: 'Manicure & Pedicure', rating: 4.9, review_count: 156 },
  ];

  const { data: professionals, error: profErr } = await supabase
    .from('professionals')
    .insert(
      profRows.map((p) => ({
        establishment_id: establishmentId,
        is_demo_data: true,
        ...p,
      })),
    )
    .select();

  if (profErr) throw new Error(`seed professionals: ${profErr.message}`);

  const profByName: Record<string, string> = {};
  for (const p of professionals) {
    profByName[p.name] = p.id;
  }

  // Link professionals <-> services
  const profServiceLinks = [
    // Carlos: Corte Masculino, Barba Completa, Corte + Barba, Pigmentação
    { professional_id: profByName['Carlos Silva'], service_id: svcByName['Corte Masculino'] },
    { professional_id: profByName['Carlos Silva'], service_id: svcByName['Barba Completa'] },
    { professional_id: profByName['Carlos Silva'], service_id: svcByName['Corte + Barba'] },
    { professional_id: profByName['Carlos Silva'], service_id: svcByName['Pigmentação de Barba'] },
    // Ana Paula: Corte Feminino, Escova, Coloração, Hidratação
    { professional_id: profByName['Ana Paula'], service_id: svcByName['Corte Feminino'] },
    { professional_id: profByName['Ana Paula'], service_id: svcByName['Escova Modeladora'] },
    { professional_id: profByName['Ana Paula'], service_id: svcByName['Coloração'] },
    { professional_id: profByName['Ana Paula'], service_id: svcByName['Hidratação Profunda'] },
    // Ricardo: Corte Masculino, Barba Completa, Corte + Barba
    { professional_id: profByName['Ricardo Santos'], service_id: svcByName['Corte Masculino'] },
    { professional_id: profByName['Ricardo Santos'], service_id: svcByName['Barba Completa'] },
    { professional_id: profByName['Ricardo Santos'], service_id: svcByName['Corte + Barba'] },
    // Juliana: Manicure, Pedicure, Mani+Pedi
    { professional_id: profByName['Juliana Costa'], service_id: svcByName['Manicure'] },
    { professional_id: profByName['Juliana Costa'], service_id: svcByName['Pedicure'] },
    { professional_id: profByName['Juliana Costa'], service_id: svcByName['Mani + Pedi'] },
  ];

  await supabase.from('professional_services').insert(profServiceLinks);

  // ------------------------------------------------------------------
  // 4. Employees (5) — the 4 professionals + 1 recepcionista
  // ------------------------------------------------------------------
  const employeeRows = [
    { name: 'Carlos Silva', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', role: 'professional' as const, specialty: 'Barbeiro Master', phone: '(11) 99999-1111', email: 'carlos@appbello.com', commission_type: 'percentage' as const, commission_value: 40, hire_date: '2023-01-15' },
    { name: 'Ana Paula', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', role: 'professional' as const, specialty: 'Hair Stylist', phone: '(11) 99999-2222', email: 'ana@appbello.com', commission_type: 'percentage' as const, commission_value: 45, hire_date: '2023-03-20' },
    { name: 'Ricardo Santos', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', role: 'professional' as const, specialty: 'Barbeiro', phone: '(11) 99999-3333', email: 'ricardo@appbello.com', commission_type: 'percentage' as const, commission_value: 40, hire_date: '2023-06-10' },
    { name: 'Juliana Costa', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', role: 'professional' as const, specialty: 'Manicure & Pedicure', phone: '(11) 99999-4444', email: 'juliana@appbello.com', commission_type: 'percentage' as const, commission_value: 50, hire_date: '2023-02-01' },
    { name: 'Maria Souza', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', role: 'admin' as const, specialty: null, phone: '(11) 99999-5555', email: 'maria@appbello.com', commission_type: 'fixed' as const, commission_value: 0, hire_date: '2023-04-15' },
  ];

  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .insert(
      employeeRows.map((e) => ({
        establishment_id: establishmentId,
        is_demo_data: true,
        ...e,
      })),
    )
    .select();

  if (empErr) throw new Error(`seed employees: ${empErr.message}`);

  const empByName: Record<string, string> = {};
  for (const e of employees) {
    empByName[e.name] = e.id;
  }

  // ------------------------------------------------------------------
  // 5. Clients (5)
  // ------------------------------------------------------------------
  const clientRows = [
    { name: 'João Pedro Almeida', email: 'joao.pedro@email.com', phone: '(11) 98888-1111', birth_date: '1990-05-15', notes: 'Cliente VIP - sempre pontual' },
    { name: 'Maria Clara Santos', email: 'maria.clara@email.com', phone: '(11) 98888-2222', birth_date: '1985-11-20', notes: 'Prefere horários pela manhã' },
    { name: 'Lucas Ferreira', email: 'lucas.f@email.com', phone: '(11) 98888-3333', birth_date: '1995-03-08', notes: null },
    { name: 'Fernanda Lima', email: 'fernanda.lima@email.com', phone: '(11) 98888-4444', birth_date: '1988-07-30', notes: 'Alergia a amônia' },
    { name: 'Roberto Gomes', email: 'roberto.g@email.com', phone: '(11) 98888-5555', birth_date: '1992-12-12', notes: null },
  ];

  const { data: clients, error: cliErr } = await supabase
    .from('clients')
    .insert(
      clientRows.map((c) => ({
        establishment_id: establishmentId,
        is_demo_data: true,
        ...c,
      })),
    )
    .select();

  if (cliErr) throw new Error(`seed clients: ${cliErr.message}`);

  const clientIds = clients.map((c: any) => c.id);

  // ------------------------------------------------------------------
  // 6. Products (6)
  // ------------------------------------------------------------------
  const productRows = [
    { name: 'Pomada Modeladora', description: 'Pomada para cabelo com fixação forte', price: 45, cost_price: 22, stock: 15, min_stock: 5, category: 'Cabelo' },
    { name: 'Óleo para Barba', description: 'Óleo hidratante para barba', price: 38, cost_price: 18, stock: 12, min_stock: 3, category: 'Barba' },
    { name: 'Shampoo Premium', description: 'Shampoo profissional 500ml', price: 32, cost_price: 15, stock: 8, min_stock: 5, category: 'Cabelo' },
    { name: 'Cera Capilar', description: 'Cera modeladora matte', price: 38, cost_price: 18, stock: 20, min_stock: 8, category: 'Cabelo' },
    { name: 'Esmalte Premium', description: 'Esmalte longa duração', price: 25, cost_price: 12, stock: 25, min_stock: 10, category: 'Unhas' },
    { name: 'Balm para Barba', description: 'Balm hidratante e modelador', price: 48, cost_price: 24, stock: 6, min_stock: 4, category: 'Barba' },
  ];

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .insert(
      productRows.map((p) => ({
        establishment_id: establishmentId,
        is_demo_data: true,
        ...p,
      })),
    )
    .select();

  if (prodErr) throw new Error(`seed products: ${prodErr.message}`);

  const productIds = products.map((p: any) => p.id);

  // ------------------------------------------------------------------
  // 7. Appointments (30)
  //    20 past (completed), 5 today (confirmed), 5 future (pending)
  // ------------------------------------------------------------------
  const serviceIds = services.map((s: any) => s.id);
  const employeeProfIds = employees
    .filter((e: any) => e.role === 'professional')
    .map((e: any) => e.id);

  const appointmentRows: any[] = [];

  // 20 past appointments (last 30 days) - completed
  for (let i = 0; i < 20; i++) {
    const pastDate = daysAgo(randInt(1, 30));
    const clientId = pick(clientIds);
    const client = clients.find((c: any) => c.id === clientId);
    appointmentRows.push({
      establishment_id: establishmentId,
      client_id: clientId,
      client_name: client?.name ?? null,
      employee_id: pick(employeeProfIds),
      service_id: pick(serviceIds),
      date: formatDate(pastDate),
      time: randomTimeSlot(),
      status: 'completed',
      is_demo_data: true,
    });
  }

  // 5 today - confirmed
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const clientId = pick(clientIds);
    const client = clients.find((c: any) => c.id === clientId);
    appointmentRows.push({
      establishment_id: establishmentId,
      client_id: clientId,
      client_name: client?.name ?? null,
      employee_id: pick(employeeProfIds),
      service_id: pick(serviceIds),
      date: formatDate(today),
      time: randomTimeSlot(),
      status: 'confirmed',
      is_demo_data: true,
    });
  }

  // 5 future (next 7 days) - pending
  for (let i = 0; i < 5; i++) {
    const futureDate = daysFromNow(randInt(1, 7));
    const clientId = pick(clientIds);
    const client = clients.find((c: any) => c.id === clientId);
    appointmentRows.push({
      establishment_id: establishmentId,
      client_id: clientId,
      client_name: client?.name ?? null,
      employee_id: pick(employeeProfIds),
      service_id: pick(serviceIds),
      date: formatDate(futureDate),
      time: randomTimeSlot(),
      status: 'pending',
      is_demo_data: true,
    });
  }

  const { data: appointments, error: apptErr } = await supabase
    .from('appointments')
    .insert(appointmentRows)
    .select();

  if (apptErr) throw new Error(`seed appointments: ${apptErr.message}`);

  // ------------------------------------------------------------------
  // 8. Transactions (7) — income from completed appointments
  // ------------------------------------------------------------------
  const completedAppts = appointments.filter(
    (a: any) => a.status === 'completed',
  );

  const paymentMethods: Array<'pix' | 'credit' | 'debit' | 'cash'> = [
    'pix', 'credit', 'debit', 'cash',
  ];

  const transactionRows: any[] = [];
  // Pick 7 completed appointments for transactions
  const apptSlice = completedAppts.slice(0, 7);
  for (const appt of apptSlice) {
    const svc = services.find((s: any) => s.id === appt.service_id);
    const client = clients.find((c: any) => c.id === appt.client_id);
    const svcName = svc?.name ?? 'Serviço';
    const clientName = client?.name ?? 'Cliente';
    transactionRows.push({
      establishment_id: establishmentId,
      type: 'income',
      category: 'Serviço',
      description: `${svcName} - ${clientName}`,
      amount: svc?.price ?? 50,
      payment_method: pick(paymentMethods),
      date: appt.date,
      employee_id: appt.employee_id,
      client_id: appt.client_id,
      status: 'paid',
      is_demo_data: true,
    });
  }

  const { error: txErr } = await supabase
    .from('transactions')
    .insert(transactionRows);

  if (txErr) throw new Error(`seed transactions: ${txErr.message}`);

  // ------------------------------------------------------------------
  // 9. Comandas (2)
  // ------------------------------------------------------------------
  const { data: comandas, error: cmdErr } = await supabase
    .from('comandas')
    .insert([
      {
        establishment_id: establishmentId,
        client_id: clientIds[0],
        employee_id: empByName['Carlos Silva'],
        status: 'open',
        total: 115,
        is_demo_data: true,
      },
      {
        establishment_id: establishmentId,
        client_id: clientIds[1],
        employee_id: empByName['Ana Paula'],
        status: 'paid',
        total: 130,
        is_demo_data: true,
      },
    ])
    .select();

  if (cmdErr) throw new Error(`seed comandas: ${cmdErr.message}`);

  // ------------------------------------------------------------------
  // 10. Comanda Items (6) — 3 per comanda
  // ------------------------------------------------------------------
  const comandaItemRows = [
    // Comanda 1 (open) - Corte + Barba + Pomada
    {
      comanda_id: comandas[0].id,
      service_id: svcByName['Corte + Barba'],
      product_id: null,
      name: 'Corte + Barba',
      quantity: 1,
      price: 70,
      is_demo_data: true,
    },
    {
      comanda_id: comandas[0].id,
      service_id: null,
      product_id: productIds[0], // Pomada Modeladora
      name: 'Pomada Modeladora',
      quantity: 1,
      price: 45,
      is_demo_data: true,
    },
    {
      comanda_id: comandas[0].id,
      service_id: null,
      product_id: productIds[1], // Óleo para Barba
      name: 'Óleo para Barba',
      quantity: 1,
      price: 38,
      is_demo_data: true,
    },
    // Comanda 2 (paid) - Escova + Coloração + Shampoo
    {
      comanda_id: comandas[1].id,
      service_id: svcByName['Escova Modeladora'],
      product_id: null,
      name: 'Escova Modeladora',
      quantity: 1,
      price: 50,
      is_demo_data: true,
    },
    {
      comanda_id: comandas[1].id,
      service_id: svcByName['Hidratação Profunda'],
      product_id: null,
      name: 'Hidratação Profunda',
      quantity: 1,
      price: 80,
      is_demo_data: true,
    },
    {
      comanda_id: comandas[1].id,
      service_id: null,
      product_id: productIds[2], // Shampoo Premium
      name: 'Shampoo Premium',
      quantity: 1,
      price: 32,
      is_demo_data: true,
    },
  ];

  const { error: ciErr } = await supabase
    .from('comanda_items')
    .insert(comandaItemRows);

  if (ciErr) throw new Error(`seed comanda_items: ${ciErr.message}`);

  // ------------------------------------------------------------------
  // Mark establishment as having demo data
  // ------------------------------------------------------------------
  const { error: estErr } = await supabase
    .from('establishments')
    .update({ has_demo_data: true })
    .eq('id', establishmentId);

  if (estErr) throw new Error(`seed establishments flag: ${estErr.message}`);
}

// ---------------------------------------------------------------------------
// clearDemoData
// ---------------------------------------------------------------------------

export async function clearDemoData(
  supabase: any,
  establishmentId: string,
): Promise<void> {
  // Delete in reverse FK order to avoid constraint violations.
  const tables = [
    'comanda_items',
    'comandas',
    'transactions',
    'appointments',
    'products',
    'clients',
    'employees',
    'professional_services', // junction table — no is_demo_data, clear via professional ids
    'professionals',
    'services',
    'service_categories',
  ];

  // For professional_services we need the professional IDs first
  const { data: demoProfessionals } = await supabase
    .from('professionals')
    .select('id')
    .eq('establishment_id', establishmentId)
    .eq('is_demo_data', true);

  for (const table of tables) {
    if (table === 'professional_services') {
      // Junction table has no is_demo_data — delete by demo professional IDs
      if (demoProfessionals && demoProfessionals.length > 0) {
        const profIds = demoProfessionals.map((p: any) => p.id);
        const { error } = await supabase
          .from('professional_services')
          .delete()
          .in('professional_id', profIds);
        if (error) throw new Error(`clear professional_services: ${error.message}`);
      }
      continue;
    }

    // comanda_items links to comandas, not directly to establishment.
    // We need to find demo comanda IDs first.
    if (table === 'comanda_items') {
      const { data: demoCmdIds } = await supabase
        .from('comandas')
        .select('id')
        .eq('establishment_id', establishmentId)
        .eq('is_demo_data', true);

      if (demoCmdIds && demoCmdIds.length > 0) {
        const ids = demoCmdIds.map((c: any) => c.id);
        const { error } = await supabase
          .from('comanda_items')
          .delete()
          .in('comanda_id', ids);
        if (error) throw new Error(`clear comanda_items: ${error.message}`);
      }
      continue;
    }

    // All other tables have establishment_id + is_demo_data
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('establishment_id', establishmentId)
      .eq('is_demo_data', true);

    if (error) throw new Error(`clear ${table}: ${error.message}`);
  }

  // Unset the flag on the establishment
  const { error: estErr } = await supabase
    .from('establishments')
    .update({ has_demo_data: false })
    .eq('id', establishmentId);

  if (estErr) throw new Error(`clear establishments flag: ${estErr.message}`);
}

// ---------------------------------------------------------------------------
// checkHasDemoData
// ---------------------------------------------------------------------------

export async function checkHasDemoData(
  supabase: any,
  establishmentId: string,
): Promise<boolean> {
  // Quick check: look for any demo service_categories row for this establishment.
  // This is the first table seeded, so if it has demo rows the rest should too.
  const { data, error } = await supabase
    .from('service_categories')
    .select('id')
    .eq('establishment_id', establishmentId)
    .eq('is_demo_data', true)
    .limit(1);

  if (error) {
    // Column might not exist yet — treat as "no demo data"
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}
