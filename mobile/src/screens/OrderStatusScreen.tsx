import { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getOrder, Order } from '../api/client'

export default function OrderStatusScreen({ route, navigation }: any) {
  const { orderId } = route.params
  const [order, setOrder] = useState<Order | null>(null)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOrder(orderId)
        setOrder(data)
      } catch {}
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [orderId])

  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Aguardando Confirmação', color: '#e74c3c', icon: '⏳' },
    confirmed: { label: 'Confirmado', color: '#f39c12', icon: '✅' },
    preparing: { label: 'Preparando', color: '#3498db', icon: '👨‍🍳' },
    ready: { label: 'Pronto', color: '#27ae60', icon: '🍽️' },
    delivered: { label: 'Entregue', color: '#95a5a6', icon: '📦' },
  }

  const status = order ? statusMap[order.status] || statusMap.pending : statusMap.pending

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{status.icon}</Text>
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        <Text style={styles.orderId}>Pedido #{orderId.slice(0, 8)}</Text>

        {order && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Detalhes</Text>
            <View style={styles.row}><Text style={styles.label}>Total</Text><Text style={styles.value}>R$ {order.total.toFixed(2)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={[styles.value, { color: status.color }]}>{status.label}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Data</Text><Text style={styles.value}>{new Date(order.created_at).toLocaleString('pt-BR')}</Text></View>
          </View>
        )}

        <View style={styles.timeline}>
          {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((s, i) => {
            const st = statusMap[s]
            const done = order ? ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].indexOf(order.status) >= i : false
            return (
              <View key={s} style={styles.step}>
                <View style={[styles.dot, done && styles.dotDone]}>
                  <Text style={styles.dotIcon}>{done ? '✓' : st.icon}</Text>
                </View>
                {i < 4 && <View style={[styles.line, done && styles.lineDone]} />}
                <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{st.label}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  icon: { fontSize: 64, marginBottom: 16 },
  statusLabel: { fontSize: 20, fontWeight: '700' },
  orderId: { fontSize: 13, color: '#999', marginTop: 4 },
  card: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, width: '100%', marginTop: 24 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 13, fontWeight: '600' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 32, paddingHorizontal: 10 },
  step: { alignItems: 'center', flex: 1, position: 'relative' },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  dotDone: { borderColor: '#27ae60', backgroundColor: '#27ae60' },
  dotIcon: { fontSize: 12, color: '#fff', fontWeight: '700' },
  line: { position: 'absolute', top: 14, left: 28, right: 0, height: 2, backgroundColor: '#ddd', zIndex: -1 },
  lineDone: { backgroundColor: '#27ae60' },
  stepLabel: { fontSize: 9, color: '#999', marginTop: 6, textAlign: 'center' },
  stepLabelDone: { color: '#27ae60', fontWeight: '600' },
})