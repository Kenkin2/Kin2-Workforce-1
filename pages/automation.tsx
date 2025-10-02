import AppLayout from "@/components/layout/app-layout";
import { WorkflowAutomation } from "@/components/automation/workflow-automation";

export default function Automation() {
  return (
    <AppLayout 
      title="Workflow Automation"
      breadcrumbs={[{ label: "Workflow Automation" }]}
    >
      <WorkflowAutomation />
    </AppLayout>
  );
}