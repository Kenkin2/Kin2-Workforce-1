import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Repeat, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function RecurringShifts() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);
  const [newRecurring, setNewRecurring] = useState({
    title: '',
    jobId: '',
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: [] as number[],
    hourlyRate: '',
    location: '',
    requirements: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recurring shifts
  const { data: recurringShifts = [], isLoading } = useQuery({
    queryKey: ['/api/recurring-shifts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recurring-shifts');
      return response.json();
    }
  });

  // Fetch jobs for selection
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/jobs');
      return response.json();
    }
  });

  // Create recurring shift mutation
  const createRecurringMutation = useMutation({
    mutationFn: async (recurringData: any) => {
      const response = await apiRequest('POST', '/api/recurring-shifts', recurringData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Recurring shift created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-shifts'] });
      setIsCreating(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create recurring shift', description: error.message, variant: 'destructive' });
    }
  });

  // Generate shifts mutation
  const generateShiftsMutation = useMutation({
    mutationFn: async ({ recurringId, weeks }: { recurringId: string, weeks: number }) => {
      const response = await apiRequest('POST', `/api/recurring-shifts/${recurringId}/generate`, { weeks });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: `Generated ${data.count} shifts successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to generate shifts', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setNewRecurring({
      title: '',
      jobId: '',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [],
      hourlyRate: '',
      location: '',
      requirements: ''
    });
  };

  const handleDayToggle = (day: number, checked: boolean) => {
    if (checked) {
      setNewRecurring({
        ...newRecurring,
        daysOfWeek: [...newRecurring.daysOfWeek, day].sort()
      });
    } else {
      setNewRecurring({
        ...newRecurring,
        daysOfWeek: newRecurring.daysOfWeek.filter(d => d !== day)
      });
    }
  };

  const getDayNames = (days: number[]) => {
    return days.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recurring Shifts</h3>
          <p className="text-muted-foreground">Create templates for repeating shift patterns</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-recurring-shift">
              <Plus className="w-4 h-4 mr-2" />
              Create Recurring Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Recurring Shift Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Shift title"
                  value={newRecurring.title}
                  onChange={(e) => setNewRecurring({ ...newRecurring, title: e.target.value })}
                  data-testid="input-recurring-title"
                />
                <Select value={newRecurring.jobId} onValueChange={(jobId) => setNewRecurring({ ...newRecurring, jobId })}>
                  <SelectTrigger data-testid="select-recurring-job">
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job: any) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="time"
                  value={newRecurring.startTime}
                  onChange={(e) => setNewRecurring({ ...newRecurring, startTime: e.target.value })}
                  data-testid="input-recurring-start-time"
                />
                <Input
                  type="time"
                  value={newRecurring.endTime}
                  onChange={(e) => setNewRecurring({ ...newRecurring, endTime: e.target.value })}
                  data-testid="input-recurring-end-time"
                />
                <Input
                  type="number"
                  placeholder="Hourly rate"
                  value={newRecurring.hourlyRate}
                  onChange={(e) => setNewRecurring({ ...newRecurring, hourlyRate: e.target.value })}
                  data-testid="input-recurring-rate"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Days of Week</label>
                <div className="grid grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={newRecurring.daysOfWeek.includes(day.value)}
                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                        data-testid={`checkbox-day-${day.value}`}
                      />
                      <label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Location"
                  value={newRecurring.location}
                  onChange={(e) => setNewRecurring({ ...newRecurring, location: e.target.value })}
                  data-testid="input-recurring-location"
                />
                <Input
                  placeholder="Requirements"
                  value={newRecurring.requirements}
                  onChange={(e) => setNewRecurring({ ...newRecurring, requirements: e.target.value })}
                  data-testid="input-recurring-requirements"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createRecurringMutation.mutate(newRecurring)}
                  disabled={createRecurringMutation.isPending || !newRecurring.title || !newRecurring.jobId || newRecurring.daysOfWeek.length === 0}
                  data-testid="button-save-recurring"
                >
                  {createRecurringMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : recurringShifts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recurring Shifts</h3>
              <p className="text-muted-foreground mb-4">Create templates for shifts that repeat regularly</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          recurringShifts.map((recurring: any) => (
            <Card key={recurring.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">{recurring.title}</h4>
                      <Badge variant={recurring.isActive ? 'default' : 'secondary'}>
                        {recurring.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {recurring.startTime} - {recurring.endTime}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {getDayNames(recurring.daysOfWeek)}
                      </div>
                    </div>
                    
                    {recurring.location && (
                      <p className="text-sm text-muted-foreground mt-2">📍 {recurring.location}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="font-semibold text-primary">${recurring.hourlyRate}/hr</div>
                    </div>
                    
                    <Select onValueChange={(weeks) => 
                      generateShiftsMutation.mutate({ recurringId: recurring.id, weeks: parseInt(weeks) })
                    }>
                      <SelectTrigger className="w-32" data-testid={`select-generate-${recurring.id}`}>
                        <SelectValue placeholder="Generate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 week</SelectItem>
                        <SelectItem value="2">2 weeks</SelectItem>
                        <SelectItem value="4">4 weeks</SelectItem>
                        <SelectItem value="8">8 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button size="sm" variant="outline" data-testid={`button-edit-recurring-${recurring.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-delete-recurring-${recurring.id}`}>
                      <Trash2 className="w-4 h-4" />
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