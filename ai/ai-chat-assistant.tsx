import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Bot, 
  User, 
  Lightbulb,
  TrendingUp,
  Clock,
  Zap,
  Brain,
  Settings
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  metadata?: any;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  context: 'workforce' | 'performance' | 'scheduling' | 'general';
  createdAt: Date;
}

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: "Hello! I'm your AI workforce assistant. I can help with performance analytics, scheduling optimization, employee insights, and strategic recommendations. What would you like to explore?",
      timestamp: new Date(),
      suggestions: [
        "Analyze team performance trends",
        "Optimize next week's schedule", 
        "Review employee satisfaction",
        "Identify productivity improvements"
      ]
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatContext, setChatContext] = useState<'workforce' | 'performance' | 'scheduling' | 'general'>('general');
  const [sessionId] = useState(`chat_${Date.now()}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<any>(null);

  // Initialize speech capabilities
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = false;
      speechRecognitionRef.current.lang = 'en-US';
      
      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsListening(false);
      };
      
      speechRecognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // AI Chat Mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: chatContext,
          sessionId,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        metadata: data.metadata
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Text-to-speech for assistant responses
      if (speechSynthesisRef.current && data.response) {
        speakText(data.response);
      }
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user', 
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(currentMessage);
    setCurrentMessage("");
  };

  const handleVoiceInput = () => {
    if (!speechRecognitionRef.current) return;
    
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesisRef.current) return;
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current.speak(utterance);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'workforce': return <User className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'scheduling': return <Clock className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Workforce Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getContextIcon(chatContext)}
              {chatContext}
            </Badge>
            <select 
              value={chatContext}
              onChange={(e) => setChatContext(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="general">General</option>
              <option value="workforce">Workforce</option>
              <option value="performance">Performance</option>
              <option value="scheduling">Scheduling</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                } rounded-lg p-3 space-y-2`}>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    {message.type === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* AI Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask me anything about workforce management..."
                className="min-h-[40px] max-h-[100px] resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={handleVoiceInput}
                disabled={!speechRecognitionRef.current}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || chatMutation.isPending}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestionClick("What's our team's current performance status?")}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Performance
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestionClick("Help me optimize tomorrow's schedule")}
            >
              <Clock className="h-3 w-3 mr-1" />
              Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestionClick("Suggest productivity improvements")}
            >
              <Zap className="h-3 w-3 mr-1" />
              Optimize
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestionClick("Generate insights from recent data")}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Insights
            </Button>
          </div>
          
          {isListening && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Listening... Speak now
            </div>
          )}
          
          {isSpeaking && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-3 w-3" />
              Speaking...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}