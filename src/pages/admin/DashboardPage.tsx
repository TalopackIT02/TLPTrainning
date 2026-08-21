import { BookOpen, CheckCircle2, Clock3, GraduationCap, TimerOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useData } from '@/data/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state'

export default function DashboardPage() {
  const { data, loading, error } = useData(); if (loading) return <LoadingState />; if (error) return <ErrorState message={error} />
  const states = data.batches.flatMap((batch) => batch.learnerStates)
  const metrics = [
    { label: 'Đợt đang mở', value: data.batches.filter((batch) => batch.status === 'OPEN').length, icon: GraduationCap, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Chưa bắt đầu', value: states.filter((state) => state.currentStatus === 'NOT_STARTED').length, icon: Clock3, tone: 'text-slate-600 bg-slate-100' },
    { label: 'Đang thực hiện', value: states.filter((state) => ['READING', 'READY_FOR_EXAM', 'IN_PROGRESS'].includes(state.currentStatus)).length, icon: BookOpen, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Đã đạt', value: states.filter((state) => state.currentStatus === 'PASSED').length, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Không đạt / Quá hạn', value: states.filter((state) => ['FAILED', 'EXPIRED'].includes(state.currentStatus)).length, icon: TimerOff, tone: 'text-red-600 bg-red-50' },
  ]
  return <><PageHeader title="Tổng quan đào tạo" description="Theo dõi nhanh tiến độ các đợt đào tạo đang triển khai." action={<Button asChild><Link to="/admin/batches">Tạo đợt đào tạo</Link></Button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <Card key={metric.label}><CardContent className="flex items-center gap-3 p-4"><div className={`grid size-10 place-items-center rounded-md ${metric.tone}`}><metric.icon /></div><div><p className="text-xs text-muted-foreground">{metric.label}</p><p className="text-2xl font-bold">{metric.value}</p></div></CardContent></Card>)}</div><Card className="mt-6"><CardHeader><CardTitle>Tiến độ đợt đào tạo</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0">{data.batches.length === 0 ? <EmptyState title="Chưa có đợt đào tạo" description="Tạo đợt đầu tiên để bắt đầu giao nhân viên." /> : <table className="data-table"><thead><tr><th>Mã đợt</th><th>Tên đợt đào tạo</th><th>Trạng thái</th><th>Học viên</th><th>Đã đạt</th><th>Thời hạn</th></tr></thead><tbody>{data.batches.map((batch) => <tr key={batch.id}><td className="font-medium">{batch.batchCode}</td><td><Link className="font-medium text-primary hover:underline" to={`/admin/monitoring?batch=${batch.id}`}>{batch.batchName}</Link></td><td><StatusBadge status={batch.status} /></td><td>{batch.employeeIds.length}</td><td>{batch.learnerStates.filter((state) => state.currentStatus === 'PASSED').length}</td><td>{batch.dueAt ? new Date(batch.dueAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td></tr>)}</tbody></table>}</CardContent></Card></>
}
