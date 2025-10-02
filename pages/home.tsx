import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import AIEnhancementBanner from "@/components/ai/ai-enhancement-banner";
import AIQuickActions from "@/components/ai/ai-quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { StatsSkeleton } from "@/components/ui/loading-skeleton";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Rocket, UserCheck, Calculator, Handshake, Settings as SettingsIcon, FileText, Package, Briefcase, Calendar, MapPin, Users, Clock, CreditCard, AreaChart, Check } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to landing page for unauthenticated users
      setLocation("/landing");
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <AppLayout title="Loading...">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-8 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-muted rounded w-64 mb-2"></div>
                <div className="h-6 bg-muted rounded w-96"></div>
              </div>
              <div className="hidden md:block w-20 h-20 bg-muted rounded-full"></div>
            </div>
          </div>
          <StatsSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Home"
      breadcrumbs={[{ label: "Home" }]}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 rounded-lg p-8 animate-fadeIn border border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="animate-slideIn">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Welcome back, {(user as any)?.firstName || "User"}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Your complete 360° management platform is ready. Choose a module to get started.
              </p>
            </div>
            <div className="hidden md:block animate-bounceIn">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg pulse-on-hover">
                <Rocket className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Enhancement Banner */}
        <AIEnhancementBanner />

        {/* Management Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Core Workforce */}
          <Link href="/hr-management">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group interactive-card touch-feedback" data-testid="card-hr-management">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <UserCheck className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">HR Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Employee lifecycle, benefits, performance reviews, and recruitment pipeline management.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/finance-management">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-green-200/50 hover:border-green-300" data-testid="card-finance-management">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-lg flex items-center justify-center group-hover:from-green-400/30 group-hover:to-green-600/30 transition-all duration-300 group-hover:scale-110">
                    <Calculator className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Finance Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Accounting, invoicing, budgeting, expense tracking, and comprehensive financial reporting.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/crm-management">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-purple-200/50 hover:border-purple-300" data-testid="card-crm-management">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-lg flex items-center justify-center group-hover:from-purple-400/30 group-hover:to-purple-600/30 transition-all duration-300 group-hover:scale-110">
                    <Handshake className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg">CRM Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Lead generation, sales pipeline, customer success, and marketing campaign management.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/operations-management">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-orange-200/50 hover:border-orange-300" data-testid="card-operations-management">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-lg flex items-center justify-center group-hover:from-orange-400/30 group-hover:to-orange-600/30 transition-all duration-300 group-hover:scale-110">
                    <SettingsIcon className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-lg">Operations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Project management, supply chain, quality control, and operational excellence.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/document-management">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-indigo-200/50 hover:border-indigo-300" data-testid="card-document-management">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 rounded-lg flex items-center justify-center group-hover:from-indigo-400/30 group-hover:to-indigo-600/30 transition-all duration-300 group-hover:scale-110">
                    <FileText className="w-6 h-6 text-indigo-500" />
                  </div>
                  <CardTitle className="text-lg">Document Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Centralized document storage, version control, workflows, and collaboration tools.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/asset-management">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-teal-200/50 hover:border-teal-300" data-testid="card-asset-management">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400/20 to-teal-600/20 rounded-lg flex items-center justify-center group-hover:from-teal-400/30 group-hover:to-teal-600/30 transition-all duration-300 group-hover:scale-110">
                    <Package className="w-6 h-6 text-teal-500" />
                  </div>
                  <CardTitle className="text-lg">Asset Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Equipment tracking, maintenance scheduling, depreciation, and asset optimization.</p>
              </CardContent>
            </Card>
          </Link>

          {/* Core Workforce Modules */}
          <Link href="/jobs">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-primary/30 hover:border-primary/50" data-testid="card-jobs">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/30 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/40 transition-all duration-300 group-hover:scale-110">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Job Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Post jobs, manage applications, and track hiring progress with automated workflows.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/schedule">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-secondary/30 hover:border-secondary/50" data-testid="card-schedule">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/30 rounded-lg flex items-center justify-center group-hover:from-secondary/30 group-hover:to-secondary/40 transition-all duration-300 group-hover:scale-110">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">Schedule Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Drag-and-drop scheduling interface with shift management and worker availability.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/map-tracking">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group interactive-card touch-feedback transform hover:-translate-y-2 animate-scaleIn border-red-200/50 hover:border-red-300" data-testid="card-map-tracking">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-lg flex items-center justify-center group-hover:from-red-400/30 group-hover:to-red-600/30 transition-all duration-300 group-hover:scale-110">
                    <MapPin className="w-6 h-6 text-red-500" />
                  </div>
                  <CardTitle className="text-lg">Map Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Real-time worker location monitoring with GPS tracking and geofencing capabilities.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/workers">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-muted/50" data-testid="button-quick-workers">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">View Workers</span>
                </Button>
              </Link>
              
              <Link href="/timesheets">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-muted/50" data-testid="button-quick-timesheets">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Timesheets</span>
                </Button>
              </Link>
              
              <Link href="/payments">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-muted/50" data-testid="button-quick-payments">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm">Payments</span>
                </Button>
              </Link>
              
              <Link href="/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-muted/50" data-testid="button-quick-analytics">
                  <AreaChart className="w-5 h-5" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* AI Quick Actions */}
        <AIQuickActions />

        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Core Management Systems</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Human Resources Management</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Financial Management & Accounting</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Customer Relationship Management</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Operations & Project Management</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Document & Asset Management</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Advanced Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Real-time Map Tracking & GPS</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Security Monitoring & Compliance</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Gig Economy Management</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Learning Hub with KarmaCoins</li>
                  <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Advanced Analytics & Automation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}