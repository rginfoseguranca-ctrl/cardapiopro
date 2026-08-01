import { useCart } from '../hooks/useCart'

interface Props {
  onCartClick: () => void
}

export default function CartBottomBar({ onCartClick }: Props) {
  const items = useCart(s => s.items)
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)

  if (totalItems === 0) return null

  return (
    <div className="cart-bottom-bar">
      <span style={{ fontSize: '1.3rem' }}>🛍️</span>
      <div className="cart-bottom-bar-info">
        <div className="cart-bottom-bar-count">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</div>
        <div className="cart-bottom-bar-total">R$ {subtotal.toFixed(2)}</div>
      </div>
      <button className="cart-bottom-bar-btn" onClick={onCartClick}>Ver Carrinho</button>
    </div>
  )
}
