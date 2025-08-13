"use client"

import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

interface AnalyticsChartProps {
  data: any[]
  metric: string
  type: "line" | "bar"
}

export function AnalyticsChart({ data, metric, type }: AnalyticsChartProps) {
  const chartColors = {
    primary: "#3b82f6", // Blue-500
    primaryLight: "rgba(59, 130, 246, 0.1)",
    primaryAlpha: "rgba(59, 130, 246, 0.8)",
    accent: "#0ea5e9", // Sky-500
    accentLight: "rgba(14, 165, 233, 0.1)",
    accentAlpha: "rgba(14, 165, 233, 0.8)",
    muted: "#64748b", // Slate-500 for text
    mutedLight: "rgba(100, 116, 139, 0.1)", // Slate-500 with opacity
    mutedAlpha: "rgba(100, 116, 139, 0.8)",
  }

  const getMetricValue = (item: any) => {
    switch (metric) {
      case "revenue":
        return item.totalRevenue || 0
      case "units":
        return item.totalUnitsSold || 0
      case "products":
        return item.totalProducts || 0
      default:
        return 0
    }
  }

  const getLabel = (item: any) => {
    if (item.date) {
      return new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
    return item.productName || ""
  }

  const chartData = {
    labels: data.map(getLabel),
    datasets: [
      {
        label: metric === "revenue" ? "Revenue (₦)" : metric === "units" ? "Units Sold" : "Products",
        data: data.map(getMetricValue),
        borderColor: chartColors.primary,
        backgroundColor: type === "line" ? chartColors.primaryLight : chartColors.primaryAlpha,
        fill: type === "line",
        tension: 0.4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: chartColors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y
            if (metric === "revenue") {
              return `Revenue: ₦${value.toLocaleString()}`
            }
            return `${metric}: ${value}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: chartColors.muted,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: chartColors.mutedLight,
        },
        ticks: {
          color: chartColors.muted,
          callback: (value: any) => {
            if (metric === "revenue") {
              return `₦${value.toLocaleString()}`
            }
            return value
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  }

  return (
    <div className="h-64 w-full">
      {type === "line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
    </div>
  )
}
