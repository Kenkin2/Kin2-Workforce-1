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
import { Building2, Search, Filter, Eye, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";
import type { User } from "@shared/schema";

export default function Clients() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { canManageClients } = useRoleAccess();
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

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

  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const clientSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }).min(1, { message: "Email is required" }),
    firstName: z.string().min(1, { message: "First name is required" }).max(50, { message: "First name must be 50 characters or less" }),
    lastName: z.string().min(1, { message: "Last name is required" }).max(50, { message: "Last name must be 50 characters or less" }),
    organizationName: z.string().min(2, { message: "Company name must be at least 2 characters" }).max(100, { message: "Company name must be 100 characters or less" }),
  });

  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      organizationName: "",
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/clients", {
        ...data,
        role: "client",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsAddClientOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    addClientMutation.mutate(data);
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
      title="Clients"
      breadcrumbs={[{ label: "Management", href: "/dashboard" }, { label: "Clients" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Client Management</h2>
            <p className="text-muted-foreground">Manage client accounts and organizations</p>
          </div>
          {canManageClients && (
            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-client">
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Acme Corporation" 
                            {...field} 
                            data-testid="input-client-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="contact@company.com" 
                            {...field} 
                            data-testid="input-client-email"
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
                              placeholder="Jane" 
                              {...field} 
                              data-testid="input-client-first-name"
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
                              placeholder="Smith" 
                              {...field} 
                              data-testid="input-client-last-name"
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
                      onClick={() => setIsAddClientOpen(false)}
                      data-testid="button-cancel-client"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addClientMutation.isPending}
                      data-testid="button-submit-client"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      {addClientMutation.isPending ? 'Adding...' : 'Add Client'}
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
                <Input 
                  placeholder="Search clients..." 
                  className="pl-10"
                  data-testid="input-search-clients"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              </div>
              <Button variant="outline" data-testid="button-filter-clients" onClick={() => toast({ title: "Filters", description: "Client filtering coming soon!" })}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        {clientsLoading ? (
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
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow" data-testid={`card-client-${client.id}`}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={client.profileImageUrl || undefined} alt={`${client.firstName} ${client.lastName}`} />
                      <AvatarFallback>
                        {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-client-name-${client.id}`}>
                        {client.firstName} {client.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid={`text-client-email-${client.id}`}>
                        {client.email}
                      </p>
                      <Badge variant="outline" className="mt-2" data-testid={`badge-client-role-${client.id}`}>
                        {client.role}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-foreground" data-testid={`text-client-joined-${client.id}`}>
                        {new Date(client.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Jobs:</span>
                      <span className="text-foreground font-medium">3</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Spent:</span>
                      <span className="text-foreground font-medium">£24,560</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-client-${client.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-client-${client.id}`}>
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
                <Building2 className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No clients found</h3>
                <p className="text-muted-foreground mb-4">
                  {canManageClients 
                    ? "Start onboarding your first client"
                    : "No clients available at this time"}
                </p>
                {canManageClients && (
                  <Button 
                    onClick={() => setIsAddClientOpen(true)}
                    data-testid="button-add-first-client"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Add Your First Client
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
