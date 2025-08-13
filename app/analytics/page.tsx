"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FileImage,
  FileText,
} from "lucide-react"
import { AnalyticsChart } from "@/components/analytics-chart"
import type { SalesData } from "@/types/sales"

interface DailySummary {
  date: string
  totalRevenue: number
  totalProducts: number
  totalUnitsSold: number
  topProduct: string
  topProductRevenue: number
}

interface ProductAnalytics {
  productName: string
  totalRevenue: number
  totalUnitsSold: number
  averagePrice: number
  appearances: number
  lastSold: string
}

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData>({})
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue")
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadSalesData()
  }, [])

  const loadSalesData = async () => {
    setIsLoading(true)
    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      const stored = localStorage.getItem("dailySalesData")
      if (stored) {
        setSalesData(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading sales data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const dailySummaries = useMemo((): DailySummary[] => {
    return Object.entries(salesData)
      .map(([date, products]) => {
        const totalRevenue = products.reduce((sum, p) => sum + p.totalSales, 0)
        const totalUnitsSold = products.reduce((sum, p) => sum + p.qtySold, 0)
        const topProduct = products.reduce(
          (top, current) => (current.totalSales > top.totalSales ? current : top),
          products[0],
        )

        return {
          date,
          totalRevenue,
          totalProducts: products.length,
          totalUnitsSold,
          topProduct: topProduct?.productName || "",
          topProductRevenue: topProduct?.totalSales || 0,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [salesData])

  const productAnalytics = useMemo((): ProductAnalytics[] => {
    const productMap = new Map<string, ProductAnalytics>()

    Object.entries(salesData).forEach(([date, products]) => {
      products.forEach((product) => {
        const existing = productMap.get(product.productName)
        if (existing) {
          existing.totalRevenue += product.totalSales
          existing.totalUnitsSold += product.qtySold
          existing.appearances += 1
          existing.lastSold = date > existing.lastSold ? date : existing.lastSold
        } else {
          productMap.set(product.productName, {
            productName: product.productName,
            totalRevenue: product.totalSales,
            totalUnitsSold: product.qtySold,
            averagePrice: product.pricePerUnit,
            appearances: 1,
            lastSold: date,
          })
        }
      })
    })

    return Array.from(productMap.values())
      .map((product) => ({
        ...product,
        averagePrice: product.totalRevenue / product.totalUnitsSold,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [salesData])

  const filteredSummaries = useMemo(() => {
    if (selectedPeriod === "all") return dailySummaries

    const now = new Date()
    const filterDate = new Date()

    switch (selectedPeriod) {
      case "7days":
        filterDate.setDate(now.getDate() - 7)
        break
      case "30days":
        filterDate.setDate(now.getDate() - 30)
        break
      case "90days":
        filterDate.setDate(now.getDate() - 90)
        break
      default:
        return dailySummaries
    }

    return dailySummaries.filter((summary) => new Date(summary.date) >= filterDate)
  }, [dailySummaries, selectedPeriod])

  const totalStats = useMemo(() => {
    const total = filteredSummaries.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.totalRevenue,
        products: acc.products + day.totalProducts,
        units: acc.units + day.totalUnitsSold,
      }),
      { revenue: 0, products: 0, units: 0 },
    )

    const avgDaily = {
      revenue: total.revenue / (filteredSummaries.length || 1),
      products: total.products / (filteredSummaries.length || 1),
      units: total.units / (filteredSummaries.length || 1),
    }

    // Calculate growth (comparing first half vs second half of period)
    const midPoint = Math.floor(filteredSummaries.length / 2)
    const firstHalf = filteredSummaries.slice(midPoint)
    const secondHalf = filteredSummaries.slice(0, midPoint)

    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.totalRevenue, 0) / (firstHalf.length || 1)
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.totalRevenue, 0) / (secondHalf.length || 1)

    const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

    return { total, avgDaily, growthRate }
  }, [filteredSummaries])

  const exportAsImage = async () => {
    setIsExporting(true)
    try {
      const summariesPayload = dailySummaries.map((d) => ({
        date: d.date,
        totalRevenue: d.totalRevenue,
        totalProducts: d.totalProducts,
        totalUnitsSold: d.totalUnitsSold,
        topProduct: d.topProduct,
        topProductRevenue: d.topProductRevenue,
      }))
      const topProductsPayload = productAnalytics.map((p) => ({
        productName: p.productName,
        totalRevenue: p.totalRevenue,
        totalUnitsSold: p.totalUnitsSold,
        averagePrice: p.averagePrice,
        appearances: p.appearances,
        lastSold: p.lastSold,
      }))

      const res = await fetch('/api/export/analytics-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPeriod, summaries: summariesPayload, topProducts: topProductsPayload }),
      })
      if (!res.ok) throw new Error('Failed to generate Analytics PNG')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting analytics image:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsPDF = async () => {
    setIsExporting(true)
    try {
      const summariesPayload = dailySummaries.map((d) => ({
        date: d.date,
        totalRevenue: d.totalRevenue,
        totalProducts: d.totalProducts,
        totalUnitsSold: d.totalUnitsSold,
        topProduct: d.topProduct,
        topProductRevenue: d.topProductRevenue,
      }))
      const topProductsPayload = productAnalytics.map((p) => ({
        productName: p.productName,
        totalRevenue: p.totalRevenue,
        totalUnitsSold: p.totalUnitsSold,
        averagePrice: p.averagePrice,
        appearances: p.appearances,
        lastSold: p.lastSold,
      }))

      const res = await fetch('/api/export/analytics-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPeriod, summaries: summariesPayload, topProducts: topProductsPayload }),
      })
      if (!res.ok) throw new Error('Failed to generate Analytics PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting analytics PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navigation />
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (Object.keys(salesData).length === 0) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto animate-float">
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                No Sales Data Yet
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                Start tracking your daily sales to see beautiful analytics and insights here.
              </p>
            </div>
            <Button asChild className="mt-8 hover-lift touch-action">
              <a href="/">
                <BarChart3 className="h-4 w-4 mr-2" />
                Start Tracking Sales
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-hero smooth-scroll">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Enhanced header with animations */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-float">
            Sales Analytics
          </h1>
          <p
            className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Discover insights from your sales history and track your business growth over time.
          </p>
        </div>

        {/* Enhanced controls with better mobile layout */}
        <div
          className="flex flex-col sm:flex-row gap-4 items-center justify-between animate-scale-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48 focus-ring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">View:</span>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32 focus-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="units">Units Sold</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsImage}
                disabled={isExporting}
                className="flex items-center gap-2 hover:scale-105 transition-all duration-300 bg-transparent"
              >
                <FileImage className="h-4 w-4" />
                <span className="hidden sm:inline">PNG</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsPDF}
                disabled={isExporting}
                className="flex items-center gap-2 hover:scale-105 transition-all duration-300 bg-transparent"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>

        <div data-export-section="analytics-data" className="space-y-8">
          {/* Enhanced stats cards with staggered animations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.4s" }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="font-display text-xl md:text-2xl font-bold">
                      ₦{totalStats.total.revenue.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      {totalStats.growthRate >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs md:text-sm font-medium ${totalStats.growthRate >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {Math.abs(totalStats.growthRate).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.5s" }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                    <p className="font-display text-xl md:text-2xl font-bold">
                      ₦{totalStats.avgDaily.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {totalStats.avgDaily.units.toFixed(1)} units/day
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.6s" }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <p className="font-display text-xl md:text-2xl font-bold">{productAnalytics.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{totalStats.total.units} units sold</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-chart-3/20 to-chart-3/10 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.7s" }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Sales Days</p>
                    <p className="font-display text-xl md:text-2xl font-bold">{filteredSummaries.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {totalStats.avgDaily.products.toFixed(1)} products/day
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-chart-4/20 to-chart-4/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced charts with better responsive layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.8s" }}>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart data={filteredSummaries} metric={selectedMetric} type="line" />
              </CardContent>
            </Card>

            <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.9s" }}>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart data={productAnalytics.slice(0, 5)} metric="revenue" type="bar" />
              </CardContent>
            </Card>
          </div>

          {/* Enhanced product performance table */}
          <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "1s" }}>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Performance ({selectedPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {productAnalytics.slice(0, 10).map((product, index) => (
                  <div
                    key={product.productName}
                    className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover-lift animate-fade-in-up"
                    style={{ animationDelay: `${1.1 + index * 0.05}s` }}
                  >
                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                      <Badge
                        variant="secondary"
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold"
                      >
                        {index + 1}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate text-sm md:text-base">{product.productName}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {product.totalUnitsSold} units • {product.appearances} days • Last sold:{" "}
                          {new Date(product.lastSold).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-bold text-sm md:text-base">
                        ₦{product.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        ₦{product.averagePrice.toFixed(2)}/unit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {isExporting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Exporting analytics data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
