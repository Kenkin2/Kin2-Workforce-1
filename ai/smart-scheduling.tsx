import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, User, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ScheduleRecommendation {
  workerId: string;
  shiftId: string;
  score: number;
  reasoning: string;
}

interface SmartSchedulingProps {
  jobId?: string;
}

export default function SmartScheduling({ jobId }: SmartSchedulingProps) {
  const [selectedJobId, setSelectedJobId] = useState(jobId || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<ScheduleRecommendation[]>({
    queryKey: ['/api/ai/schedule-recommendations', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const response = await apiRequest('POST', '/api/ai/schedule-recommendations', {
        jobId: selectedJobId,
      });
      return response as unknown as ScheduleRecommendation[];
    },
    enabled: !!selectedJobId,
  });

  const { data: workers } = useQuery<any[]>({
    queryKey: ['/api/workers'],
  });

  const getWorkerName = (workerId: string) => {
    const worker = workers?.find((w: any) => w.id === workerId);
    return worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown Worker';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Smart Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Job for AI Recommendations</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
            data-testid="select-job-ai-scheduling"
          >
            <option value="">Select a job...</option>
            {jobs?.map((job: any) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.location}
              </option>
            ))}
          </select>
        </div>

        {/* AI Recommendations */}
        {selectedJobId && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              AI Recommendations
            </h4>
            
            {isLoadingRecommendations ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                ))}
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec: ScheduleRecommendation, index: number) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`recommendation-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{getWorkerName(rec.workerId)}</span>
                          <Badge className={getScoreColor(rec.score)}>
                            {rec.score}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid={`button-assign-${index}`}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedJobId ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No scheduling recommendations available for this job.</p>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}