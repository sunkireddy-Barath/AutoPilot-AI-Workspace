import { Navigate } from 'react-router-dom'
import { useAppStore } from '../../store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAppStore()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <>{children}</>
}
