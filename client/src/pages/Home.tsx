import MenuView from '../components/MenuView'

export default function Home({ onCartClick, slug }: { onCartClick: () => void; slug?: string }) {
  return <MenuView mode="delivery" onCartClick={onCartClick} headerTitle="Cardápio Digital" headerSubtitle="Peça pelo celular sem sair de casa" storeSlug={slug} />
}
