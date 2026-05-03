import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // During build or server-side pre-rendering, these might be missing.
    // We return a dummy client or handle it gracefully to prevent build crashes.
    console.warn('Supabase credentials missing. Client initialization deferred.')
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-key'
  )
}
