import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, MapPin, Users, Route, Clock, Satellite, Map, Plus, Shapes } from "lucide-react";

export default function MapTracking() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const workerLocations = [
    { id: "1", name: "Sarah Wilson", location: "London Office", status: "active", lastUpdate: "2 mins ago" },
    { id: "2", name: "Mike Johnson", location: "Manchester Site", status: "on_route", lastUpdate: "5 mins ago" },
    { id: "3", name: "Emma Thompson", location: "Birmingham Hub", status: "break", lastUpdate: "15 mins ago" },
  ];

  return (
    <AppLayout 
      title="Map Tracking"
      breadcrumbs={[{ label: "Operations", href: "/operations-management" }, { label: "Map Tracking" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Location Tracking</h2>
            <p className="text-muted-foreground">Real-time worker location and route monitoring</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-export-routes" onClick={() => toast({ title: "Export", description: "Route export feature coming soon!" })}>
              <Download className="mr-2 h-4 w-4" />
              Export Routes
            </Button>
            <Button data-testid="button-live-tracking" onClick={() => toast({ title: "Live Tracking", description: "Real-time GPS tracking coming soon!" })}>
              <MapPin className="mr-2 h-4 w-4" />
              Enable Live Tracking
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">127</div>
              <p className="text-xs text-muted-foreground">Currently tracked</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Route</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">23</div>
              <p className="text-xs text-muted-foreground">Between locations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2.4m</div>
              <p className="text-xs text-muted-foreground">Emergency response</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GPS Accuracy</CardTitle>
              <Satellite className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">98.7%</div>
              <p className="text-xs text-muted-foreground">Location precision</p>
            </CardContent>
          </Card>
        </div>

        {/* Map and Tracking Interface */}
        <Tabs defaultValue="live-map" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live-map" data-testid="tab-live-map">Live Map</TabsTrigger>
            <TabsTrigger value="routes" data-testid="tab-routes">Routes</TabsTrigger>
            <TabsTrigger value="geofences" data-testid="tab-geofences">Geofences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live-map">
            <Card>
              <CardContent className="p-6">
                <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                  <div className="text-center">
                    <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Map</h3>
                    <p className="text-muted-foreground">Real-time worker locations will appear here</p>
                    <Button className="mt-4" onClick={() => toast({ title: "Map Integration", description: "Google Maps integration coming soon!" })}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Initialize Map
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle>Active Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workerLocations.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`route-worker-${worker.id}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          worker.status === 'active' ? 'bg-green-500' : 
                          worker.status === 'on_route' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`worker-name-${worker.id}`}>{worker.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`worker-location-${worker.id}`}>{worker.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={worker.status === 'active' ? 'default' : 'secondary'} data-testid={`worker-status-${worker.id}`}>
                          {worker.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`worker-update-${worker.id}`}>{worker.lastUpdate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="geofences">
            <Card>
              <CardHeader>
                <CardTitle>Geofence Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shapes className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Geofence Setup</h3>
                  <p className="text-muted-foreground mb-4">Create virtual boundaries for automatic attendance tracking</p>
                  <Button onClick={() => toast({ title: "Geofences", description: "Geofencing feature coming soon!" })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Geofence
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