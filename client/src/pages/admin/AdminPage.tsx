import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import AdminDashboard from './AdminDashboard'
import AdminStores from './AdminStores'
import AdminSubscriptions from './AdminSubscriptions'
import AdminAnalytics from './AdminAnalytics'

export default function AdminPage() {
  const [tab, setTab] = useState('overview')

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {tab === 'overview' && <AdminDashboard />}
      {tab === 'stores' && <AdminStores />}
      {tab === 'subscriptions' && <AdminSubscriptions />}
      {tab === 'users' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>👥</p>
          <p style={{ color: '#666' }}>Gestão de usuários — em breve</p>
        </div>
      )}
      {tab === 'revenue' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>💰</p>
          <p style={{ color: '#666' }}>Relatórios de receita — em breve</p>
        </div>
      )}
      {tab === 'analytics' && <AdminAnalytics />}
    </AdminLayout>
  )
}
