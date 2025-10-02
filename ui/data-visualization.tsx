"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  DollarSign,
  Clock,
  Target,
  Award,
  BarChart3,
  PieChart,
  TrendingUpDown
} from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
  description?: string
  color?: "default" | "success" | "warning" | "destructive"
  className?: string
  animate?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  description,
  color = "default",
  className,
  animate = true
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
    return <TrendingUpDown className="w-4 h-4 text-muted-foreground" />
  }

  const getColorClasses = () => {
    switch (color) {
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      case "destructive":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      default:
        return ""
    }
  }

  const cardContent = (
    <Card className={cn("transition-all duration-300 hover:shadow-lg", getColorClasses(), className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline space-x-3">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {change !== undefined && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon()}
                  <span className={cn(
                    "text-sm font-medium",
                    trend === "up" ? "text-green-600" : 
                    trend === "down" ? "text-red-600" : 
                    "text-muted-foreground"
                  )}>
                    {change > 0 ? "+" : ""}{change}%
                  </span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground opacity-70">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!animate) return cardContent

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {cardContent}
    </motion.div>
  )
}

interface KPIDashboardProps {
  metrics: Array<{
    id: string
    title: string
    value: string | number
    change?: number
    trend?: "up" | "down" | "neutral"
    icon?: React.ReactNode
    description?: string
    color?: "default" | "success" | "warning" | "destructive"
  }>
  title?: string
  subtitle?: string
  className?: string
}

export function KPIDashboard({ 
  metrics, 
  title = "Key Performance Indicators",
  subtitle = "Real-time business metrics and insights",
  className 
}: KPIDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || subtitle) && (
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  label?: string
  showValue?: boolean
  className?: string
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "hsl(217, 91%, 60%)",
  backgroundColor = "hsl(214, 32%, 91%)",
  label,
  showValue = true,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${progress / 100 * circumference} ${circumference}`

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 1000" }}
            animate={{ strokeDasharray }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      {label && (
        <p className="text-sm font-medium text-muted-foreground text-center">{label}</p>
      )}
    </div>
  )
}

interface InteractiveStatsProps {
  stats: Array<{
    label: string
    value: number
    maxValue?: number
    color?: string
    icon?: React.ReactNode
  }>
  title?: string
  className?: string
}

export function InteractiveStats({ stats, title, className }: InteractiveStatsProps) {
  return (
    <Card className={cn("w-full", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {stat.icon}
                <span className="text-sm font-medium text-foreground">{stat.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stat.value}{stat.maxValue ? ` / ${stat.maxValue}` : ''}
              </span>
            </div>
            <Progress 
              value={stat.maxValue ? (stat.value / stat.maxValue) * 100 : stat.value} 
              className="h-2"
            />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}

export const WorkforceIcons = {
  Users: <Users className="w-8 h-8" />,
  DollarSign: <DollarSign className="w-8 h-8" />,
  Clock: <Clock className="w-8 h-8" />,
  Target: <Target className="w-8 h-8" />,
  Award: <Award className="w-8 h-8" />,
  BarChart: <BarChart3 className="w-8 h-8" />,
  PieChart: <PieChart className="w-8 h-8" />,
  Activity: <Activity className="w-8 h-8" />,
}