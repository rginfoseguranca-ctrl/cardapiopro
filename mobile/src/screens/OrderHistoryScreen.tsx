import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../api/client'

interface Order {
  id: string; status: string; total: number; items: any[]
  payment_method: string; delivery_type: string; created_at: string
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Aguardando', color: '#e74c3c', icon: '⏳' },
  confirmed: { label: 'Confirmado', color: '#f39c12', icon: '✅' },
  preparing: { label: 'Preparando', color: '#3498db', icon: '👨‍🍳' },
  ready: { label: 'Pronto', color: '#27ae60', icon: '🍽️' },
  delivered: { label: 'Entregue', color: '#95a5a6', icon: '📦' },
  canceled: { label: 'Cancelado', color: '#e74c3c', icon: '❌' },
}

export default function OrderHistoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      if (!user?.phone) {
        setLoading(false)
        return
      }
      setPhone(user.phone)
      const { data } = await api.get(`/customers/phone/${user.phone}/orders`)
      setOrders(data.orders || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#e74c3c" /></View>
  }

  if (!phone) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 48 }}>📋</Text>
        <Text style={styles.emptyTitle}>Faça login para ver seus pedidos</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Meus Pedidos</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const st = STATUS_MAP[item.status] || STATUS_MAP.pending
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OrderStatus', { orderId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: st.color + '15' }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.icon} {st.label}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.itemsCount}>{item.items?.length || 0} itens</Text>
                <Text style={styles.orderTotal}>R$ {(item.total || 0).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
            <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.btnText}>Fazer Pedido</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { fontSize: 15, color: '#e74c3c' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDate: { fontSize: 12, color: '#999', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  itemsCount: { fontSize: 13, color: '#666' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: '#e74c3c' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginTop: 12, marginBottom: 16 },
  btn: { backgroundColor: '#e74c3c', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
})
