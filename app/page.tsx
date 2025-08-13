"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Calendar, BarChart3, Plus } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import SalesChart from "@/components/sales-chart"
import type { SalesData, ProductEntry } from "@/types/sales"

export default function DailySalesTracker() {
  const [currentDate, setCurrentDate] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [salesData, setSalesData] = useState<SalesData>({})
  const [currentProducts, setCurrentProducts] = useState<ProductEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [productName, setProductName] = useState("")
  const [initialQty, setInitialQty] = useState("")
  const [qtySold, setQtySold] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [error, setError] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setCurrentDate(today)
    setSelectedDate(today)
    loadSalesData()
  }, [])

  useEffect(() => {
    setCurrentProducts(salesData[selectedDate] || [])
  }, [selectedDate, salesData])

  const loadSalesData = async () => {
    setIsLoading(true)
    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const stored = localStorage.getItem("dailySalesData")
      if (stored) {
        const data = JSON.parse(stored)
        setSalesData(data)
        setAvailableDates(Object.keys(data).sort().reverse())
      }
    } catch (error) {
      console.error("Error loading sales data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSalesData = (data: SalesData) => {
    try {
      localStorage.setItem("dailySalesData", JSON.stringify(data))
      setSalesData(data)
      setAvailableDates(Object.keys(data).sort().reverse())
    } catch (error) {
      console.error("Error saving sales data:", error)
      setError("Failed to save data. Please try again.")
    }
  }

  const addProduct = async () => {
    setError("")
    setIsAddingProduct(true)

    // Add loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!productName.trim()) {
      setError("Product name is required")
      setIsAddingProduct(false)
      return
    }

    const initialQtyNum = Number.parseInt(initialQty)
    const qtySoldNum = Number.parseInt(qtySold)
    const pricePerUnitNum = Number.parseFloat(pricePerUnit)

    if (isNaN(initialQtyNum) || initialQtyNum < 0) {
      setError("Initial quantity must be a valid positive number")
      setIsAddingProduct(false)
      return
    }

    if (isNaN(qtySoldNum) || qtySoldNum < 0) {
      setError("Quantity sold must be a valid positive number")
      setIsAddingProduct(false)
      return
    }

    if (isNaN(pricePerUnitNum) || pricePerUnitNum < 0) {
      setError("Price per unit must be a valid positive number")
      setIsAddingProduct(false)
      return
    }

    if (qtySoldNum > initialQtyNum) {
      setError("Quantity sold cannot exceed initial quantity")
      setIsAddingProduct(false)
      return
    }

    const newProduct: ProductEntry = {
      id: Date.now().toString(),
      productName: productName.trim(),
      initialQty: initialQtyNum,
      qtySold: qtySoldNum,
      pricePerUnit: pricePerUnitNum,
      totalSales: qtySoldNum * pricePerUnitNum,
      remainingQty: initialQtyNum - qtySoldNum,
    }

    const updatedProducts = [...currentProducts, newProduct]
    const updatedSalesData = {
      ...salesData,
      [selectedDate]: updatedProducts,
    }

    saveSalesData(updatedSalesData)

    setProductName("")
    setInitialQty("")
    setQtySold("")
    setPricePerUnit("")
    setIsAddingProduct(false)
  }

  const removeProduct = (productId: string) => {
    const updatedProducts = currentProducts.filter((p) => p.id !== productId)
    const updatedSalesData = {
      ...salesData,
      [selectedDate]: updatedProducts,
    }

    if (updatedProducts.length === 0) {
      delete updatedSalesData[selectedDate]
    }

    saveSalesData(updatedSalesData)
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all sales data? This action cannot be undone.")) {
      localStorage.removeItem("dailySalesData")
      setSalesData({})
      setCurrentProducts([])
      setAvailableDates([])
      setSelectedDate(currentDate)
    }
  }

  const totalRevenue = currentProducts.reduce((sum, product) => sum + product.totalSales, 0)

  const topSellingProduct =
    currentProducts.length > 0
      ? currentProducts.reduce((top, current) => (current.totalSales > top.totalSales ? current : top))
      : null

  const topSellingPercentage =
    totalRevenue > 0 && topSellingProduct ? ((topSellingProduct.totalSales / totalRevenue) * 100).toFixed(1) : "0"

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

  return (
    <div className="min-h-screen gradient-hero smooth-scroll">
      <Navigation />

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
        <div className="text-center space-y-3 sm:space-y-4 py-6 sm:py-8 md:py-12 animate-fade-in-up">
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-float leading-tight">
            Your Sales Story Today
          </h1>
          <p
            className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            {selectedDate === currentDate
              ? `Today - ${new Date(currentDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`
              : new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
          </p>
        </div>

        <div
          className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row gap-4 items-center justify-between animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full sm:w-48 focus-ring">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentDate}>Today</SelectItem>
                {availableDates
                  .filter((date) => date !== currentDate)
                  .map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center order-first sm:order-none">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
            <p className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-bounce-subtle">
              ₦{totalRevenue.toLocaleString()}
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllData}
            className="flex items-center gap-2 w-full sm:w-auto touch-action hover-lift"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Clear All Data</span>
          </Button>
        </div>

        {selectedDate === currentDate && (
          <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
                <Plus className="h-5 w-5" />
                Add New Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="lg:col-span-1">
                  <Label htmlFor="productName" className="text-sm font-medium">
                    Product Name
                  </Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    className="mt-1 focus-ring touch-action"
                  />
                </div>
                <div>
                  <Label htmlFor="initialQty" className="text-sm font-medium">
                    Initial Qty
                  </Label>
                  <Input
                    id="initialQty"
                    type="number"
                    min="0"
                    value={initialQty}
                    onChange={(e) => setInitialQty(e.target.value)}
                    placeholder="0"
                    className="mt-1 focus-ring touch-action"
                  />
                </div>
                <div>
                  <Label htmlFor="qtySold" className="text-sm font-medium">
                    Qty Sold
                  </Label>
                  <Input
                    id="qtySold"
                    type="number"
                    min="0"
                    value={qtySold}
                    onChange={(e) => setQtySold(e.target.value)}
                    placeholder="0"
                    className="mt-1 focus-ring touch-action"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerUnit" className="text-sm font-medium">
                    Price/Unit (₦)
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 focus-ring touch-action"
                  />
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button
                    onClick={addProduct}
                    disabled={isAddingProduct}
                    className="w-full touch-action hover-lift transition-all duration-300"
                  >
                    {isAddingProduct ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs sm:text-sm">Adding...</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Add Product</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="mt-4 animate-slide-up">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <div data-export-section="complete-data" className="space-y-4 sm:space-y-6">
          <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.5s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl">
                <BarChart3 className="h-5 w-5" />
                <span className="truncate">
                  Sales Data -{" "}
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: window.innerWidth < 640 ? "short" : "long",
                    year: "numeric",
                    month: window.innerWidth < 640 ? "short" : "long",
                    day: "numeric",
                  })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground animate-fade-in-up">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <p className="text-base sm:text-lg font-medium mb-2">No products added for this date.</p>
                  {selectedDate === currentDate && (
                    <p className="text-xs sm:text-sm">Add your first product using the form above.</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto smooth-scroll -mx-2 sm:mx-0">
                  <div className="min-w-[600px] px-2 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px] text-xs sm:text-sm">Product Name</TableHead>
                          <TableHead className="text-right min-w-[80px] text-xs sm:text-sm">Initial Qty</TableHead>
                          <TableHead className="text-right min-w-[80px] text-xs sm:text-sm">Qty Sold</TableHead>
                          <TableHead className="text-right min-w-[100px] text-xs sm:text-sm">Price/Unit</TableHead>
                          <TableHead className="text-right min-w-[120px] text-xs sm:text-sm">Total Sales</TableHead>
                          <TableHead className="text-right min-w-[100px] text-xs sm:text-sm">Remaining</TableHead>
                          {selectedDate === currentDate && (
                            <TableHead className="text-center min-w-[80px] text-xs sm:text-sm">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentProducts.map((product, index) => (
                          <TableRow
                            key={product.id}
                            className="animate-fade-in-up hover:bg-muted/50 transition-colors duration-200"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <TableCell className="font-medium text-xs sm:text-sm">{product.productName}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{product.initialQty}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{product.qtySold}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">
                              ₦{product.pricePerUnit.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary text-xs sm:text-sm">
                              ₦{product.totalSales.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{product.remainingQty}</TableCell>
                            {selectedDate === currentDate && (
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProduct(product.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-action hover-lift p-1 sm:p-2"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {currentProducts.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.6s" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-lg sm:text-xl">Sales Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesChart products={currentProducts} currentDate={currentDate} />
                </CardContent>
              </Card>

              <Card className="glass-card border-0 hover-lift animate-scale-in" style={{ animationDelay: "0.7s" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-lg sm:text-xl">Daily Insights & Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg animate-pulse-slow">
                    <h4 className="font-display font-semibold mb-2 text-sm sm:text-base">Top Performer</h4>
                    {topSellingProduct && (
                      <p className="text-xs sm:text-sm leading-relaxed">
                        <span className="font-medium">{topSellingProduct.productName}</span> was the top seller with{" "}
                        <span className="font-semibold text-primary">
                          ₦{topSellingProduct.totalSales.toLocaleString()}
                        </span>{" "}
                        in sales, making up <span className="font-semibold">{topSellingPercentage}%</span> of total
                        revenue.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg hover-lift">
                      <p className="text-muted-foreground mb-1 text-xs sm:text-sm">Products Sold</p>
                      <p className="font-display text-lg sm:text-2xl font-bold text-accent">{currentProducts.length}</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-chart-3/10 to-chart-3/5 rounded-lg hover-lift">
                      <p className="text-muted-foreground mb-1 text-xs sm:text-sm">Total Units</p>
                      <p className="font-display text-lg sm:text-2xl font-bold text-chart-3">
                        {currentProducts.reduce((sum, p) => sum + p.qtySold, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-gradient-to-br from-muted/20 to-muted/10 rounded-lg">
                    <h4 className="font-display font-semibold mb-2 text-sm sm:text-base">Daily Summary</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Today's sales performance shows a total revenue of ₦{totalRevenue.toLocaleString()} across{" "}
                      {currentProducts.length} products. The average selling price was ₦
                      {(
                        currentProducts.reduce((sum, p) => sum + p.totalSales, 0) /
                          currentProducts.reduce((sum, p) => sum + p.qtySold, 0) || 0
                      ).toFixed(2)}{" "}
                      per unit with {currentProducts.reduce((sum, p) => sum + p.qtySold, 0)} total units sold.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
