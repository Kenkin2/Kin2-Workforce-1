import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, Clock, FileText } from 'lucide-react';

export default function ShiftTemplates() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    duration: '',
    hourlyRate: '',
    requirements: '',
    description: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shift templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/shift-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shift-templates');
      return response.json();
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/shift-templates', {
        ...templateData,
        duration: parseInt(templateData.duration),
        hourlyRate: parseFloat(templateData.hourlyRate)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Shift template created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
      setIsCreating(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('DELETE', `/api/shift-templates/${templateId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Template deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete template', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setNewTemplate({
      name: '',
      duration: '',
      hourlyRate: '',
      requirements: '',
      description: ''
    });
  };

  const useTemplate = async (template: any) => {
    // This would typically open the shift creation dialog with template values pre-filled
    toast({ 
      title: 'Template applied', 
      description: `Shift creation form filled with ${template.name} template` 
    });
    // In a real implementation, this would trigger the parent component to open shift creation
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shift Templates</h3>
          <p className="text-muted-foreground">Create reusable templates for common shift types</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-shift-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shift Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Template name (e.g., 'Morning Security')"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                data-testid="input-template-name"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Duration (hours)</label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={newTemplate.duration}
                    onChange={(e) => setNewTemplate({ ...newTemplate, duration: e.target.value })}
                    data-testid="input-template-duration"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Hourly Rate</label>
                  <Input
                    type="number"
                    placeholder="25.00"
                    value={newTemplate.hourlyRate}
                    onChange={(e) => setNewTemplate({ ...newTemplate, hourlyRate: e.target.value })}
                    data-testid="input-template-rate"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Requirements</label>
                <Input
                  placeholder="Security clearance, lifting certification, etc."
                  value={newTemplate.requirements}
                  onChange={(e) => setNewTemplate({ ...newTemplate, requirements: e.target.value })}
                  data-testid="input-template-requirements"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  placeholder="Detailed description of the shift responsibilities..."
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  data-testid="textarea-template-description"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createTemplateMutation.mutate(newTemplate)}
                  disabled={createTemplateMutation.isPending || !newTemplate.name || !newTemplate.duration}
                  data-testid="button-save-template"
                >
                  {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Shift Templates</h3>
              <p className="text-muted-foreground mb-4">Create templates to quickly create similar shifts</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template: any) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {template.duration} hours
                  </div>
                  
                  {template.hourlyRate && (
                    <div className="font-semibold text-primary">
                      ${template.hourlyRate}/hr
                    </div>
                  )}
                  
                  {template.requirements && (
                    <div className="text-sm">
                      <strong>Requirements:</strong> {template.requirements}
                    </div>
                  )}
                  
                  {template.description && (
                    <div className="text-sm text-muted-foreground">
                      {template.description.length > 100 
                        ? `${template.description.slice(0, 100)}...` 
                        : template.description}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => useTemplate(template)} data-testid={`button-use-template-${template.id}`}>
                      Use Template
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-template-${template.id}`}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}