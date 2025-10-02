import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Filter, Download, Eye, Pencil, Users, Coins } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";

export default function Workers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { canManageWorkers } = useRoleAccess();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

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

  const { data: workers, isLoading: workersLoading } = useQuery<User[]>({
    queryKey: ["/api/workers"],
    enabled: isAuthenticated,
  });

  const form = useForm({
    resolver: zodResolver(
      insertUserSchema.omit({ role: true, karmaCoins: true, password: true })
    ),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      profileImageUrl: "",
    },
  });

  const inviteWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/workers/invite", {
        ...data,
        role: "worker",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker invitation sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setIsInviteDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to invite worker. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    inviteWorkerMutation.mutate(data);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="Workers" 
      breadcrumbs={[{ label: "Workers" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Worker Management</h2>
            <p className="text-muted-foreground">Manage worker profiles and performance</p>
          </div>
          {canManageWorkers && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-worker">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Worker
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite New Worker</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="worker@example.com" 
                            {...field} 
                            data-testid="input-worker-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John" 
                              {...field} 
                              data-testid="input-worker-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Doe" 
                              {...field} 
                              data-testid="input-worker-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsInviteDialogOpen(false)}
                      data-testid="button-cancel-invite"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={inviteWorkerMutation.isPending}
                      data-testid="button-submit-invite"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {inviteWorkerMutation.isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search by name, skills, or location..." 
                  className="pl-10"
                  data-testid="input-search-workers"
                />
              </div>
              <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-filter-workers">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Workers</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Advanced filtering options coming soon!</p>
                    <Button onClick={() => setIsFilterDialogOpen(false)} className="w-full">
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" data-testid="button-export-workers" onClick={() => toast({ title: "Export", description: "Worker export feature coming soon!" })}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workers Grid */}
        {workersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-muted rounded-full mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <Card key={worker.id} className="hover:shadow-lg transition-shadow" data-testid={`card-worker-${worker.id}`}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={worker.profileImageUrl || undefined} alt={`${worker.firstName} ${worker.lastName}`} />
                      <AvatarFallback>
                        {worker.firstName?.charAt(0)}{worker.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-worker-name-${worker.id}`}>
                        {worker.firstName} {worker.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid={`text-worker-email-${worker.id}`}>
                        {worker.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" data-testid={`badge-worker-role-${worker.id}`}>
                          {worker.role}
                        </Badge>
                        <div className="flex items-center text-sm text-secondary">
                          <Coins className="w-4 h-4 mr-1" />
                          <span data-testid={`text-worker-karma-${worker.id}`}>{worker.karmaCoins} KC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-foreground" data-testid={`text-worker-joined-${worker.id}`}>
                        {new Date(worker.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate:</span>
                      <span className="text-foreground font-medium">95.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Hours:</span>
                      <span className="text-foreground font-medium">1,247</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-worker-${worker.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-worker-${worker.id}`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No workers found</h3>
                <p className="text-muted-foreground mb-4">
                  {canManageWorkers
                    ? "Start building your workforce"
                    : "No workers available at this time"}
                </p>
                {canManageWorkers && (
                  <Button 
                    onClick={() => setIsInviteDialogOpen(true)}
                    data-testid="button-invite-first-worker"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Your First Worker
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
