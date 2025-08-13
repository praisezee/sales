export interface ProductEntry {
  id: string
  productName: string
  initialQty: number
  qtySold: number
  pricePerUnit: number
  totalSales: number
  remainingQty: number
}

export interface SalesData {
  [date: string]: ProductEntry[]
}
