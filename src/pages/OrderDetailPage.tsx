import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Order, OrderStatus } from '../types/api'

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'Nová' },
  { value: 'processing', label: 'Zpracovávám' },
  { value: 'shipped', label: 'Odesláno' },
  { value: 'delivered', label: 'Doručeno' },
  { value: 'cancelled', label: 'Zrušeno' },
]

const SHIPPING_LABELS: Record<string, string> = {
  zasilkovna: 'Zásilkovna',
  ceska_posta: 'Česká pošta',
  osobni_odber: 'Osobní odběr',
}

const PAYMENT_LABELS: Record<string, string> = {
  card: 'Platební karta',
  qr: 'QR kód',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: (orderStatus: OrderStatus) =>
      api.put(`/orders/${id}/status`, { orderStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Načítám…</div>
  if (!order) return <div className="p-8 text-sm text-red-500">Objednávka nenalezena</div>

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="text-sm text-gray-500 hover:text-gray-900">
          ← Zpět
        </button>
        <h1 className="text-xl font-semibold text-gray-900 font-mono">{order.id}</h1>
      </div>

      <div className="space-y-5">
        <Section title="Zákazník">
          <Row label="Jméno" value={`${order.customerFirstName} ${order.customerLastName}`} />
          <Row
            label="Email"
            value={
              <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:underline">
                {order.customerEmail}
              </a>
            }
          />
          {order.customerPhone && <Row label="Telefon" value={order.customerPhone} />}
          <Row label="Adresa" value={`${order.street}, ${order.zip} ${order.city}`} />
        </Section>

        <Section title="Doprava & platba">
          <Row label="Doprava" value={SHIPPING_LABELS[order.shippingMethod] ?? order.shippingMethod} />
          <Row label="Cena dopravy" value={`${order.shippingPrice} Kč`} />
          <Row label="Způsob platby" value={PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} />
          <Row label="Stav platby" value={order.paymentStatus} />
          {order.comgateTransactionId && (
            <Row label="Comgate ID" value={<span className="font-mono text-xs">{order.comgateTransactionId}</span>} />
          )}
        </Section>

        <Section title="Položky objednávky">
          <div className="space-y-2">
            {items.map((item: { productId: string; name: string; price: number; quantity: number }, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-medium text-gray-900">{(item.price * item.quantity).toLocaleString('cs-CZ')} Kč</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-semibold">
              <span>Celkem</span>
              <span>{order.totalAmount.toLocaleString('cs-CZ')} Kč</span>
            </div>
          </div>
        </Section>

        <Section title="Stav objednávky">
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateStatus.mutate(value)}
                disabled={updateStatus.isPending}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  order.orderStatus === value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {order.notes && (
          <Section title="Poznámky">
            <p className="text-sm text-gray-700">{order.notes}</p>
          </Section>
        )}

        <div className="pt-2">
          <a
            href={`mailto:${order.customerEmail}?subject=Objednávka ${order.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Napsat zákazníkovi →
          </a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  )
}
