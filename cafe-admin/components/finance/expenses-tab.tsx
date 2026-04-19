'use client'

import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses, useExpenseBreakdown, type DateRange } from '@/hooks/useFinance'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  EXPENSE_CATEGORY,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/constants/expenses'
import { AddExpenseDialog } from './add-expense-dialog'

const ALL = 'all'

interface ExpensesTabProps {
  range: DateRange
  userId: string
}

export function ExpensesTab({ range, userId }: ExpensesTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>(ALL)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: expenses, isLoading, isError } = useExpenses({
    category: categoryFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })
  const { data: breakdown, isLoading: loadingBreakdown } = useExpenseBreakdown(range)

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'all')}
          >
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Categories</SelectItem>
              {Object.values(EXPENSE_CATEGORY).map((c) => (
                <SelectItem key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px] h-10"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px] h-10"
          />
        </div>
        <AddExpenseDialog userId={userId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense breakdown donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Breakdown by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="h-[260px] flex items-center justify-center">
                <div className="h-[170px] w-[170px] animate-pulse rounded-full bg-muted" />
              </div>
            ) : breakdown && breakdown.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="amount"
                      nameKey="category"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {breakdown.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), 'Amount']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No expenses for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses table */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive py-8 text-center">Failed to load expenses</p>
          ) : (
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!expenses || expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No expenses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.description || '—'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
