import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCart } from '../contexts/CartContext'

export default function CartScreen({ navigation }: any) {
  const { items, removeItem, updateQuantity, subtotal } = useCart()
  const insets = useSafeAreaInsets()

  const itemKey = (item: any) => {
    const compKey = item.complements
      ? item.complements.map((g: any) => g.items.map((i: any) => i.complementId).sort().join(',')).join('|') : ''
    return `${item.productId}_${compKey}`
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 48 }}>🛒</Text>
        <Text style={styles.emptyTitle}>Sacola vazia</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Ver Cardápio</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Voltar</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Sacola</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={itemKey}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const key = itemKey(item)
          return (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.complements?.map((g: any, gi: number) => (
                  <Text key={gi} style={styles.comps}>{g.items.map((i: any) => i.name).join(', ')}</Text>
                ))}
                <Text style={styles.itemPrice}>R$ {item.unitPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => item.quantity > 1 ? updateQuantity(key, item.quantity - 1) : removeItem(key)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(key, item.quantity + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>R$ {item.totalPrice.toFixed(2)}</Text>
            </View>
          )
        }}
      />

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>R$ {subtotal().toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutBtnText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 12, color: '#666' },
  btn: { marginTop: 20, backgroundColor: '#e74c3c', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { fontSize: 15, color: '#e74c3c' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600' },
  comps: { fontSize: 11, color: '#999', marginTop: 1 },
  itemPrice: { fontSize: 12, color: '#999', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
  qty: { fontSize: 15, fontWeight: '700', marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '700', minWidth: 70, textAlign: 'right' },
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#999' },
  totalPrice: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  checkoutBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  checkoutBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
})