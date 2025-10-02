import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PieChart, FileText, PoundSterling, Receipt, Percent, TrendingUp, Gauge, Plus, Banknote, Calculator, BarChart3, Scale, Book } from "lucide-react";

export default function FinanceManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

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
      title="Finance Management"
      breadcrumbs={[{ label: "Operations", href: "/operations-management" }, { label: "Finance Management" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Financial Management</h2>
            <p className="text-muted-foreground">Accounting, invoicing, and financial planning</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-financial-reports" onClick={() => toast({ title: "Financial Reports", description: "Comprehensive financial reporting coming soon!" })}>
              <PieChart className="mr-2 h-4 w-4" />
              Financial Reports
            </Button>
            <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-invoice">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Client name..." data-testid="input-invoice-client" />
                  <Input placeholder="Amount..." data-testid="input-invoice-amount" />
                  <Input placeholder="Due date..." data-testid="input-invoice-due-date" />
                  <Button onClick={() => {
                    toast({ title: "Success", description: "Invoice created successfully!" });
                    setIsCreateInvoiceOpen(false);
                  }} className="w-full">
                    Create Invoice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">£124,750</div>
              <p className="text-xs text-muted-foreground">+15.2% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">£23,480</div>
              <p className="text-xs text-muted-foreground">12 invoices pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">£45,320</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">63.7%</div>
              <p className="text-xs text-muted-foreground">Above target</p>
            </CardContent>
          </Card>
        </div>

        {/* Finance Management Interface */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" data-testid="tab-finance-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="invoicing" data-testid="tab-invoicing">Invoicing</TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
            <TabsTrigger value="budgeting" data-testid="tab-budgeting">Budgeting</TabsTrigger>
            <TabsTrigger value="accounting" data-testid="tab-accounting">Accounting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Financial Dashboard</h3>
                  <p className="text-muted-foreground mb-4">Real-time financial insights and KPIs</p>
                  <Button onClick={() => toast({ title: "Financial Dashboard", description: "Advanced financial analytics coming soon!" })}>
                    <Gauge className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoicing">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Invoice Management</h3>
                  <p className="text-muted-foreground mb-4">Create, send, and track invoices</p>
                  <Button onClick={() => toast({ title: "Invoicing", description: "Advanced invoicing system coming soon!" })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Manage Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Expense Management</h3>
                  <p className="text-muted-foreground mb-4">Track and approve business expenses</p>
                  <Button onClick={() => toast({ title: "Expenses", description: "Expense management system coming soon!" })}>
                    <Banknote className="mr-2 h-4 w-4" />
                    Manage Expenses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="budgeting">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Budget Planning</h3>
                  <p className="text-muted-foreground mb-4">Financial planning and budget management</p>
                  <Button onClick={() => toast({ title: "Budgeting", description: "Budget planning tools coming soon!" })}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Manage Budgets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accounting">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Scale className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Accounting</h3>
                  <p className="text-muted-foreground mb-4">General ledger and financial statements</p>
                  <Button onClick={() => toast({ title: "Accounting", description: "Full accounting system coming soon!" })}>
                    <Book className="mr-2 h-4 w-4" />
                    View Accounts
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