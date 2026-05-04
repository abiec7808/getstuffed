import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('placeholder')) {
    if (typeof window !== 'undefined') {
      console.error(
        'Supabase environment variables are missing or using placeholders! ' +
        'Found URL starting with: ' + (url ? url.substring(0, 10) + '...' : 'null') +
        '. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        'are set in your deployment settings and TRIGGER A NEW BUILD.'
      )
    }
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-key'
  )
}
