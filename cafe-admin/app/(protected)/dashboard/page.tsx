import { OrderRealtimeListener } from '@/components/orders/realtime-listener'
import { SalesCard } from '@/components/dashboard/sales-card'
import { OrdersSummary } from '@/components/dashboard/orders-summary'
import { ProfitEstimate } from '@/components/dashboard/profit-estimate'
import { LowStockAlert } from '@/components/dashboard/low-stock-alert'
import { OrdersBySource } from '@/components/dashboard/orders-by-source'
import { RevenueTrend } from '@/components/dashboard/revenue-trend'
import { TodaysBookings } from '@/components/dashboard/todays-bookings'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <OrderRealtimeListener />
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {/* Top row — KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SalesCard />
        <OrdersSummary />
        <ProfitEstimate />
      </div>

      {/* Middle row — bookings + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodaysBookings />
        <LowStockAlert />
      </div>

      {/* Bottom row — orders by source */}
      <div className="grid grid-cols-1 gap-4">
        <OrdersBySource />
      </div>

      {/* Full-width revenue trend */}
      <RevenueTrend />
    </div>
  )
}
