import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Clock, DollarSign, AlertTriangle, 
  Calendar, Target, Activity 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SchedulingAnalytics() {
  // Fetch scheduling analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/scheduling/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scheduling/analytics');
      return response.json();
    }
  });

  // Fetch worker utilization
  const { data: utilization } = useQuery({
    queryKey: ['/api/scheduling/utilization'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/scheduling/utilization');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Shifts</p>
                <p className="text-2xl font-bold" data-testid="metric-total-shifts">
                  {analytics?.totalShifts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Workers</p>
                <p className="text-2xl font-bold" data-testid="metric-active-workers">
                  {analytics?.activeWorkers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Fill Rate</p>
                <p className="text-2xl font-bold" data-testid="metric-fill-rate">
                  {analytics?.fillRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Weekly Cost</p>
                <p className="text-2xl font-bold" data-testid="metric-weekly-cost">
                  ${analytics?.weeklyCost || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shift Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Shift Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics?.shiftStatusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analytics?.shiftStatusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Weekly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics?.weeklyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="shiftsCreated" stroke="#8884d8" name="Shifts Created" />
                <Line type="monotone" dataKey="shiftsAssigned" stroke="#82ca9d" name="Shifts Assigned" />
                <Line type="monotone" dataKey="shiftsCompleted" stroke="#ffc658" name="Shifts Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Worker Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Worker Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {utilization?.workers?.map((worker: any) => (
              <div key={worker.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {worker.firstName?.[0]}{worker.lastName?.[0]}
                  </div>
                  <div>
                    <div className="font-medium">{worker.firstName} {worker.lastName}</div>
                    <div className="text-sm text-muted-foreground">
                      {worker.hoursThisWeek}h this week • {worker.shiftsCompleted} shifts completed
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-32">
                    <Progress value={worker.utilizationPercent} className="h-2" />
                  </div>
                  <div className="text-sm font-medium w-12 text-right">
                    {worker.utilizationPercent}%
                  </div>
                  {worker.isOverloaded && (
                    <Badge variant="destructive" className="text-xs">
                      Overloaded
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      {analytics?.complianceAlerts?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.complianceAlerts.map((alert: any, index: number) => (
                <div key={index} className="p-3 border-l-4 border-destructive bg-destructive/5 rounded">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.description}</div>
                  <div className="text-xs text-destructive mt-1">
                    Severity: {alert.severity} | Deadline: {alert.deadline}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}