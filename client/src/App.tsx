import { useState, useEffect } from 'react'
import { useCart } from './hooks/useCart'
import { Routes, Route, Link, useLocation, useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStoreSettings, type StoreSettings, isDesktop, setActiveStoreSlug } from './api/client'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer'
import CartBottomBar from './components/CartBottomBar'
import ChatBot from './components/ChatBot'
import ToastContainer from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import ChangePasswordModal from './components/ChangePasswordModal'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Checkout from './pages/Checkout'
import OrderStatus from './pages/OrderStatus'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Login from './pages/Login'
import MesaMenu from './pages/MesaMenu'
import Balcao from './pages/Balcao'
import KDS from './pages/KDS'
import About from './pages/About'
import Help from './pages/Help'
import Plans from './pages/Plans'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Partners from './pages/Partners'
import OrderHistory from './pages/OrderHistory'
import NotFound from './pages/NotFound'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import LoyaltyDashboard from './pages/LoyaltyDashboard'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminPage from './pages/admin/AdminPage'
import Materiais from './pages/Materiais'
import Assinaturas from './pages/Assinaturas'
import PDV from './pages/PDV'

const HIDE_HEADER_PATHS = ['/dashboard', '/admin', '/kds', '/pdv']

function MenuHome({ onCartClick }: { onCartClick: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  return <Home onCartClick={onCartClick} slug={slug} />
}

export default function App() {
  const location = useLocation()
  const [cartOpen, setCartOpen] = useState(false)
  const cartItems = useCart(s => s.items)
  const [routeSlug, setRouteSlug] = useState<string | null>(null)
  const { data: settings } = useQuery({ queryKey: ['storeSettings', routeSlug ?? 'main'], queryFn: getStoreSettings })

  const isAppPage = HIDE_HEADER_PATHS.some(p => location.pathname.startsWith(p)) ||
    location.pathname.startsWith('/mesa/') ||
    location.pathname === '/balcao'

  const isLanding = location.pathname === '/'

  useEffect(() => {
    const m = location.pathname.match(/^\/menu\/([^/]+)/)
    const slug = m ? m[1] : null
    setRouteSlug(slug)
    setActiveStoreSlug(slug)
  }, [location.pathname])

  useEffect(() => {
    if (settings) {
      document.documentElement.style.setProperty('--primary', settings.primaryColor)
      document.documentElement.style.setProperty('--primary-dark', settings.primaryDark)
      document.title = `${settings.storeIcon} ${settings.storeName}`
      const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (link && settings.logoUrl) link.href = settings.logoUrl
    }
  }, [settings])

  const s = settings || {} as StoreSettings
  const storeIcon = s.storeIcon || '🍔'
  const storeName = s.storeName || 'CardápioPro'
  const footerText = s.footerText || `${storeName} • Delivery`

  return (
    <ErrorBoundary>
      {!isAppPage && (
        <>
          <Header onCartClick={() => setCartOpen(true)} storeIcon={storeIcon} storeName={storeName} whatsapp={settings?.whatsapp} />
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
          {!isDesktop && cartItems.length > 0 && <CartBottomBar onCartClick={() => setCartOpen(true)} />}
          <ChatBot />
        </>
      )}
      <ChangePasswordModal />
      <ToastContainer />
      <Routes>
        <Route path="/" element={isDesktop ? <Navigate to="/login" replace /> : <Landing />} />
        <Route path="/cardapio" element={<Home onCartClick={() => setCartOpen(true)} />} />
        <Route path="/menu/:slug" element={<MenuHome onCartClick={() => setCartOpen(true)} />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<OrderStatus />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/mesa/:number" element={<MesaMenu />} />
        <Route path="/balcao" element={<Balcao />} />
        <Route path="/pdv" element={<ProtectedRoute><PDV standalone /></ProtectedRoute>} />
        <Route path="/kds" element={<KDS />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/planos" element={<Plans />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/parceiros" element={<Partners />} />
        <Route path="/historico" element={<OrderHistory />} />
        <Route path="/fidelidade" element={<LoyaltyDashboard />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/materiais" element={<Materiais />} />
        <Route path="/assinaturas" element={<ProtectedRoute><Assinaturas /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAppPage && !isLanding && !isDesktop && (
        <footer style={{
          background: '#2c3e50', color: '#fff', padding: '24px 0', marginTop: 40,
          textAlign: 'center', fontSize: '.85rem'
        }}>
          <div className="container">
            <p style={{ fontWeight: 700, marginBottom: 8 }}>{storeIcon} {storeName}</p>
            <p style={{ color: '#bdc3c7', marginBottom: 12 }}>{footerText}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/cardapio" style={{ color: '#bdc3c7' }}>Cardápio</Link>
              <Link to="/balcao" style={{ color: '#bdc3c7' }}>Balcão</Link>
              <Link to="/planos" style={{ color: '#bdc3c7' }}>Planos</Link>
              <Link to="/blog" style={{ color: '#bdc3c7' }}>Blog</Link>
              <Link to="/parceiros" style={{ color: '#bdc3c7' }}>Parceiros</Link>
              <Link to="/about" style={{ color: '#bdc3c7' }}>Quem Somos</Link>
              <Link to="/help" style={{ color: '#bdc3c7' }}>Ajuda</Link>
              <Link to="/historico" style={{ color: '#bdc3c7' }}>Meus Pedidos</Link>
              <Link to="/fidelidade" style={{ color: '#bdc3c7' }}>Fidelidade</Link>
              <Link to="/materiais" style={{ color: '#bdc3c7' }}>Materiais</Link>
              <Link to="/privacidade" style={{ color: '#bdc3c7' }}>Privacidade</Link>
              <Link to="/termos" style={{ color: '#bdc3c7' }}>Termos</Link>
              <Link to="/dashboard" style={{ color: '#bdc3c7' }}>Admin</Link>
            </div>
            <p style={{ color: '#7f8c8d', marginTop: 12, fontSize: '.8rem' }}>
              © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      )}
    </ErrorBoundary>
  )
}
