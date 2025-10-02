import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  PoundSterling, 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Mail,
  Clock,
  BanknoteIcon
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  universalCredit: {
    status: string;
    monthlyEntitlement: number;
    nextPayment: string;
    workCoach: string;
  };
  totalMonthlyBenefits: number;
  recentPayments: number;
  unreadMessages: number;
  activeClaims: number;
  complianceScore: number;
}

interface Payment {
  id: string;
  benefitType: string;
  paymentAmount: number;
  paymentDate: string;
  status: string;
  paymentReference: string;
}

interface Communication {
  id: string;
  communicationType: string;
  subject: string;
  message: string;
  priority: string;
  sentAt: string;
  isRead: boolean;
  requiresAction: boolean;
}

interface Report {
  id: string;
  reportType: string;
  title: string;
  description: string;
  summary: any;
  createdAt: string;
  data: any;
}

interface UCClaim {
  id: string;
  universalCreditNumber: string;
  claimStatus: string;
  monthlyEntitlement: number;
  workCoachName?: string;
  nextAssessmentDate?: string;
}

interface Benefit {
  id: string;
  benefitType: string;
  claimStatus: string;
  monthlyAmount: number;
}

export default function GovernmentReports() {
  const [earningsInput, setEarningsInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dashboard data
  const { data: dashboardStats, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/government/dashboard"],
  });

  // Universal Credit claim
  const { data: ucClaim } = useQuery<UCClaim>({
    queryKey: ["/api/government/universal-credit"],
  });

  // Benefits
  const { data: benefits } = useQuery<Benefit[]>({
    queryKey: ["/api/government/benefits"],
  });

  // Payment history
  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/government/payments"],
  });

  // Communications
  const { data: communications } = useQuery<Communication[]>({
    queryKey: ["/api/government/communications"],
  });

  // Sync with government APIs
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/government/sync"),
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Successfully synchronized with government systems",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/government/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate reports mutations
  const generateUCSummary = useMutation({
    mutationFn: () => apiRequest("POST", "/api/government/reports/uc-summary"),
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Universal Credit summary report has been created",
      });
    },
  });

  const generateBenefitBreakdown = useMutation({
    mutationFn: () => apiRequest("POST", "/api/government/reports/benefit-breakdown"),
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Benefit breakdown report has been created",
      });
    },
  });

  const generateEarningsImpact = useMutation({
    mutationFn: (earnings: number) => 
      apiRequest("POST", "/api/government/reports/earnings-impact", { earnings }),
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Earnings impact report has been created",
      });
    },
  });

  // Mark communication as read
  const markReadMutation = useMutation({
    mutationFn: (commId: string) => 
      apiRequest("PATCH", `/api/government/communications/${commId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/government/communications"] });
    },
  });

  const stats = dashboardStats as DashboardStats;

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "denied": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="title-government-reports">
              Government & Social Benefits
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your Universal Credit claim, benefits, and government communications
            </p>
          </div>
          <Button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-government"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync with Government
          </Button>
        </div>

        {/* Dashboard Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-uc-status">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Universal Credit</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      £{stats.universalCredit.monthlyEntitlement}
                    </p>
                    <Badge className={getStatusColor(stats.universalCredit.status)}>
                      {stats.universalCredit.status}
                    </Badge>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-monthly-benefits">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Benefits</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      £{stats.totalMonthlyBenefits}
                    </p>
                    <p className="text-sm text-gray-500">{stats.activeClaims} active claims</p>
                  </div>
                  <PoundSterling className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-payments">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Payments (90d)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      £{stats.recentPayments}
                    </p>
                  </div>
                  <BanknoteIcon className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-compliance-score">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.complianceScore}%
                    </p>
                    <Progress value={stats.complianceScore} className="mt-2" />
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="communications" data-testid="tab-communications">Messages</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">Tools</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Universal Credit Details */}
              {ucClaim && (
                <Card data-testid="card-uc-details">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Universal Credit Claim
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Claim Number</Label>
                        <p className="font-mono" data-testid="text-uc-number">{ucClaim.universalCreditNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Status</Label>
                        <Badge className={getStatusColor(ucClaim.claimStatus)}>
                          {ucClaim.claimStatus}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Monthly Entitlement</Label>
                        <p className="text-lg font-semibold" data-testid="text-entitlement">
                          £{ucClaim.monthlyEntitlement}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Work Coach</Label>
                        <p data-testid="text-work-coach">{ucClaim.workCoachName || "Not assigned"}</p>
                      </div>
                    </div>
                    {ucClaim.nextAssessmentDate && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Next Assessment</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {format(new Date(ucClaim.nextAssessmentDate), "PPP")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Active Benefits */}
              <Card data-testid="card-active-benefits">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Active Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {benefits && benefits.length > 0 ? (
                    <div className="space-y-3">
                      {benefits.filter((b: Benefit) => b.claimStatus === "active").map((benefit: Benefit) => (
                        <div key={benefit.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium" data-testid={`text-benefit-${benefit.id}`}>
                              {benefit.benefitType}
                            </p>
                            <p className="text-sm text-gray-500">
                              £{benefit.monthlyAmount}/month
                            </p>
                          </div>
                          <Badge className={getStatusColor(benefit.claimStatus)}>
                            {benefit.claimStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No active benefits found</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Unread Messages Alert */}
            {stats && stats.unreadMessages > 0 && (
              <Card className="border-orange-200 dark:border-orange-800" data-testid="card-unread-messages">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium">You have {stats.unreadMessages} unread messages</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Check the Messages tab for important updates from government services
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card data-testid="card-payment-history">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PoundSterling className="w-5 h-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Recent benefit payments and transaction details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment: Payment) => (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`payment-${payment.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium" data-testid={`text-payment-type-${payment.id}`}>
                                {payment.benefitType}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(payment.paymentDate), "PPP")}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            Ref: {payment.paymentReference}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600" data-testid={`text-payment-amount-${payment.id}`}>
                            £{payment.paymentAmount}
                          </p>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No payment history found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-6">
            <Card data-testid="card-communications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Government Communications
                </CardTitle>
                <CardDescription>
                  Messages and updates from government services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {communications && communications.length > 0 ? (
                  <div className="space-y-3">
                    {communications.map((comm: Communication) => (
                      <div 
                        key={comm.id} 
                        className={`p-4 border rounded-lg ${!comm.isRead ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : ''}`}
                        data-testid={`communication-${comm.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="font-medium" data-testid={`text-comm-subject-${comm.id}`}>
                                {comm.subject}
                              </span>
                              <Badge className={getPriorityColor(comm.priority)}>
                                {comm.priority}
                              </Badge>
                              {!comm.isRead && (
                                <Badge variant="secondary">New</Badge>
                              )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2" data-testid={`text-comm-message-${comm.id}`}>
                              {comm.message}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(comm.sentAt), "PPp")}
                              </span>
                              {comm.requiresAction && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  Action Required
                                </span>
                              )}
                            </div>
                          </div>
                          {!comm.isRead && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markReadMutation.mutate(comm.id)}
                              data-testid={`button-mark-read-${comm.id}`}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No communications found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card data-testid="card-uc-summary-report">
                <CardHeader>
                  <CardTitle className="text-lg">Universal Credit Summary</CardTitle>
                  <CardDescription>
                    Comprehensive overview of your UC claim and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => generateUCSummary.mutate()}
                    disabled={generateUCSummary.isPending}
                    className="w-full"
                    data-testid="button-generate-uc-summary"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {generateUCSummary.isPending ? "Generating..." : "Generate Report"}
                  </Button>
                </CardContent>
              </Card>

              <Card data-testid="card-benefit-breakdown-report">
                <CardHeader>
                  <CardTitle className="text-lg">Benefit Breakdown</CardTitle>
                  <CardDescription>
                    Detailed analysis of all benefit claims and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => generateBenefitBreakdown.mutate()}
                    disabled={generateBenefitBreakdown.isPending}
                    className="w-full"
                    data-testid="button-generate-benefit-breakdown"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {generateBenefitBreakdown.isPending ? "Generating..." : "Generate Report"}
                  </Button>
                </CardContent>
              </Card>

              <Card data-testid="card-earnings-impact-report">
                <CardHeader>
                  <CardTitle className="text-lg">Earnings Impact</CardTitle>
                  <CardDescription>
                    Calculate how work affects your benefit entitlements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="earnings-input">Monthly Earnings (£)</Label>
                    <Input
                      id="earnings-input"
                      type="number"
                      placeholder="0"
                      value={earningsInput}
                      onChange={(e) => setEarningsInput(e.target.value)}
                      data-testid="input-earnings"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (earningsInput) {
                        generateEarningsImpact.mutate(parseFloat(earningsInput));
                      }
                    }}
                    disabled={generateEarningsImpact.isPending || !earningsInput}
                    className="w-full"
                    data-testid="button-generate-earnings-impact"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {generateEarningsImpact.isPending ? "Calculating..." : "Calculate Impact"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-government-sync">
                <CardHeader>
                  <CardTitle>Government API Sync</CardTitle>
                  <CardDescription>
                    Synchronize your data with government systems for the latest updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    className="w-full"
                    data-testid="button-sync-apis"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    {syncMutation.isPending ? "Syncing..." : "Sync Now"}
                  </Button>
                </CardContent>
              </Card>

              <Card data-testid="card-benefits-calculator">
                <CardHeader>
                  <CardTitle>Benefits Calculator</CardTitle>
                  <CardDescription>
                    Calculate potential benefit entitlements and work incentives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled data-testid="button-benefits-calculator">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}