import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Building2, ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Menu, MonitorCheck, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'
const nav = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true }, { to: '/admin/employees', label: 'Nhân viên', icon: Users },
  { to: '/admin/courses', label: 'Khóa đào tạo', icon: BookOpen }, { to: '/admin/question-banks', label: 'Ngân hàng câu hỏi', icon: Building2 },
  { to: '/admin/exams', label: 'Bài kiểm tra', icon: ClipboardCheck }, { to: '/admin/batches', label: 'Đợt đào tạo', icon: GraduationCap },
  { to: '/admin/monitoring', label: 'Theo dõi & Kết quả', icon: MonitorCheck },
]
export default function AdminLayout() {
  const [open, setOpen] = useState(false); const auth = useAuth(); const navigate = useNavigate()
  async function logout() { await auth.signOut(); navigate('/admin/login') }
  return <div className="min-h-screen bg-slate-50"><aside className={cn('fixed inset-y-0 left-0 w-64 bg-[#071d35] text-white transition-transform md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}><div className="flex h-16 items-center gap-3 border-b border-white/10 px-5"><div className="grid size-9 place-items-center rounded-md border-2 border-blue-500 font-extrabold">TLP</div><span className="text-lg font-bold">TLP Training</span><button className="ml-auto rounded p-1 md:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu"><X /></button></div><nav className="flex flex-col gap-1 p-3">{nav.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white', isActive && 'bg-blue-600 text-white')}><item.icon />{item.label}</NavLink>)}</nav><div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-3"><button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/10" onClick={logout}><LogOut />Đăng xuất</button></div></aside><div className="md:pl-64"><header className="sticky top-0 flex h-16 items-center border-b bg-white px-4 md:px-7"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu /></Button><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">Admin</p><p className="text-xs text-muted-foreground">{auth.email}</p></div><div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">AD</div></div></header><main className="p-4 md:p-7"><Outlet /></main></div>{open ? <button className="fixed inset-0 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu overlay" /> : null}</div>
}
