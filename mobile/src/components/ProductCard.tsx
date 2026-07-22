import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Product } from '../api/client'
import { useCart } from '../contexts/CartContext'

interface Props {
  product: Product
  onCustomize: (product: Product) => void
}

export default function ProductCard({ product, onCustomize }: Props) {
  const { addItem } = useCart()
  const price = product.pricePromotional || product.price
  const hasPromo = product.pricePromotional && product.pricePromotional < product.price

  return (
    <View style={styles.card}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}><Text style={{ fontSize: 28 }}>🍔</Text></View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {product.ingredients.length > 0 && (
          <Text style={styles.ingredients} numberOfLines={1}>{product.ingredients.slice(0, 3).join(', ')}</Text>
        )}
        <View style={styles.footer}>
          <View>
            {hasPromo && <Text style={styles.oldPrice}>R$ {product.price.toFixed(2)}</Text>}
            <Text style={[styles.price, hasPromo ? styles.pricePromo : undefined]}>R$ {price.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onCustomize(product)}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    alignItems: 'center',
  },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  imagePlaceholder: { width: 70, height: 70, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  ingredients: { fontSize: 12, color: '#999', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  oldPrice: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  price: { fontSize: 16, fontWeight: '700' },
  pricePromo: { color: '#e74c3c' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#e74c3c',
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -1 },
})