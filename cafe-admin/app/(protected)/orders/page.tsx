import { OrdersTable } from '@/components/orders/orders-table'
import { OrderRealtimeListener } from '@/components/orders/realtime-listener'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <OrderRealtimeListener />
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <OrdersTable />
    </div>
  )
}
