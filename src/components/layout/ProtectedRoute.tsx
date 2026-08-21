import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/ui/state'
import { useAuth } from '@/features/auth/auth-context'
export default function ProtectedRoute() { const auth = useAuth(); const location = useLocation(); if (auth.loading) return <LoadingState label="Đang xác thực…" />; return auth.authenticated ? <Outlet /> : <Navigate to="/admin/login" replace state={{ from: location.pathname }} /> }
