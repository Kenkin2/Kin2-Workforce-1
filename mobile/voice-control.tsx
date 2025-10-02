import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceControl } from '@/hooks/useMobileFeatures';
import { useMobileIntegration, useVoiceCommandIntegration } from '@/hooks/useMobileIntegration';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function VoiceControlWidget() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    lastCommand,
    startListening,
    stopListening,
    speak,
  } = useVoiceControl();

  const { executeVoiceCommand: integratedExecuteCommand } = useMobileIntegration();
  const { isProcessing } = useVoiceCommandIntegration();

  const [isEnabled, setIsEnabled] = useState(false);

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async (action: 'in' | 'out') => {
      return apiRequest('POST', '/api/mobile/clock', { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/data'] });
    },
  });

  // Listen for clock action events from voice commands
  useEffect(() => {
    const handleClockAction = (event: CustomEvent) => {
      const { action } = event.detail;
      clockMutation.mutate(action);
    };

    window.addEventListener('mobile-clock-action', handleClockAction as EventListener);
    return () => {
      window.removeEventListener('mobile-clock-action', handleClockAction as EventListener);
    };
  }, [clockMutation]);

  useEffect(() => {
    if (lastCommand && isEnabled) {
      integratedExecuteCommand(lastCommand.action);
      executeVoiceCommand(lastCommand.action);
    }
  }, [lastCommand, isEnabled, integratedExecuteCommand]);

  const executeVoiceCommand = async (action: string) => {
    switch (action) {
      case 'clock_in':
        speak('Clocking you in now');
        await clockMutation.mutateAsync('in');
        speak('Successfully clocked in');
        break;
      
      case 'clock_out':
        speak('Clocking you out now');
        await clockMutation.mutateAsync('out');
        speak('Successfully clocked out');
        break;
      
      case 'show_jobs':
        speak('Navigating to jobs page');
        setLocation('/jobs');
        break;
      
      case 'show_schedule':
        speak('Showing your schedule');
        setLocation('/schedule');
        break;
      
      case 'navigate_dashboard':
        speak('Going to dashboard');
        setLocation('/');
        break;
      
      case 'open_camera':
        speak('Opening camera for photo capture');
        break;
      
      case 'show_notifications':
        speak('Showing notifications');
        break;
      
      default:
        speak('Command not recognized');
    }
  };

  const toggleVoiceControl = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
    if (!isEnabled) {
      speak('Voice control enabled');
    } else {
      speak('Voice control disabled');
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MicOff className="w-5 h-5 mr-2" />
            Voice Control
          </CardTitle>
          <CardDescription>Voice control is not supported on this device</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Voice Control
          </div>
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Control the app with voice commands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button
            onClick={toggleEnabled}
            variant={isEnabled ? 'default' : 'outline'}
            className="flex-1"
            data-testid="button-toggle-voice-control"
          >
            {isEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
          
          {isEnabled && (
            <Button
              onClick={toggleVoiceControl}
              variant={isListening ? 'destructive' : 'secondary'}
              disabled={!isEnabled}
              data-testid="button-voice-listen"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {isEnabled && (
          <>
            {isListening && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Listening...
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-4 bg-blue-500 rounded animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
                {transcript && (
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    "{transcript}"
                  </p>
                )}
              </div>
            )}

            {lastCommand && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Last Command
                  </span>
                  <Badge variant="secondary">
                    {Math.round(lastCommand.confidence * 100)}% confident
                  </Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  "{lastCommand.command}" → {lastCommand.action.replace('_', ' ')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Available Commands:</h4>
              <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                <div>"Clock in" or "Start work"</div>
                <div>"Clock out" or "End work"</div>
                <div>"Show jobs" or "View jobs"</div>
                <div>"Show schedule" or "My schedule"</div>
                <div>"Go to dashboard"</div>
                <div>"Take photo" or "Open camera"</div>
                <div>"Show notifications"</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function VoiceAssistant() {
  const { speak } = useVoiceControl();
  
  const speakText = (text: string) => {
    speak(text);
  };

  const announceNotification = (title: string, message: string) => {
    speak(`New notification: ${title}. ${message}`);
  };

  const announceJobUpdate = (jobTitle: string, status: string) => {
    speak(`Job update: ${jobTitle} is now ${status}`);
  };

  const announceShiftReminder = (timeUntil: string) => {
    speak(`Reminder: Your shift starts in ${timeUntil}`);
  };

  return {
    speak: speakText,
    announceNotification,
    announceJobUpdate,
    announceShiftReminder,
  };
}