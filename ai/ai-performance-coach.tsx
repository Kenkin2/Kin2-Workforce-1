import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Target, 
  TrendingUp, 
  Award, 
  Star,
  Brain,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Calendar,
  BarChart3,
  Users,
  Clock,
  Zap,
  Trophy,
  BookOpen,
  MessageSquare
} from "lucide-react";

interface PerformanceInsight {
  id: string;
  type: 'strength' | 'improvement' | 'goal' | 'achievement';
  title: string;
  description: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'collaboration' | 'skills' | 'quality' | 'efficiency';
}

interface PersonalizedGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  aiSuggested: boolean;
  milestones: {
    name: string;
    completed: boolean;
    dueDate: Date;
  }[];
}

interface CoachingSession {
  id: string;
  date: Date;
  topic: string;
  insights: string[];
  actions: string[];
  progress: number;
  nextSession?: Date;
}

export default function AIPerformanceCoach() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('me');
  const [coachingHistory, setCoachingHistory] = useState<CoachingSession[]>([]);
  const [currentInsights, setCurrentInsights] = useState<PerformanceInsight[]>([]);

  // Performance insights query
  const { data: performanceInsights = [] } = useQuery<PerformanceInsight[]>({
    queryKey: ['/api/ai/performance/insights', selectedEmployee],
    enabled: true
  });

  // Personal goals query
  const { data: personalGoals = [] } = useQuery<PersonalizedGoal[]>({
    queryKey: ['/api/ai/performance/goals', selectedEmployee],
    enabled: true
  });

  // Coaching sessions query
  const { data: coachingSessions = [] } = useQuery<CoachingSession[]>({
    queryKey: ['/api/ai/performance/coaching', selectedEmployee],
    enabled: true
  });

  // Generate coaching session
  const generateCoachingMutation = useMutation({
    mutationFn: (topic: string) =>
      fetch('/api/ai/performance/coaching/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee: selectedEmployee, topic })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/performance/coaching'] });
    }
  });

  useEffect(() => {
    setCurrentInsights(performanceInsights);
  }, [performanceInsights]);

  useEffect(() => {
    setCoachingHistory(coachingSessions);
  }, [coachingSessions]);

  // Mock data for demonstration
  const mockInsights: PerformanceInsight[] = [
    {
      id: 'insight1',
      type: 'strength',
      title: 'Excellent Task Completion Rate',
      description: 'You consistently complete 95% of assigned tasks on time',
      score: 95,
      trend: 'improving',
      recommendations: [
        'Share your time management techniques with team members',
        'Consider taking on stretch assignments to further develop skills'
      ],
      priority: 'low',
      category: 'productivity'
    },
    {
      id: 'insight2',
      type: 'improvement',
      title: 'Communication Enhancement Opportunity',
      description: 'Feedback indicates room for improvement in cross-team communication',
      score: 72,
      trend: 'stable',
      recommendations: [
        'Practice active listening techniques',
        'Schedule regular check-ins with other departments',
        'Use clear, concise messaging in emails'
      ],
      priority: 'high',
      category: 'collaboration'
    },
    {
      id: 'insight3',
      type: 'goal',
      title: 'Technical Skills Development',
      description: 'AI recommends focusing on emerging technologies relevant to your role',
      score: 78,
      trend: 'improving',
      recommendations: [
        'Complete advanced certification in your primary tech stack',
        'Attend industry conferences or webinars',
        'Participate in code review sessions'
      ],
      priority: 'medium',
      category: 'skills'
    }
  ];

  const mockGoals: PersonalizedGoal[] = [
    {
      id: 'goal1',
      title: 'Improve Team Collaboration Score',
      description: 'Increase collaboration effectiveness rating to 85%',
      category: 'Teamwork',
      targetValue: 85,
      currentValue: 72,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: 'high',
      aiSuggested: true,
      milestones: [
        { name: 'Complete communication workshop', completed: true, dueDate: new Date() },
        { name: 'Lead cross-team project', completed: false, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        { name: 'Get feedback from 5 colleagues', completed: false, dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) }
      ]
    },
    {
      id: 'goal2',
      title: 'Increase Productivity Rating',
      description: 'Achieve 90% productivity score through better time management',
      category: 'Productivity',
      targetValue: 90,
      currentValue: 83,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      aiSuggested: false,
      milestones: [
        { name: 'Implement time-blocking technique', completed: true, dueDate: new Date() },
        { name: 'Reduce meeting time by 20%', completed: false, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        { name: 'Automate routine tasks', completed: false, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      ]
    }
  ];

  const mockSessions: CoachingSession[] = [
    {
      id: 'session1',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      topic: 'Communication Skills Enhancement',
      insights: [
        'Active listening is a key area for development',
        'Email communication could be more concise',
        'Team meeting participation has improved significantly'
      ],
      actions: [
        'Practice summarizing key points in meetings',
        'Use bullet points for email clarity',
        'Schedule weekly one-on-ones with team members'
      ],
      progress: 75,
      nextSession: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ];

  const currentData = {
    insights: currentInsights.length > 0 ? currentInsights : mockInsights,
    goals: personalGoals.length > 0 ? personalGoals : mockGoals,
    sessions: coachingHistory.length > 0 ? coachingHistory : mockSessions
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <Star className="h-4 w-4 text-green-500" />;
      case 'improvement': return <Target className="h-4 w-4 text-orange-500" />;
      case 'goal': return <Trophy className="h-4 w-4 text-blue-500" />;
      case 'achievement': return <Award className="h-4 w-4 text-purple-500" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return <ArrowRight className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Performance Coach</h3>
          <Badge variant="outline" className="ml-2">
            <MessageSquare className="h-3 w-3 mr-1" />
            Personalized
          </Badge>
        </div>
        <Button onClick={() => generateCoachingMutation.mutate('general')}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Coaching Session
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
          <TabsTrigger value="goals">Personal Goals</TabsTrigger>
          <TabsTrigger value="coaching">Coaching Sessions</TabsTrigger>
          <TabsTrigger value="development">Development Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentData.insights.map((insight) => (
              <Card key={insight.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-sm">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </Badge>
                      {getTrendIcon(insight.trend)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Performance Score</span>
                      <span className="font-medium">{insight.score}%</span>
                    </div>
                    <Progress value={insight.score} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-medium">AI Recommendations:</h5>
                    <div className="space-y-1">
                      {insight.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="space-y-4">
            {currentData.goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{goal.title}</CardTitle>
                      {goal.aiSuggested && (
                        <Badge variant="outline" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Suggested
                        </Badge>
                      )}
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                      {goal.priority} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">{goal.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">{goal.currentValue}/{goal.targetValue}</span>
                    </div>
                    <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium">Category:</span> {goal.category}
                    </div>
                    <div>
                      <span className="font-medium">Deadline:</span> {goal.deadline.toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-medium">Milestones:</h5>
                    <div className="space-y-1">
                      {goal.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle 
                            className={`h-3 w-3 ${
                              milestone.completed ? 'text-green-500' : 'text-gray-300'
                            }`} 
                          />
                          <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                            {milestone.name}
                          </span>
                          <span className="text-muted-foreground">
                            ({milestone.dueDate.toLocaleDateString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coaching" className="space-y-4">
          <div className="space-y-4">
            {currentData.sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{session.topic}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {session.date.toLocaleDateString()}
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        {session.progress}% Complete
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Progress value={session.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium">Key Insights:</h5>
                      <div className="space-y-1">
                        {session.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs">
                            <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-medium">Action Items:</h5>
                      <div className="space-y-1">
                        {session.actions.map((action, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {session.nextSession && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs">
                      <strong>Next Session:</strong> {session.nextSession.toLocaleDateString()} - Follow-up on progress
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommended Learning Paths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-2 border rounded">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">Advanced Communication Skills</div>
                    <div className="text-xs text-muted-foreground">4 modules, 8 hours</div>
                  </div>
                  <Button size="sm" variant="outline">Start</Button>
                </div>
                
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Users className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">Team Leadership Fundamentals</div>
                    <div className="text-xs text-muted-foreground">6 modules, 12 hours</div>
                  </div>
                  <Button size="sm" variant="outline">Start</Button>
                </div>
                
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">Productivity Optimization</div>
                    <div className="text-xs text-muted-foreground">3 modules, 6 hours</div>
                  </div>
                  <Button size="sm" variant="outline">Start</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Skill Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Technical Skills</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Communication</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Leadership</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Problem Solving</span>
                    <span>91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <BarChart3 className="h-3 w-3 mr-2" />
                  Take Full Assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}