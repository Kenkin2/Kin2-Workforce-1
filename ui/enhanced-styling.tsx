"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

// Enhanced gradient backgrounds
export const GradientBackgrounds = {
  primary: "bg-gradient-to-br from-primary via-primary/90 to-primary/70",
  secondary: "bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70", 
  success: "bg-gradient-to-br from-green-500 via-green-600 to-green-700",
  warning: "bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500",
  info: "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500",
  workspace: "bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800",
  analytics: "bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 dark:from-violet-950 dark:via-indigo-950 dark:to-blue-950",
}

// Animated container component
interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  animation?: "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale"
}

export function AnimatedContainer({
  children,
  className,
  delay = 0,
  duration = 0.5,
  animation = "fadeIn"
}: AnimatedContainerProps) {
  const animations = {
    fadeIn: { 
      initial: { opacity: 0 }, 
      animate: { opacity: 1 } 
    },
    slideUp: { 
      initial: { opacity: 0, y: 30 }, 
      animate: { opacity: 1, y: 0 } 
    },
    slideDown: { 
      initial: { opacity: 0, y: -30 }, 
      animate: { opacity: 1, y: 0 } 
    },
    slideLeft: { 
      initial: { opacity: 0, x: 30 }, 
      animate: { opacity: 1, x: 0 } 
    },
    slideRight: { 
      initial: { opacity: 0, x: -30 }, 
      animate: { opacity: 1, x: 0 } 
    },
    scale: { 
      initial: { opacity: 0, scale: 0.9 }, 
      animate: { opacity: 1, scale: 1 } 
    },
  }

  return (
    <motion.div
      initial={animations[animation].initial}
      animate={animations[animation].animate}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Enhanced glass effect cards
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  intensity?: "light" | "medium" | "strong"
}

export function GlassCard({ children, className, intensity = "medium" }: GlassCardProps) {
  const intensityClasses = {
    light: "bg-white/10 backdrop-blur-sm border border-white/20",
    medium: "bg-white/20 backdrop-blur-md border border-white/30",
    strong: "bg-white/30 backdrop-blur-lg border border-white/40",
  }

  return (
    <Card className={cn(
      "shadow-xl",
      intensityClasses[intensity],
      className
    )}>
      {children}
    </Card>
  )
}

// Floating action button
interface FloatingActionButtonProps {
  onClick?: () => void
  icon: React.ReactNode
  className?: string
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  size?: "sm" | "md" | "lg"
}

export function FloatingActionButton({
  onClick,
  icon,
  className,
  position = "bottom-right",
  size = "md"
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6", 
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6",
  }

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14", 
    lg: "w-16 h-16",
  }

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-50 flex items-center justify-center",
        positionClasses[position],
        sizeClasses[size],
        className
      )}
    >
      {icon}
    </motion.button>
  )
}

// Animated progress indicator
interface AnimatedProgressProps {
  progress: number
  className?: string
  color?: string
  showPercentage?: boolean
  height?: number
}

export function AnimatedProgress({
  progress,
  className,
  color = "hsl(var(--primary))",
  showPercentage = true,
  height = 8
}: AnimatedProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div 
        className="relative bg-muted rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  )
}

// Enhanced loading spinner
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function LoadingSpinner({ 
  size = "md", 
  color = "hsl(var(--primary))",
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        "border-4 border-muted border-t-transparent rounded-full",
        sizeClasses[size],
        className
      )}
      style={{ borderTopColor: color }}
    />
  )
}

// Staggered children animation container
interface StaggeredContainerProps {
  children: React.ReactNode
  className?: string
  stagger?: number
}

export function StaggeredContainer({ 
  children, 
  className, 
  stagger = 0.1 
}: StaggeredContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger
          }
        }
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          key={index}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Interactive hover cards
interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  clickScale?: number
  onClick?: () => void
}

export function InteractiveCard({
  children,
  className,
  hoverScale = 1.02,
  clickScale = 0.98,
  onClick
}: InteractiveCardProps) {
  return (
    <motion.div
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: clickScale }}
      onClick={onClick}
      className={cn("cursor-pointer", className)}
    >
      <Card className="transition-shadow duration-300 hover:shadow-lg">
        {children}
      </Card>
    </motion.div>
  )
}

// Enhanced color palette for consistent theming
export const ColorPalette = {
  primary: {
    50: "hsl(214, 100%, 97%)",
    100: "hsl(214, 95%, 93%)",
    200: "hsl(213, 97%, 87%)",
    300: "hsl(212, 96%, 78%)",
    400: "hsl(213, 94%, 68%)",
    500: "hsl(217, 91%, 60%)",
    600: "hsl(221, 83%, 53%)",
    700: "hsl(224, 76%, 48%)",
    800: "hsl(226, 71%, 40%)",
    900: "hsl(224, 64%, 33%)",
  },
  success: {
    50: "hsl(142, 76%, 96%)",
    100: "hsl(141, 84%, 93%)",
    200: "hsl(141, 79%, 85%)",
    300: "hsl(142, 77%, 73%)",
    400: "hsl(141, 69%, 58%)",
    500: "hsl(142, 69%, 58%)",
    600: "hsl(142, 70%, 45%)",
    700: "hsl(142, 78%, 36%)",
    800: "hsl(143, 64%, 24%)",
    900: "hsl(144, 61%, 20%)",
  },
  warning: {
    50: "hsl(48, 100%, 96%)",
    100: "hsl(48, 96%, 89%)",
    200: "hsl(48, 97%, 77%)",
    300: "hsl(46, 97%, 65%)",
    400: "hsl(43, 96%, 56%)",
    500: "hsl(38, 92%, 50%)",
    600: "hsl(32, 95%, 44%)",
    700: "hsl(26, 90%, 37%)",
    800: "hsl(23, 83%, 31%)",
    900: "hsl(22, 78%, 26%)",
  },
}