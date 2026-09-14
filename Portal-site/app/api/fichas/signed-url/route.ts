import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Anamnesis fichas can contain sensitive health data. The `public-fichas`
// bucket is private (see migration 20260914030000) — the only way to read an
// object in it is a signed URL minted here, after verifying the caller
// actually manages the establishment that owns it. Short-lived by design:
// unlike a permanent public URL, this expires and can't be un-shared later,
// but at least it stops working.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function callerClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error('Storage admin credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const caller = callerClient(token);
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const shareToken = typeof body?.shareToken === 'string' ? body.shareToken.trim() : '';
  const establishmentId = typeof body?.establishmentId === 'string' ? body.establishmentId.trim() : '';
  // UUID-shaped only — this becomes part of a storage path, never pass it through unchecked.
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(shareToken) || (establishmentId && !uuidRe.test(establishmentId))) {
    return NextResponse.json({ error: 'shareToken inválido' }, { status: 400 });
  }

  let storagePath: string;
  if (establishmentId) {
    // Tenant-prefixed upload: verify, under the CALLER's own RLS identity
    // (never trust establishmentId from the request body alone), that they
    // actually manage this establishment before minting a link for it.
    const { data: allowed } = await caller.rpc('can_manage_establishment', {
      p_establishment_id: establishmentId,
    });
    if (!allowed) {
      return NextResponse.json({ error: 'Acesso negado a este estabelecimento' }, { status: 403 });
    }
    storagePath = `${establishmentId}/${shareToken}.html`;
  } else {
    // Legacy flat-path object (uploaded before the bucket went private): no
    // tenant can be recovered from the path, so the bar is "any
    // authenticated Appbello user" — narrower than before (fully public,
    // no auth), and the token itself is still an unguessable UUID.
    storagePath = `${shareToken}.html`;
  }

  const admin = adminClient();
  const { data: signed, error: signError } = await admin.storage
    .from('public-fichas')
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Ficha não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ url: signed.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
