import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText,
  Lightbulb,
  Zap,
  Users,
  Calendar,
  CreditCard,
  Shield,
  ExternalLink,
  Star,
  Clock
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  rating: number;
  isPopular?: boolean;
  isNew?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  color: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Kin2 Workforce',
    description: 'Complete guide to setting up your account and first job posting',
    category: 'Getting Started',
    difficulty: 'beginner',
    readTime: 5,
    rating: 4.8,
    isPopular: true
  },
  {
    id: '2',
    title: 'Advanced Scheduling Features',
    description: 'Learn to use AI-powered scheduling and conflict resolution',
    category: 'Scheduling',
    difficulty: 'intermediate',
    readTime: 8,
    rating: 4.6,
    isNew: true
  },
  {
    id: '3',
    title: 'GDPR Compliance Setup',
    description: 'Configure your platform for GDPR compliance and data protection',
    category: 'Compliance',
    difficulty: 'advanced',
    readTime: 12,
    rating: 4.9
  },
  {
    id: '4',
    title: 'Payment Processing Guide',
    description: 'Set up automated payments and manage worker compensation',
    category: 'Payments',
    difficulty: 'intermediate',
    readTime: 7,
    rating: 4.7,
    isPopular: true
  },
  {
    id: '5',
    title: 'Mobile App Features',
    description: 'Use the mobile PWA for on-the-go workforce management',
    category: 'Mobile',
    difficulty: 'beginner',
    readTime: 4,
    rating: 4.5
  },
  {
    id: '6',
    title: 'Analytics and Reporting',
    description: 'Generate insights from your workforce data and performance metrics',
    category: 'Analytics',
    difficulty: 'intermediate',
    readTime: 10,
    rating: 4.6
  }
];

const faqItems: FAQItem[] = [
  {
    question: 'How do I create my first job posting?',
    answer: 'Navigate to the Jobs section in the sidebar, click "Create Job", fill in the details including title, description, pay rate, and requirements, then publish it.',
    category: 'jobs'
  },
  {
    question: 'Can I schedule recurring shifts?',
    answer: 'Yes! Go to Advanced Scheduling, create a shift template, and set it to recurring. You can generate multiple weeks of shifts automatically.',
    category: 'scheduling'
  },
  {
    question: 'How does the compliance dashboard work?',
    answer: 'The compliance dashboard monitors 7 major regulations automatically. It runs assessments, tracks violations, and generates reports for auditors.',
    category: 'compliance'
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We support all major payment methods through Stripe including credit cards, bank transfers, and digital wallets. Payments are processed securely.',
    category: 'payments'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade security including encryption, audit trails, and compliance with GDPR, HIPAA, and other regulations.',
    category: 'security'
  },
  {
    question: 'Can I access the platform on mobile?',
    answer: 'Yes! Kin2 Workforce is a progressive web app (PWA) that works seamlessly on mobile devices with offline capabilities.',
    category: 'mobile'
  }
];

export function HelpCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [, setLocation] = useLocation();

  const quickActions: QuickAction[] = [
    {
      title: 'Start Guided Tour',
      description: 'Take a tour of the main features',
      icon: Zap,
      action: () => {},
      color: 'bg-blue-500'
    },
    {
      title: 'Create First Job',
      description: 'Post your first job quickly',
      icon: Users,
      action: () => setLocation('/jobs'),
      color: 'bg-green-500'
    },
    {
      title: 'Schedule Demo',
      description: 'Book a personalized demo',
      icon: Calendar,
      action: () => {},
      color: 'bg-purple-500'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageCircle,
      action: () => {},
      color: 'bg-orange-500'
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           article.category.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = faqItems.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'jobs', 'scheduling', 'compliance', 'payments', 'mobile', 'analytics'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Help Center</h2>
                <p className="text-muted-foreground">Find answers and get support</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, FAQs, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <Tabs defaultValue="quick-start" className="p-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            {/* Quick Start Tab */}
            <TabsContent value="quick-start" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg text-white ${action.color}`}>
                            <action.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{action.title}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Popular Topics</h3>
                <div className="space-y-3">
                  {helpArticles.filter(a => a.isPopular).map(article => (
                    <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{article.title}</h4>
                          <p className="text-sm text-muted-foreground">{article.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{article.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground">{article.readTime} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map(article => (
                  <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{article.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                        </div>
                        {article.isNew && <Badge className="ml-2">New</Badge>}
                        {article.isPopular && <Badge variant="secondary" className="ml-2">Popular</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{article.readTime} min read</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{article.rating}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">{article.category}</Badge>
                        <Badge variant="outline" className="text-xs ml-2 capitalize">{article.difficulty}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                    <Badge variant="outline" className="mt-2 text-xs capitalize">{faq.category}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Live Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Get instant help from our support team</p>
                    <Button className="w-full">Start Chat</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Video Tutorials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Watch step-by-step video guides</p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit YouTube Channel
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Comprehensive technical documentation</p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Docs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Community
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Connect with other users and experts</p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join Community
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Lightbulb className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Still need help?</h3>
                    <p className="text-muted-foreground mb-4">
                      Our support team is available 24/7 to assist you with any questions or issues.
                    </p>
                    <Button>Contact Support Team</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}