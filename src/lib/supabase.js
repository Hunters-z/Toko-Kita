import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Inisialisasi client Supabase
// Jika env tidak diset, return proxy agar aplikasi tidak crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Audit Log: Mengirim log ke Supabase untuk keamanan jika terhubung.
 */
export async function logSecurityEvent(event, details) {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  await supabase.from('security_logs').insert({
    event,
    details,
    user_id: session?.user?.id,
    timestamp: new Date().toISOString()
  })
}
