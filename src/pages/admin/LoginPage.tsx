import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { GraduationCap, LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
const schema = z.object({ email: z.string().email('Email không hợp lệ'), password: z.string().min(1, 'Vui lòng nhập mật khẩu') })
export default function LoginPage() {
  const auth = useAuth(); const location = useLocation(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (auth.authenticated) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/admin'} replace />
  async function submit(event: React.FormEvent) { event.preventDefault(); const parsed = schema.safeParse({ email, password }); if (!parsed.success) { setError(parsed.error.issues[0].message); return } setBusy(true); setError(''); try { await auth.signIn(email, password) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Đăng nhập thất bại') } finally { setBusy(false) } }
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-4"><Card className="w-full max-w-md"><CardHeader className="items-center text-center"><div className="mb-2 grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground"><GraduationCap /></div><CardTitle className="text-2xl">TLP Training</CardTitle><CardDescription>Đăng nhập dành cho quản trị viên / người đào tạo</CardDescription></CardHeader><CardContent><form className="flex flex-col gap-4" onSubmit={submit}>{!auth.configured ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800" role="alert">Hệ thống chưa được kết nối Supabase. Vui lòng cấu hình biến môi trường trước khi đăng nhập.</p> : null}<label className="field"><span className="field-label">Email</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" disabled={!auth.configured} /></label><label className="field"><span className="field-label">Mật khẩu</span><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={!auth.configured} /></label>{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<Button size="lg" disabled={busy || !auth.configured}>{busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}Đăng nhập</Button></form></CardContent></Card></main>
}
