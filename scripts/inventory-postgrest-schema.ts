const keyFile = process.argv[2];
const requestedRole = process.argv[3] === 'service_role' ? 'service_role' : 'anon';
const projectRef = process.env.SUPABASE_PROJECT_REF;
const url = projectRef
  ? `https://${projectRef}.supabase.co`
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (keyFile) {
  const keys = (await Bun.file(keyFile).json()) as Array<{
    name: string;
    type: string;
    api_key: string;
  }>;
  anonKey = keys.find((key) => key.name === requestedRole && key.type === 'legacy')?.api_key;
}

if (!url || !anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios');
}

const response = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
    accept: 'application/openapi+json',
  },
});

if (!response.ok) {
  throw new Error(`PostgREST retornou HTTP ${response.status}`);
}

const schema = (await response.json()) as {
  definitions?: Record<string, { properties?: Record<string, unknown>; required?: string[] }>;
  paths?: Record<string, unknown>;
};

const tables = Object.entries(schema.definitions ?? {})
  .map(([name, definition]) => ({
    name,
    columns: Object.keys(definition.properties ?? {}).sort(),
    required: [...(definition.required ?? [])].sort(),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const rpcs = Object.keys(schema.paths ?? {})
  .filter((path) => path.startsWith('/rpc/'))
  .map((path) => path.slice('/rpc/'.length))
  .sort();

console.log(JSON.stringify({ tables, rpcs }, null, 2));
