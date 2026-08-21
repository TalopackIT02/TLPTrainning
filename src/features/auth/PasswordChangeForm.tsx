import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { useAuth } from './auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const passwordSchema = z.object({
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.'),
  confirmation: z.string(),
}).refine((value) => value.password === value.confirmation, { message: 'Mật khẩu xác nhận không khớp.', path: ['confirmation'] })

export function PasswordChangeForm({ onSuccess }: { onSuccess: () => void }) {
  const auth = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = passwordSchema.safeParse({ password, confirmation })
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    setBusy(true); setError('')
    try { await auth.updatePassword(parsed.data.password); onSuccess() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật mật khẩu.') }
    finally { setBusy(false) }
  }

  return <form className="flex flex-col gap-4" onSubmit={submit}><label className="field"><span className="field-label">Mật khẩu mới</span><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></label><label className="field"><span className="field-label">Xác nhận mật khẩu mới</span><Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /></label>{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : null}Cập nhật mật khẩu</Button></form>
}
