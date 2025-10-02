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
import { BarChart3, Plus, Box, PoundSterling, Wrench, Percent, Laptop, Monitor, Car, Route, CalendarCheck, TrendingDown, Calculator } from "lucide-react";

export default function AssetManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);

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

  const assets = [
    { id: "1", name: "MacBook Pro 16\"", category: "IT Equipment", value: "£2,500", status: "assigned", assignee: "Sarah Wilson" },
    { id: "2", name: "Office Desk (Standing)", category: "Furniture", value: "£800", status: "available", assignee: null },
    { id: "3", name: "Company Vehicle #1", category: "Vehicles", value: "£35,000", status: "maintenance", assignee: "Fleet Manager" },
  ];

  return (
    <AppLayout 
      title="Asset Management"
      breadcrumbs={[{ label: "Resources", href: "/dashboard" }, { label: "Assets" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Asset Management</h2>
            <p className="text-muted-foreground">Track, manage, and optimize company assets and equipment</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-asset-reports" onClick={() => toast({ title: "Asset Reports", description: "Asset analytics and depreciation reports coming soon!" })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Asset Reports
            </Button>
            <Dialog open={isCreateAssetOpen} onOpenChange={setIsCreateAssetOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-asset">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Asset name..." data-testid="input-asset-name" />
                  <Input placeholder="Category..." data-testid="input-asset-category" />
                  <Input placeholder="Value..." data-testid="input-asset-value" />
                  <Input placeholder="Serial number..." data-testid="input-asset-serial" />
                  <Button onClick={() => {
                    toast({ title: "Success", description: "Asset added successfully!" });
                    setIsCreateAssetOpen(false);
                  }} className="w-full">
                    Add Asset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Asset Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">847</div>
              <p className="text-xs text-muted-foreground">Tracked items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">£2.4M</div>
              <p className="text-xs text-muted-foreground">Asset portfolio value</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">15</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">89.4%</div>
              <p className="text-xs text-muted-foreground">Asset efficiency</p>
            </CardContent>
          </Card>
        </div>

        {/* Asset Management Interface */}
        <Tabs defaultValue="all-assets" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all-assets" data-testid="tab-all-assets">All Assets</TabsTrigger>
            <TabsTrigger value="it-equipment" data-testid="tab-it-equipment">IT Equipment</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-asset-maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="depreciation" data-testid="tab-depreciation">Depreciation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-assets">
            <Card>
              <CardHeader>
                <CardTitle>Asset Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`card-asset-${asset.id}`}>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`asset-name-${asset.id}`}>{asset.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`asset-category-${asset.id}`}>{asset.category} • {asset.value}</p>
                        {asset.assignee && (
                          <p className="text-xs text-muted-foreground" data-testid={`asset-assignee-${asset.id}`}>
                            Assigned to: {asset.assignee}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={asset.status === 'assigned' ? 'default' : asset.status === 'available' ? 'secondary' : 'destructive'} data-testid={`asset-status-${asset.id}`}>
                          {asset.status}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`button-manage-asset-${asset.id}`} onClick={() => toast({ title: "Asset Management", description: "Asset details and management coming soon!" })}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="it-equipment">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Laptop className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">IT Equipment</h3>
                  <p className="text-muted-foreground mb-4">Computers, phones, and technology assets</p>
                  <Button onClick={() => toast({ title: "IT Equipment", description: "IT asset management coming soon!" })}>
                    <Monitor className="mr-2 h-4 w-4" />
                    Manage IT Assets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vehicles">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Fleet Management</h3>
                  <p className="text-muted-foreground mb-4">Company vehicles and fleet optimization</p>
                  <Button onClick={() => toast({ title: "Fleet Management", description: "Vehicle tracking and management coming soon!" })}>
                    <Route className="mr-2 h-4 w-4" />
                    Manage Fleet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Maintenance Scheduling</h3>
                  <p className="text-muted-foreground mb-4">Preventive maintenance and service tracking</p>
                  <Button onClick={() => toast({ title: "Maintenance", description: "Maintenance management coming soon!" })}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Schedule Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="depreciation">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <TrendingDown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Depreciation Tracking</h3>
                  <p className="text-muted-foreground mb-4">Asset depreciation and financial planning</p>
                  <Button onClick={() => toast({ title: "Depreciation", description: "Depreciation calculations coming soon!" })}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Depreciation
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