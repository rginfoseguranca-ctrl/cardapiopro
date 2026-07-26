import { Router, Request, Response } from 'express'
import { dbGet, dbRun } from '../database'
import { notifyOrder } from './notifications'
import { v4 as uuid } from 'uuid'
import { createChildLogger } from '../logger'

const log = createChildLogger('webhooks')

const router = Router()

router.post('/:provider', async (req: Request, res: Response) => {
  const provider = req.params.provider
  const payload = req.body

  log.info({ provider }, 'webhook received')

  try {
    let orderId: string | null = null
    let status: 'approved' | 'rejected' | 'pending' | null = null
    let paymentId: string | null = null

    switch (provider) {
      case 'mercadopago': {
        if (payload.action === 'payment.updated' && payload.data?.id) {
          paymentId = String(payload.data.id)
          const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
          if (mpToken) {
            try {
              const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${mpToken}` }
              })
              if (mpRes.ok) {
                const mpData = await mpRes.json() as any
                orderId = mpData.external_reference || null
                if (mpData.status === 'approved') status = 'approved'
                else if (mpData.status === 'cancelled' || mpData.status === 'rejected') status = 'rejected'
                else status = 'pending'
              }
            } catch (e) {
              log.error({ err: e }, 'MercadoPago API fetch error')
            }
          }
          if (!orderId) {
            orderId = payload.external_reference || payload.order_id || null
          }
        }
        break
      }

      case 'asaas': {
        if (payload.event === 'PAYMENT_CONFIRMED' || payload.event === 'PAYMENT_RECEIVED') {
          orderId = payload.payment?.externalReference || null
          status = 'approved'
          paymentId = payload.payment?.id || null
        } else if (payload.event === 'PAYMENT_OVERDUE' || payload.event === 'PAYMENT_DELETED') {
          orderId = payload.payment?.externalReference || null
          status = 'rejected'
        }
        break
      }

      case 'efi': {
        if (payload.pix?.txid) {
          orderId = payload.pix.txid || null
          if (payload.pix.status === 'CONCLUIDA') status = 'approved'
          else if (payload.pix.status === 'DEVOLVIDO') status = 'rejected'
          else status = 'pending'
        } else if (payload.charges) {
          const charge = Array.isArray(payload.charges) ? payload.charges[0] : payload.charges
          orderId = charge?.external_reference || null
          if (charge?.status === 'paid') status = 'approved'
          else if (charge?.status === 'unpaid') status = 'rejected'
          else status = 'pending'
        }
        break
      }

      default: {
        orderId = payload.orderId || payload.order_id || null
        status = payload.status || null
        paymentId = payload.paymentId || payload.payment_id || null
      }
    }

    if (!orderId || !status) {
      res.status(200).json({ received: true, processed: false })
      return
    }

    const order = dbGet('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) {
      res.status(200).json({ received: true, processed: false })
      return
    }

    const newPaymentStatus = status === 'approved' ? 'paid' :
                            status === 'rejected' ? 'failed' : 'pending'

    dbRun('UPDATE orders SET payment_status = ?, updated_at = datetime("now") WHERE id = ?',
      [newPaymentStatus, orderId])

    if (status === 'approved' && order.status === 'pending') {
      dbRun('UPDATE orders SET status = ?, updated_at = datetime("now") WHERE id = ?',
        ['confirmed', orderId])

      const updatedOrder = dbGet('SELECT * FROM orders WHERE id = ?', [orderId])
      if (updatedOrder) {
        notifyOrder(orderId, {
          type: 'status_update',
          order: { ...updatedOrder, items: JSON.parse(updatedOrder.items), printed: !!updatedOrder.printed },
          paymentStatus: newPaymentStatus
        })
      }
    }

    dbRun(`INSERT INTO payment_webhooks (id, provider, order_id, payment_id, status, payload, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      ['wh_' + uuid(), provider, orderId, paymentId, status, JSON.stringify(payload)])

    res.json({ success: true })
  } catch (err) {
    log.error({ err }, 'webhook processing error')
    res.status(200).json({ received: true, error: 'processing_failed' })
  }
})

export default router
