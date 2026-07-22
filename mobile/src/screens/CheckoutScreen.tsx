import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createOrder, getStoreSettings } from '../api/client'
import { useCart } from '../contexts/CartContext'

export default function CheckoutScreen({ navigation }: any) {
  const { items, subtotal, clearCart } = useCart()
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState('pix')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [storeSettings, setStoreSettings] = useState<any>(null)

  useEffect(() => { getStoreSettings().then(setStoreSettings).catch(() => {}) }, [])

  const submit = async () => {
    if (!name) { Alert.alert('Erro', 'Nome é obrigatório'); return }
    setSubmitting(true)
    try {
      const order = await createOrder({
        customerName: name,
        customerPhone: phone || '00000000000',
        items,
        paymentMethod: payment,
        deliveryAddress: address || undefined,
        notes: notes || undefined,
      })
      clearCart()
      navigation.replace('OrderStatus', { orderId: order.id })
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível criar o pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Voltar</Text></TouchableOpacity>
      <Text style={styles.title}>Finalizar Pedido</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Resumo</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowText}>{item.quantity}x {item.productName}</Text>
            <Text style={styles.rowValue}>R$ {item.totalPrice.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {subtotal().toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Dados</Text>
        <TextInput style={styles.input} placeholder="Nome *" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Endereço (opcional)" value={address} onChangeText={setAddress} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💳 Pagamento</Text>
        <View style={styles.paymentRow}>
          {['pix', 'credit', 'debit', 'cash'].map(p => (
            <TouchableOpacity key={p} style={[styles.paymentBtn, payment === p && styles.paymentBtnActive]} onPress={() => setPayment(p)}>
              <Text style={[styles.paymentText, payment === p && styles.paymentTextActive]}>
                {p === 'pix' ? 'PIX' : p === 'credit' ? 'Crédito' : p === 'debit' ? 'Débito' : 'Dinheiro'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {payment === 'pix' && storeSettings?.paymentPixKey && (
          <View style={styles.pixBox}>
            <Text style={styles.pixLabel}>Chave PIX:</Text>
            <Text style={styles.pixKey}>{storeSettings.paymentPixKey}</Text>
          </View>
        )}
      </View>

      <TextInput style={styles.input} placeholder="Observações" value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
        <Text style={styles.submitBtnText}>{submitting ? 'Enviando...' : `Confirmar - R$ ${subtotal().toFixed(2)}`}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', paddingHorizontal: 20 },
  backBtn: { fontSize: 15, color: '#e74c3c', marginBottom: 12, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowText: { fontSize: 13, color: '#555' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#e74c3c' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  paymentRow: { flexDirection: 'row', gap: 8 },
  paymentBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  paymentBtnActive: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  paymentText: { fontSize: 12, fontWeight: '600', color: '#555' },
  paymentTextActive: { color: '#fff' },
  pixBox: { marginTop: 12, backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8 },
  pixLabel: { fontSize: 12, color: '#999' },
  pixKey: { fontSize: 15, fontWeight: '700', color: '#e74c3c', marginTop: 2 },
  submitBtn: { backgroundColor: '#e74c3c', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})