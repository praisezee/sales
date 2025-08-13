export interface ProductEntryDTO {
  id: string
  productName: string
  initialQty: number
  qtySold: number
  pricePerUnit: number
  totalSales: number
  remainingQty: number
}

export function buildSalesReportHTML(currentDate: string, products: ProductEntryDTO[]) {
  const totalRevenue = products.reduce((s, p) => s + p.totalSales, 0)
  const totalUnits = products.reduce((s, p) => s + p.qtySold, 0)
  const avgPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0
  const maxRevenue = Math.max(1, ...products.map((p) => p.totalSales))

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const chips = [
    `Revenue: ₦${totalRevenue.toLocaleString()}`,
    `Products: ${products.length}`,
    `Units: ${totalUnits}`,
    `Avg Price: ₦${avgPrice.toFixed(2)}`,
  ]

  const dateStr = new Date(currentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const rows = products
    .map((p) => {
      return `<tr>
        <td class="cell name">${esc(p.productName)}</td>
        <td class="cell num">${p.initialQty}</td>
        <td class="cell num">${p.qtySold}</td>
        <td class="cell num">₦${p.pricePerUnit.toFixed(2)}</td>
        <td class="cell num emph">₦${p.totalSales.toLocaleString()}</td>
        <td class="cell num">${p.remainingQty}</td>
      </tr>`
    })
    .join("")

  const bars = products
    .map((p) => {
      const pct = Math.max(4, Math.round((p.totalSales / maxRevenue) * 100))
      return `<div class="bar-row">
        <div class="bar-label">${esc(p.productName)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">₦${p.totalSales.toLocaleString()}</div>
      </div>`
    })
    .join("")

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Daily Sales Report</title>
    <style>
      :root { --primary: #3b82f6; --accent: #0ea5e9; --muted:#64748b; --border:#e2e8f0; --bg:#ffffff; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: #fff; color: #0f172a; }
      .container { padding: 20px; }
      .brand { height: 8px; background: var(--primary); }
      .header { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; margin-top: 16px; }
      .title { font-size: 22px; font-weight: 800; }
      .date { color: var(--muted); font-size: 12px; margin-top: 4px; }
      .chips { display:flex; gap: 8px; flex-wrap: wrap; }
      .chip { padding: 6px 10px; border:1px solid var(--border); border-radius:8px; background:#f8fafc; font-size:12px; color:#475569; }
      .section { margin-top: 18px; }
      .section-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; color:#0f172a; }
      .card { border:1px solid var(--border); border-radius: 10px; padding: 12px; background: var(--bg); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
      /* Bars */
      .bar-row { display:grid; grid-template-columns: 1fr 4fr auto; gap: 10px; align-items:center; margin: 6px 0; }
      .bar-label { font-size: 12px; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .bar-track { height: 10px; background:#f1f5f9; border-radius: 999px; overflow:hidden; border:1px solid #e2e8f0; }
      .bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); }
      .bar-value { font-size: 12px; color:#334155; min-width: 90px; text-align:right; }
      /* Table */
      table { width:100%; border-collapse: separate; border-spacing: 0; }
      thead th { text-align:left; font-size: 12px; font-weight: 700; background:#f8fafc; padding:8px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
      tbody td { font-size: 12px; padding:8px; border-bottom:1px solid var(--border); color:#334155; }
      .cell.num { text-align:right; white-space:nowrap; }
      .cell.name { max-width: 260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .cell.emph { color: var(--primary); font-weight: 700; }
      .footer { margin-top: 16px; color:#64748b; font-size:10px; text-align:right; }
    </style>
  </head>
  <body>
    <div class="brand"></div>
    <div class="container">
      <div class="header">
        <div>
          <div class="title">Daily Sales Report</div>
          <div class="date">${dateStr}</div>
        </div>
        <div class="chips">
          ${chips.map((c) => `<div class="chip">${c}</div>`).join("")}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Revenue by Product</div>
        <div class="card">
          ${bars || '<div style="font-size:12px;color:#64748b;">No data</div>'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Details</div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align:right;">Initial</th>
                <th style="text-align:right;">Sold</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
                <th style="text-align:right;">Remain</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="6" style="padding:12px;color:#64748b;">No products</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">Generated by Daily Sales Tracker</div>
    </div>
  </body>
  </html>`
}


