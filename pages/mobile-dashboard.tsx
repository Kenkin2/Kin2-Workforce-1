import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Clock, MapPin, Star, Zap, TrendingUp, Calendar } from 'lucide-react';

export default function MobileDashboard() {
  const { user } = useAuth() as { user: any };
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get mobile-optimized data
  const { data: mobileData, isLoading } = useQuery<any>({
    queryKey: ['/api/mobile/data'],
    enabled: !!user,
  });

  const { data: nearbyJobs } = useQuery<any[]>({
    queryKey: ['/api/mobile/nearby-jobs'],
    enabled: !!location && user?.role === 'worker',
  });

  // Location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async (action: 'in' | 'out') => {
      return apiRequest('POST', '/api/mobile/clock', { action, location });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/data'] });
    },
  });

  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest('POST', `/api/jobs/${jobId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/data'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20"> {/* Bottom padding for mobile nav */}
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-gray-900">
                  Hi, {user?.firstName}!
                </h1>
                <p className="text-sm text-gray-500">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                {user?.karmaCoins || 0}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {user?.role === 'worker' && (
          <>
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => clockMutation.mutate('in')}
                    disabled={clockMutation.isPending}
                    className="h-16 flex-col space-y-1"
                    data-testid="button-clock-in"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">Clock In</span>
                  </Button>
                  <Button
                    onClick={() => clockMutation.mutate('out')}
                    disabled={clockMutation.isPending}
                    variant="outline"
                    className="h-16 flex-col space-y-1"
                    data-testid="button-clock-out"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">Clock Out</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mobileData?.schedule?.length > 0 ? (
                    mobileData.schedule.map((shift: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{shift.jobTitle}</p>
                          <p className="text-sm text-gray-500">
                            {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                        <Badge>{shift.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No shifts scheduled for today</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Nearby Jobs */}
            {nearbyJobs && nearbyJobs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Nearby Jobs
                  </CardTitle>
                  <CardDescription>Jobs within 10 miles of your location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nearbyJobs.slice(0, 3).map((job: any) => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{job.title}</h3>
                          <Badge>{job.distance.toFixed(1)} mi</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            ${job.hourlyRate}/hr • {job.estimatedTravelTime} min
                          </span>
                          <Button
                            size="sm"
                            onClick={() => acceptJobMutation.mutate(job.id)}
                            disabled={acceptJobMutation.isPending}
                            data-testid={`button-accept-job-${job.id}`}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Performance Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {user?.role === 'worker' ? '32' : '147'}
                </div>
                <div className="text-sm text-gray-500">
                  {user?.role === 'worker' ? 'Hours Worked' : 'Jobs Posted'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${user?.role === 'worker' ? '1,280' : '24,500'}
                </div>
                <div className="text-sm text-gray-500">
                  {user?.role === 'worker' ? 'Earnings' : 'Revenue'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'Completed shift at Downtown Office', time: '2 hours ago', icon: '✅' },
                { action: 'New job assignment available', time: '4 hours ago', icon: '💼' },
                { action: 'Earned 50 KarmaCoins bonus', time: '1 day ago', icon: '🪙' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2">
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Specific Features */}
        <Tabs defaultValue="offline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offline">Offline Mode</TabsTrigger>
            <TabsTrigger value="settings">Mobile Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="offline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offline Capabilities</CardTitle>
                <CardDescription>Work without internet connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Offline Data Sync</span>
                    <Badge variant="secondary">Up to date</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Actions</span>
                    <Badge>3 queued</Badge>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    data-testid="button-sync-offline"
                  >
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mobile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Push Notifications</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Location Tracking</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Biometric Login</span>
                    <Badge>Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Offline Mode</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}