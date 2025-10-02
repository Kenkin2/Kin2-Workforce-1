import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Download, FileText, Calculator, TrendingUp, Users, Clock } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedTaxYear, setSelectedTaxYear] = useState("2024-25");
  const [selectedPayPeriod, setSelectedPayPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });

  // Fetch payroll summary
  const { data: payrollSummary, isLoading: loadingPayroll } = useQuery({
    queryKey: ["/api/reports/payroll-summary", dateRange.startDate, dateRange.endDate],
    queryFn: () => apiRequest("GET", `/api/reports/payroll-summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`).then(res => res.json()),
    enabled: isAuthenticated,
  });

  // Fetch payroll records
  const { data: payrollRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ["/api/payroll/records", selectedTaxYear],
    queryFn: () => apiRequest("GET", `/api/payroll/records?year=${selectedTaxYear}`).then(res => res.json()),
    enabled: isAuthenticated,
  });

  // Generate payroll mutation
  const generatePayrollMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      return apiRequest("POST", "/api/payroll/generate", data).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Payroll Generated",
        description: `Successfully generated ${data.recordsGenerated} payroll records`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/payroll-summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate payroll",
        variant: "destructive",
      });
    }
  });

  // Download HMRC CSV mutation
  const downloadHMRCMutation = useMutation({
    mutationFn: async (data: { taxYear: string; payPeriod: string }) => {
      const response = await apiRequest("POST", "/api/reports/hmrc-csv", data);
      const blob = await response.blob();
      return { blob, filename: `HMRC_FPS_${data.taxYear}_${data.payPeriod}.csv` };
    },
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Downloaded",
        description: "HMRC submission file downloaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download HMRC CSV",
        variant: "destructive",
      });
    }
  });

  const handleGeneratePayroll = () => {
    generatePayrollMutation.mutate(dateRange);
  };

  const handleDownloadHMRC = () => {
    downloadHMRCMutation.mutate({
      taxYear: selectedTaxYear,
      payPeriod: selectedPayPeriod
    });
  };

  const openPayslip = (workerId: string, payrollRecordId: string) => {
    window.open(`/api/payslips/${workerId}/${payrollRecordId}`, '_blank');
  };

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
      title="Advanced Reports"
      breadcrumbs={[{ label: "Analytics", href: "/analytics" }, { label: "Reports" }]}
    >
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Advanced Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate payroll reports, HMRC submissions, and payslips
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGeneratePayroll}
              disabled={generatePayrollMutation.isPending}
              className="shadow-lg"
              data-testid="button-generate-payroll"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {generatePayrollMutation.isPending ? "Generating..." : "Generate Payroll"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" data-testid="tab-summary">Summary</TabsTrigger>
            <TabsTrigger value="hmrc" data-testid="tab-hmrc">HMRC Reports</TabsTrigger>
            <TabsTrigger value="payslips" data-testid="tab-payslips">Payslips</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-lg transition-all duration-300 animate-slideIn">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {payrollSummary?.summary?.totalWorkers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Active this period</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 animate-slideIn [animation-delay:100ms]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    £{payrollSummary?.summary?.totalGrossPay?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">Before deductions</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 animate-slideIn [animation-delay:200ms]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    £{payrollSummary?.summary?.totalNetPay?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">After deductions</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 animate-slideIn [animation-delay:300ms]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {payrollSummary?.summary?.totalHoursWorked?.toFixed(0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total hours</p>
                </CardContent>
              </Card>
            </div>

            <Card className="animate-slideIn [animation-delay:400ms]">
              <CardHeader>
                <CardTitle>Period Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {payrollSummary?.workers && (
              <Card className="animate-slideIn [animation-delay:500ms]">
                <CardHeader>
                  <CardTitle>Worker Payroll Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payrollSummary.workers.map((worker: any, index: number) => (
                      <div 
                        key={worker.workerId}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors animate-slideIn"
                        style={{ animationDelay: `${600 + index * 100}ms` }}
                        data-testid={`row-worker-${worker.workerId}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{worker.workerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {worker.hoursWorked.toFixed(1)} hours • £{(worker.grossPay / worker.hoursWorked).toFixed(2)}/hr
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-green-600">£{worker.netPay.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            Gross: £{worker.grossPay.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hmrc" className="space-y-6">
            <Card className="animate-slideIn">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  HMRC Submissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax-year">Tax Year</Label>
                    <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
                      <SelectTrigger data-testid="select-tax-year">
                        <SelectValue placeholder="Select tax year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-25">2024-25</SelectItem>
                        <SelectItem value="2023-24">2023-24</SelectItem>
                        <SelectItem value="2022-23">2022-23</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pay-period">Pay Period</Label>
                    <Input
                      id="pay-period"
                      type="month"
                      value={selectedPayPeriod}
                      onChange={(e) => setSelectedPayPeriod(e.target.value)}
                      data-testid="input-pay-period"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownloadHMRC}
                    disabled={downloadHMRCMutation.isPending}
                    className="shadow-lg"
                    data-testid="button-download-hmrc"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadHMRCMutation.isPending ? "Generating..." : "Download FPS CSV"}
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">HMRC Submission Information</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• FPS (Full Payment Submission) reports must be submitted to HMRC on or before pay date</li>
                    <li>• CSV format is compatible with HMRC RTI (Real Time Information) system</li>
                    <li>• Includes tax, National Insurance, and pension contribution data</li>
                    <li>• Automatically calculates year-to-date figures for compliance</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {payrollRecords && (
              <Card className="animate-slideIn [animation-delay:200ms]">
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payrollRecords.slice(0, 5).map((record: any, index: number) => (
                      <div 
                        key={record.payrollRecord?.id || record.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-slideIn"
                        style={{ animationDelay: `${300 + index * 100}ms` }}
                        data-testid={`row-submission-${record.payrollRecord?.id || record.id}`}
                      >
                        <div>
                          <div className="font-medium">{record.worker?.firstName} {record.worker?.lastName}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.payrollRecord?.payPeriodStart ? format(new Date(record.payrollRecord.payPeriodStart), "MMM yyyy") : "N/A"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">£{parseFloat(record.payrollRecord?.netPay || record.netPay || "0").toFixed(2)}</div>
                          <Badge variant={record.payrollRecord?.hmrcReported ? "default" : "secondary"}>
                            {record.payrollRecord?.hmrcReported ? "Reported" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payslips" className="space-y-6">
            <Card className="animate-slideIn">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Payslip Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payrollRecords && (
                  <div className="space-y-3">
                    {payrollRecords.map((record: any, index: number) => (
                      <div 
                        key={record.payrollRecord?.id || record.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-slideIn"
                        style={{ animationDelay: `${100 + index * 50}ms` }}
                        data-testid={`row-payslip-${record.payrollRecord?.id || record.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{record.worker?.firstName} {record.worker?.lastName}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.payrollRecord?.payPeriodStart && record.payrollRecord?.payPeriodEnd ? 
                              `${format(new Date(record.payrollRecord.payPeriodStart), "dd MMM")} - ${format(new Date(record.payrollRecord.payPeriodEnd), "dd MMM yyyy")}` :
                              "N/A"}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <div className="font-bold text-green-600">£{parseFloat(record.payrollRecord?.netPay || record.netPay || "0").toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Net Pay</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={record.payrollRecord?.payslipGenerated ? "default" : "secondary"}>
                            {record.payrollRecord?.payslipGenerated ? "Generated" : "Pending"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPayslip(record.worker?.id || record.workerId, record.payrollRecord?.id || record.id)}
                            data-testid={`button-view-payslip-${record.payrollRecord?.id || record.id}`}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="animate-slideIn">
                <CardHeader>
                  <CardTitle>Tax Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tax Deducted</span>
                      <span className="font-bold">£{payrollSummary?.summary?.totalTaxDeducted?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total NI Deducted</span>
                      <span className="font-bold">£{payrollSummary?.summary?.totalNIDeducted?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pension Contributions</span>
                      <span className="font-bold">£{payrollSummary?.summary?.totalPensionDeducted?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-medium">Total Deductions</span>
                      <span className="font-bold text-red-600">
                        £{((payrollSummary?.summary?.totalTaxDeducted || 0) + 
                          (payrollSummary?.summary?.totalNIDeducted || 0) + 
                          (payrollSummary?.summary?.totalPensionDeducted || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slideIn [animation-delay:200ms]">
                <CardHeader>
                  <CardTitle>Workforce Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Hourly Rate</span>
                      <span className="font-bold">£{payrollSummary?.summary?.averageHourlyRate?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Hours</span>
                      <span className="font-bold">{payrollSummary?.summary?.totalHoursWorked?.toFixed(0) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Hours per Worker</span>
                      <span className="font-bold">
                        {payrollSummary?.summary?.totalWorkers ? 
                          (payrollSummary.summary.totalHoursWorked / payrollSummary.summary.totalWorkers).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-medium">Period</span>
                      <span className="font-bold">
                        {payrollSummary?.periodStart} - {payrollSummary?.periodEnd}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
