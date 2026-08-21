import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { PasswordChangeForm } from '@/features/auth/PasswordChangeForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PasswordRecoveryPage() {
  const navigate = useNavigate()
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-4"><Card className="w-full max-w-md"><CardHeader className="items-center text-center"><div className="mb-2 grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground"><KeyRound /></div><CardTitle className="text-2xl">Đặt mật khẩu mới</CardTitle><CardDescription>Nhập mật khẩu mới cho tài khoản quản trị.</CardDescription></CardHeader><CardContent><PasswordChangeForm onSuccess={() => navigate('/admin', { replace: true })} /></CardContent></Card></main>
}
