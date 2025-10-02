import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
  selectedItems: string[];
  onClearSelection: () => void;
  itemType: "timesheets" | "jobs" | "workers";
}

export default function BulkActions({ selectedItems, onClearSelection, itemType }: BulkActionsProps) {
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const { toast } = useToast();

  const getActionsForType = (type: string) => {
    switch (type) {
      case "timesheets":
        return [
          { value: "approve", label: "Approve Selected", icon: "fas fa-check", variant: "default" },
          { value: "reject", label: "Reject Selected", icon: "fas fa-times", variant: "destructive" },
          { value: "request-changes", label: "Request Changes", icon: "fas fa-edit", variant: "secondary" },
          { value: "export", label: "Export to CSV", icon: "fas fa-download", variant: "outline" },
        ];
      case "jobs":
        return [
          { value: "activate", label: "Activate Jobs", icon: "fas fa-play", variant: "default" },
          { value: "deactivate", label: "Deactivate Jobs", icon: "fas fa-pause", variant: "secondary" },
          { value: "archive", label: "Archive Jobs", icon: "fas fa-archive", variant: "outline" },
          { value: "delete", label: "Delete Jobs", icon: "fas fa-trash", variant: "destructive" },
        ];
      case "workers":
        return [
          { value: "invite", label: "Send Invitations", icon: "fas fa-envelope", variant: "default" },
          { value: "deactivate", label: "Deactivate Workers", icon: "fas fa-user-slash", variant: "secondary" },
          { value: "assign-training", label: "Assign Training", icon: "fas fa-graduation-cap", variant: "outline" },
          { value: "export", label: "Export Contact List", icon: "fas fa-download", variant: "outline" },
        ];
      default:
        return [];
    }
  };

  const handleBulkAction = async () => {
    if (!selectedAction) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const action = getActionsForType(itemType).find(a => a.value === selectedAction);
      
      toast({
        title: "Bulk Action Completed",
        description: `${action?.label} applied to ${selectedItems.length} items successfully`,
      });
      
      setActionDialogOpen(false);
      setSelectedAction("");
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const actions = getActionsForType(itemType);

  if (selectedItems.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={true} 
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="font-medium text-foreground">
                {selectedItems.length} {itemType} selected
              </span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Bulk Actions Available
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearSelection}
              data-testid="button-clear-selection"
            >
              <i className="fas fa-times mr-2"></i>
              Clear Selection
            </Button>
            
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-bulk-actions">
                  <i className="fas fa-bolt mr-2"></i>
                  Bulk Actions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Actions</DialogTitle>
                  <DialogDescription>
                    Apply an action to {selectedItems.length} selected {itemType}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Action</label>
                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose an action..." />
                      </SelectTrigger>
                      <SelectContent>
                        {actions.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            <div className="flex items-center space-x-2">
                              <i className={action.icon}></i>
                              <span>{action.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedAction && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Confirmation</h4>
                      <p className="text-sm text-muted-foreground">
                        This action will be applied to <strong>{selectedItems.length}</strong> {itemType}.
                        {selectedAction === "delete" && " This action cannot be undone."}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleBulkAction}
                      disabled={!selectedAction}
                      variant={selectedAction === "delete" ? "destructive" : "default"}
                    >
                      {selectedAction === "delete" ? "Delete" : "Apply Action"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}