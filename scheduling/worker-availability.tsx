import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkerAvailability() {
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [availabilityChanges, setAvailabilityChanges] = useState<any>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workers
  const { data: workers = [] } = useQuery({
    queryKey: ['/api/users', 'worker'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=worker');
      return response.json();
    }
  });

  // Fetch availability for selected worker
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['/api/worker-availability', selectedWorker],
    enabled: !!selectedWorker,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/worker-availability/${selectedWorker}`);
      return response.json();
    }
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData: any) => {
      const response = await apiRequest('PUT', `/api/worker-availability/${selectedWorker}`, availabilityData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Availability updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/worker-availability', selectedWorker] });
      setAvailabilityChanges({});
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update availability', description: error.message, variant: 'destructive' });
    }
  });

  // Check conflicts
  const { data: conflicts = [] } = useQuery({
    queryKey: ['/api/scheduling-conflicts', selectedWorker],
    enabled: !!selectedWorker,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/scheduling-conflicts/${selectedWorker}`);
      return response.json();
    }
  });

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.find((a: any) => a.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false
    };
  };

  const updateDayAvailability = (dayOfWeek: number, field: string, value: any) => {
    const key = `${dayOfWeek}-${field}`;
    setAvailabilityChanges({
      ...availabilityChanges,
      [key]: value
    });
  };

  const getEffectiveValue = (dayOfWeek: number, field: string, defaultValue: any) => {
    const key = `${dayOfWeek}-${field}`;
    return availabilityChanges[key] !== undefined ? availabilityChanges[key] : defaultValue;
  };

  const saveChanges = () => {
    const updates = DAYS.map((_, dayOfWeek) => {
      const current = getAvailabilityForDay(dayOfWeek);
      return {
        dayOfWeek,
        startTime: getEffectiveValue(dayOfWeek, 'startTime', current.startTime),
        endTime: getEffectiveValue(dayOfWeek, 'endTime', current.endTime),
        isAvailable: getEffectiveValue(dayOfWeek, 'isAvailable', current.isAvailable)
      };
    });
    
    updateAvailabilityMutation.mutate({ availability: updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Worker Availability</h3>
        <p className="text-muted-foreground mb-4">Manage when workers are available for shifts</p>
        
        <div className="flex items-center space-x-4 mb-6">
          <select
            className="px-3 py-2 border rounded-md"
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            data-testid="select-worker-availability"
          >
            <option value="">Select worker...</option>
            {workers.map((worker: any) => (
              <option key={worker.id} value={worker.id}>
                {worker.firstName} {worker.lastName} ({worker.email})
              </option>
            ))}
          </select>
          
          {conflicts.length > 0 && (
            <Badge variant="destructive" className="flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {conflicts.length} conflicts
            </Badge>
          )}
        </div>
      </div>

      {selectedWorker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Weekly Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS.map((day, dayOfWeek) => {
                  const dayAvailability = getAvailabilityForDay(dayOfWeek);
                  const isAvailable = getEffectiveValue(dayOfWeek, 'isAvailable', dayAvailability.isAvailable);
                  const startTime = getEffectiveValue(dayOfWeek, 'startTime', dayAvailability.startTime);
                  const endTime = getEffectiveValue(dayOfWeek, 'endTime', dayAvailability.endTime);

                  return (
                    <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 font-medium">{day}</div>
                        <Switch
                          checked={isAvailable}
                          onCheckedChange={(checked) => updateDayAvailability(dayOfWeek, 'isAvailable', checked)}
                          data-testid={`switch-available-${dayOfWeek}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {isAvailable ? 'Available' : 'Not available'}
                        </span>
                      </div>
                      
                      {isAvailable && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => updateDayAvailability(dayOfWeek, 'startTime', e.target.value)}
                            className="w-24"
                            data-testid={`input-start-time-${dayOfWeek}`}
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => updateDayAvailability(dayOfWeek, 'endTime', e.target.value)}
                            className="w-24"
                            data-testid={`input-end-time-${dayOfWeek}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {Object.keys(availabilityChanges).length > 0 && (
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setAvailabilityChanges({})}>
                      Cancel Changes
                    </Button>
                    <Button 
                      onClick={saveChanges}
                      disabled={updateAvailabilityMutation.isPending}
                      data-testid="button-save-availability"
                    >
                      {updateAvailabilityMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scheduling Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Scheduling Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.map((conflict: any, index: number) => (
                <div key={index} className="p-3 border-l-4 border-destructive bg-destructive/5 rounded">
                  <div className="font-medium">{conflict.shiftTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(conflict.startTime).toLocaleDateString()} {conflict.startTime.split('T')[1]?.slice(0,5)} - {conflict.endTime.split('T')[1]?.slice(0,5)}
                  </div>
                  <div className="text-sm text-destructive mt-1">{conflict.reason}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}