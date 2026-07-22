import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getProducts, getCategories, getStoreSettings, Product, Category } from '../api/client'
import { useCart } from '../contexts/CartContext'
import ProductCard from '../components/ProductCard'
import ComplementModal from '../components/ComplementModal'

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [storeName, setStoreName] = useState('Cardápio')
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const { totalItems } = useCart()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getStoreSettings()]).then(([prods, cats, store]) => {
      setProducts(prods)
      setCategories(cats)
      setStoreName(store.storeName || 'Cardápio')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = activeCat === 'all' ? products : products.filter(p => p.categoryId === activeCat)

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#e74c3c" /></View>
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.subtitle}>Faça seu pedido</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('OrderHistory')}>
            <Text style={styles.iconBtnText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.iconBtnText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartIcon}>🛒</Text>
            {totalItems() > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{totalItems()}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        horizontal
        data={[{ id: 'all', name: 'Todos', icon: '📋' } as any, ...categories]}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, activeCat === item.id && styles.catBtnActive]}
            onPress={() => setActiveCat(item.id)}
          >
            <Text style={styles.catIcon}>{item.icon}</Text>
            <Text style={[styles.catName, activeCat === item.id && styles.catNameActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productList}
        renderItem={({ item }) => (
          <ProductCard product={item} onCustomize={(p) => setModalProduct(p)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum produto</Text>}
      />

      {modalProduct && (
        <ComplementModal
          visible={!!modalProduct}
          product={modalProduct}
          onClose={() => setModalProduct(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  storeName: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 20 },
  cartBtn: { position: 'relative', padding: 4 },
  cartIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#e74c3c', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  catList: { paddingHorizontal: 16, marginBottom: 8 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  catBtnActive: { backgroundColor: '#e74c3c' },
  catIcon: { fontSize: 16, marginRight: 4 },
  catName: { fontSize: 13, fontWeight: '500' },
  catNameActive: { color: '#fff' },
  productList: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
})