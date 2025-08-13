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
		await page.setContent(html, { waitUntil: "networkidle0" });

		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
		});
		await browser.close();

		const arrayBuffer =
			pdfBuffer instanceof Buffer ? pdfBuffer.buffer : pdfBuffer;

		return new Response(arrayBuffer, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename=Sales-Report-${currentDate}.pdf`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error: any) {
		console.error(error);
		return new Response(
			JSON.stringify({ error: error?.message || "Failed to generate PDF" }),
			{ status: 500 }
		);
	}
}
