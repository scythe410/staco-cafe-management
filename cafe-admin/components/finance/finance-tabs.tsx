'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './overview-tab'
import { ExpensesTab } from './expenses-tab'
import { PlatformTab } from './platform-tab'
import {
  type DatePreset,
  type DateRange,
  getPresetRange,
} from '@/hooks/useFinance'
import type { Role } from '@/constants/roles'

interface FinanceTabsProps {
  userId: string
  userRole: Role
}

export function FinanceTabs({ userId, userRole }: FinanceTabsProps) {
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [customRange, setCustomRange] = useState<DateRange>(getPresetRange('this_month'))

  const range = preset === 'custom' ? customRange : getPresetRange(preset)

  return (
    <Tabs defaultValue="overview">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
        <TabsTrigger value="expenses" className="min-h-[44px]">Expenses</TabsTrigger>
        <TabsTrigger value="platforms" className="min-h-[44px]">Platform Earnings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <OverviewTab
          range={range}
          preset={preset}
          onPresetChange={setPreset}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </TabsContent>

      <TabsContent value="expenses" className="mt-6">
        <ExpensesTab range={range} userId={userId} userRole={userRole} />
      </TabsContent>

      <TabsContent value="platforms" className="mt-6">
        <PlatformTab range={range} />
      </TabsContent>
    </Tabs>
  )
}
