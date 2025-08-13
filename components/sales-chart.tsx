"use client";
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	Filler,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	TrendingUp,
	PieChart,
	BarChart3,
	FileImage,
	FileText,
} from "lucide-react";
import type { ProductEntry, SalesData } from "@/types/sales";

ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	Filler
);

interface SalesChartProps {
	products: ProductEntry[];
	currentDate: string;
}

export default function SalesChart({ products, currentDate }: SalesChartProps) {
	const [chartType, setChartType] = useState<"pie" | "bar" | "line">("bar");
	const [salesHistory, setSalesHistory] = useState<SalesData>({});
	const [isExporting, setIsExporting] = useState(false);
	const chartContainerRef = useRef<HTMLDivElement>(null);

	const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);

	useEffect(() => {
		// Load historical data for line chart
		try {
			const stored = localStorage.getItem("dailySalesData");
			if (stored) {
				setSalesHistory(JSON.parse(stored));
			}
		} catch (error) {
			console.error("Error loading sales history:", error);
		}
	}, []);

	const exportAsImage = async () => {
		setIsExporting(true);
		try {
			const res = await fetch("/api/export/png", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentDate, products }),
			});
			if (!res.ok) throw new Error("Failed to generate PNG");
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `Sales-Report-${currentDate}.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error exporting image:", error);
		} finally {
			setIsExporting(false);
		}
	};

	const exportAsPDF = async () => {
		setIsExporting(true);
		try {
			const res = await fetch("/api/export/pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentDate, products }),
			});
			if (!res.ok) throw new Error("Failed to generate PDF");
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `Sales-Report-${currentDate}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error exporting PDF:", error);
		} finally {
			setIsExporting(false);
		}
	};

	const chartColors = {
		primary: "#3b82f6", // Blue-500
		primaryLight: "rgba(59, 130, 246, 0.2)",
		accent: "#0ea5e9", // Sky-500
		accentLight: "rgba(14, 165, 233, 0.2)",
		muted: "#64748b", // Slate-500 for text
		border: "#e2e8f0", // Slate-200 for borders
		gradient: [
			"#3b82f6", // Blue-500
			"#0ea5e9", // Sky-500
			"#8b5cf6", // Violet-500
			"#059669", // Emerald-600
			"#f97316", // Orange-500
			"#ef4444", // Red-500
			"#8b5cf6", // Purple-500
		],
		gradientLight: [
			"rgba(59, 130, 246, 0.2)",
			"rgba(14, 165, 233, 0.2)",
			"rgba(139, 92, 246, 0.2)",
			"rgba(5, 150, 105, 0.2)",
			"rgba(249, 115, 22, 0.2)",
			"rgba(239, 68, 68, 0.2)",
			"rgba(139, 92, 246, 0.2)",
		],
	};

	// Resolve theme-aware colors for charts (works in light/dark)
	const getCssVar = (name: string, fallback: string) => {
		if (typeof window === "undefined") return fallback;
		const v = getComputedStyle(document.documentElement)
			.getPropertyValue(name)
			.trim();
		return v || fallback;
	};
	const themeTextColor = getCssVar("--foreground", "#0f172a");
	const themeMutedColor = getCssVar("--muted-foreground", "#64748b");

	const pieData = {
		labels: products.map((p) => p.productName),
		datasets: [
			{
				data: products.map((p) => p.totalSales),
				backgroundColor: chartColors.gradient.slice(0, products.length),
				borderColor: chartColors.gradient.slice(0, products.length),
				borderWidth: 3,
				hoverBorderWidth: 4,
				hoverOffset: 8,
			},
		],
	};

	const barData = {
		labels: products.map((p) => p.productName),
		datasets: [
			{
				label: "Sales Revenue (₦)",
				data: products.map((p) => p.totalSales),
				backgroundColor: chartColors.gradient.slice(0, products.length),
				borderColor: chartColors.gradient.slice(0, products.length),
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			},
		],
	};

	const getLineChartData = () => {
		const last7Days = [];
		const today = new Date(currentDate);

		for (let i = 6; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];
			last7Days.push(dateStr);
		}

		const getCssVar = (name: string, fallback: string) => {
			if (typeof window === "undefined") return fallback;
			const v = getComputedStyle(document.documentElement)
				.getPropertyValue(name)
				.trim();
			return v || fallback;
		};
		const themeTextColor = getCssVar("--foreground", "#0f172a");
		const themeMutedColor = getCssVar("--muted-foreground", "#64748b");

		const dailyRevenue = last7Days.map((date) => {
			const dayProducts = salesHistory[date] || [];
			return dayProducts.reduce((sum, p) => sum + p.totalSales, 0);
		});

		const dailyUnits = last7Days.map((date) => {
			const dayProducts = salesHistory[date] || [];
			return dayProducts.reduce((sum, p) => sum + p.qtySold, 0);
		});

		return {
			labels: last7Days.map((date) =>
				new Date(date).toLocaleDateString("en-US", {
					weekday: "short",
					month: "short",
					day: "numeric",
				})
			),
			datasets: [
				{
					label: "Revenue (₦)",
					data: dailyRevenue,
					borderColor: chartColors.primary,
					backgroundColor: chartColors.primaryLight,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: chartColors.primary,
					pointBorderColor: "#ffffff",
					pointBorderWidth: 3,
					pointRadius: 6,
					pointHoverRadius: 8,
					pointHoverBackgroundColor: chartColors.primary,
					pointHoverBorderColor: "#ffffff",
					pointHoverBorderWidth: 3,
				},
				{
					label: "Units Sold",
					data: dailyUnits,
					borderColor: chartColors.accent,
					backgroundColor: chartColors.accentLight,
					fill: false,
					tension: 0.4,
					pointBackgroundColor: chartColors.accent,
					pointBorderColor: "#ffffff",
					pointBorderWidth: 3,
					pointRadius: 6,
					pointHoverRadius: 8,
					pointHoverBackgroundColor: chartColors.accent,
					pointHoverBorderColor: "#ffffff",
					pointHoverBorderWidth: 3,
					yAxisID: "y1",
				},
			],
		};
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false, // Allow flexible aspect ratio for better mobile support
		layout: {
			padding: 8,
		},
		animation: {
			duration: 1000,
			easing: "easeInOutQuart" as const,
		},
		plugins: {
			legend: {
				position: "bottom" as const,
				labels: {
					padding: window.innerWidth < 640 ? 12 : 20, // Responsive padding
					usePointStyle: true,
					font: {
						size: window.innerWidth < 640 ? 12 : 13, // Responsive font size
						weight: 500 as const,
					},
					color: themeTextColor,
				},
			},
			tooltip: {
				backgroundColor: "rgba(0, 0, 0, 0.9)",
				titleColor: "#ffffff",
				bodyColor: "#ffffff",
				borderColor: chartColors.primary,
				borderWidth: 1,
				cornerRadius: 12,
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600 as const,
				},
				bodyFont: {
					size: 13,
				},
				callbacks: {
					label: (context: any) => {
						const value = context.parsed || context.raw;
						if (context.datasetIndex === 1 && chartType === "line") {
							return `Units: ${value}`;
						}
						return `₦${value.toLocaleString()}`;
					},
				},
			},
		},
	};

	const pieOptions = {
		...chartOptions,
		aspectRatio: 1.5,
		plugins: {
			...chartOptions.plugins,
			legend: {
				position: "bottom" as const,
				labels: {
					padding: window.innerWidth < 640 ? 12 : 20, // Responsive padding
					usePointStyle: true,
					font: {
						size: window.innerWidth < 640 ? 12 : 13, // Responsive font size
						weight: 500 as const,
					},
					color: themeTextColor,
					generateLabels: (chart: any) => {
						const data = chart.data;
						if (data.labels.length && data.datasets.length) {
							return data.labels.map((label: string, i: number) => {
								const value = data.datasets[0].data[i];
								const percentage =
									totalSales > 0 ? ((value / totalSales) * 100).toFixed(1) : 0;
								return {
									text: `${label}: ${percentage}%`,
									fillStyle: data.datasets[0].backgroundColor[i],
									strokeStyle: data.datasets[0].borderColor[i],
									lineWidth: data.datasets[0].borderWidth,
									hidden: false,
									index: i,
								};
							});
						}
						return [];
					},
				},
			},
			tooltip: {
				backgroundColor: "rgba(0, 0, 0, 0.9)",
				titleColor: "#ffffff",
				bodyColor: "#ffffff",
				borderColor: chartColors.primary,
				borderWidth: 1,
				cornerRadius: 12,
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600 as const,
				},
				bodyFont: {
					size: 13,
				},
				callbacks: {
					label: (context: any) => {
						const value = context.parsed || context.raw;
						const percentage =
							totalSales > 0 ? ((value / totalSales) * 100).toFixed(1) : 0;
						return `₦${value.toLocaleString()} (${percentage}%)`;
					},
				},
			},
		},
	};

	const barOptions = {
		...chartOptions,
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: themeMutedColor,
					font: {
						size: 12,
					},
				},
			},
			y: {
				beginAtZero: true,
				grid: {
					color: chartColors.border,
					drawBorder: false,
				},
				ticks: {
					color: themeMutedColor,
					font: {
						size: 12,
					},
					callback: (value: any) => `₦${value.toLocaleString()}`,
				},
			},
		},
	};

	const lineOptions = {
		...chartOptions,
		interaction: {
			mode: "index" as const,
			intersect: false,
		},
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: themeMutedColor,
					font: {
						size: 12,
					},
				},
			},
			y: {
				type: "linear" as const,
				display: true,
				position: "left" as const,
				beginAtZero: true,
				grid: {
					color: chartColors.border,
					drawBorder: false,
				},
				ticks: {
					color: themeMutedColor,
					font: {
						size: 12,
					},
					callback: (value: any) => `₦${value.toLocaleString()}`,
				},
			},
			y1: {
				type: "linear" as const,
				display: true,
				position: "right" as const,
				beginAtZero: true,
				grid: {
					drawOnChartArea: false,
				},
				ticks: {
					color: themeMutedColor,
					font: {
						size: 12,
					},
				},
			},
		},
	};

	const chartButtons = [
		{ type: "bar" as const, icon: BarChart3, label: "Comparison" },
		{ type: "pie" as const, icon: PieChart, label: "Distribution" },
		{ type: "line" as const, icon: TrendingUp, label: "Growth Trend" },
	];

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center sm:flex-wrap gap-4">
				<div className="flex bg-muted/50 rounded-lg p-1 gap-1 w-full sm:w-auto overflow-x-auto">
					{chartButtons.map(({ type, icon: Icon, label }) => (
						<Button
							key={type}
							variant={chartType === type ? "default" : "ghost"}
							size="sm"
							onClick={() => setChartType(type)}
							className={`flex items-center gap-2 transition-all duration-300 flex-1 sm:flex-none whitespace-nowrap ${
								chartType === type
									? "bg-primary text-primary-foreground shadow-lg animate-glow"
									: "hover:bg-accent/50 hover:scale-105 text-foreground"
							}`}>
							<Icon className="h-4 w-4" />
							<span className="text-xs sm:text-sm">{label}</span>
						</Button>
					))}
				</div>

				{products.length > 0 && (
					<div className="flex gap-2 w-full sm:w-auto sm:flex-nowrap flex-wrap overflow-x-auto justify-start sm:justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={exportAsImage}
							disabled={isExporting}
							className="flex items-center gap-2 hover:scale-105 transition-all duration-300 bg-transparent text-foreground flex-1 sm:flex-none whitespace-nowrap">
							<FileImage className="h-4 w-4" />
							<span className="text-xs sm:text-sm">Export PNG</span>
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={exportAsPDF}
							disabled={isExporting}
							className="flex items-center gap-2 hover:scale-105 transition-all duration-300 bg-transparent text-foreground flex-1 sm:flex-none whitespace-nowrap">
							<FileText className="h-4 w-4" />
							<span className="text-xs sm:text-sm">Export PDF</span>
						</Button>
					</div>
				)}
			</div>

			<div
				className="relative"
				ref={chartContainerRef}
				data-export-root="true">
				<div className="w-full max-w-full overflow-hidden transition-all duration-500 ease-in-out">
					{chartType === "pie" && (
						<div className="animate-in fade-in-0 duration-500 bg-card rounded-lg border p-4 sm:p-6 shadow-sm">
							<h4 className="font-display text-base sm:text-lg font-semibold mb-4 text-center text-foreground">
								Revenue Distribution
							</h4>
							<div className="w-full h-[300px] sm:h-[400px] flex items-center justify-center">
								<Pie
									data={pieData}
									options={pieOptions}
								/>
							</div>
						</div>
					)}

					{chartType === "bar" && (
						<div className="animate-in fade-in-0 duration-500 bg-card rounded-lg border p-4 sm:p-6 shadow-sm">
							<h4 className="font-display text-base sm:text-lg font-semibold mb-4 text-center text-foreground">
								Sales Comparison
							</h4>
							<div className="w-full h-[300px] sm:h-[400px]">
								<Bar
									data={barData}
									options={barOptions}
								/>
							</div>
						</div>
					)}

					{chartType === "line" && (
						<div className="animate-in fade-in-0 duration-500 bg-card rounded-lg border p-4 sm:p-6 shadow-sm">
							<h4 className="font-display text-base sm:text-lg font-semibold mb-4 text-center text-foreground">
								7-Day Sales Growth
							</h4>
							<div className="w-full h-[300px] sm:h-[400px]">
								<Line
									data={getLineChartData()}
									options={lineOptions}
								/>
							</div>
						</div>
					)}
				</div>

				<div
					className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg blur-xl"
					data-html2canvas-ignore="true"
				/>
			</div>

			{products.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
					<div className="text-center p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
						<p className="text-xs sm:text-sm text-muted-foreground">Best Seller</p>
						<p className="font-display font-bold text-primary text-sm sm:text-base truncate">
							{
								products.reduce((top, current) =>
									current.totalSales > top.totalSales ? current : top
								).productName
							}
						</p>
					</div>
					<div className="text-center p-3 sm:p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg">
						<p className="text-xs sm:text-sm text-muted-foreground">Total Units</p>
						<p className="font-display font-bold text-accent text-sm sm:text-base">
							{products.reduce((sum, p) => sum + p.qtySold, 0)}
						</p>
					</div>
					<div className="text-center p-3 sm:p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-lg">
						<p className="text-xs sm:text-sm text-muted-foreground">Avg Price</p>
						<p className="font-display font-bold text-violet-600 text-sm sm:text-base">
							₦
							{(
								products.reduce((sum, p) => sum + p.totalSales, 0) /
									products.reduce((sum, p) => sum + p.qtySold, 0) || 0
							).toFixed(0)}
						</p>
					</div>
				</div>
			)}

			{isExporting && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-background p-4 sm:p-6 rounded-lg shadow-lg flex items-center gap-3 mx-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
						<span className="text-sm sm:text-base">Exporting Sales Data...</span>
					</div>
				</div>
			)}
		</div>
	);
}
