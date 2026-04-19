'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
            onChange={(e) =>
              onCustomRangeChange({
                ...customRange,
                from: new Date(e.target.value).toISOString(),
              })
            }
            className="w-[150px] h-10"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={customRange.to.slice(0, 10)}
            onChange={(e) =>
              onCustomRangeChange({
                ...customRange,
                to: new Date(e.target.value + 'T23:59:59').toISOString(),
              })
            }
            className="w-[150px] h-10"
          />
        </>
      )}
    </div>
  )
}
