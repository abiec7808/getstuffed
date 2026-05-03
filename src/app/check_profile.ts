import { createClient } from './lib/supabase'

async function check() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log("No user")
    return
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  console.log(JSON.stringify(data, null, 2))
}
