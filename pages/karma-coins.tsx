import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coins, 
  TrendingUp, 
  Gift, 
  Trophy, 
  Star, 
  Target, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Calendar, 
  Award,
  Zap,
  Coffee,
  ShoppingCart,
  Crown,
  Medal,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Activity
} from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from "recharts";

interface KarmaStats {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  rank: number;
  totalUsers: number;
  weeklyEarned: number;
  monthlyEarned: number;
}

interface KarmaActivity {
  id: string;
  name: string;
  description: string;
  reward: number;
  icon: any;
  category: 'learning' | 'performance' | 'social' | 'attendance' | 'achievement';
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  completedAt?: string;
  progress?: number;
  requirements?: string[];
}

interface KarmaReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: any;
  category: 'benefits' | 'recognition' | 'experiences' | 'merchandise';
  availability: number;
  claimed: number;
  canClaim: boolean;
  imageUrl?: string;
}

interface KarmaTransaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface KarmaLeaderboard {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  karmaCoins: number;
  weeklyEarned: number;
  profileImageUrl?: string;
}

interface KarmaTrend {
  date: string;
  earned: number;
  spent: number;
  balance: number;
}

export default function KarmaCoins() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch karma stats
  const { data: stats, isLoading: statsLoading } = useQuery<KarmaStats>({
    queryKey: ["/api/karma/stats"],
    initialData: {
      balance: 1250,
      totalEarned: 2800,
      totalSpent: 1550,
      rank: 12,
      totalUsers: 150,
      weeklyEarned: 320,
      monthlyEarned: 1150
    }
  });

  // Fetch available activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<KarmaActivity[]>({
    queryKey: ["/api/karma/activities"],
    initialData: [
      {
        id: 'complete_course',
        name: 'Complete a Learning Course',
        description: 'Finish any available course in the learning center',
        reward: 50,
        icon: BookOpen,
        category: 'learning',
        difficulty: 'easy',
        completed: false,
        requirements: ['Access to learning center', 'Course enrollment']
      },
      {
        id: 'submit_timesheet_early',
        name: 'Submit Timesheet Early',
        description: 'Submit your timesheet 24 hours before deadline',
        reward: 25,
        icon: Clock,
        category: 'performance',
        difficulty: 'easy',
        completed: true,
        completedAt: '2024-10-28',
        requirements: ['Active timesheet', 'Submit 24h early']
      },
      {
        id: 'perfect_attendance',
        name: 'Perfect Attendance Week',
        description: 'Complete all scheduled shifts in a week',
        reward: 100,
        icon: Calendar,
        category: 'attendance',
        difficulty: 'medium',
        completed: false,
        progress: 4,
        requirements: ['Complete 5/5 shifts', 'No missed shifts']
      },
      {
        id: 'help_colleague',
        name: 'Help a Colleague',
        description: 'Assist a team member with their tasks or training',
        reward: 75,
        icon: Users,
        category: 'social',
        difficulty: 'medium',
        completed: false,
        requirements: ['Manager verification', 'Positive feedback']
      },
      {
        id: 'innovation_suggestion',
        name: 'Innovation Suggestion',
        description: 'Submit a process improvement idea that gets implemented',
        reward: 200,
        icon: Sparkles,
        category: 'achievement',
        difficulty: 'hard',
        completed: false,
        requirements: ['Written proposal', 'Management approval', 'Implementation']
      },
      {
        id: 'safety_champion',
        name: 'Safety Champion',
        description: 'Complete advanced safety training and mentor others',
        reward: 150,
        icon: Award,
        category: 'achievement',
        difficulty: 'hard',
        completed: false,
        requirements: ['Safety certification', 'Mentor 3 colleagues']
      }
    ]
  });

  // Fetch available rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<KarmaReward[]>({
    queryKey: ["/api/karma/rewards"],
    initialData: [
      {
        id: 'extra_break',
        name: 'Extra 15-Minute Break',
        description: 'Get an additional 15-minute break during your shift',
        cost: 100,
        icon: Coffee,
        category: 'benefits',
        availability: 5,
        claimed: 2,
        canClaim: true
      },
      {
        id: 'parking_spot',
        name: 'Reserved Parking Spot',
        description: 'Get a reserved parking spot for one week',
        cost: 200,
        icon: Target,
        category: 'benefits',
        availability: 2,
        claimed: 0,
        canClaim: true
      },
      {
        id: 'employee_month',
        name: 'Employee of the Month Nomination',
        description: 'Get nominated for Employee of the Month award',
        cost: 500,
        icon: Crown,
        category: 'recognition',
        availability: 1,
        claimed: 0,
        canClaim: true
      },
      {
        id: 'team_lunch',
        name: 'Team Lunch Voucher',
        description: '£25 voucher for team lunch at local restaurant',
        cost: 300,
        icon: Users,
        category: 'experiences',
        availability: 3,
        claimed: 1,
        canClaim: true
      },
      {
        id: 'branded_mug',
        name: 'Branded Coffee Mug',
        description: 'Premium company-branded coffee mug',
        cost: 150,
        icon: Coffee,
        category: 'merchandise',
        availability: 10,
        claimed: 4,
        canClaim: true
      },
      {
        id: 'hoodie',
        name: 'Company Hoodie',
        description: 'Comfortable branded hoodie in your size',
        cost: 400,
        icon: ShoppingCart,
        category: 'merchandise',
        availability: 8,
        claimed: 2,
        canClaim: false // User doesn't have enough coins
      }
    ]
  });

  // Fetch transaction history
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<KarmaTransaction[]>({
    queryKey: ["/api/karma/transactions", selectedPeriod],
    initialData: [
      {
        id: '1',
        type: 'earned',
        amount: 50,
        description: 'Completed Safety Training Course',
        date: '2024-10-28',
        category: 'learning'
      },
      {
        id: '2',
        type: 'earned',
        amount: 25,
        description: 'Early Timesheet Submission',
        date: '2024-10-27',
        category: 'performance'
      },
      {
        id: '3',
        type: 'spent',
        amount: 100,
        description: 'Redeemed Extra Break',
        date: '2024-10-26',
        category: 'benefits'
      },
      {
        id: '4',
        type: 'earned',
        amount: 75,
        description: 'Helped New Team Member',
        date: '2024-10-25',
        category: 'social'
      },
      {
        id: '5',
        type: 'earned',
        amount: 100,
        description: 'Perfect Attendance Week',
        date: '2024-10-22',
        category: 'attendance'
      }
    ]
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<KarmaLeaderboard[]>({
    queryKey: ["/api/karma/leaderboard"],
    initialData: [
      { rank: 1, userId: '1', firstName: 'Sarah', lastName: 'Johnson', karmaCoins: 2850, weeklyEarned: 450 },
      { rank: 2, userId: '2', firstName: 'Mike', lastName: 'Chen', karmaCoins: 2640, weeklyEarned: 380 },
      { rank: 3, userId: '3', firstName: 'Emma', lastName: 'Davis', karmaCoins: 2520, weeklyEarned: 320 },
      { rank: 4, userId: '4', firstName: 'John', lastName: 'Smith', karmaCoins: 2410, weeklyEarned: 290 },
      { rank: 5, userId: '5', firstName: 'Lisa', lastName: 'Wilson', karmaCoins: 2350, weeklyEarned: 275 }
    ]
  });

  // Fetch karma trends
  const { data: trends = [], isLoading: trendsLoading } = useQuery<KarmaTrend[]>({
    queryKey: ["/api/karma/trends", selectedPeriod],
    initialData: [
      { date: '2024-10-21', earned: 125, spent: 0, balance: 1000 },
      { date: '2024-10-22', earned: 100, spent: 0, balance: 1100 },
      { date: '2024-10-23', earned: 50, spent: 200, balance: 950 },
      { date: '2024-10-24', earned: 75, spent: 0, balance: 1025 },
      { date: '2024-10-25', earned: 75, spent: 0, balance: 1100 },
      { date: '2024-10-26', earned: 25, spent: 100, balance: 1025 },
      { date: '2024-10-27', earned: 25, spent: 0, balance: 1050 },
      { date: '2024-10-28', earned: 200, spent: 0, balance: 1250 }
    ]
  });

  // Claim activity reward mutation
  const claimActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const response = await apiRequest("POST", `/api/karma/claim-activity`, { activityId });
      return response.json();
    },
    onSuccess: (data, activityId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/karma/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/karma/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/karma/transactions"] });
      const activity = activities.find(a => a.id === activityId);
      toast({
        title: "Reward Claimed!",
        description: `You earned ${activity?.reward} karma coins for "${activity?.name}"`,
      });
    },
    onError: () => {
      toast({
        title: "Claim Failed",
        description: "Could not claim reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await apiRequest("POST", `/api/karma/redeem-reward`, { rewardId });
      return response.json();
    },
    onSuccess: (data, rewardId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/karma/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/karma/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/karma/transactions"] });
      const reward = rewards.find(r => r.id === rewardId);
      toast({
        title: "Reward Redeemed!",
        description: `You redeemed "${reward?.name}" for ${reward?.cost} karma coins`,
      });
    },
    onError: () => {
      toast({
        title: "Redemption Failed",
        description: "Could not redeem reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return BookOpen;
      case 'performance': return Target;
      case 'social': return Users;
      case 'attendance': return Calendar;
      case 'achievement': return Award;
      default: return Star;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <div className="space-y-6" data-testid="karma-coins">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Coins className="w-8 h-8 text-yellow-500" />
            Karma Coins
          </h2>
          <p className="text-muted-foreground">Earn coins through activities and redeem amazing rewards</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
            <Coins className="w-8 h-8" />
            {stats?.balance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">Your karma balance</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card data-testid="stat-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available coins
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-earned">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-weekly-earned">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.weeklyEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Earned this week
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-rank">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              #{stats?.rank}
            </div>
            <p className="text-xs text-muted-foreground">
              of {stats?.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-spent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <ShoppingCart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total redeemed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activities" data-testid="tab-activities">Earn Coins</TabsTrigger>
          <TabsTrigger value="rewards" data-testid="tab-rewards">Rewards</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Activities</h3>
            <div className="flex gap-2">
              {['all', 'learning', 'performance', 'social', 'attendance', 'achievement'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`filter-${category}`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {activities
              .filter(activity => selectedCategory === 'all' || activity.category === selectedCategory)
              .map((activity) => {
                const CategoryIcon = getCategoryIcon(activity.category);
                const isCompleted = activity.completed;
                const hasProgress = activity.progress !== undefined;
                
                return (
                  <Card key={activity.id} data-testid={`activity-${activity.id}`} className={isCompleted ? "bg-green-50 dark:bg-green-900/20" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <activity.icon className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {activity.name}
                              {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </CardTitle>
                            <CardDescription>{activity.description}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-lg font-bold text-yellow-600">+{activity.reward}</span>
                          </div>
                          <Badge variant="outline" className={getDifficultyColor(activity.difficulty)}>
                            {activity.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {hasProgress && !isCompleted && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Progress</span>
                              <span>{activity.progress}/5 completed</span>
                            </div>
                            <Progress value={(activity.progress! / 5) * 100} className="h-2" />
                          </div>
                        )}

                        {activity.requirements && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Requirements:</h5>
                            <ul className="space-y-1">
                              {activity.requirements.map((req, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4" />
                            <span className="text-sm capitalize">{activity.category}</span>
                          </div>
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Completed {activity.completedAt && formatDate(activity.completedAt)}</span>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => claimActivityMutation.mutate(activity.id)}
                              disabled={claimActivityMutation.isPending}
                              data-testid={`claim-${activity.id}`}
                            >
                              {claimActivityMutation.isPending ? "Claiming..." : "Claim Reward"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Your balance: <span className="font-bold text-yellow-600">{stats?.balance} coins</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} data-testid={`reward-${reward.id}`} className={!reward.canClaim ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
                      <reward.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{reward.name}</CardTitle>
                      <CardDescription className="text-sm">{reward.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-yellow-600">{reward.cost} coins</span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {reward.category}
                      </Badge>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Available</span>
                      <span>{reward.availability - reward.claimed}/{reward.availability}</span>
                    </div>
                    <Progress value={((reward.availability - reward.claimed) / reward.availability) * 100} className="h-2" />

                    <Button 
                      className="w-full"
                      onClick={() => redeemRewardMutation.mutate(reward.id)}
                      disabled={!reward.canClaim || redeemRewardMutation.isPending || reward.availability === reward.claimed}
                      data-testid={`redeem-${reward.id}`}
                    >
                      {!reward.canClaim && stats && stats.balance < reward.cost ? "Insufficient Coins" :
                       reward.availability === reward.claimed ? "Out of Stock" :
                       redeemRewardMutation.isPending ? "Redeeming..." : "Redeem"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Transaction History</h3>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  data-testid={`period-${period}`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Card data-testid="transaction-history">
            <CardContent className="p-0">
              <div className="space-y-0">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id} className={`p-4 ${index !== transactions.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${transaction.type === 'earned' ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'}`}>
                          {transaction.type === 'earned' ? 
                            <TrendingUp className="w-4 h-4 text-green-600" /> : 
                            <ShoppingCart className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.date)} • {transaction.category}</p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Karma Leaderboard</h3>
            <Badge variant="outline">Updated daily</Badge>
          </div>

          <Card data-testid="leaderboard">
            <CardContent className="p-0">
              <div className="space-y-0">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.userId === user?.id;
                  
                  return (
                    <div key={entry.userId} className={`p-4 ${index !== leaderboard.length - 1 ? 'border-b' : ''} ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${entry.rank <= 3 ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            {entry.rank === 1 ? <Crown className="w-5 h-5 text-yellow-600" /> :
                             entry.rank === 2 ? <Medal className="w-5 h-5 text-gray-600" /> :
                             entry.rank === 3 ? <Award className="w-5 h-5 text-orange-600" /> :
                             <span className="font-bold text-gray-600">#{entry.rank}</span>
                            }
                          </div>
                          <div>
                            <p className="font-medium">{entry.firstName} {entry.lastName} {isCurrentUser && '(You)'}</p>
                            <p className="text-sm text-muted-foreground">+{entry.weeklyEarned} this week</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-600">{entry.karmaCoins.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">karma coins</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Karma Analytics</h3>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  data-testid={`analytics-period-${period}`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Card data-testid="karma-trends-chart">
            <CardHeader>
              <CardTitle>Karma Trends</CardTitle>
              <CardDescription>Track your earning and spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="earned" stroke="#10b981" name="Earned" strokeWidth={2} />
                  <Line type="monotone" dataKey="spent" stroke="#ef4444" name="Spent" strokeWidth={2} />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Balance" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="earning-breakdown">
              <CardHeader>
                <CardTitle>Earning Breakdown</CardTitle>
                <CardDescription>Where you earn the most karma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Learning</span>
                    </div>
                    <span className="font-bold">450 coins</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Performance</span>
                    </div>
                    <span className="font-bold">320 coins</span>
                  </div>
                  <Progress value={42} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Social</span>
                    </div>
                    <span className="font-bold">225 coins</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Attendance</span>
                    </div>
                    <span className="font-bold">180 coins</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="spending-breakdown">
              <CardHeader>
                <CardTitle>Spending Breakdown</CardTitle>
                <CardDescription>Your reward preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-brown-600" />
                      <span className="text-sm">Benefits</span>
                    </div>
                    <span className="font-bold">800 coins</span>
                  </div>
                  <Progress value={70} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Merchandise</span>
                    </div>
                    <span className="font-bold">450 coins</span>
                  </div>
                  <Progress value={40} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Experiences</span>
                    </div>
                    <span className="font-bold">300 coins</span>
                  </div>
                  <Progress value={26} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}