import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, BookOpen, Award, Target, Users, TrendingUp, CheckCircle, Clock, Star, ExternalLink, PlayCircle, FileText, Trophy, Brain } from "lucide-react";
import type { Course, CourseCompletion, Quiz, Certificate } from "@shared/schema";

// Form schemas
const qualificationSchema = z.object({
  qualificationName: z.string().min(1, "Qualification name is required"),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
  dateObtained: z.string().min(1, "Date obtained is required"),
  expiryDate: z.string().optional(),
  verificationDocuments: z.string().optional(),
});

const programmeApplicationSchema = z.object({
  personalStatement: z.string().min(50, "Personal statement must be at least 50 characters"),
  relevantExperience: z.string().optional(),
  careerGoals: z.string().optional(),
});

type QualificationForm = z.infer<typeof qualificationSchema>;
type ProgrammeApplicationForm = z.infer<typeof programmeApplicationSchema>;

export default function Learning() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedProgramme, setSelectedProgramme] = useState<any>(null);
  const [selectedPathway, setSelectedPathway] = useState<any>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [qualificationDialogOpen, setQualificationDialogOpen] = useState(false);
  const [programmeDialogOpen, setProgrammeDialogOpen] = useState(false);
  const [pathwayDialogOpen, setPathwayDialogOpen] = useState(false);

  // Form hooks
  const qualificationForm = useForm<QualificationForm>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: {
      qualificationName: "",
      issuingAuthority: "",
      dateObtained: "",
      expiryDate: "",
      verificationDocuments: "",
    },
  });

  const programmeForm = useForm<ProgrammeApplicationForm>({
    resolver: zodResolver(programmeApplicationSchema),
    defaultValues: {
      personalStatement: "",
      relevantExperience: "",
      careerGoals: "",
    },
  });

  // Mutations
  const addQualification = useMutation({
    mutationFn: async (data: QualificationForm) => {
      const response = await apiRequest("POST", "/api/education/qualifications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Qualification Added",
        description: "Your qualification has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/education/qualifications"] });
      setQualificationDialogOpen(false);
      qualificationForm.reset();
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
        description: "Failed to add qualification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const applyToProgramme = useMutation({
    mutationFn: async ({ programmeId, data }: { programmeId: string; data: ProgrammeApplicationForm }) => {
      const response = await apiRequest("POST", `/api/education/programmes/${programmeId}/apply`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your programme application has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/education/participations"] });
      setProgrammeDialogOpen(false);
      programmeForm.reset();
    },
    onError: (error: any) => {
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
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const enrollInPathway = useMutation({
    mutationFn: async (pathwayId: string) => {
      const response = await apiRequest("POST", `/api/education/pathways/${pathwayId}/enroll`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the learning pathway.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/education/pathway-progress"] });
      setPathwayDialogOpen(false);
    },
    onError: (error: any) => {
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
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in pathway. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/complete`, {
        score: 95
      });
      return response.json();
    },
    onSuccess: (data, courseId) => {
      const course = courses?.find(c => c.id === courseId);
      toast({
        title: "Course Completed!",
        description: `You've earned ${course?.karmaReward || 0} KarmaCoins for completing "${course?.title}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setCourseDialogOpen(false);
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
        description: "Failed to complete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const enrollInCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/enroll`, {});
      return response.json();
    },
    onSuccess: (data, courseId) => {
      const course = courses?.find(c => c.id === courseId);
      toast({
        title: "Enrolled Successfully!",
        description: `You have been enrolled in "${course?.title}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/learning/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
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
        title: "Enrollment Failed",
        description: "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateCertificate = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/certificate`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Certificate Generated!",
        description: "Your completion certificate has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
    onError: (error: any) => {
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
        title: "Certificate Generation Failed",
        description: error.message || "Failed to generate certificate. Please try again.",
        variant: "destructive",
      });
    },
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

  // Data queries
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated,
  });

  const { data: qualifications, isLoading: qualificationsLoading } = useQuery<any[]>({
    queryKey: ["/api/education/qualifications"],
    enabled: isAuthenticated,
  });

  const { data: programmes, isLoading: programmesLoading } = useQuery<any[]>({
    queryKey: ["/api/education/programmes"],
    enabled: isAuthenticated,
  });

  const { data: pathways, isLoading: pathwaysLoading } = useQuery<any[]>({
    queryKey: ["/api/education/pathways"],
    enabled: isAuthenticated,
  });

  const { data: userSkills, isLoading: skillsLoading } = useQuery<any[]>({
    queryKey: ["/api/education/user-skills"],
    enabled: isAuthenticated,
  });

  const { data: developmentPlans, isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ["/api/education/development-plans"],
    enabled: isAuthenticated,
  });

  const { data: participations, isLoading: participationsLoading } = useQuery<any[]>({
    queryKey: ["/api/education/participations"],
    enabled: isAuthenticated,
  });

  // New LMS queries
  const { data: learningStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/learning/stats"],
    enabled: isAuthenticated,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery<any[]>({
    queryKey: ["/api/learning/achievements"],
    enabled: isAuthenticated,
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "secondary";
      case "intermediate": return "default";
      case "advanced": return "destructive";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "pending": return "outline";
      case "verified": return "default";
      default: return "outline";
    }
  };

  return (
    <AppLayout 
      title="Education & Development"
      breadcrumbs={[{ label: "Human Resources", href: "/hr-management" }, { label: "Learning" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Education & Development Hub</h2>
            <p className="text-muted-foreground">Comprehensive learning, qualifications, and career development</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-secondary to-primary text-white px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span className="font-semibold" data-testid="text-karma-coins">2,847 KarmaCoins</span>
              </div>
            </div>
            <Button data-testid="button-my-certificates">
              <Award className="h-4 w-4 mr-2" />
              My Certificates
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
            <TabsTrigger value="programmes">Government Programmes</TabsTrigger>
            <TabsTrigger value="pathways">Learning Pathways</TabsTrigger>
            <TabsTrigger value="skills">Skills & Development</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{courses?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Courses Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{learningStats?.coursesCompleted || 0}</p>
                      <p className="text-sm text-muted-foreground">Courses Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{certificates?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Certificates Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{learningStats?.totalPoints || 0}</p>
                      <p className="text-sm text-muted-foreground">Learning Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Overall Completion</p>
                        <p className="text-sm text-muted-foreground">
                          {learningStats?.coursesCompleted || 0} of {courses?.length || 0} courses completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          {(courses?.length || 0) > 0 ? Math.round(((learningStats?.coursesCompleted || 0) / (courses?.length || 1)) * 100) : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Complete</p>
                      </div>
                    </div>
                    <Progress 
                      value={(courses?.length || 0) > 0 ? ((learningStats?.coursesCompleted || 0) / (courses?.length || 1)) * 100 : 0} 
                      className="w-full" 
                    />
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{learningStats?.totalLessonsCompleted || 0}</p>
                        <p className="text-xs text-muted-foreground">Lessons Completed</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{learningStats?.averageQuizScore || 0}%</p>
                        <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements && achievements.length > 0 ? (
                      achievements.slice(0, 3).map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            +{achievement.points} pts
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">No achievements yet</p>
                        <p className="text-xs text-muted-foreground">Complete courses to earn achievements!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : courses && courses.length > 0 ? (
                courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow" data-testid={`card-course-${course.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg" data-testid={`text-course-title-${course.id}`}>
                            {course.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={getDifficultyBadgeVariant(course.difficulty)} data-testid={`badge-difficulty-${course.id}`}>
                              {course.difficulty}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Award className="h-3 w-3 mr-1 text-secondary" />
                              <span data-testid={`text-karma-reward-${course.id}`}>{course.karmaReward} KC</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4" data-testid={`text-course-description-${course.id}`}>
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span data-testid={`text-course-duration-${course.id}`}>
                          <Clock className="h-3 w-3 mr-1 inline" />
                          {course.duration} minutes
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          data-testid={`button-start-course-${course.id}`}
                          onClick={() => enrollInCourse.mutate(course.id)}
                          disabled={enrollInCourse.isPending}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          {enrollInCourse.isPending ? "Enrolling..." : "Start Course"}
                        </Button>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            data-testid={`button-view-lessons-${course.id}`}
                          >
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Lessons
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            data-testid={`button-view-quizzes-${course.id}`}
                          >
                            <Brain className="h-3 w-3 mr-1" />
                            Quizzes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No courses available</h3>
                        <p className="text-muted-foreground">Check back later for new learning opportunities</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Certificates</h3>
              <div className="flex space-x-2">
                <Button variant="outline" data-testid="button-verify-certificate">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Certificate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificatesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : certificates && certificates.length > 0 ? (
                certificates.map((certificate) => (
                  <Card key={certificate.id} className="hover:shadow-lg transition-shadow" data-testid={`card-certificate-${certificate.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg" data-testid={`text-certificate-course-${certificate.id}`}>
                            Course Certificate
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="default" data-testid={`badge-certificate-status-${certificate.id}`}>
                              {certificate.isRevoked ? 'Revoked' : 'Valid'}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Star className="h-3 w-3 mr-1 text-yellow-500" />
                              <span data-testid={`text-certificate-score-${certificate.id}`}>
                                Certificate ID: {certificate.certificateNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Award className="h-8 w-8 text-secondary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Issue Date:</span>
                          <span data-testid={`text-certificate-date-${certificate.id}`}>
                            {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Certificate ID:</span>
                          <span className="font-mono text-xs" data-testid={`text-certificate-verification-${certificate.id}`}>
                            {certificate.verificationCode}
                          </span>
                        </div>
                        {certificate.validUntil && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Valid Until:</span>
                            <span data-testid={`text-certificate-expiry-${certificate.id}`}>
                              {certificate.validUntil ? new Date(certificate.validUntil).toLocaleDateString() : 'No expiry'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        <Button className="w-full" variant="outline" data-testid={`button-download-certificate-${certificate.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button 
                          className="w-full" 
                          variant="secondary" 
                          data-testid={`button-share-certificate-${certificate.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Share Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No certificates yet</h3>
                        <p className="text-muted-foreground mb-4">Complete courses to earn certificates</p>
                        <Button onClick={() => {
                          // Switch to courses tab
                          const coursesTab = document.querySelector('[value="courses"]') as HTMLElement;
                          coursesTab?.click();
                        }}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Browse Courses
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Qualifications Tab */}
          <TabsContent value="qualifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Qualifications</h3>
              <Dialog open={qualificationDialogOpen} onOpenChange={setQualificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-qualification">
                    <Award className="h-4 w-4 mr-2" />
                    Add Qualification
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Qualification</DialogTitle>
                    <DialogDescription>
                      Add a new qualification to your profile
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...qualificationForm}>
                    <form onSubmit={qualificationForm.handleSubmit((data) => addQualification.mutate(data))} className="space-y-4">
                      <FormField
                        control={qualificationForm.control}
                        name="qualificationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualification Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Level 3 Certificate in Business Administration" data-testid="input-qualification-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={qualificationForm.control}
                        name="issuingAuthority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuing Authority</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., City & Guilds, BTEC, University" data-testid="input-issuing-authority" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={qualificationForm.control}
                        name="dateObtained"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Obtained</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-date-obtained" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={qualificationForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-expiry-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={qualificationForm.control}
                        name="verificationDocuments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Documents (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Upload or describe verification documents" data-testid="textarea-verification-docs" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setQualificationDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addQualification.isPending} data-testid="button-submit-qualification">
                          {addQualification.isPending ? "Adding..." : "Add Qualification"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualificationsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : qualifications && qualifications.length > 0 ? (
                qualifications.map((qualification) => (
                  <Card key={qualification.id} data-testid={`card-qualification-${qualification.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{qualification.qualificationName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{qualification.issuingAuthority}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(qualification.verificationStatus)}>
                          {qualification.verificationStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Obtained: {new Date(qualification.dateObtained).toLocaleDateString()}
                        </div>
                        {qualification.expiryDate && (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            Expires: {new Date(qualification.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No qualifications added</h3>
                        <p className="text-muted-foreground">Add your qualifications to showcase your expertise</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Government Programmes Tab */}
          <TabsContent value="programmes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Government Training Programmes</h3>
                <p className="text-sm text-muted-foreground">Apprenticeships, training schemes, and funded education</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programmesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : programmes && programmes.length > 0 ? (
                programmes.map((programme) => (
                  <Card key={programme.id} className="hover:shadow-lg transition-shadow" data-testid={`card-programme-${programme.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{programme.programmeName}</CardTitle>
                          <Badge variant="secondary" className="mt-2">{programme.programmeType}</Badge>
                        </div>
                        {programme.fundingAmount && (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">£{programme.fundingAmount}</p>
                            <p className="text-xs text-muted-foreground">Funding</p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{programme.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          Level: {programme.qualificationLevel}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Apply by: {new Date(programme.applicationDeadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          Duration: {programme.duration} months
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => {
                          setSelectedProgramme(programme);
                          setProgrammeDialogOpen(true);
                        }}
                        data-testid={`button-apply-programme-${programme.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No programmes available</h3>
                        <p className="text-muted-foreground">Check back for new government training opportunities</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Programme Application Dialog */}
            <Dialog open={programmeDialogOpen} onOpenChange={setProgrammeDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Apply to {selectedProgramme?.programmeName}</DialogTitle>
                  <DialogDescription>
                    Complete your application for this government programme
                  </DialogDescription>
                </DialogHeader>
                <Form {...programmeForm}>
                  <form onSubmit={programmeForm.handleSubmit((data) => {
                    if (selectedProgramme) {
                      applyToProgramme.mutate({ programmeId: selectedProgramme.id, data });
                    }
                  })} className="space-y-4">
                    <FormField
                      control={programmeForm.control}
                      name="personalStatement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Statement</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} placeholder="Why are you interested in this programme? What are your career goals?" data-testid="textarea-personal-statement" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={programmeForm.control}
                      name="relevantExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relevant Experience (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Describe any relevant work experience or qualifications" data-testid="textarea-relevant-experience" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={programmeForm.control}
                      name="careerGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Career Goals (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="What are your long-term career aspirations?" data-testid="textarea-career-goals" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setProgrammeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={applyToProgramme.isPending} data-testid="button-submit-application">
                        {applyToProgramme.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Learning Pathways Tab */}
          <TabsContent value="pathways" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Learning Pathways</h3>
                <p className="text-sm text-muted-foreground">Structured career development paths</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pathwaysLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : pathways && pathways.length > 0 ? (
                pathways.map((pathway) => (
                  <Card key={pathway.id} className="hover:shadow-lg transition-shadow" data-testid={`card-pathway-${pathway.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{pathway.pathwayName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{pathway.industry}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={getDifficultyBadgeVariant(pathway.difficulty)}>
                              {pathway.difficulty}
                            </Badge>
                            <Badge variant="outline">{pathway.careerLevel}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{pathway.estimatedDuration}</p>
                          <p className="text-xs text-muted-foreground">Duration</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{pathway.description}</p>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium">Learning Steps:</p>
                        <div className="space-y-1">
                          {pathway.learningSteps && pathway.learningSteps.slice(0, 3).map((step: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-muted-foreground">
                              <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                              {step}
                            </div>
                          ))}
                          {pathway.learningSteps && pathway.learningSteps.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{pathway.learningSteps.length - 3} more steps</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setSelectedPathway(pathway);
                          setPathwayDialogOpen(true);
                        }}
                        data-testid={`button-enroll-pathway-${pathway.id}`}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Enroll in Pathway
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No learning pathways available</h3>
                        <p className="text-muted-foreground">Check back for new career development paths</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Pathway Enrollment Dialog */}
            <Dialog open={pathwayDialogOpen} onOpenChange={setPathwayDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll in {selectedPathway?.pathwayName}</DialogTitle>
                  <DialogDescription>
                    Start your learning journey with this structured pathway
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Industry:</strong> {selectedPathway?.industry}</p>
                    <p className="text-sm"><strong>Career Level:</strong> {selectedPathway?.careerLevel}</p>
                    <p className="text-sm"><strong>Duration:</strong> {selectedPathway?.estimatedDuration}</p>
                    <p className="text-sm"><strong>Difficulty:</strong> {selectedPathway?.difficulty}</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setPathwayDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedPathway) {
                          enrollInPathway.mutate(selectedPathway.id);
                        }
                      }}
                      disabled={enrollInPathway.isPending}
                      data-testid="button-confirm-enrollment"
                    >
                      {enrollInPathway.isPending ? "Enrolling..." : "Confirm Enrollment"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Skills & Development Tab */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Assessment</CardTitle>
                  <CardDescription>Your verified skills and competencies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {skillsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-2 bg-muted rounded w-full"></div>
                        </div>
                      ))
                    ) : userSkills && userSkills.length > 0 ? (
                      userSkills.slice(0, 5).map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{skill.skillName}</p>
                            <p className="text-xs text-muted-foreground">{skill.skillCategory}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${i < skill.competencyLevel ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            {skill.isEndorsed && (
                              <Badge variant="default" className="text-xs">Endorsed</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No skills assessed yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Development Plans */}
              <Card>
                <CardHeader>
                  <CardTitle>Development Plans</CardTitle>
                  <CardDescription>Your personal development roadmap</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plansLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-2 bg-muted rounded w-full"></div>
                        </div>
                      ))
                    ) : developmentPlans && developmentPlans.length > 0 ? (
                      developmentPlans.map((plan) => (
                        <div key={plan.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{plan.planName}</p>
                            <Badge variant={getStatusBadgeVariant(plan.status)}>{plan.status}</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{plan.progressPercentage}%</span>
                            </div>
                            <Progress value={plan.progressPercentage} className="w-full h-2" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Target: {new Date(plan.targetCompletionDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No development plans created</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Participations */}
            {participations && participations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Programme Participations</CardTitle>
                  <CardDescription>Your current programme enrollments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participations.map((participation) => (
                      <div key={participation.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{participation.programmeName}</p>
                          <Badge variant={getStatusBadgeVariant(participation.status)}>{participation.status}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{participation.progressPercentage}%</span>
                          </div>
                          <Progress value={participation.progressPercentage} className="w-full" />
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(participation.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}