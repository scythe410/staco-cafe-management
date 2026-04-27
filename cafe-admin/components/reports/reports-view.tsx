'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DailySalesReport } from './daily-sales-report'
import { MonthlyIncomeReport } from './monthly-income-report'
import { StockReport } from './stock-report'
import { SalaryReport } from './salary-report'
import { BookingsReport } from './bookings-report'
import { format, startOfMonth } from 'date-fns'

type ReportType = 'daily_sales' | 'monthly_income' | 'stock' | 'salary' | 'bookings'

const REPORT_LABELS: Record<ReportType, string> = {
  daily_sales: 'Daily Sales',
  monthly_income: 'Monthly Income',
  stock: 'Stock Report',
  salary: 'Salary Report',
  bookings: 'Bookings',
}

export function ReportsView() {
  const [reportType, setReportType] = useState<ReportType>('daily_sales')
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [from, setFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [to, setTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const needsDate = reportType === 'daily_sales'
  const needsMonth = reportType === 'monthly_income' || reportType === 'salary'
  const needsRange = reportType === 'bookings'

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
          <SelectTrigger className="w-[200px] h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(REPORT_LABELS) as [ReportType, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {needsDate && (
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px] h-11"
          />
        )}

        {needsMonth && (
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-[180px] h-11"
          />
        )}

        {needsRange && (
          <>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[170px] h-11"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-[170px] h-11"
            />
          </>
        )}
      </div>

      {/* Report content */}
      {reportType === 'daily_sales' && <DailySalesReport date={date} />}
      {reportType === 'monthly_income' && <MonthlyIncomeReport month={month} />}
      {reportType === 'stock' && <StockReport />}
      {reportType === 'salary' && <SalaryReport month={month} />}
      {reportType === 'bookings' && <BookingsReport from={from} to={to} />}
    </div>
  )
}
