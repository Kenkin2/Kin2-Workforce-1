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
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Wrench, Box, AlertTriangle, Building, Plus, CalendarPlus, History } from "lucide-react";

export default function ProductsFacilities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateFacilityOpen, setIsCreateFacilityOpen] = useState(false);

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

  const products = [
    { id: "1", name: "Safety Equipment Kit", category: "Safety", stock: 45, status: "in_stock", supplier: "SafetyFirst Ltd" },
    { id: "2", name: "Uniform Set", category: "Apparel", stock: 12, status: "low_stock", supplier: "UniformPro" },
    { id: "3", name: "Tool Kit Basic", category: "Tools", stock: 78, status: "in_stock", supplier: "ToolMasters" },
  ];

  const facilities = [
    { id: "1", name: "London Headquarters", type: "Office", capacity: 200, occupancy: 145, status: "operational" },
    { id: "2", name: "Manchester Warehouse", type: "Warehouse", capacity: 50, occupancy: 34, status: "operational" },
    { id: "3", name: "Birmingham Training Center", type: "Training", capacity: 30, occupancy: 0, status: "maintenance" },
  ];

  return (
    <AppLayout 
      title="Products & Facilities"
      breadcrumbs={[{ label: "Operations", href: "/operations-management" }, { label: "Products & Facilities" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Products & Facilities Management</h2>
            <p className="text-muted-foreground">Manage inventory, equipment, and facility operations</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-inventory-report" onClick={() => toast({ title: "Inventory Report", description: "Inventory reporting coming soon!" })}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Inventory Report
            </Button>
            <Button data-testid="button-maintenance-schedule" onClick={() => toast({ title: "Maintenance", description: "Facility maintenance scheduling coming soon!" })}>
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">245</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">8</div>
              <p className="text-xs text-muted-foreground">Need reorder</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Facilities</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">3</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Interface */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" data-testid="tab-products">Products & Inventory</TabsTrigger>
            <TabsTrigger value="facilities" data-testid="tab-facilities">Facilities</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product Inventory</CardTitle>
                  <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-product">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Product name..." data-testid="input-product-name" />
                        <Input placeholder="Category..." data-testid="input-product-category" />
                        <Input placeholder="Stock quantity..." data-testid="input-product-stock" />
                        <Textarea placeholder="Product description..." data-testid="textarea-product-description" />
                        <Button onClick={() => {
                          toast({ title: "Success", description: "Product added successfully!" });
                          setIsCreateProductOpen(false);
                        }} className="w-full">
                          Add Product
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`card-product-${product.id}`}>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`product-name-${product.id}`}>{product.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`product-category-${product.id}`}>{product.category} • {product.supplier}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`product-stock-${product.id}`}>Stock: {product.stock} units</p>
                      </div>
                      <Badge variant={product.status === 'in_stock' ? 'default' : 'destructive'} data-testid={`product-status-${product.id}`}>
                        {product.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="facilities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Facility Management</CardTitle>
                  <Dialog open={isCreateFacilityOpen} onOpenChange={setIsCreateFacilityOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-facility">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Facility
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Facility</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Facility name..." data-testid="input-facility-name" />
                        <Input placeholder="Type (Office, Warehouse, etc.)..." data-testid="input-facility-type" />
                        <Input placeholder="Capacity..." data-testid="input-facility-capacity" />
                        <Textarea placeholder="Facility description..." data-testid="textarea-facility-description" />
                        <Button onClick={() => {
                          toast({ title: "Success", description: "Facility added successfully!" });
                          setIsCreateFacilityOpen(false);
                        }} className="w-full">
                          Add Facility
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {facilities.map((facility) => (
                    <div key={facility.id} className="p-4 border border-border rounded-lg" data-testid={`card-facility-${facility.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground" data-testid={`facility-name-${facility.id}`}>{facility.name}</h4>
                        <Badge variant={facility.status === 'operational' ? 'default' : 'destructive'} data-testid={`facility-status-${facility.id}`}>
                          {facility.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Type:</span>
                          <span className="text-sm font-medium text-foreground" data-testid={`facility-type-${facility.id}`}>{facility.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Capacity:</span>
                          <span className="text-sm font-medium text-foreground" data-testid={`facility-capacity-${facility.id}`}>{facility.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Occupancy:</span>
                          <span className="text-sm font-medium text-foreground" data-testid={`facility-occupancy-${facility.id}`}>{facility.occupancy}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-facility-${facility.id}`} onClick={() => toast({ title: "Facility Details", description: "Detailed facility view coming soon!" })}>
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-facility-${facility.id}`} onClick={() => toast({ title: "Edit Facility", description: "Facility editing coming soon!" })}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Maintenance Management</h3>
                  <p className="text-muted-foreground mb-4">Schedule and track facility maintenance</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => toast({ title: "Schedule Maintenance", description: "Maintenance scheduling coming soon!" })}>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Schedule Maintenance
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Maintenance Log", description: "Maintenance history coming soon!" })}>
                      <History className="mr-2 h-4 w-4" />
                      View History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}