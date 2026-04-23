'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { startOfDateSL } from '@/lib/utils'
import type { DatePreset, DateRange } from '@/hooks/useFinance'

interface DateRangePickerProps {
  preset: DatePreset
  onPresetChange: (preset: DatePreset) => void
  customRange: DateRange
  onCustomRangeChange: (range: DateRange) => void
}

export function DateRangePicker({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as DatePreset)}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this_week">This Week</SelectItem>
          <SelectItem value="this_month">This Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <>
          <Input
            type="date"
            value={customRange.from.slice(0, 10)}
            onChange={(e) => {
              if (!e.target.value) return
              onCustomRangeChange({
                ...customRange,
                from: startOfDateSL(e.target.value),
              })
            }}
            className="w-[150px] h-10"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={customRange.to.slice(0, 10)}
            onChange={(e) => {
              if (!e.target.value) return
              // Upper bound = start of the day AFTER selected end date
              const [y, m, d] = e.target.value.split('-').map(Number)
              const nextDay = new Date(Date.UTC(y, m - 1, d + 1))
              const nextDayStr = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')}`
              onCustomRangeChange({
                ...customRange,
                to: startOfDateSL(nextDayStr),
              })
            }}
            className="w-[150px] h-10"
          />
        </>
      )}
    </div>
  )
}
