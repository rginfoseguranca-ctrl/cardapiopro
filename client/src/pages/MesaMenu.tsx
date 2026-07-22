import { useParams } from 'react-router-dom'
import MenuView from '../components/MenuView'

export default function MesaMenu() {
  const { number } = useParams()
  return (
    <MenuView
      mode="mesa"
      tableNumber={Number(number)}
      headerTitle="Faça seu pedido"
      headerSubtitle="Escaneie o QR Code para pedir pelo celular"
      headerTheme="primary"
    />
  )
}
