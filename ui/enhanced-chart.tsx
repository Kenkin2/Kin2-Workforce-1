"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EnhancedChartProps {
  title?: string
  description?: string
  data: any[]
  type: "bar" | "line" | "area" | "pie" | "radial" | "treemap"
  height?: number
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  animate?: boolean
  className?: string
  dataKey?: string
  xAxisKey?: string
  yAxisKey?: string
  config?: any
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.dataKey}:</span>
            <span className="font-medium text-foreground">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function EnhancedChart({
  title,
  description,
  data,
  type,
  height = 350,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showGrid = true,
  animate = true,
  className,
  dataKey = "value",
  xAxisKey = "name",
  yAxisKey,
  config = {},
}: EnhancedChartProps) {
  const chartConfig = React.useMemo(() => {
    const keys = Object.keys(data[0] || {})
    const generatedConfig: any = {}
    
    keys.forEach((key, index) => {
      if (key !== xAxisKey) {
        generatedConfig[key] = {
          label: key.charAt(0).toUpperCase() + key.slice(1),
          color: colors[index % colors.length],
        }
      }
    })
    
    return { ...generatedConfig, ...config }
  }, [data, colors, xAxisKey, config])

  const renderChart = () => {
    const commonProps = {
      data,
      height,
      ...(animate && { animationBegin: 0, animationDuration: 800 }),
    }

    switch (type) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<CustomTooltip />} />
            {showLegend && <ChartLegend />}
            {Object.keys(chartConfig).map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </BarChart>
        )

      case "line":
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<CustomTooltip />} />
            {showLegend && <ChartLegend />}
            {Object.keys(chartConfig).map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ fill: colors[index % colors.length], r: 4 }}
                activeDot={{ r: 6, className: "animate-pulse" }}
                className="transition-all duration-300"
              />
            ))}
          </LineChart>
        )

      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<CustomTooltip />} />
            {showLegend && <ChartLegend />}
            {Object.keys(chartConfig).map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                className="transition-all duration-300"
              />
            ))}
          </AreaChart>
        )

      case "pie":
        const pieProps = { ...commonProps }
        if (animate) {
          pieProps.animationBegin = 0
          pieProps.animationDuration = 800
        }
        return (
          <PieChart {...pieProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              dataKey={dataKey}
              className="outline-none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <ChartTooltip content={<CustomTooltip />} />
            {showLegend && <ChartLegend />}
          </PieChart>
        )

      case "radial":
        return (
          <RadialBarChart
            {...commonProps}
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="90%"
          >
            <RadialBar
              dataKey={dataKey}
              cornerRadius={4}
              fill={colors[0]}
              className="transition-all duration-300"
            />
            <ChartTooltip content={<CustomTooltip />} />
          </RadialBarChart>
        )

      default:
        return null
    }
  }

  if (title || description) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              Live Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={height}>
              {renderChart() as any}
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    )
  }

  return (
    <ChartContainer config={chartConfig}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() as any}
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// Specialized chart components
export function WorkforceMetricsChart({ data, className }: { data: any[], className?: string }) {
  return (
    <EnhancedChart
      title="Workforce Metrics"
      description="Real-time workforce performance indicators"
      data={data}
      type="bar"
      height={300}
      colors={["hsl(217, 91%, 60%)", "hsl(142, 69%, 58%)", "hsl(38, 92%, 60%)"]}
      className={className}
    />
  )
}

export function RevenueChart({ data, className }: { data: any[], className?: string }) {
  return (
    <EnhancedChart
      title="Revenue Trends"
      description="Monthly revenue analysis and projections"
      data={data}
      type="area"
      height={300}
      colors={["hsl(142, 69%, 58%)", "hsl(217, 91%, 60%)"]}
      className={className}
    />
  )
}

export function KarmaDistributionChart({ data, className }: { data: any[], className?: string }) {
  return (
    <EnhancedChart
      title="Karma Distribution"
      description="Worker karma points distribution across platform"
      data={data}
      type="pie"
      height={300}
      colors={[
        "hsl(217, 91%, 60%)",
        "hsl(142, 69%, 58%)", 
        "hsl(38, 92%, 60%)",
        "hsl(346, 87%, 65%)",
        "hsl(262, 83%, 70%)",
      ]}
      dataKey="count"
      className={className}
    />
  )
}