import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TrendingUp, Network, Clock, Settings, Star, ListTodo, Truck, Link, CheckCircle, ClipboardCheck, Boxes, Gauge, BarChart3 } from "lucide-react";

export default function OperationsManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="Operations Management"
      breadcrumbs={[{ label: "Operations Management" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Operations Management</h2>
            <p className="text-muted-foreground">Project management, supply chain, and operational excellence</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-ops-reports" onClick={() => toast({ title: "Operations Reports", description: "Operational analytics coming soon!" })}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Operations Reports
            </Button>
            <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-project">
                  <Network className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Project name..." data-testid="input-project-name" />
                  <Input placeholder="Project manager..." data-testid="input-project-manager" />
                  <Input placeholder="Start date..." data-testid="input-project-start" />
                  <Input placeholder="End date..." data-testid="input-project-end" />
                  <Button onClick={() => {
                    toast({ title: "Success", description: "Project created successfully!" });
                    setIsCreateProjectOpen(false);
                  }} className="w-full">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Operations Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">28</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">94.2%</div>
              <p className="text-xs text-muted-foreground">Above target</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">87.3%</div>
              <p className="text-xs text-muted-foreground">Optimal range</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">96.1%</div>
              <p className="text-xs text-muted-foreground">Quality metrics</p>
            </CardContent>
          </Card>
        </div>

        {/* Operations Management Interface */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
            <TabsTrigger value="supply-chain" data-testid="tab-supply-chain">Supply Chain</TabsTrigger>
            <TabsTrigger value="quality" data-testid="tab-quality">Quality Control</TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <ListTodo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Project Management</h3>
                  <p className="text-muted-foreground mb-4">Agile project management with Gantt charts and Kanban boards</p>
                  <Button onClick={() => toast({ title: "Project Management", description: "Full project management suite coming soon!" })}>
                    <Network className="mr-2 h-4 w-4" />
                    Manage Projects
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="supply-chain">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Supply Chain Management</h3>
                  <p className="text-muted-foreground mb-4">Vendor management, procurement, and logistics</p>
                  <Button onClick={() => toast({ title: "Supply Chain", description: "Supply chain management coming soon!" })}>
                    <Link className="mr-2 h-4 w-4" />
                    Manage Supply Chain
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quality">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Quality Control</h3>
                  <p className="text-muted-foreground mb-4">Quality assurance and control processes</p>
                  <Button onClick={() => toast({ title: "Quality Control", description: "Quality management system coming soon!" })}>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Quality Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Boxes className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Resource Planning</h3>
                  <p className="text-muted-foreground mb-4">Enterprise resource planning and allocation</p>
                  <Button onClick={() => toast({ title: "Resource Planning", description: "ERP system coming soon!" })}>
                    <Network className="mr-2 h-4 w-4" />
                    Resource Planner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="kpis">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Gauge className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Key Performance Indicators</h3>
                  <p className="text-muted-foreground mb-4">Track and monitor operational KPIs</p>
                  <Button onClick={() => toast({ title: "KPIs", description: "KPI dashboard coming soon!" })}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View KPIs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}