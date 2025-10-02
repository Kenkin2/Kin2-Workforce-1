import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  User,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addHours } from 'date-fns';

interface Shift {
  id: string;
  jobId: string;
  workerId?: string;
  title: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  status: 'draft' | 'published' | 'assigned' | 'completed';
  location?: string;
  requirements?: string;
  worker?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  job?: {
    title: string;
  };
}

interface DragDropCalendarProps {
  view?: 'week' | 'day';
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function DragDropCalendar({ 
  view = 'week', 
  selectedDate = new Date(),
  onDateChange 
}: DragDropCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [newShift, setNewShift] = useState({
    title: '',
    jobId: '',
    startTime: '',
    endTime: '',
    hourlyRate: '',
    location: '',
    requirements: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const calendarRef = useRef<HTMLDivElement>(null);

  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'shift_updated' || data.type === 'shift_created' || data.type === 'shift_deleted') {
        queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      }
    };

    return () => ws.close();
  }, [queryClient]);

  // Get week start and end dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch shifts for the current week
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['/api/shifts', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shifts?start=${format(weekStart, 'yyyy-MM-dd')}&end=${format(weekEnd, 'yyyy-MM-dd')}`);
      return response.json();
    }
  });

  // Fetch available workers
  const { data: workers = [] } = useQuery({
    queryKey: ['/api/workers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/workers');
      return response.json();
    }
  });

  // Fetch available jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/jobs');
      return response.json();
    }
  });

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      // Get the first available job if none specified
      if (!shiftData.jobId && jobs.length > 0) {
        shiftData.jobId = jobs[0].id;
      }
      const response = await apiRequest('POST', '/api/shifts', shiftData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Shift created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setIsCreating(false);
      setNewShift({ title: '', jobId: '', startTime: '', endTime: '', hourlyRate: '', location: '', requirements: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create shift', description: error.message, variant: 'destructive' });
    }
  });

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const response = await apiRequest('PATCH', `/api/shifts/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Shift updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setEditingShift(null);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update shift', description: error.message, variant: 'destructive' });
    }
  });

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await apiRequest('DELETE', `/api/shifts/${shiftId}`);
    },
    onSuccess: () => {
      toast({ title: 'Shift deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete shift', description: error.message, variant: 'destructive' });
    }
  });

  // Navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = addDays(currentDate, direction === 'next' ? 7 : -7);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, shift: Shift) => {
    setDraggedShift(shift);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback((e: React.DragEvent, targetDate: Date, targetHour: number) => {
    e.preventDefault();
    
    if (!draggedShift) return;

    const newStartTime = new Date(targetDate);
    newStartTime.setHours(targetHour, 0, 0, 0);
    
    const currentStart = parseISO(draggedShift.startTime);
    const currentEnd = parseISO(draggedShift.endTime);
    const duration = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60); // hours
    
    const newEndTime = addHours(newStartTime, duration);

    updateShiftMutation.mutate({
      id: draggedShift.id,
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString()
    });

    setDraggedShift(null);
  }, [draggedShift, updateShiftMutation]);

  // Time slot creation
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = addHours(startTime, 1);
    
    setNewShift({
      title: '',
      jobId: '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      hourlyRate: '15',
      location: '',
      requirements: ''
    });
    setIsCreating(true);
  };

  // Get shifts for a specific day
  const getShiftsForDay = (date: Date) => {
    return shifts.filter((shift: Shift) => 
      isSameDay(parseISO(shift.startTime), date)
    ).sort((a: Shift, b: Shift) => 
      parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
    );
  };

  // Time slots (7 AM to 10 PM)
  const timeSlots = Array.from({ length: 15 }, (_, i) => 7 + i);

  const getShiftHeight = (shift: Shift) => {
    const start = parseISO(shift.startTime);
    const end = parseISO(shift.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    return Math.max(1, duration) * 60; // 60px per hour, minimum 1 hour
  };

  const getShiftTop = (shift: Shift) => {
    const start = parseISO(shift.startTime);
    const hour = start.getHours() + start.getMinutes() / 60;
    return (hour - 7) * 60; // 60px per hour, starting from 7 AM
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateWeek('prev')} data-testid="button-prev-week">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={navigateToToday} data-testid="button-today">
            Today
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')} data-testid="button-next-week">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreating(true)} data-testid="button-create-shift">
            <Plus className="w-4 h-4 mr-2" />
            Create Shift
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div ref={calendarRef} className="grid grid-cols-8 border-b">
            {/* Time column header */}
            <div className="p-4 border-r border-border bg-muted/30">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            
            {/* Day headers */}
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="p-4 border-r border-border text-center">
                <div className="text-sm font-medium text-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold ${
                  isSameDay(day, new Date()) 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots and shifts */}
          <div className="grid grid-cols-8 relative" style={{ minHeight: '900px' }}>
            {/* Time labels */}
            <div className="border-r border-border bg-muted/30">
              {timeSlots.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-border px-2 py-1 text-xs text-muted-foreground">
                  {format(new Date().setHours(hour, 0), 'ha')}
                </div>
              ))}
            </div>

            {/* Day columns with shifts */}
            {weekDays.map((day, dayIndex) => (
              <div 
                key={day.toISOString()} 
                className="border-r border-border relative"
                onDragOver={handleDragOver}
              >
                {/* Time slot grid */}
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onDrop={(e) => handleDrop(e, day, hour)}
                    onClick={() => handleTimeSlotClick(day, hour)}
                    data-testid={`timeslot-${format(day, 'yyyy-MM-dd')}-${hour}`}
                  />
                ))}

                {/* Shifts overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {getShiftsForDay(day).map((shift: Shift) => (
                    <div
                      key={shift.id}
                      className="absolute left-1 right-1 pointer-events-auto cursor-move"
                      style={{
                        top: `${getShiftTop(shift)}px`,
                        height: `${getShiftHeight(shift)}px`,
                        zIndex: 10
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shift)}
                      data-testid={`shift-${shift.id}`}
                    >
                      <Card className="h-full shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-2 h-full flex flex-col">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={
                              shift.status === 'assigned' ? 'default' :
                              shift.status === 'completed' ? 'secondary' :
                              'outline'
                            }>
                              {shift.status}
                            </Badge>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => setEditingShift(shift)}
                                data-testid={`button-edit-shift-${shift.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteShiftMutation.mutate(shift.id)}
                                data-testid={`button-delete-shift-${shift.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex-1 text-xs">
                            <div className="font-medium text-foreground mb-1 truncate">
                              {shift.title}
                            </div>
                            <div className="flex items-center text-muted-foreground mb-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(parseISO(shift.startTime), 'h:mm a')} - {format(parseISO(shift.endTime), 'h:mm a')}
                            </div>
                            {shift.worker && (
                              <div className="flex items-center text-muted-foreground mb-1">
                                <User className="w-3 h-3 mr-1" />
                                {shift.worker.firstName} {shift.worker.lastName}
                              </div>
                            )}
                            {shift.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{shift.location}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs font-medium text-primary">
                            ${shift.hourlyRate}/hr
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Shift Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Shift title"
              value={newShift.title}
              onChange={(e) => setNewShift({ ...newShift, title: e.target.value })}
              data-testid="input-new-shift-title"
            />

            <Select onValueChange={(jobId) => setNewShift({ ...newShift, jobId })}>
              <SelectTrigger data-testid="select-new-shift-job">
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
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                value={newShift.startTime.slice(0, 16)}
                onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value + ':00.000Z' })}
                data-testid="input-new-shift-start"
              />
              <Input
                type="datetime-local"
                value={newShift.endTime.slice(0, 16)}
                onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value + ':00.000Z' })}
                data-testid="input-new-shift-end"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Hourly rate"
                value={newShift.hourlyRate}
                onChange={(e) => setNewShift({ ...newShift, hourlyRate: e.target.value })}
                data-testid="input-new-shift-rate"
              />
              <Input
                placeholder="Location"
                value={newShift.location}
                onChange={(e) => setNewShift({ ...newShift, location: e.target.value })}
                data-testid="input-new-shift-location"
              />
            </div>

            <Input
              placeholder="Requirements or notes"
              value={newShift.requirements}
              onChange={(e) => setNewShift({ ...newShift, requirements: e.target.value })}
              data-testid="input-new-shift-requirements"
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createShiftMutation.mutate(newShift)}
                disabled={createShiftMutation.isPending}
                data-testid="button-save-new-shift"
              >
                {createShiftMutation.isPending ? 'Creating...' : 'Create Shift'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          {editingShift && (
            <div className="space-y-4">
              <Input
                placeholder="Shift title"
                defaultValue={editingShift.title}
                onChange={(e) => setEditingShift({ ...editingShift, title: e.target.value })}
                data-testid="input-edit-shift-title"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  defaultValue={editingShift.startTime.slice(0, 16)}
                  onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value + ':00.000Z' })}
                  data-testid="input-edit-shift-start"
                />
                <Input
                  type="datetime-local"
                  defaultValue={editingShift.endTime.slice(0, 16)}
                  onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value + ':00.000Z' })}
                  data-testid="input-edit-shift-end"
                />
              </div>

              <Select value={editingShift.workerId || ''} onValueChange={(workerId) => 
                setEditingShift({ ...editingShift, workerId })
              }>
                <SelectTrigger data-testid="select-edit-shift-worker">
                  <SelectValue placeholder="Assign worker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No worker assigned</SelectItem>
                  {workers.map((worker: any) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Hourly rate"
                  defaultValue={editingShift.hourlyRate}
                  onChange={(e) => setEditingShift({ ...editingShift, hourlyRate: Number(e.target.value) })}
                  data-testid="input-edit-shift-rate"
                />
                <Input
                  placeholder="Location"
                  defaultValue={editingShift.location}
                  onChange={(e) => setEditingShift({ ...editingShift, location: e.target.value })}
                  data-testid="input-edit-shift-location"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingShift(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateShiftMutation.mutate(editingShift)}
                  disabled={updateShiftMutation.isPending}
                  data-testid="button-save-edit-shift"
                >
                  {updateShiftMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-muted rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">Draft</Badge>
              <span>Unassigned</span>
            </div>
            <div className="flex items-center">
              <Badge variant="default" className="mr-2">Assigned</Badge>
              <span>Worker assigned</span>
            </div>
            <div className="flex items-center">
              <Badge variant="secondary" className="mr-2">Completed</Badge>
              <span>Shift completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}