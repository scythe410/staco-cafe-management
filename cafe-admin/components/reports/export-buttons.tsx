'use client'

import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportButtonsProps {
  onCSV: () => void
  onPrint: () => void
}

export function ExportButtons({ onCSV, onPrint }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="h-11 gap-1.5" onClick={onCSV}>
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" className="h-11 gap-1.5" onClick={onPrint}>
        <Printer className="h-4 w-4" />
        Print / PDF
      </Button>
    </div>
  )
}
