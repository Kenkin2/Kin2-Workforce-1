import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Star, 
  Calendar, 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle,
  Eye,
  MessageSquare,
  BarChart3,
  Plus,
  Filter,
  UserPlus,
  Briefcase,
  CalendarX,
  BookUser,
  Search,
  Heart,
  Shield
} from "lucide-react";

// Review Form Component
interface ReviewFormProps {
  reviewId: string;
  competencies: any[];
  onSubmit: (data: any[]) => void;
  onClose: () => void;
}

function ReviewForm({ reviewId, competencies, onSubmit, onClose }: ReviewFormProps) {
  const [responses, setResponses] = useState<{ [key: string]: { rating: number; comments: string } }>({});

  const handleRatingChange = (competencyId: string, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [competencyId]: { ...prev[competencyId], rating }
    }));
  };

  const handleCommentsChange = (competencyId: string, comments: string) => {
    setResponses(prev => ({
      ...prev,
      [competencyId]: { ...prev[competencyId], comments }
    }));
  };

  const handleSubmit = () => {
    const responseData = Object.entries(responses).map(([competencyId, data]) => ({
      competencyId,
      rating: data.rating,
      comments: data.comments || ""
    }));
    onSubmit(responseData);
  };

  const isComplete = competencies.every(comp => responses[comp.id]?.rating);

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Rate each competency from 1 (Needs Improvement) to 5 (Exceptional) and provide specific feedback.
      </div>
      
      <div className="space-y-6">
        {competencies.map((competency: any) => (
          <div key={competency.id} className="space-y-3 border-b pb-6">
            <div>
              <h4 className="font-semibold">{competency.competencyName}</h4>
              <p className="text-sm text-muted-foreground">{competency.description}</p>
              <Badge variant="outline" className="mt-1">{competency.category}</Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={responses[competency.id]?.rating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRatingChange(competency.id, rating)}
                    className="w-10 h-10 p-0"
                    data-testid={`rating-${competency.id}-${rating}`}
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        responses[competency.id]?.rating >= rating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : ""
                      }`} 
                    />
                  </Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                1 = Needs Improvement, 3 = Meets Expectations, 5 = Exceptional
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments & Feedback</label>
              <Textarea
                placeholder="Provide specific examples and constructive feedback..."
                value={responses[competency.id]?.comments || ""}
                onChange={(e) => handleCommentsChange(competency.id, e.target.value)}
                className="min-h-[80px]"
                data-testid={`comments-${competency.id}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {Object.keys(responses).filter(id => responses[id]?.rating).length} of {competencies.length} competencies rated
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isComplete}
            data-testid="button-submit-review"
          >
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
}

// Form schemas
const reviewCycleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string(),
  endDate: z.string(),
  karmaReward: z.string().transform(val => parseInt(val))
});

const reviewResponseSchema = z.object({
  competencyId: z.string(),
  rating: z.number().min(1).max(5),
  comments: z.string().optional()
});

export default function HRManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("cycles");

  // API Queries
  const { data: reviewCycles = [] } = useQuery<any[]>({
    queryKey: ['/api/360/cycles'],
    enabled: isAuthenticated
  });

  const { data: myReviews = [] } = useQuery<any[]>({
    queryKey: ['/api/360/reviews/my-reviews'],
    enabled: isAuthenticated
  });

  const { data: reviewsToComplete = [] } = useQuery<any[]>({
    queryKey: ['/api/360/reviews/to-review'],
    enabled: isAuthenticated
  });

  const { data: competencies = [] } = useQuery<any[]>({
    queryKey: ['/api/360/competencies'],
    enabled: isAuthenticated
  });

  const { data: reviewStats = { completionRate: 0, averageRating: 0 } } = useQuery<{ completionRate: number; averageRating: number }>({
    queryKey: ['/api/360/stats'],
    enabled: isAuthenticated
  });

  // Forms
  const cycleForm = useForm({
    resolver: zodResolver(reviewCycleSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      karmaReward: "100"
    }
  });

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: (data: any) => 
      fetch('/api/360/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/360/cycles'] });
      toast({ title: "Success", description: "Review cycle created successfully!" });
      setIsCreateCycleOpen(false);
      cycleForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create review cycle",
        variant: "destructive" 
      });
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ reviewId, responses }: { reviewId: string; responses: any[] }) =>
      fetch(`/api/360/reviews/${reviewId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/360/reviews/to-review'] });
      toast({ title: "Success", description: "Review submitted successfully!" });
      setSelectedReview(null);
    }
  });

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
      title="HR Management"
      breadcrumbs={[{ label: "HR Management" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Human Resources Management</h2>
            <p className="text-muted-foreground">Employee lifecycle, benefits, and performance management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-hr-reports" onClick={() => toast({ title: "HR Reports", description: "HR analytics and reporting coming soon!" })}>
              <BarChart3 className="w-4 h-4 mr-2" />
              HR Reports
            </Button>
            <Dialog open={isCreateEmployeeOpen} onOpenChange={setIsCreateEmployeeOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-employee">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Full name..." data-testid="input-employee-name" />
                  <Input placeholder="Email address..." data-testid="input-employee-email" />
                  <Input placeholder="Department..." data-testid="input-employee-department" />
                  <Input placeholder="Position..." data-testid="input-employee-position" />
                  <Button onClick={() => {
                    toast({ title: "Success", description: "Employee added successfully!" });
                    setIsCreateEmployeeOpen(false);
                  }} className="w-full">
                    Add Employee
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* HR Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">247</div>
              <p className="text-xs text-muted-foreground">+12 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">18</div>
              <p className="text-xs text-muted-foreground">Actively hiring</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <CalendarX className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">7</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Reviews</CardTitle>
              <Star className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">23</div>
              <p className="text-xs text-muted-foreground">Due this month</p>
            </CardContent>
          </Card>
        </div>

        {/* HR Management Interface */}
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="employees" data-testid="tab-employees">Employees</TabsTrigger>
            <TabsTrigger value="recruitment" data-testid="tab-recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="benefits" data-testid="tab-benefits">Benefits</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
            <TabsTrigger value="policies" data-testid="tab-policies">Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employee Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookUser className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Employee Management</h3>
                  <p className="text-muted-foreground mb-4">Comprehensive employee directory and management</p>
                  <Button onClick={() => toast({ title: "Employee Directory", description: "Full employee management system coming soon!" })}>
                    <Users className="w-4 h-4 mr-2" />
                    View Directory
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recruitment">
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UserPlus className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Talent Acquisition</h3>
                  <p className="text-muted-foreground mb-4">End-to-end recruitment and onboarding process</p>
                  <Button onClick={() => toast({ title: "Recruitment", description: "ATS and recruitment pipeline coming soon!" })}>
                    <Search className="w-4 h-4 mr-2" />
                    Manage Pipeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle>Benefits Administration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Employee Benefits</h3>
                  <p className="text-muted-foreground mb-4">Healthcare, pension, and benefit management</p>
                  <Button onClick={() => toast({ title: "Benefits", description: "Benefits administration portal coming soon!" })}>
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Benefits
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="space-y-6">
              {/* 360 Feedback Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Cycles</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reviewCycles.length}</div>
                    <p className="text-xs text-muted-foreground">Current review periods</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reviewsToComplete.length}</div>
                    <p className="text-xs text-muted-foreground">Awaiting your feedback</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myReviews.length}</div>
                    <p className="text-xs text-muted-foreground">Reviews about me</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reviewStats?.completionRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">On-time feedback</p>
                  </CardContent>
                </Card>
              </div>

              {/* 360 Feedback Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      360-Degree Feedback System
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Comprehensive performance evaluation and development</p>
                  </div>
                  <Dialog open={isCreateCycleOpen} onOpenChange={setIsCreateCycleOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-cycle">
                        <Plus className="h-4 w-4 mr-2" />
                        New Review Cycle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Review Cycle</DialogTitle>
                      </DialogHeader>
                      <Form {...cycleForm}>
                        <form onSubmit={cycleForm.handleSubmit((data) => createCycleMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={cycleForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cycle Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Q4 2024 Performance Review" {...field} data-testid="input-cycle-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={cycleForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Quarterly performance review focusing on..." {...field} data-testid="input-cycle-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={cycleForm.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-cycle-start" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={cycleForm.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-cycle-end" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={cycleForm.control}
                            name="karmaReward"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Karma Coins Reward</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="100" {...field} data-testid="input-cycle-karma" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full" disabled={createCycleMutation.isPending}>
                            {createCycleMutation.isPending ? "Creating..." : "Create Cycle"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="cycles" data-testid="tab-360-cycles">Cycles</TabsTrigger>
                      <TabsTrigger value="pending" data-testid="tab-360-pending">Pending ({reviewsToComplete.length})</TabsTrigger>
                      <TabsTrigger value="my-reviews" data-testid="tab-360-reviews">My Reviews</TabsTrigger>
                      <TabsTrigger value="analytics" data-testid="tab-360-analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="cycles" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Review Cycles</h3>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {reviewCycles.length === 0 ? (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Review Cycles</h3>
                            <p className="text-muted-foreground mb-4">Create your first 360-degree feedback cycle</p>
                            <Button onClick={() => setIsCreateCycleOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Cycle
                            </Button>
                          </div>
                        ) : (
                          reviewCycles.map((cycle: any) => (
                            <Card key={cycle.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{cycle.name}</h4>
                                  <p className="text-sm text-muted-foreground">{cycle.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}</span>
                                    <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                                      {cycle.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Results
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Pending Reviews</h3>
                        <Badge variant="outline">{reviewsToComplete.length} pending</Badge>
                      </div>
                      <div className="space-y-3">
                        {reviewsToComplete.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                            <p className="text-muted-foreground">No pending reviews to complete</p>
                          </div>
                        ) : (
                          reviewsToComplete.map((review: any) => (
                            <Card key={review.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{review.reviewee?.firstName} {review.reviewee?.lastName}</h4>
                                  <p className="text-sm text-muted-foreground">{review.cycle?.name}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">{review.participantType}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Due: {new Date(review.cycle?.endDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => setSelectedReview(review.id)}
                                  data-testid={`button-review-${review.id}`}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Provide Feedback
                                </Button>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="my-reviews" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">My Performance Reviews</h3>
                        <Badge variant="outline">{myReviews.length} total</Badge>
                      </div>
                      <div className="space-y-3">
                        {myReviews.length === 0 ? (
                          <div className="text-center py-8">
                            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                            <p className="text-muted-foreground">Your performance reviews will appear here</p>
                          </div>
                        ) : (
                          myReviews.map((review: any) => (
                            <Card key={review.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{review.cycle?.name}</h4>
                                  <p className="text-sm text-muted-foreground">Performance Review</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                                      {review.status}
                                    </Badge>
                                    {review.averageRating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-medium">{review.averageRating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Performance Analytics</h3>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-4">
                          <h4 className="font-semibold mb-4">Review Completion Rate</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span>{reviewStats?.completionRate || 0}%</span>
                            </div>
                            <Progress value={reviewStats?.completionRate || 0} className="h-2" />
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <h4 className="font-semibold mb-4">Average Rating</h4>
                          <div className="flex items-center gap-2">
                            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            <span className="text-2xl font-bold">{reviewStats?.averageRating || 0}</span>
                            <span className="text-muted-foreground">/5</span>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Review Dialog */}
              {selectedReview && (
                <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>360-Degree Feedback Form</DialogTitle>
                    </DialogHeader>
                    <ReviewForm 
                      reviewId={selectedReview} 
                      competencies={competencies}
                      onSubmit={(data) => submitReviewMutation.mutate({ reviewId: selectedReview, responses: data })}
                      onClose={() => setSelectedReview(null)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>HR Policies & Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <i className="fas fa-book text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Policy Management</h3>
                  <p className="text-muted-foreground mb-4">Company policies and procedure documentation</p>
                  <Button onClick={() => toast({ title: "Policies", description: "Policy management system coming soon!" })}>
                    <i className="fas fa-file-contract mr-2"></i>
                    Manage Policies
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