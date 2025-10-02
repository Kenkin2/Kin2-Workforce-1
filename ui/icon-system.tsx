"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  // Core business icons
  Users, UserCheck, UserPlus, UserX, UserCog,
  Briefcase, Building, Building2, Factory,
  DollarSign, CreditCard, Receipt, TrendingUp, TrendingDown,
  Calendar, Clock, CalendarDays, Timer,
  BarChart3, PieChart, LineChart, Activity,
  
  // Workflow and operations
  CheckCircle, Circle, Clock4, Play, Pause, Square,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Plus, Minus, X, Check, AlertTriangle, AlertCircle,
  
  // Learning and development  
  BookOpen, GraduationCap, Award, Trophy, Star,
  Target, Brain, Lightbulb, FileText, Clipboard,
  
  // Communication and collaboration
  MessageSquare, Mail, Phone, Video, Mic, MicOff,
  Bell, BellRing, Share, Send,
  
  // Settings and controls
  Settings, Cog, Filter, Search, MoreHorizontal,
  Edit, Trash, Download, Upload, Save, Copy,
  Eye, EyeOff, Lock, Unlock, Shield, ShieldCheck,
  
  // Navigation and UI
  Menu, X as Close, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Home, Folder, File, Image, Paperclip,
  
  // Status and feedback
  CheckCircle2, XCircle, AlertTriangle as Warning, Info,
  Loader, RefreshCw, Zap, Heart, ThumbsUp, ThumbsDown,
} from "lucide-react"

// Icon size variants
const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4", 
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
}

// Icon wrapper component with consistent styling
interface IconProps {
  size?: keyof typeof iconSizes
  className?: string
  color?: "primary" | "secondary" | "success" | "warning" | "destructive" | "muted"
  children: React.ReactNode
  animate?: boolean
  onClick?: () => void
}

export function Icon({ 
  size = "md", 
  className, 
  color,
  children, 
  animate = false,
  onClick 
}: IconProps) {
  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-green-600",
    warning: "text-yellow-600", 
    destructive: "text-red-600",
    muted: "text-muted-foreground",
  }

  const IconWrapper = animate ? motion.div : "div"
  const motionProps = animate ? {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 },
    transition: { duration: 0.2 }
  } : {}

  return (
    <IconWrapper
      className={cn(
        iconSizes[size],
        color && colorClasses[color],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </IconWrapper>
  )
}

// Organized icon collections
export const WorkforceIcons = {
  // People and teams
  People: {
    Users: () => <Icon><Users /></Icon>,
    UserCheck: () => <Icon><UserCheck /></Icon>,
    UserPlus: () => <Icon><UserPlus /></Icon>,
    UserX: () => <Icon><UserX /></Icon>,
    UserCog: () => <Icon><UserCog /></Icon>,
  },
  
  // Business and finance
  Business: {
    Briefcase: () => <Icon><Briefcase /></Icon>,
    Building: () => <Icon><Building /></Icon>,
    Factory: () => <Icon><Factory /></Icon>,
    DollarSign: () => <Icon><DollarSign /></Icon>,
    CreditCard: () => <Icon><CreditCard /></Icon>,
    Receipt: () => <Icon><Receipt /></Icon>,
  },
  
  // Time and scheduling
  Time: {
    Calendar: () => <Icon><Calendar /></Icon>,
    Clock: () => <Icon><Clock /></Icon>,
    CalendarDays: () => <Icon><CalendarDays /></Icon>,
    Timer: () => <Icon><Timer /></Icon>,
    Timer2: () => <Icon><Timer /></Icon>,
  },
  
  // Analytics and reporting
  Analytics: {
    BarChart: () => <Icon><BarChart3 /></Icon>,
    PieChart: () => <Icon><PieChart /></Icon>,
    LineChart: () => <Icon><LineChart /></Icon>,
    Activity: () => <Icon><Activity /></Icon>,
    TrendingUp: () => <Icon><TrendingUp /></Icon>,
    TrendingDown: () => <Icon><TrendingDown /></Icon>,
  },
  
  // Status and workflow
  Status: {
    CheckCircle: () => <Icon><CheckCircle /></Icon>,
    Circle: () => <Icon><Circle /></Icon>,
    Clock: () => <Icon><Clock4 /></Icon>,
    Play: () => <Icon><Play /></Icon>,
    Pause: () => <Icon><Pause /></Icon>,
    Square: () => <Icon><Square /></Icon>,
  },
  
  // Learning and development
  Learning: {
    BookOpen: () => <Icon><BookOpen /></Icon>,
    GraduationCap: () => <Icon><GraduationCap /></Icon>,
    Award: () => <Icon><Award /></Icon>,
    Trophy: () => <Icon><Trophy /></Icon>,
    Star: () => <Icon><Star /></Icon>,
    Target: () => <Icon><Target /></Icon>,
    Brain: () => <Icon><Brain /></Icon>,
    Lightbulb: () => <Icon><Lightbulb /></Icon>,
  },
}

// Icon badge component
interface IconBadgeProps {
  icon: React.ReactNode
  color?: "primary" | "secondary" | "success" | "warning" | "destructive"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function IconBadge({ 
  icon, 
  color = "primary", 
  size = "md",
  className 
}: IconBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }

  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800",
    destructive: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
  }

  return (
    <div className={cn(
      "rounded-lg border flex items-center justify-center",
      sizeClasses[size],
      colorClasses[color],
      className
    )}>
      {icon}
    </div>
  )
}

// Animated icon button
interface AnimatedIconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  color?: "primary" | "secondary" | "success" | "warning" | "destructive"
  size?: "sm" | "md" | "lg"
  tooltip?: string
}

export function AnimatedIconButton({
  icon,
  onClick,
  className,
  color = "primary",
  size = "md",
  tooltip
}: AnimatedIconButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12",
  }

  const colorClasses = {
    primary: "hover:bg-primary/10 text-primary",
    secondary: "hover:bg-secondary/10 text-secondary",
    success: "hover:bg-green-100 text-green-700",
    warning: "hover:bg-yellow-100 text-yellow-700",
    destructive: "hover:bg-red-100 text-red-700",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={tooltip}
      className={cn(
        "rounded-lg flex items-center justify-center transition-colors",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      {icon}
    </motion.button>
  )
}

// Icon grid display
interface IconGridProps {
  icons: Array<{
    icon: React.ReactNode
    name: string
    description?: string
  }>
  className?: string
  onIconClick?: (name: string) => void
}

export function IconGrid({ icons, className, onIconClick }: IconGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4",
      className
    )}>
      {icons.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => onIconClick?.(item.name)}
          title={item.description || item.name}
        >
          <div className="text-muted-foreground">
            {item.icon}
          </div>
          <span className="text-xs font-medium text-center">{item.name}</span>
        </motion.div>
      ))}
    </div>
  )
}

// Status indicator with icon
interface StatusIndicatorProps {
  status: "active" | "inactive" | "pending" | "completed" | "failed"
  label?: string
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function StatusIndicator({
  status,
  label,
  size = "md",
  showIcon = true,
  className
}: StatusIndicatorProps) {
  const statusConfig = {
    active: {
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900",
      icon: <CheckCircle2 />,
      label: label || "Active"
    },
    inactive: {
      color: "text-gray-600", 
      bg: "bg-gray-100 dark:bg-gray-900",
      icon: <Circle />,
      label: label || "Inactive"
    },
    pending: {
      color: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900", 
      icon: <Clock />,
      label: label || "Pending"
    },
    completed: {
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900",
      icon: <CheckCircle />,
      label: label || "Completed"
    },
    failed: {
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900",
      icon: <XCircle />,
      label: label || "Failed"
    }
  }

  const config = statusConfig[status]
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }

  return (
    <div className={cn(
      "inline-flex items-center space-x-1.5 rounded-full font-medium",
      config.bg,
      config.color,
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <Icon size="sm">
          {config.icon}
        </Icon>
      )}
      <span>{config.label}</span>
    </div>
  )
}