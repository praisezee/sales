import { NextRequest } from "next/server"
import chromium from "@sparticuz/chromium"
import puppeteer from "puppeteer-core"
import { buildAnalyticsReportHTML, type DailySummaryDTO, type ProductAnalyticsDTO } from "../../export/analytics-template"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { selectedPeriod, summaries, topProducts }: { selectedPeriod: string; summaries: DailySummaryDTO[]; topProducts: ProductAnalyticsDTO[] } = await req.json()

    const html = buildAnalyticsReportHTML(selectedPeriod, summaries, topProducts)

    const executablePath = await chromium.executablePath()
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pngBuffer = await page.screenshot({ type: "png", fullPage: true })
    await browser.close()

    const arrayBuffer = pngBuffer instanceof Buffer ? pngBuffer.buffer : pngBuffer
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename=Analytics-Report-${new Date().toISOString().split("T")[0]}.png`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error?.message || "Failed to generate Analytics PNG" }), { status: 500 })
  }
}


