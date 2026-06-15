import { useAuthenticationStatus } from '@nhost/react'
import Auth from './Auth'
import Dashboard from './Dashboard'

export default function App() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f0f', color: '#fff' }}>
      Loading...
    </div>
  )

  return isAuthenticated ? <Dashboard /> : <Auth />
}
