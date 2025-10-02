import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  MessageSquare, 
  Share2, 
  Users, 
  FileText, 
  Calendar, 
  Mic, 
  MicOff, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Clock, 
  Globe, 
  Lock,
  Send,
  Paperclip,
  Smile,
  Search,
  Plus,
  Settings
} from "lucide-react";

interface CollaborationRoom {
  id: string;
  name: string;
  type: 'meeting' | 'project' | 'team' | 'training';
  participants: Participant[];
  isActive: boolean;
  startTime?: string;
  features: string[];
  privacy: 'public' | 'private' | 'organization';
}

interface Participant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  permissions: string[];
}

interface Message {
  id: string;
  sender: Participant;
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'voice' | 'system';
  attachments?: any[];
}

const activeRooms: CollaborationRoom[] = [
  {
    id: 'daily-standup',
    name: 'Daily Team Standup',
    type: 'meeting',
    participants: [
      { id: '1', name: 'Sarah Chen', role: 'Team Lead', status: 'online', permissions: ['moderate', 'share_screen'] },
      { id: '2', name: 'Mike Johnson', role: 'Developer', status: 'online', permissions: ['speak', 'chat'] },
      { id: '3', name: 'Lisa Park', role: 'Designer', status: 'online', permissions: ['speak', 'chat'] },
      { id: '4', name: 'David Kim', role: 'QA Engineer', status: 'away', permissions: ['speak', 'chat'] }
    ],
    isActive: true,
    startTime: '09:00 AM',
    features: ['video_call', 'screen_share', 'chat', 'recording'],
    privacy: 'organization'
  },
  {
    id: 'project-alpha',
    name: 'Project Alpha Planning',
    type: 'project',
    participants: [
      { id: '1', name: 'Sarah Chen', role: 'Project Manager', status: 'online', permissions: ['moderate', 'share_screen', 'manage'] },
      { id: '5', name: 'John Smith', role: 'Architect', status: 'busy', permissions: ['speak', 'chat', 'share_screen'] },
      { id: '6', name: 'Emma Wilson', role: 'Developer', status: 'online', permissions: ['speak', 'chat'] }
    ],
    isActive: false,
    features: ['video_call', 'screen_share', 'chat', 'whiteboard', 'file_share'],
    privacy: 'private'
  },
  {
    id: 'training-session',
    name: 'New Employee Training',
    type: 'training',
    participants: [
      { id: '7', name: 'Mark Davis', role: 'Trainer', status: 'online', permissions: ['moderate', 'share_screen', 'manage'] },
      { id: '8', name: 'Alex Rodriguez', role: 'New Hire', status: 'online', permissions: ['speak', 'chat'] },
      { id: '9', name: 'Jessica Lee', role: 'New Hire', status: 'online', permissions: ['speak', 'chat'] }
    ],
    isActive: true,
    startTime: '02:00 PM',
    features: ['video_call', 'screen_share', 'chat', 'recording', 'quiz'],
    privacy: 'organization'
  }
];

const recentMessages: Message[] = [
  {
    id: '1',
    sender: { id: '1', name: 'Sarah Chen', role: 'Team Lead', status: 'online', permissions: [] },
    content: 'Good morning everyone! Ready for our standup?',
    timestamp: '09:00 AM',
    type: 'text'
  },
  {
    id: '2',
    sender: { id: '2', name: 'Mike Johnson', role: 'Developer', status: 'online', permissions: [] },
    content: 'Yes! I completed the user authentication module yesterday.',
    timestamp: '09:01 AM',
    type: 'text'
  },
  {
    id: '3',
    sender: { id: '3', name: 'Lisa Park', role: 'Designer', status: 'online', permissions: [] },
    content: 'I have the new mockups ready to share.',
    timestamp: '09:02 AM',
    type: 'text',
    attachments: [{ name: 'mockups_v2.fig', size: '2.4 MB' }]
  }
];

export default function CollaborationHub() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<CollaborationRoom | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(recentMessages);

  const handleJoinRoom = (room: CollaborationRoom) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join collaboration rooms.",
        variant: "destructive",
      });
      return;
    }

    setSelectedRoom(room);
    toast({
      title: "Joined Room",
      description: `You've joined ${room.name}`,
    });
  };

  const handleStartMeeting = () => {
    toast({
      title: "Meeting Started",
      description: "Video call has been initiated. Inviting participants...",
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: { id: 'current', name: 'You', role: 'User', status: 'online', permissions: [] },
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'meeting': return Video;
      case 'project': return FileText;
      case 'team': return Users;
      case 'training': return Calendar;
      default: return MessageSquare;
    }
  };

  return (
    <AppLayout 
      title="Collaboration Hub"
      breadcrumbs={[{ label: "Resources", href: "/dashboard" }, { label: "Collaboration" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Collaboration Hub
            </h2>
            <p className="text-muted-foreground">Real-time collaboration and communication tools</p>
          </div>
          <div className="flex items-center gap-2">
            <Button data-testid="button-create-room">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rooms" data-testid="tab-rooms">Active Rooms</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="calls" data-testid="tab-calls">Video Calls</TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">Shared Files</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                className="h-20 flex-col gap-2" 
                variant="outline"
                onClick={handleStartMeeting}
                data-testid="button-start-meeting"
              >
                <Video className="w-6 h-6" />
                Start Meeting
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <MessageSquare className="w-6 h-6" />
                Team Chat
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Monitor className="w-6 h-6" />
                Screen Share
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Share2 className="w-6 h-6" />
                Share Files
              </Button>
            </div>

            {/* Active Rooms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeRooms.map((room) => {
                const RoomIcon = getRoomIcon(room.type);
                
                return (
                  <Card 
                    key={room.id} 
                    className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      room.isActive ? 'border-green-500/50 bg-green-500/5' : ''
                    }`}
                    onClick={() => handleJoinRoom(room)}
                    data-testid={`card-room-${room.id}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            room.isActive ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            <RoomIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">{room.type}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {room.isActive && (
                            <Badge className="bg-green-500 text-white flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              Live
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            {room.privacy === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            <span className="text-xs text-muted-foreground">{room.privacy}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {room.startTime && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {room.isActive ? 'Started at' : 'Scheduled for'} {room.startTime}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Participants ({room.participants.length}):</p>
                        <div className="flex -space-x-2">
                          {room.participants.slice(0, 4).map((participant) => (
                            <div
                              key={participant.id}
                              className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background"
                              title={participant.name}
                            >
                              <span className="text-xs font-medium">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </span>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(participant.status)}`} />
                            </div>
                          ))}
                          {room.participants.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs">
                              +{room.participants.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {room.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                        {room.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.features.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full"
                        variant={room.isActive ? "default" : "outline"}
                        data-testid={`button-join-${room.id}`}
                      >
                        {room.isActive ? 'Join Now' : 'Schedule Join'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card className="h-96">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Team Chat
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Online: 12</Badge>
                    <Button size="sm" variant="outline">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex-1 space-y-3 max-h-48 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {message.sender.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.sender.name}</span>
                          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Paperclip className="w-3 h-3" />
                            {message.attachments[0].name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    data-testid="input-message"
                  />
                  <Button size="sm" variant="outline">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-6">
            {selectedRoom && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    {selectedRoom.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Call Interface */}
                  <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center text-white relative">
                    <div className="text-center">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p>Video call in progress...</p>
                      <p className="text-sm text-gray-400">{selectedRoom.participants.length} participants</p>
                    </div>
                    
                    {/* Call Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        size="sm"
                        variant={isAudioEnabled ? "default" : "destructive"}
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                        data-testid="button-toggle-audio"
                      >
                        {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant={isVideoEnabled ? "default" : "destructive"}
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                        data-testid="button-toggle-video"
                      >
                        {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant={isScreenSharing ? "default" : "outline"}
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <PhoneOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedRoom.participants.map((participant) => (
                      <Card key={participant.id} className="text-center">
                        <CardContent className="p-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                            <span className="text-sm font-medium">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">{participant.role}</p>
                          <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${getStatusColor(participant.status)}`} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Project_Proposal.pdf', size: '2.4 MB', type: 'pdf', sharedBy: 'Sarah Chen', date: '2 hours ago' },
                { name: 'Design_Mockups.fig', size: '8.1 MB', type: 'figma', sharedBy: 'Lisa Park', date: '1 day ago' },
                { name: 'Meeting_Recording.mp4', size: '145 MB', type: 'video', sharedBy: 'Mike Johnson', date: '3 days ago' },
                { name: 'Spreadsheet_Data.xlsx', size: '1.2 MB', type: 'excel', sharedBy: 'David Kim', date: '1 week ago' }
              ].map((file, index) => (
                <Card key={index} className="transition-all duration-300 hover:shadow-md cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                        <p className="text-xs text-muted-foreground">Shared by {file.sharedBy}</p>
                        <p className="text-xs text-muted-foreground">{file.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}