'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrdersBySource } from '@/hooks/useDashboard'

export function OrdersBySource() {
  const { data: sourceData, isLoading, isError } = useOrdersBySource()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">
          Orders by Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[260px] flex items-center justify-center">
            <div className="h-[170px] w-[170px] animate-pulse rounded-full bg-muted" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load source data</p>
        ) : sourceData && sourceData.length > 0 ? (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} orders`, name as string]}
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
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No orders today</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
