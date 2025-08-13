import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import {
	buildSalesReportHTML,
	type ProductEntryDTO,
} from "../../export/report-template";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	try {
		const {
			currentDate,
			products,
		}: { currentDate: string; products: ProductEntryDTO[] } = await req.json();

		const html = buildSalesReportHTML(currentDate, products);

        const executablePath = await chromium.executablePath();
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
        });
		const page = await browser.newPage();
		await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
		await page.setContent(html, { waitUntil: "networkidle0" });

		const pngBuffer = await page.screenshot({ type: "png", fullPage: true });
		await browser.close();

		const arrayBuffer =
			pngBuffer instanceof Buffer ? pngBuffer.buffer : pngBuffer;

		return new Response(arrayBuffer, {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `attachment; filename=Sales-Report-${currentDate}.png`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error: any) {
		return new Response(
			JSON.stringify({ error: error?.message || "Failed to generate PNG" }),
			{ status: 500 }
		);
	}
}
