export interface DailySummaryDTO {
  date: string
  totalRevenue: number
  totalProducts: number
  totalUnitsSold: number
  topProduct: string
  topProductRevenue: number
}

export interface ProductAnalyticsDTO {
  productName: string
  totalRevenue: number
  totalUnitsSold: number
  averagePrice: number
  appearances: number
  lastSold: string
}

export function buildAnalyticsReportHTML(
  selectedPeriod: string,
  summaries: DailySummaryDTO[],
  topProducts: ProductAnalyticsDTO[],
) {
  const totalRevenue = summaries.reduce((s, d) => s + d.totalRevenue, 0)
  const totalUnits = summaries.reduce((s, d) => s + d.totalUnitsSold, 0)
  const days = summaries.length
  const avgDailyRevenue = days > 0 ? totalRevenue / days : 0
  const maxRevenue = Math.max(1, ...summaries.map((d) => d.totalRevenue))

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const chips = [
    `Total Revenue: ₦${totalRevenue.toLocaleString()}`,
    `Days: ${days}`,
    `Units: ${totalUnits}`,
    `Avg Daily: ₦${avgDailyRevenue.toFixed(0)}`,
  ]

  const dayBars = summaries
    .map((d) => {
      const pct = Math.max(4, Math.round((d.totalRevenue / maxRevenue) * 100))
      const label = new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return `<div class="bar-row">
        <div class="bar-label">${esc(label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">₦${d.totalRevenue.toLocaleString()}</div>
      </div>`
    })
    .join("")

  const topProductBars = topProducts
    .slice(0, 10)
    .map((p) => {
      const pct = Math.max(4, Math.round((p.totalRevenue / Math.max(1, topProducts[0]?.totalRevenue || 1)) * 100))
      return `<div class="bar-row">
        <div class="bar-label">${esc(p.productName)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">₦${p.totalRevenue.toLocaleString()}</div>
      </div>`
    })
    .join("")

  const rows = summaries
    .map((d) => {
      return `<tr>
        <td class="cell name">${esc(new Date(d.date).toLocaleDateString())}</td>
        <td class="cell num emph">₦${d.totalRevenue.toLocaleString()}</td>
        <td class="cell num">${d.totalProducts}</td>
        <td class="cell num">${d.totalUnitsSold}</td>
        <td class="cell name">${esc(d.topProduct)}</td>
        <td class="cell num">₦${d.topProductRevenue.toLocaleString()}</td>
      </tr>`
    })
    .join("")

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sales Analytics Report</title>
    <style>
      :root { --primary: #3b82f6; --accent: #0ea5e9; --muted:#64748b; --border:#e2e8f0; --bg:#ffffff; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: #fff; color: #0f172a; }
      .container { padding: 20px; }
      .brand { height: 8px; background: var(--primary); }
      .header { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; margin-top: 16px; }
      .title { font-size: 22px; font-weight: 800; }
      .subtitle { color: var(--muted); font-size: 12px; margin-top: 4px; }
      .chips { display:flex; gap: 8px; flex-wrap: wrap; }
      .chip { padding: 6px 10px; border:1px solid var(--border); border-radius:8px; background:#f8fafc; font-size:12px; color:#475569; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .section { margin-top: 18px; }
      .section-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; color:#0f172a; }
      .card { border:1px solid var(--border); border-radius: 10px; padding: 12px; background: var(--bg); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
      .bar-row { display:grid; grid-template-columns: 1fr 4fr auto; gap: 10px; align-items:center; margin: 6px 0; }
      .bar-label { font-size: 12px; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .bar-track { height: 10px; background:#f1f5f9; border-radius: 999px; overflow:hidden; border:1px solid #e2e8f0; }
      .bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); }
      .bar-value { font-size: 12px; color:#334155; min-width: 90px; text-align:right; }
      table { width:100%; border-collapse: separate; border-spacing: 0; }
      thead th { text-align:left; font-size: 12px; font-weight: 700; background:#f8fafc; padding:8px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
      tbody td { font-size: 12px; padding:8px; border-bottom:1px solid var(--border); color:#334155; }
      .cell.num { text-align:right; white-space:nowrap; }
      .cell.name { max-width: 240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .cell.emph { color: var(--primary); font-weight: 700; }
      .footer { margin-top: 16px; color:#64748b; font-size:10px; text-align:right; }
    </style>
  </head>
  <body>
    <div class="brand"></div>
    <div class="container">
      <div class="header">
        <div>
          <div class="title">Sales Analytics Report</div>
          <div class="subtitle">Period: ${esc(selectedPeriod)} • Generated: ${dateStr}</div>
        </div>
        <div class="chips">${chips.map((c) => `<div class="chip">${c}</div>`).join("")}</div>
      </div>

      <div class="grid section">
        <div>
          <div class="section-title">Revenue by Day</div>
          <div class="card">${dayBars || '<div style="font-size:12px;color:#64748b;">No data</div>'}</div>
        </div>
        <div>
          <div class="section-title">Top Products</div>
          <div class="card">${topProductBars || '<div style="font-size:12px;color:#64748b;">No data</div>'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Daily Breakdown</div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th style="text-align:right;">Revenue</th>
                <th style="text-align:right;">Products</th>
                <th style="text-align:right;">Units</th>
                <th>Top Product</th>
                <th style="text-align:right;">Top Rev</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="6" style="padding:12px;color:#64748b;">No entries</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">Generated by Daily Sales Tracker</div>
    </div>
  </body>
  </html>`
}


