'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { useArchiveOlderThan } from '@/hooks/useArchive'
import type { Role } from '@/constants/roles'

interface SettingsViewProps {
  userName: string
  userEmail: string
  userRole: Role
}

const PRESETS: { label: string; days: number }[] = [
  { label: 'Older than 30 days', days: 30 },
  { label: 'Older than 60 days', days: 60 },
  { label: 'Older than 90 days', days: 90 },
  { label: 'Older than 6 months', days: 180 },
  { label: 'Older than 1 year', days: 365 },
]

export function SettingsView({ userName, userEmail, userRole }: SettingsViewProps) {
  const [days, setDays] = useState<number>(90)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const archiveOlderThan = useArchiveOlderThan()

  function handleConfirm() {
    archiveOlderThan.mutate(days, {
      onSettled: () => setConfirmOpen(false),
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{userName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-mono text-xs">{userEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="capitalize font-medium">{userRole}</p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Hide old completed records from the active views. Archived rows are
            kept for audit and continue to count in financial totals — they can
            be restored individually from the archived view of each module.
          </p>

          <div className="space-y-2">
            <Label htmlFor="clear-window" className="text-xs">
              Clear records older than
            </Label>
            <Select
              value={String(days)}
              onValueChange={(v) => setDays(Number(v))}
            >
              <SelectTrigger id="clear-window" className="w-[220px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.days} value={String(p.days)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="destructive"
            className="h-11 gap-2"
            onClick={() => setConfirmOpen(true)}
            disabled={archiveOlderThan.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {archiveOlderThan.isPending ? 'Archiving…' : 'Clear History'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive old records?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move completed orders, expenses, finalised bookings,
              and read notifications older than{' '}
              <span className="font-semibold">{days} days</span> into the
              archive. They stay searchable in each module&apos;s Archived view
              and continue to contribute to financial totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveOlderThan.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={archiveOlderThan.isPending}
            >
              {archiveOlderThan.isPending ? 'Archiving…' : 'Archive now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
