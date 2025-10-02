import { useState } from "react"
import { motion } from "framer-motion"
import AppLayout from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  EnhancedChart, 
  WorkforceMetricsChart, 
  RevenueChart, 
  KarmaDistributionChart 
} from "@/components/ui/enhanced-chart"
import { 
  MetricCard, 
  KPIDashboard, 
  ProgressRing, 
  InteractiveStats,
  WorkforceIcons
} from "@/components/ui/data-visualization"
import { 
  VisualGallery, 
  HeroSection, 
  IllustrationCard,
  GeneratedAssets
} from "@/components/ui/visual-assets"
import { 
  AnimatedContainer,
  GlassCard,
  FloatingActionButton,
  AnimatedProgress,
  LoadingSpinner,
  StaggeredContainer,
  InteractiveCard,
  GradientBackgrounds,
  ColorPalette
} from "@/components/ui/enhanced-styling"
import { 
  WorkforceIcons as IconSystem,
  IconBadge,
  AnimatedIconButton,
  IconGrid,
  StatusIndicator
} from "@/components/ui/icon-system"
import { ImageUpload, BulkImageActions } from "@/components/ui/image-upload"
import Analytics3D from "@/components/3d/Analytics3D"
import Workspace3D from "@/components/3d/Workspace3D"
import Navigation3D from "@/components/3d/Navigation3D"
import ParticleSystem3D from "@/components/3d/ParticleSystem3D"
import DataVisualization3D from "@/components/3d/DataVisualization3D"
import { 
  Palette, 
  BarChart3, 
  Image, 
  Upload, 
  Sparkles, 
  Cpu, 
  Zap,
  Eye,
  Download,
  RefreshCw,
  Box
} from "lucide-react"

export default function GraphicsShowcase() {
  // Sample data for demonstrations
  const sampleMetrics = [
    {
      id: "workers",
      title: "Total Workers",
      value: "2,847",
      change: 12,
      trend: "up" as const,
      icon: WorkforceIcons.Users,
      description: "Active workforce members",
      color: "success" as const
    },
    {
      id: "revenue",
      title: "Monthly Revenue",
      value: "$89,240",
      change: 8,
      trend: "up" as const,
      icon: WorkforceIcons.DollarSign,
      description: "This month's earnings",
      color: "default" as const
    },
    {
      id: "efficiency",
      title: "Efficiency Rate", 
      value: "94.2%",
      change: -2,
      trend: "down" as const,
      icon: WorkforceIcons.Target,
      description: "Operational efficiency",
      color: "warning" as const
    },
    {
      id: "satisfaction",
      title: "Satisfaction Score",
      value: "4.8/5",
      change: 5,
      trend: "up" as const,
      icon: WorkforceIcons.Award,
      description: "Customer satisfaction",
      color: "success" as const
    }
  ]

  const sampleChartData = [
    { name: "Jan", revenue: 45000, workers: 120, efficiency: 92 },
    { name: "Feb", revenue: 52000, workers: 135, efficiency: 94 },
    { name: "Mar", revenue: 61000, workers: 142, efficiency: 91 },
    { name: "Apr", revenue: 58000, workers: 138, efficiency: 95 },
    { name: "May", revenue: 67000, workers: 156, efficiency: 93 },
    { name: "Jun", revenue: 74000, workers: 164, efficiency: 96 }
  ]

  const karmaData = [
    { name: "0-100", count: 45, range: "Beginner" },
    { name: "100-500", count: 120, range: "Active" },
    { name: "500-1000", count: 85, range: "Expert" },
    { name: "1000+", count: 32, range: "Master" }
  ]

  const statsData = [
    { label: "Active Projects", value: 24, maxValue: 30, icon: WorkforceIcons.BarChart },
    { label: "Completed Tasks", value: 187, maxValue: 200, icon: WorkforceIcons.Activity },
    { label: "Team Efficiency", value: 94, maxValue: 100, icon: WorkforceIcons.Target },
    { label: "Client Satisfaction", value: 96, maxValue: 100, icon: WorkforceIcons.Award }
  ]

  const iconShowcase = [
    { icon: <BarChart3 />, name: "Analytics", description: "Data visualization" },
    { icon: <Upload />, name: "Upload", description: "File management" },
    { icon: <Sparkles />, name: "AI", description: "Artificial intelligence" },
    { icon: <Cpu />, name: "Performance", description: "System metrics" },
    { icon: <Zap />, name: "Automation", description: "Workflow automation" },
    { icon: <Eye />, name: "Monitor", description: "System monitoring" },
    { icon: <Download />, name: "Export", description: "Data export" },
    { icon: <RefreshCw />, name: "Sync", description: "Data synchronization" }
  ]

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  return (
    <AppLayout title="Graphics Showcase" breadcrumbs={[{ label: "Platform", href: "/" }, { label: "Graphics" }]}>
      <div className="space-y-8">
        {/* Hero Section */}
        <HeroSection
          title="Graphics & Visual Design"
          subtitle="Comprehensive visual enhancements for the Kin2 Workforce platform"
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              ✨ AI-Generated Graphics
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              📊 Enhanced Charts
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              🎨 Interactive Visualizations
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              📱 Modern UI Components
            </Badge>
          </div>
        </HeroSection>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="3d">3D Graphics</TabsTrigger>
            <TabsTrigger value="charts">Data Visualization</TabsTrigger>
            <TabsTrigger value="graphics">Custom Graphics</TabsTrigger>
            <TabsTrigger value="icons">Icon System</TabsTrigger>
            <TabsTrigger value="styling">Enhanced Styling</TabsTrigger>
            <TabsTrigger value="upload">Image Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="3d" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
                <Box className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />
                3D Graphics & WebGL Visualization
              </h2>
              <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
                Interactive 3D visualizations powered by Three.js and React Three Fiber
              </p>
            </div>

            <StaggeredContainer className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                    3D Analytics Dashboard
                  </CardTitle>
                  <CardDescription className="text-base">
                    Interactive 3D visualization of workforce metrics with floating spheres and dynamic lighting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Analytics3D data={{
                    revenue: 125000,
                    workers: 342,
                    jobs: 89,
                    shifts: 1456
                  }} />
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-foreground/70 mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-emerald-500">$125K</p>
                    </div>
                    <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-foreground/70 mb-1">Workers</p>
                      <p className="text-2xl font-bold text-blue-500">342</p>
                    </div>
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-foreground/70 mb-1">Jobs</p>
                      <p className="text-2xl font-bold text-amber-500">89</p>
                    </div>
                    <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-foreground/70 mb-1">Shifts</p>
                      <p className="text-2xl font-bold text-purple-500">1,456</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Box className="w-6 h-6 text-purple-500" />
                    3D Workspace Model
                  </CardTitle>
                  <CardDescription className="text-base">
                    Interactive 3D model with auto-rotation, realistic lighting, and environment mapping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Workspace3D />
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">Auto-rotation</Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1">Dynamic Lighting</Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1">Contact Shadows</Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1">Environment Mapping</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="w-6 h-6 text-pink-500" />
                      3D Particle System
                    </CardTitle>
                    <CardDescription className="text-base">
                      Dynamic particle system with 5,000+ animated particles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ParticleSystem3D particleCount={5000} />
                    <p className="text-base text-foreground/70 mt-4 font-medium">
                      Optimized for 60 FPS with instanced mesh rendering
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <BarChart3 className="w-6 h-6 text-cyan-500" />
                      3D Data Visualization
                    </CardTitle>
                    <CardDescription className="text-base">
                      Advanced 3D charts with animated bars and spheres
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataVisualization3D />
                    <p className="text-base text-foreground/70 mt-4 font-medium">
                      Real-time updates with smooth animated transitions
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    3D Interactive Navigation
                  </CardTitle>
                  <CardDescription className="text-base">
                    Immersive 3D navigation system with hover effects and click interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Navigation3D />
                  <p className="text-base text-foreground/70 mt-4 font-medium">
                    Click buttons to navigate, hover to see scale effects
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-3xl">3D Graphics Technology Stack</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-xl text-blue-400">Three.js</h4>
                      <p className="text-base text-foreground/80">
                        Industry-standard WebGL library for 3D graphics
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-xl text-purple-400">React Three Fiber</h4>
                      <p className="text-base text-foreground/80">
                        React renderer for declarative 3D scenes
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-xl text-pink-400">Drei & Post-Processing</h4>
                      <p className="text-base text-foreground/80">
                        Advanced 3D components and visual effects
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t-2 border-border">
                    <h4 className="font-bold text-xl mb-4">Key Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-base font-medium">Interactive Controls</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-base font-medium">60 FPS Rendering</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-base font-medium">Dynamic Lighting</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-base font-medium">Particle Systems</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                        <span className="text-base font-medium">Auto-Rotation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-base font-medium">Data Viz</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggeredContainer>
          </TabsContent>

          <TabsContent value="overview" className="space-y-8">
            <AnimatedContainer animation="slideUp" className="space-y-6">
              {/* KPI Dashboard */}
              <KPIDashboard 
                metrics={sampleMetrics}
                title="Enhanced Metrics Dashboard"
                subtitle="Interactive KPI cards with animations and trend indicators"
              />
              
              {/* Chart Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnhancedChart
                  title="Revenue Growth"
                  description="Monthly revenue trends with smooth animations"
                  data={sampleChartData}
                  type="area"
                  height={300}
                  colors={["hsl(142, 69%, 58%)", "hsl(217, 91%, 60%)"]}
                />
                <EnhancedChart
                  title="Workforce Distribution"
                  description="Interactive pie chart with hover effects"
                  data={karmaData}
                  type="pie"
                  height={300}
                  dataKey="count"
                />
              </div>
              
              {/* Interactive Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveStats
                  title="Project Statistics"
                  stats={statsData}
                />
                <div className="flex items-center justify-center">
                  <ProgressRing
                    progress={78}
                    size={150}
                    label="Overall Platform Health"
                    color={ColorPalette.success[500]}
                  />
                </div>
              </div>
            </AnimatedContainer>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <StaggeredContainer className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Enhanced Data Visualization</h3>
                <p className="text-muted-foreground">Interactive charts with animations, custom styling, and real-time updates</p>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <WorkforceMetricsChart data={sampleChartData} />
                <RevenueChart data={sampleChartData} />
                <KarmaDistributionChart data={karmaData} />
                <EnhancedChart
                  title="Performance Metrics"
                  description="Multi-line chart showing various KPIs"
                  data={sampleChartData}
                  type="line"
                  height={300}
                  colors={[ColorPalette.primary[500], ColorPalette.warning[500], ColorPalette.success[500]]}
                />
              </div>
            </StaggeredContainer>
          </TabsContent>

          <TabsContent value="graphics" className="space-y-6">
            <VisualGallery />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <IllustrationCard
                illustration={GeneratedAssets.heroIllustration}
                title="Workforce Collaboration"
                description="Modern team collaboration illustration"
                features={["Vector Graphics", "Scalable", "Professional"]}
              />
              <IllustrationCard
                illustration={GeneratedAssets.analyticsIllustration}
                title="Analytics Dashboard"
                description="Data visualization showcase"
                features={["Interactive", "Colorful", "Modern"]}
              />
              <IllustrationCard
                illustration={GeneratedAssets.learningIconSet}
                title="Learning Icons"
                description="Educational iconography set"
                features={["Consistent Style", "Multiple Formats", "Accessible"]}
              />
            </div>
          </TabsContent>

          <TabsContent value="icons" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Comprehensive Icon System</h3>
              <p className="text-muted-foreground">Consistent, animated, and interactive icon library</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Icon Badges</CardTitle>
                  <CardDescription>Status indicators with icons</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <IconBadge icon={<BarChart3 />} color="primary" />
                    <IconBadge icon={<Upload />} color="success" />
                    <IconBadge icon={<Zap />} color="warning" />
                    <IconBadge icon={<Cpu />} color="destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Indicators</CardTitle>
                  <CardDescription>Dynamic status with icons</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatusIndicator status="active" />
                  <StatusIndicator status="pending" />
                  <StatusIndicator status="completed" />
                  <StatusIndicator status="failed" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Animated Buttons</CardTitle>
                  <CardDescription>Interactive icon buttons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <AnimatedIconButton icon={<RefreshCw />} tooltip="Refresh" />
                    <AnimatedIconButton icon={<Download />} color="success" tooltip="Download" />
                    <AnimatedIconButton icon={<Eye />} color="secondary" tooltip="View" />
                    <AnimatedIconButton icon={<Upload />} color="warning" tooltip="Upload" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Icon Collection</CardTitle>
                <CardDescription>Complete icon library for workforce management</CardDescription>
              </CardHeader>
              <CardContent>
                <IconGrid 
                  icons={iconShowcase}
                  onIconClick={(name) => {}}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styling" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Enhanced Visual Styling</h3>
              <p className="text-muted-foreground">Modern design elements with animations and effects</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Glass Effect Cards</CardTitle>
                  <CardDescription>Modern glassmorphism design</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-6 rounded-lg ${GradientBackgrounds.analytics}`}>
                    <GlassCard intensity="light">
                      <CardContent className="p-4">
                        <p className="text-sm">Light glass effect with subtle backdrop blur</p>
                      </CardContent>
                    </GlassCard>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Animated Progress</CardTitle>
                  <CardDescription>Smooth progress animations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatedProgress progress={75} color={ColorPalette.primary[500]} />
                  <AnimatedProgress progress={92} color={ColorPalette.success[500]} />
                  <AnimatedProgress progress={58} color={ColorPalette.warning[500]} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Cards</CardTitle>
                  <CardDescription>Hover and click animations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InteractiveCard onClick={() => alert("Card clicked!")}>
                    <CardContent className="p-4 text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm">Click me for interaction!</p>
                    </CardContent>
                  </InteractiveCard>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading States</CardTitle>
                  <CardDescription>Beautiful loading indicators</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center space-x-4 py-8">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Advanced Image Upload</h3>
              <p className="text-muted-foreground">Drag & drop interface with preview and progress tracking</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="w-5 h-5" />
                  <span>Image Upload Component</span>
                </CardTitle>
                <CardDescription>
                  Supports multiple file formats, drag & drop, progress tracking, and preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onFilesUpload={(files) => setUploadedFiles(files)}
                  maxFiles={8}
                  maxSize={10 * 1024 * 1024}
                  uploadText="Drop your workforce images here!"
                />
                
                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <BulkImageActions
                      files={uploadedFiles}
                      onDownloadAll={() => {}}
                      onRemoveAll={() => setUploadedFiles([])}
                      onSelectAll={() => {}}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={<Palette className="w-6 h-6" />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          position="bottom-right"
        />
      </div>
    </AppLayout>
  )
}