import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type RevenueDataPoint = {
  month: string;
  value: number;
};

export default function RevenueChart() {
  const { data: revenueData, isLoading } = useQuery<RevenueDataPoint[]>({
    queryKey: ["/api/analytics/revenue"],
    retry: false,
  });

  const chartData = revenueData || [];
  
  const computeHeight = (value: number, maxValue: number): number => {
    if (maxValue === 0) return 20;
    const minHeight = 20;
    const maxHeight = 120;
    return Math.max(minHeight, (value / maxValue) * maxHeight);
  };
  
  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(item => item.value))
    : 0;

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeIn">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Revenue Overview 📈</CardTitle>
          <Select defaultValue="6months">
            <SelectTrigger className="w-40" data-testid="select-chart-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : chartData.length > 0 ? (
          <>
            <div className="chart-container h-64 rounded-lg flex items-end justify-center space-x-2 p-4 bg-gradient-to-t from-primary/5 to-transparent">
              <div className="flex items-end space-x-1">
                {chartData.map((item, index) => {
                  const barHeight = computeHeight(item.value, maxValue);
                  return (
                    <div key={item.month} className="flex flex-col items-center animate-bounceIn" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div 
                        className="w-8 bg-gradient-to-t from-primary to-secondary rounded-t hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg"
                        style={{ height: `${barHeight}px` }}
                        title={`${item.month}: £${item.value.toLocaleString()}`}
                        data-testid={`chart-bar-${item.month.toLowerCase()}`}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center mt-4 space-x-6 text-xs text-muted-foreground font-medium">
              {chartData.map((item) => (
                <span key={item.month} className="hover:text-primary transition-colors cursor-pointer">{item.month}</span>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No revenue data available"
            description="Revenue data will appear here once transactions are processed"
            variant="compact"
          />
        )}
      </CardContent>
    </Card>
  );
}
