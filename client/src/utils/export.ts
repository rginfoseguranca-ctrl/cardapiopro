export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )

  const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function ordersToCSV(orders: any[]) {
  return orders.map(o => ({
    'Pedido': o.id?.slice(0, 8),
    'Cliente': o.customer_name,
    'Telefone': o.customer_phone,
    'Tipo': o.delivery_type === 'delivery' ? 'Delivery' : o.delivery_type === 'mesa' ? 'Mesa' : 'Balcão',
    'Subtotal': o.subtotal?.toFixed(2),
    'Desconto': o.discount?.toFixed(2),
    'Taxa Entrega': o.delivery_fee?.toFixed(2),
    'Total': o.total?.toFixed(2),
    'Pagamento': o.payment_method,
    'Status': o.status,
    'Criado em': new Date(o.created_at).toLocaleString('pt-BR'),
  }))
}

export function financialToCSV(transactions: any[]) {
  return transactions.map(t => ({
    'Data': new Date(t.date || t.created_at).toLocaleDateString('pt-BR'),
    'Descrição': t.description,
    'Tipo': t.type === 'income' ? 'Entrada' : 'Saída',
    'Categoria': t.category_name || '',
    'Valor': t.amount?.toFixed(2),
    'Status': t.status,
    'Forma Pgto': t.payment_method || '',
  }))
}
