import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback, useMotionSensors } from '@/hooks/useMobileFeatures';
import { SwipeGesture, DoubleTap } from './mobile-gestures';
import { 
  Clock, 
  MapPin, 
  TrendingUp, 
  Zap, 
  Target,
  Award,
  Calendar,
  Star,
  ChevronRight,
  Activity,
  BarChart,
  Timer
} from 'lucide-react';

export function QuickStatsWidget() {
  const { user } = useAuth() as { user: any };
  const { lightTap } = useHapticFeedback();

  const { data: stats } = useQuery({
    queryKey: ['/api/mobile/quick-stats'],
    enabled: !!user,
  });

  const handleStatClick = (statType: string) => {
    lightTap();
    console.log(`Viewing details for: ${statType}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <BarChart className="w-5 h-5 mr-2" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <DoubleTap onDoubleTap={() => handleStatClick('hours')}>
            <div 
              className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg cursor-pointer transition-transform active:scale-95"
              onClick={() => handleStatClick('hours')}
              data-testid="stat-hours"
            >
              <div className="text-2xl font-bold text-blue-600">
                {user?.role === 'worker' ? '32.5' : '248'}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {user?.role === 'worker' ? 'Hours This Week' : 'Total Hours'}
              </div>
            </div>
          </DoubleTap>

          <DoubleTap onDoubleTap={() => handleStatClick('earnings')}>
            <div 
              className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg cursor-pointer transition-transform active:scale-95"
              onClick={() => handleStatClick('earnings')}
              data-testid="stat-earnings"
            >
              <div className="text-2xl font-bold text-green-600">
                ${user?.role === 'worker' ? '1,280' : '24,500'}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                {user?.role === 'worker' ? 'This Week' : 'This Month'}
              </div>
            </div>
          </DoubleTap>

          <DoubleTap onDoubleTap={() => handleStatClick('rating')}>
            <div 
              className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg cursor-pointer transition-transform active:scale-95"
              onClick={() => handleStatClick('rating')}
              data-testid="stat-rating"
            >
              <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                <Star className="w-6 h-6 mr-1" />
                4.9
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                Average Rating
              </div>
            </div>
          </DoubleTap>

          <DoubleTap onDoubleTap={() => handleStatClick('karma')}>
            <div 
              className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg cursor-pointer transition-transform active:scale-95"
              onClick={() => handleStatClick('karma')}
              data-testid="stat-karma"
            >
              <div className="text-2xl font-bold text-purple-600 flex items-center justify-center">
                <Zap className="w-6 h-6 mr-1" />
                {user?.karmaCoins || 1250}
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-200">
                Karma Coins
              </div>
            </div>
          </DoubleTap>
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingShiftsWidget() {
  const { user } = useAuth() as { user: any };
  const { lightTap } = useHapticFeedback();

  const { data: upcomingShifts } = useQuery<any[]>({
    queryKey: ['/api/mobile/upcoming-shifts'],
    enabled: !!user && user.role === 'worker',
  });

  const shifts: any[] = upcomingShifts || [
    {
      id: '1',
      title: 'Downtown Office Cleaning',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      date: 'Tomorrow',
      location: 'Downtown Office Complex',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Warehouse Operations',
      startTime: '06:00 AM',
      endTime: '02:00 PM',
      date: 'Wednesday',
      location: 'Industrial District',
      status: 'pending'
    }
  ];

  if (user?.role !== 'worker') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Shifts
          </div>
          <Badge variant="secondary">{shifts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shifts.map((shift) => (
            <SwipeGesture
              key={shift.id}
              onSwipeRight={() => {
                lightTap();
                console.log(`Quick accept shift: ${shift.id}`);
              }}
              onSwipeLeft={() => {
                lightTap();
                console.log(`View shift details: ${shift.id}`);
              }}
            >
              <div 
                className="p-3 border rounded-lg bg-white dark:bg-gray-800 transition-transform active:scale-98"
                data-testid={`shift-${shift.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{shift.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {shift.date} • {shift.startTime} - {shift.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {shift.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={shift.status === 'confirmed' ? 'default' : 'secondary'}>
                      {shift.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 Swipe right to accept, left for details
                </div>
              </div>
            </SwipeGesture>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsProgressWidget() {
  const { user } = useAuth() as { user: any };
  const { lightTap } = useHapticFeedback();

  const goals = [
    {
      id: 'weekly-hours',
      title: 'Weekly Hours Goal',
      current: 32.5,
      target: 40,
      unit: 'hrs',
      color: 'blue'
    },
    {
      id: 'monthly-earnings',
      title: 'Monthly Earnings',
      current: 2850,
      target: 4000,
      unit: '$',
      color: 'green'
    },
    {
      id: 'skill-courses',
      title: 'Skill Courses',
      current: 3,
      target: 5,
      unit: 'courses',
      color: 'purple'
    }
  ];

  const handleGoalClick = (goalId: string) => {
    lightTap();
    console.log(`Viewing goal details: ${goalId}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Goals Progress
        </CardTitle>
        <CardDescription>Track your progress this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          const isComplete = progress >= 100;
          
          return (
            <div
              key={goal.id}
              className="space-y-2 cursor-pointer transition-transform active:scale-98"
              onClick={() => handleGoalClick(goal.id)}
              data-testid={`goal-${goal.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{goal.title}</span>
                <div className="flex items-center space-x-2">
                  {isComplete && <Award className="w-4 h-4 text-yellow-500" />}
                  <span className="text-sm text-muted-foreground">
                    {goal.unit === '$' ? '$' : ''}{goal.current}{goal.unit === '$' ? '' : ` ${goal.unit}`} / {goal.unit === '$' ? '$' : ''}{goal.target}{goal.unit === '$' ? '' : ` ${goal.unit}`}
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(progress, 100)}
                className={`h-2 ${
                  goal.color === 'blue' ? 'bg-blue-100' :
                  goal.color === 'green' ? 'bg-green-100' :
                  'bg-purple-100'
                }`}
              />
              {isComplete && (
                <div className="text-xs text-green-600 font-medium">
                  🎉 Goal completed!
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function WeatherLocationWidget() {
  const [weather, setWeather] = useState({
    temperature: 72,
    condition: 'Sunny',
    location: 'San Francisco, CA',
    humidity: 65,
    windSpeed: 8
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { lightTap } = useHapticFeedback();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          
          // Mock weather data based on location
          setWeather(prev => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`
          }));
        },
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  const handleWeatherClick = () => {
    lightTap();
    console.log('Opening weather details');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Weather & Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-3 cursor-pointer transition-transform active:scale-98"
          onClick={handleWeatherClick}
          data-testid="weather-widget"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°F</div>
              <div className="text-sm text-muted-foreground">{weather.condition}</div>
            </div>
            <div className="text-4xl">☀️</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Humidity: </span>
              <span>{weather.humidity}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Wind: </span>
              <span>{weather.windSpeed} mph</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {location ? weather.location : 'Location not available'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MotionActivityWidget() {
  const motion = useMotionSensors();
  const { lightTap } = useHapticFeedback();
  const [stepCount, setStepCount] = useState(3247);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Detect significant motion for step counting (simplified)
    const totalAcceleration = Math.sqrt(
      motion.acceleration.x ** 2 + 
      motion.acceleration.y ** 2 + 
      motion.acceleration.z ** 2
    );

    if (totalAcceleration > 12) { // Threshold for step detection
      setIsActive(true);
      setStepCount(prev => prev + 1);
      
      setTimeout(() => setIsActive(false), 1000);
    }
  }, [motion.acceleration]);

  const handleActivityClick = () => {
    lightTap();
    console.log('Opening activity details');
  };

  if (!motion.isSupported) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Activity Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-3 cursor-pointer transition-transform active:scale-98"
          onClick={handleActivityClick}
          data-testid="activity-widget"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stepCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Steps Today</div>
            </div>
            <div className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>
              🚶‍♂️
            </div>
          </div>
          
          <Progress value={(stepCount / 10000) * 100} className="h-2" />
          
          <div className="text-xs text-muted-foreground">
            Goal: 10,000 steps • {Math.max(0, 10000 - stepCount).toLocaleString()} remaining
          </div>
          
          {motion.isSupported && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">{motion.acceleration.x.toFixed(1)}</div>
                <div className="text-muted-foreground">X</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{motion.acceleration.y.toFixed(1)}</div>
                <div className="text-muted-foreground">Y</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{motion.acceleration.z.toFixed(1)}</div>
                <div className="text-muted-foreground">Z</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TimerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const { lightTap, success } = useHapticFeedback();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    lightTap();
    setIsRunning(true);
  };

  const handlePause = () => {
    lightTap();
    setIsRunning(false);
  };

  const handleReset = () => {
    success();
    setIsRunning(false);
    setTime(0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Timer className="w-5 h-5 mr-2" />
          Work Timer
        </CardTitle>
        <CardDescription>Track your work session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold mb-2">
            {formatTime(time)}
          </div>
          <div className="text-sm text-muted-foreground">
            {isRunning ? 'Timer running...' : 'Timer stopped'}
          </div>
        </div>
        
        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <Button 
              onClick={handleStart}
              data-testid="button-start-timer"
            >
              Start
            </Button>
          ) : (
            <Button 
              onClick={handlePause}
              variant="outline"
              data-testid="button-pause-timer"
            >
              Pause
            </Button>
          )}
          
          <Button 
            onClick={handleReset}
            variant="outline"
            data-testid="button-reset-timer"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}