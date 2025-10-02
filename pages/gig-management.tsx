import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BarChart3, Plus, Briefcase, Users, CheckCircle, Star, Store, Search, FileText, CreditCard, Banknote } from "lucide-react";

export default function GigManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateGigOpen, setIsCreateGigOpen] = useState(false);

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

  const gigs = [
    { id: "1", title: "Event Setup Crew", client: "Event Solutions Ltd", rate: "£15/hour", status: "active", applicants: 12, duration: "4 hours" },
    { id: "2", title: "Delivery Driver", client: "QuickDelivery", rate: "£12/hour", status: "filled", applicants: 8, duration: "6 hours" },
    { id: "3", title: "Warehouse Assistant", client: "LogiCorp", rate: "£13.50/hour", status: "draft", applicants: 0, duration: "8 hours" },
  ];

  return (
    <AppLayout 
      title="Gig Management"
      breadcrumbs={[{ label: "Management", href: "/dashboard" }, { label: "Gig Management" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Gig Economy Management</h2>
            <p className="text-muted-foreground">Manage short-term gigs and freelance opportunities</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-gig-analytics" onClick={() => toast({ title: "Analytics", description: "Gig analytics dashboard coming soon!" })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Dialog open={isCreateGigOpen} onOpenChange={setIsCreateGigOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-gig">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Gig
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Gig</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Gig title..." data-testid="input-gig-title" />
                  <Input placeholder="Hourly rate..." data-testid="input-gig-rate" />
                  <Button onClick={() => {
                    toast({ title: "Success", description: "Gig created successfully!" });
                    setIsCreateGigOpen(false);
                  }} className="w-full">
                    Create Gig
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Gigs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">24</div>
              <p className="text-xs text-muted-foreground">+3 this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gig Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">156</div>
              <p className="text-xs text-muted-foreground">Available now</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">94.2%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">4.8</div>
              <p className="text-xs text-muted-foreground">Worker satisfaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Gig Management Interface */}
        <Tabs defaultValue="active-gigs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active-gigs" data-testid="tab-active-gigs">Active Gigs</TabsTrigger>
            <TabsTrigger value="marketplace" data-testid="tab-marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">Applications</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-gig-payments">Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active-gigs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {gigs.map((gig) => (
                <Card key={gig.id} className="hover:shadow-lg transition-shadow" data-testid={`card-gig-${gig.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`gig-title-${gig.id}`}>{gig.title}</CardTitle>
                      <Badge variant={gig.status === 'active' ? 'default' : gig.status === 'filled' ? 'secondary' : 'outline'} data-testid={`gig-status-${gig.id}`}>
                        {gig.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Client:</span>
                        <span className="text-sm font-medium text-foreground" data-testid={`gig-client-${gig.id}`}>{gig.client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rate:</span>
                        <span className="text-sm font-medium text-foreground" data-testid={`gig-rate-${gig.id}`}>{gig.rate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Duration:</span>
                        <span className="text-sm font-medium text-foreground" data-testid={`gig-duration-${gig.id}`}>{gig.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Applicants:</span>
                        <span className="text-sm font-medium text-foreground" data-testid={`gig-applicants-${gig.id}`}>{gig.applicants}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-gig-${gig.id}`} onClick={() => toast({ title: "Gig Details", description: "Detailed gig view coming soon!" })}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-gig-${gig.id}`} onClick={() => toast({ title: "Edit Gig", description: "Gig editing coming soon!" })}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="marketplace">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Gig Marketplace</h3>
                  <p className="text-muted-foreground mb-4">Browse and apply for available gig opportunities</p>
                  <Button onClick={() => toast({ title: "Marketplace", description: "Gig marketplace coming soon!" })}>
                    <Search className="mr-2 h-4 w-4" />
                    Browse Gigs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="applications">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Gig Applications</h3>
                  <p className="text-muted-foreground mb-4">Manage applications and worker selection</p>
                  <Button onClick={() => toast({ title: "Applications", description: "Application management coming soon!" })}>
                    <Users className="mr-2 h-4 w-4" />
                    View Applications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Gig Payments</h3>
                  <p className="text-muted-foreground mb-4">Process payments for completed gigs</p>
                  <Button onClick={() => toast({ title: "Gig Payments", description: "Gig payment processing coming soon!" })}>
                    <Banknote className="mr-2 h-4 w-4" />
                    Process Payments
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