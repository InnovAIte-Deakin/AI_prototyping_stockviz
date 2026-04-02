import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Settings, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Administration panel for StockViz platform management.',
}

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          <Shield className="h-4 w-4" />
          Admin
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Admin Panel
        </h1>
        <p className="text-muted-foreground text-lg">
          Admin functions require authentication — coming in Sprint 5.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto border-dashed border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
            <Settings className="h-5 w-5" />
            Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            API status monitoring, data source configuration, and cache management
            will be available after the admin backend is migrated.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
