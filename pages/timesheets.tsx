import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Clock, CalendarDays, TrendingUp, Check, X } from "lucide-react";
import type { Timesheet } from "@shared/schema";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function Timesheets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', id: string } | null>(null);

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

  const { data: pendingTimesheets, isLoading: timesheetsLoading } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets/pending"],
    enabled: isAuthenticated,
  });

  const approveTimesheetMutation = useMutation({
    mutationFn: async (timesheetId: string) => {
      const response = await apiRequest("PATCH", `/api/timesheets/${timesheetId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Timesheet approved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets/pending"] });
      setConfirmAction(null);
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
        description: "Failed to approve timesheet.",
        variant: "destructive",
      });
    },
  });

  const rejectTimesheetMutation = useMutation({
    mutationFn: async (timesheetId: string) => {
      const response = await apiRequest("PATCH", `/api/timesheets/${timesheetId}/reject`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Timesheet rejected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets/pending"] });
      setConfirmAction(null);
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
        description: "Failed to reject timesheet.",
        variant: "destructive",
      });
    },
  });

  const handleApproveTimesheet = (timesheetId: string) => {
    setConfirmAction({ type: 'approve', id: timesheetId });
  };

  const handleRejectTimesheet = (timesheetId: string) => {
    setConfirmAction({ type: 'reject', id: timesheetId });
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'approve') {
      approveTimesheetMutation.mutate(confirmAction.id);
    } else {
      rejectTimesheetMutation.mutate(confirmAction.id);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center" data-testid="loader-timesheets">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <AppLayout 
      title="Timesheets"
      breadcrumbs={[{ label: "Management", href: "/dashboard" }, { label: "Timesheets" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Timesheet Management</h2>
            <p className="text-muted-foreground" data-testid="text-page-description">Review and approve worker timesheets</p>
          </div>
          <Button data-testid="button-export-timesheets" onClick={() => toast({ title: "Export", description: "Timesheet export feature coming soon!" })}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-pending-approval">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {pendingTimesheets?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-pending-description">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-week-hours">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week Hours</CardTitle>
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-week-hours">247</div>
              <p className="text-xs text-muted-foreground" data-testid="text-week-hours-change">
                +12% from last week
              </p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-average-hours">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-hours">8.2</div>
              <p className="text-xs text-muted-foreground" data-testid="text-average-hours-description">
                Per worker per day
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Timesheets Table */}
        <Card data-testid="card-timesheets-table">
          <CardHeader>
            <CardTitle data-testid="text-timesheets-table-title">Pending Timesheets</CardTitle>
          </CardHeader>
          <CardContent>
            {timesheetsLoading ? (
              <div className="flex items-center justify-center h-32" data-testid="loader-timesheets-table">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : pendingTimesheets && pendingTimesheets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id} data-testid={`row-timesheet-${timesheet.id}`}>
                      <TableCell className="font-medium" data-testid={`text-worker-${timesheet.id}`}>
                        Worker ID: {timesheet.workerId}
                      </TableCell>
                      <TableCell data-testid={`text-clock-in-${timesheet.id}`}>
                        {timesheet.clockIn ? new Date(timesheet.clockIn).toLocaleString() : "Not clocked in"}
                      </TableCell>
                      <TableCell data-testid={`text-clock-out-${timesheet.id}`}>
                        {timesheet.clockOut ? new Date(timesheet.clockOut).toLocaleString() : "Not clocked out"}
                      </TableCell>
                      <TableCell data-testid={`text-total-hours-${timesheet.id}`}>
                        {timesheet.clockIn && timesheet.clockOut 
                          ? ((new Date(timesheet.clockOut).getTime() - new Date(timesheet.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
                          : "0"
                        } hrs
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(timesheet.status)} data-testid={`badge-timesheet-status-${timesheet.id}`}>
                          {timesheet.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => handleApproveTimesheet(timesheet.id)}
                            disabled={approveTimesheetMutation.isPending}
                            data-testid={`button-approve-timesheet-${timesheet.id}`}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {approveTimesheetMutation.isPending ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleRejectTimesheet(timesheet.id)}
                            disabled={rejectTimesheetMutation.isPending}
                            data-testid={`button-reject-timesheet-${timesheet.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            {rejectTimesheetMutation.isPending ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12" data-testid="empty-state-timesheets">
                <Clock className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-empty-title">No pending timesheets</h3>
                <p className="text-muted-foreground" data-testid="text-empty-description">All timesheets have been reviewed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.type === 'approve' ? 'Approve Timesheet' : 'Reject Timesheet'}
        description={
          confirmAction?.type === 'approve'
            ? 'Are you sure you want to approve this timesheet? This will mark it as approved and process payment.'
            : 'Are you sure you want to reject this timesheet? This action will notify the worker and they may need to resubmit.'
        }
        confirmText={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmAction?.type === 'reject' ? 'destructive' : 'default'}
        onConfirm={executeConfirmedAction}
        isLoading={approveTimesheetMutation.isPending || rejectTimesheetMutation.isPending}
        data-testid="dialog-confirm-timesheet-action"
      />
    </AppLayout>
  );
}
