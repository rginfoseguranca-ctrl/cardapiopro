import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native'
import { getComplementGroups, Product, ComplementGroup as CG, Complement } from '../api/client'
import { useCart } from '../contexts/CartContext'

interface Props {
  visible: boolean
  product: Product
  onClose: () => void
}

interface Selection { complementId: string; name: string; price: number }
interface Selections { [groupId: string]: { groupName: string; type: string; min: number; max: number; isRequired: boolean; selected: Selection[] } }

export default function ComplementModal({ visible, product, onClose }: Props) {
  const { addItem } = useCart()
  const [groups, setGroups] = useState<CG[]>([])
  const [selections, setSelections] = useState<Selections>({})
  const [loading, setLoading] = useState(true)
  const price = product.pricePromotional || product.price

  useEffect(() => {
    if (visible) {
      setLoading(true)
      getComplementGroups(product.id).then(data => {
        setGroups(data)
        const initial: Selections = {}
        for (const g of data) {
          initial[g.id] = { groupName: g.name, type: g.type, min: g.min, max: g.max, isRequired: g.isRequired, selected: [] }
        }
        setSelections(initial)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [visible, product.id])

  const toggle = (group: CG, item: Complement) => {
    setSelections(prev => {
      const current = { ...prev }
      const gs = { ...current[group.id] }
      const exists = gs.selected.find(s => s.complementId === item.id)
      if (group.type === 'radio') {
        gs.selected = exists ? [] : [{ complementId: item.id, name: item.name, price: item.price }]
      } else {
        if (exists) { gs.selected = gs.selected.filter(s => s.complementId !== item.id) }
        else if (group.max === 0 || gs.selected.length < group.max) {
          gs.selected = [...gs.selected, { complementId: item.id, name: item.name, price: item.price }]
        }
      }
      current[group.id] = gs
      return { ...current }
    })
  }

  const totalExtra = Object.values(selections).reduce((sum, g) => sum + g.selected.reduce((s, i) => s + i.price, 0), 0)

  const confirm = () => {
    let valid = true
    for (const gId in selections) {
      const g = selections[gId]
      if (g.selected.length < g.min) { valid = false; break }
    }
    if (!valid) return

    const complements = Object.entries(selections)
      .filter(([_, g]) => g.selected.length > 0)
      .map(([gId, g]) => ({ groupId: gId, groupName: g.groupName, items: g.selected.map(s => ({ complementId: s.complementId, name: s.name, price: s.price })) }))

    addItem({ productId: product.id, productName: product.name, unitPrice: price, complements, complementPrice: totalExtra })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.subtitle}>R$ {price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {loading ? (
              <Text style={{ textAlign: 'center', color: '#999' }}>Carregando...</Text>
            ) : groups.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#999' }}>Nenhum complemento</Text>
            ) : groups.map(group => (
              <View key={group.id} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupHint}>
                    {group.type === 'radio' ? 'Selecione 1' : `${selections[group.id]?.selected.length || 0}/${group.max || '∞'}`}
                    {group.isRequired ? ' *' : ''}
                  </Text>
                </View>
                {group.items.map(item => {
                  const isSelected = selections[group.id]?.selected.some(s => s.complementId === item.id)
                  return (
                    <TouchableOpacity key={item.id} style={[styles.item, isSelected && styles.itemSelected]} onPress={() => toggle(group, item)}>
                      <View style={[styles.checkbox, group.type === 'radio' && styles.radio, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.price > 0 && <Text style={styles.itemPrice}>+R$ {item.price.toFixed(2)}</Text>}
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>R$ {(price + totalExtra).toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
              <Text style={styles.confirmBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  closeBtn: { fontSize: 22, color: '#999', padding: 4 },
  body: { paddingHorizontal: 20, maxHeight: 400 },
  groupSection: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 16 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  groupName: { fontSize: 15, fontWeight: '600' },
  groupHint: { fontSize: 12, color: '#999' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  itemSelected: { backgroundColor: '#fff5f5', borderRadius: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  radio: { borderRadius: 11 },
  checkboxSelected: { borderColor: '#e74c3c', backgroundColor: '#e74c3c' },
  itemName: { flex: 1, fontSize: 14 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#e74c3c' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalLabel: { fontSize: 13, color: '#999' },
  totalPrice: { fontSize: 20, fontWeight: '700' },
  confirmBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})