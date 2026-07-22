import MenuView from '../components/MenuView'

export default function Home({ onCartClick }: { onCartClick: () => void }) {
  return <MenuView mode="delivery" onCartClick={onCartClick} headerTitle="Cardápio Digital" headerSubtitle="Peça pelo celular sem sair de casa" />
}
