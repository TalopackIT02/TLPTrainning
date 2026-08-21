import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
interface AuthValue { authenticated: boolean; configured: boolean; loading: boolean; email: string; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) }); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => data.subscription.unsubscribe() }, [])
  const value = useMemo<AuthValue>(() => ({
    authenticated: Boolean(session), configured: isSupabaseConfigured, loading, email: session?.user.email ?? '',
    signIn: async (email, password) => { if (!supabase) throw new Error('Supabase chưa được cấu hình.'); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error },
    signOut: async () => { if (supabase) await supabase.auth.signOut() },
  }), [session, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be inside AuthProvider'); return value }
