import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Session, User } from '@supabase/supabase-js';

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

function authCookieBaseName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const hostname = new URL(url).hostname;
  const ref = hostname === '127.0.0.1' ? '127' : hostname.split('.')[0];
  return `sb-${ref}-auth-token`;
}

/** Lee tokens de la cookie de auth sin llamar getSession() (evita warning en SSR). */
async function readSessionFromCookies(): Promise<Session | null> {
  const baseName = authCookieBaseName();
  const cookieStore = await cookies();
  const chunks = cookieStore
    .getAll()
    .filter((c) => c.name === baseName || c.name.startsWith(`${baseName}.`))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (chunks.length === 0) return null;

  const raw = chunks.map((c) => c.value).join('');
  const json = raw.startsWith('base64-')
    ? Buffer.from(raw.slice('base64-'.length), 'base64').toString('utf8')
    : raw;

  try {
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const stored = await readSessionFromCookies();
  if (!stored?.access_token) return null;

  return { ...stored, user: user as User };
}
