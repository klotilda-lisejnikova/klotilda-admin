import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Order, OrderStatus, PaymentStatus, PaginatedResponse } from '../types/api'

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nová',
  processing: 'Zpracovávám',
  shipped: 'Odesláno',
  delivered: 'Doručeno',
  cancelled: 'Zrušeno',
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Čeká',
  paid: 'Zaplaceno',
  failed: 'Selhalo',
  refunded: 'Vráceno',
}

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
}

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')

  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (orderStatus) params.set('orderStatus', orderStatus)
  if (paymentStatus) params.set('paymentStatus', paymentStatus)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, orderStatus, paymentStatus],
    queryFn: () =>
      api.get<PaginatedResponse<Order>>(`/orders?${params}`).then((r) => r.data),
  })

  const orders = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Objednávky</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} objednávek celkem</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={orderStatus}
            onChange={(e) => { setOrderStatus(e.target.value as OrderStatus | ''); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">Všechny stavy</option>
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value as PaymentStatus | ''); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">Všechny platby</option>
            {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Načítám…</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Zákazník</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Datum</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Částka</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Platba</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stav</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.id}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {order.customerFirstName} {order.customerLastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {order.totalAmount.toLocaleString('cs-CZ')} Kč
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.orderStatus]}`}>
                        {ORDER_STATUS_LABELS[order.orderStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Žádné objednávky
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 justify-end">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Předchozí
              </button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Další →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
