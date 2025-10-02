import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, Pencil, Eye, Briefcase } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema } from "@shared/schema";
import type { Job } from "@shared/schema";
import JobMatching from "@/components/ai/job-matching";

export default function Jobs() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { canManageJobs } = useRoleAccess();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const form = useForm({
    resolver: zodResolver(
      insertJobSchema.omit({ clientId: true })
    ),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      salary: "",
      jobType: "full-time",
      status: "draft",
      requiredSkills: [],
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", "/api/jobs", jobData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createJobMutation.mutate(data);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <AppLayout title="Jobs">
        <div className="space-y-6" data-testid="loader-jobs">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
            </div>
            <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          </div>
          <TableSkeleton rows={6} />
        </div>
      </AppLayout>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "closed": return "secondary";
      case "paused": return "outline";
      default: return "outline";
    }
  };

  return (
    <AppLayout 
      title="Jobs"
      breadcrumbs={[{ label: "Management", href: "/dashboard" }, { label: "Jobs" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Job Management</h2>
            <p className="text-muted-foreground" data-testid="text-page-description">Manage job postings and applications</p>
          </div>
          
          {canManageJobs && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-post-job">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]" data-testid="dialog-post-job">
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">Post New Job</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Senior Frontend Developer, Marketing Manager" 
                            {...field} 
                            data-testid="input-job-title"
                            className={form.formState.errors.title ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the role, key responsibilities, required qualifications, and any special requirements..." 
                            className={`min-h-[120px] ${form.formState.errors.description ? "border-red-500" : ""}`}
                            {...field} 
                            data-testid="textarea-job-description"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {field.value?.length || 0}/500 characters
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="City, Country or 'Remote'" 
                              {...field} 
                              data-testid="input-job-location"
                              className={form.formState.errors.location ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Annual salary (e.g. 65000)" 
                              type="number" 
                              min="0" 
                              step="1000" 
                              {...field} 
                              data-testid="input-job-salary"
                              className={form.formState.errors.salary ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-job-type">
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-job"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => form.handleSubmit(onSubmit)()}
                      disabled={createJobMutation.isPending}
                      data-testid="button-submit-job"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Search and Filters */}
        <Card data-testid="card-search-filters">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search jobs by title, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-jobs"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32" data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {jobsLoading ? (
          <div data-testid="loader-jobs-list">
            <TableSkeleton rows={6} />
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-6" data-testid="list-jobs">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`card-job-${job.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl" data-testid={`text-job-title-${job.id}`}>{job.title}</CardTitle>
                      <CardDescription data-testid={`text-job-location-${job.id}`}>
                        {job.location} • {job.jobType}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(job.status)} data-testid={`badge-job-status-${job.id}`}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4" data-testid={`text-job-description-${job.id}`}>
                    {job.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {job.salary && (
                        <span className="font-semibold text-foreground" data-testid={`text-job-salary-${job.id}`}>
                          £{parseInt(job.salary).toLocaleString()}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground" data-testid={`text-job-created-${job.id}`}>
                        Posted {new Date(job.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" data-testid={`button-edit-job-${job.id}`}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-view-job-${job.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card data-testid="card-empty-state">
            <CardContent className="pt-6">
              <EmptyState
                icon={Briefcase}
                title="No jobs posted yet"
                description={canManageJobs ? "Get started by posting your first job" : "No jobs available at this time"}
                action={canManageJobs ? {
                  label: "Post Your First Job",
                  onClick: () => setIsDialogOpen(true),
                  testId: "button-post-first-job"
                } : undefined}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
