import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Brain, Briefcase, Star, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface JobMatch {
  jobId: string;
  workerId: string;
  score: number;
  reasoning: string;
}

interface JobMatchingProps {
  className?: string;
}

export default function JobMatching({ className }: JobMatchingProps) {
  const [selectedJobId, setSelectedJobId] = useState('');

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: workers } = useQuery<any[]>({
    queryKey: ['/api/workers'],
  });

  const { data: matches, isLoading: isLoadingMatches } = useQuery<JobMatch[]>({
    queryKey: ['/api/ai/job-match', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const response = await apiRequest('POST', '/api/ai/job-match', {
        jobId: selectedJobId,
      });
      return response as unknown as JobMatch[];
    },
    enabled: !!selectedJobId,
  });

  const getWorker = (workerId: string) => {
    return workers?.find((w: any) => w.id === workerId);
  };

  const getJob = (jobId: string) => {
    return jobs?.find((j: any) => j.id === jobId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Job Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Job for AI Matching</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
            data-testid="select-job-ai-matching"
          >
            <option value="">Select a job...</option>
            {jobs?.map((job: any) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.location}
              </option>
            ))}
          </select>
        </div>

        {/* Job Details */}
        {selectedJobId && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="font-medium">{getJob(selectedJobId)?.title}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getJob(selectedJobId)?.description}
            </p>
          </div>
        )}

        {/* AI Matches */}
        {selectedJobId && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Top Worker Matches
            </h4>
            
            {isLoadingMatches ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : matches && matches.length > 0 ? (
              <div className="space-y-3">
                {matches.slice(0, 5).map((match: JobMatch, index: number) => {
                  const worker = getWorker(match.workerId);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`match-${index}`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={worker?.profileImageUrl} />
                        <AvatarFallback>
                          {worker?.firstName?.[0]}{worker?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {worker?.firstName} {worker?.lastName}
                          </span>
                          <Badge className={getScoreColor(match.score)}>
                            {match.score}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {match.reasoning}
                        </p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid={`button-hire-${index}`}
                      >
                        Hire
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : selectedJobId ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No suitable worker matches found for this job.</p>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}