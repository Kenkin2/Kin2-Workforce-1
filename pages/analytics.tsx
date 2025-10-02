import AppLayout from "@/components/layout/app-layout";
import { EnhancedAnalyticsDashboard } from "@/components/analytics/enhanced-analytics-dashboard";

export default function Analytics() {
  return (
    <AppLayout 
      title="Advanced Analytics"
      breadcrumbs={[{ label: "Advanced Analytics" }]}
    >
      <EnhancedAnalyticsDashboard />
    </AppLayout>
  );
}