import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Search, 
  Filter, 
  Star, 
  Download, 
  Zap, 
  Clock, 
  Users, 
  BarChart3, 
  Shield, 
  Cpu,
  Globe,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  FileText,
  Camera,
  MessageSquare,
  Settings,
  Database,
  Cloud
} from "lucide-react";

interface MarketplaceApp {
  id: string;
  name: string;
  developer: string;
  category: 'productivity' | 'analytics' | 'communication' | 'automation' | 'security' | 'integration';
  description: string;
  longDescription: string;
  icon: any;
  price: number;
  priceType: 'free' | 'one-time' | 'monthly' | 'per-user';
  rating: number;
  downloads: number;
  featured?: boolean;
  verified?: boolean;
  screenshots: string[];
  features: string[];
  requirements: string[];
  permissions: string[];
  lastUpdated: string;
  version: string;
}

const marketplaceApps: MarketplaceApp[] = [
  {
    id: 'smart-analytics-pro',
    name: 'Smart Analytics Pro',
    developer: 'DataVision Inc.',
    category: 'analytics',
    description: 'Advanced workforce analytics with machine learning insights and predictive modeling',
    longDescription: 'Transform your workforce data into actionable insights with our advanced analytics platform. Features include predictive modeling, real-time dashboards, custom reporting, and AI-powered recommendations.',
    icon: BarChart3,
    price: 49,
    priceType: 'monthly',
    rating: 4.8,
    downloads: 12543,
    featured: true,
    verified: true,
    screenshots: ['/screenshots/analytics-1.png', '/screenshots/analytics-2.png'],
    features: [
      'Real-time workforce analytics',
      'Predictive performance modeling',
      'Custom dashboard builder',
      'Automated report generation',
      'AI-powered insights',
      'Data export capabilities'
    ],
    requirements: ['Professional plan or higher', 'Minimum 50 employees'],
    permissions: ['Read workforce data', 'Generate reports', 'Create dashboards'],
    lastUpdated: '2025-08-15',
    version: '2.4.1'
  },
  {
    id: 'team-communicator',
    name: 'Team Communicator',
    developer: 'ConnectFlow',
    category: 'communication',
    description: 'Seamless team communication with video calls, messaging, and file sharing',
    longDescription: 'Keep your workforce connected with our comprehensive communication platform. Includes video conferencing, instant messaging, file sharing, and integration with your existing workforce management tools.',
    icon: MessageSquare,
    price: 0,
    priceType: 'free',
    rating: 4.6,
    downloads: 28475,
    featured: true,
    verified: true,
    screenshots: ['/screenshots/comm-1.png', '/screenshots/comm-2.png'],
    features: [
      'HD video conferencing',
      'Instant messaging',
      'File sharing and storage',
      'Screen sharing',
      'Team channels',
      'Mobile app support'
    ],
    requirements: ['Any plan'],
    permissions: ['Access camera and microphone', 'Send notifications', 'File storage access'],
    lastUpdated: '2025-08-20',
    version: '1.8.2'
  },
  {
    id: 'security-guardian',
    name: 'Security Guardian',
    developer: 'CyberShield Systems',
    category: 'security',
    description: 'Advanced security monitoring and threat detection for workforce data',
    longDescription: 'Protect your workforce data with enterprise-grade security monitoring. Features include real-time threat detection, access monitoring, compliance reporting, and automated security responses.',
    icon: Shield,
    price: 89,
    priceType: 'monthly',
    rating: 4.9,
    downloads: 7892,
    verified: true,
    screenshots: ['/screenshots/security-1.png', '/screenshots/security-2.png'],
    features: [
      'Real-time threat detection',
      'Access monitoring and logging',
      'Compliance reporting',
      'Automated incident response',
      'Security analytics',
      'Multi-factor authentication'
    ],
    requirements: ['Enterprise plan', 'Admin permissions'],
    permissions: ['Monitor system access', 'Generate security reports', 'Manage user permissions'],
    lastUpdated: '2025-08-18',
    version: '3.1.0'
  },
  {
    id: 'payroll-plus',
    name: 'Payroll Plus',
    developer: 'FinanceFlow',
    category: 'automation',
    description: 'Automated payroll processing with tax calculations and compliance',
    longDescription: 'Streamline your payroll process with automated calculations, tax compliance, direct deposits, and comprehensive reporting. Supports multiple pay periods and complex compensation structures.',
    icon: CreditCard,
    price: 25,
    priceType: 'per-user',
    rating: 4.7,
    downloads: 15632,
    verified: true,
    screenshots: ['/screenshots/payroll-1.png', '/screenshots/payroll-2.png'],
    features: [
      'Automated payroll calculations',
      'Tax compliance and filing',
      'Direct deposit management',
      'Benefits administration',
      'Overtime calculations',
      'Pay stub generation'
    ],
    requirements: ['Professional plan or higher'],
    permissions: ['Access employee data', 'Process payments', 'Generate tax documents'],
    lastUpdated: '2025-08-12',
    version: '4.2.3'
  },
  {
    id: 'calendar-sync',
    name: 'Calendar Sync Pro',
    developer: 'TimeWise Apps',
    category: 'productivity',
    description: 'Synchronize schedules across multiple calendar platforms and devices',
    longDescription: 'Keep everyone synchronized with our powerful calendar integration. Supports Google Calendar, Outlook, Apple Calendar, and more. Features include automatic conflict detection and resolution.',
    icon: Calendar,
    price: 15,
    priceType: 'monthly',
    rating: 4.5,
    downloads: 9847,
    screenshots: ['/screenshots/calendar-1.png', '/screenshots/calendar-2.png'],
    features: [
      'Multi-platform calendar sync',
      'Conflict detection and resolution',
      'Automatic schedule updates',
      'Meeting room booking',
      'Timezone support',
      'Mobile synchronization'
    ],
    requirements: ['Starter plan or higher'],
    permissions: ['Access calendar data', 'Send calendar invites', 'Sync across platforms'],
    lastUpdated: '2025-08-10',
    version: '1.5.4'
  },
  {
    id: 'crm-connector',
    name: 'CRM Connector',
    developer: 'IntegrationHub',
    category: 'integration',
    description: 'Connect with popular CRM platforms for seamless customer management',
    longDescription: 'Bridge your workforce management with customer relationship management. Supports Salesforce, HubSpot, Pipedrive, and 20+ other CRM platforms with real-time data synchronization.',
    icon: Database,
    price: 199,
    priceType: 'one-time',
    rating: 4.4,
    downloads: 5621,
    verified: true,
    screenshots: ['/screenshots/crm-1.png', '/screenshots/crm-2.png'],
    features: [
      'Multi-CRM platform support',
      'Real-time data synchronization',
      'Custom field mapping',
      'Automated workflow triggers',
      'Data validation and cleanup',
      'Performance tracking'
    ],
    requirements: ['Professional plan or higher', 'CRM system access'],
    permissions: ['Access CRM data', 'Sync customer information', 'Create automated workflows'],
    lastUpdated: '2025-08-14',
    version: '2.1.7'
  },
  {
    id: 'cloud-backup',
    name: 'Cloud Backup Suite',
    developer: 'SecureCloud Inc.',
    category: 'security',
    description: 'Automated cloud backups with encryption and disaster recovery',
    longDescription: 'Protect your workforce data with automated cloud backups, enterprise-grade encryption, and comprehensive disaster recovery. Supports multiple cloud providers and compliance standards.',
    icon: Cloud,
    price: 39,
    priceType: 'monthly',
    rating: 4.8,
    downloads: 11234,
    verified: true,
    screenshots: ['/screenshots/backup-1.png', '/screenshots/backup-2.png'],
    features: [
      'Automated daily backups',
      'End-to-end encryption',
      'Multi-cloud support',
      'Point-in-time recovery',
      'Compliance reporting',
      'Backup verification'
    ],
    requirements: ['Professional plan or higher'],
    permissions: ['Access system data', 'Cloud storage access', 'Backup scheduling'],
    lastUpdated: '2025-08-16',
    version: '3.0.2'
  },
  {
    id: 'ai-assistant',
    name: 'AI Workforce Assistant',
    developer: 'AI Innovations Lab',
    category: 'automation',
    description: 'Intelligent AI assistant for workforce optimization and decision support',
    longDescription: 'Leverage the power of AI to optimize your workforce management. Features include intelligent scheduling, performance recommendations, predictive analytics, and natural language query support.',
    icon: Cpu,
    price: 79,
    priceType: 'monthly',
    rating: 4.9,
    downloads: 8765,
    featured: true,
    verified: true,
    screenshots: ['/screenshots/ai-1.png', '/screenshots/ai-2.png'],
    features: [
      'Intelligent scheduling optimization',
      'Performance recommendations',
      'Natural language queries',
      'Predictive workforce analytics',
      'Automated decision support',
      'Machine learning insights'
    ],
    requirements: ['Enterprise plan or AI Premium plan'],
    permissions: ['Access all workforce data', 'Generate AI insights', 'Make optimization recommendations'],
    lastUpdated: '2025-08-22',
    version: '1.2.0'
  }
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'communication', label: 'Communication' },
  { value: 'automation', label: 'Automation' },
  { value: 'security', label: 'Security' },
  { value: 'integration', label: 'Integration' }
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' }
];

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [installedApps, setInstalledApps] = useState<string[]>(['team-communicator']);
  const [filteredApps, setFilteredApps] = useState(marketplaceApps);

  useEffect(() => {
    let filtered = marketplaceApps;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    // Sort apps
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case 'popular':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleInstallApp = async (appId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to install apps.",
        variant: "destructive",
      });
      return;
    }

    const app = marketplaceApps.find(a => a.id === appId);
    if (!app) return;

    if (installedApps.includes(appId)) {
      toast({
        title: "Already Installed",
        description: `${app.name} is already installed.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Installing App",
      description: `Installing ${app.name}...`,
    });

    // Simulate installation process
    setTimeout(() => {
      setInstalledApps(prev => [...prev, appId]);
      toast({
        title: "Installation Complete",
        description: `${app.name} has been successfully installed!`,
      });
    }, 2000);
  };

  const formatPrice = (app: MarketplaceApp) => {
    if (app.priceType === 'free') return 'Free';
    if (app.priceType === 'one-time') return `$${app.price}`;
    if (app.priceType === 'per-user') return `$${app.price}/user/month`;
    return `$${app.price}/month`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <AppLayout 
      title="Marketplace"
      breadcrumbs={[{ label: "Resources", href: "/dashboard" }, { label: "Marketplace" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              App Marketplace
            </h2>
            <p className="text-muted-foreground">Extend your workforce management with powerful integrations</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {installedApps.length} Installed
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search apps, developers, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-apps"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" data-testid="tab-browse">Browse Apps</TabsTrigger>
            <TabsTrigger value="installed" data-testid="tab-installed">
              Installed ({installedApps.length})
            </TabsTrigger>
            <TabsTrigger value="featured" data-testid="tab-featured">Featured</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Featured Apps Section */}
            {selectedCategory === 'all' && searchQuery === '' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Featured Apps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceApps
                    .filter(app => app.featured)
                    .slice(0, 3)
                    .map((app) => {
                      const Icon = app.icon;
                      const isInstalled = installedApps.includes(app.id);
                      
                      return (
                        <Card key={app.id} className="transition-all duration-300 hover:shadow-lg" data-testid={`card-featured-${app.id}`}>
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{app.name}</CardTitle>
                                  <p className="text-sm text-muted-foreground">{app.developer}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="secondary">Featured</Badge>
                                {app.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{app.description}</p>
                            <div className="flex items-center justify-between">
                              {renderStars(app.rating)}
                              <span className="text-sm text-muted-foreground">
                                {app.downloads.toLocaleString()} downloads
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-lg">{formatPrice(app)}</span>
                              <Button
                                onClick={() => handleInstallApp(app.id)}
                                disabled={isInstalled}
                                variant={isInstalled ? "outline" : "default"}
                                data-testid={`button-install-${app.id}`}
                              >
                                {isInstalled ? "Installed" : "Install"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* All Apps Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedCategory === 'all' ? 'All Apps' : `${categories.find(c => c.value === selectedCategory)?.label} Apps`}
                  <span className="text-muted-foreground ml-2">({filteredApps.length})</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredApps.map((app) => {
                  const Icon = app.icon;
                  const isInstalled = installedApps.includes(app.id);
                  
                  return (
                    <Card key={app.id} className="transition-all duration-300 hover:shadow-lg" data-testid={`card-app-${app.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm truncate">{app.name}</CardTitle>
                            <p className="text-xs text-muted-foreground truncate">{app.developer}</p>
                          </div>
                          {app.verified && (
                            <Badge variant="outline" className="text-xs">✓</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>{app.rating}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {app.downloads > 1000 ? `${Math.round(app.downloads / 1000)}k` : app.downloads} downloads
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{formatPrice(app)}</span>
                          <Button
                            size="sm"
                            onClick={() => handleInstallApp(app.id)}
                            disabled={isInstalled}
                            variant={isInstalled ? "outline" : "default"}
                            data-testid={`button-install-${app.id}`}
                          >
                            {isInstalled ? "✓" : "Install"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="installed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceApps
                .filter(app => installedApps.includes(app.id))
                .map((app) => {
                  const Icon = app.icon;
                  
                  return (
                    <Card key={app.id} className="border-green-500/20 bg-green-500/5" data-testid={`card-installed-${app.id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{app.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{app.developer}</p>
                          </div>
                          <Badge className="bg-green-500 text-white">Installed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{app.description}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Open App
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceApps
                .filter(app => app.featured)
                .map((app) => {
                  const Icon = app.icon;
                  const isInstalled = installedApps.includes(app.id);
                  
                  return (
                    <Card key={app.id} className="border-primary/20 bg-primary/5" data-testid={`card-featured-detail-${app.id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{app.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{app.developer}</p>
                            </div>
                          </div>
                          <Badge className="bg-primary text-white">Featured</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{app.longDescription}</p>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Key Features:</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {app.features.slice(0, 4).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-primary rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center justify-between">
                          {renderStars(app.rating)}
                          <span className="font-semibold text-lg">{formatPrice(app)}</span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleInstallApp(app.id)}
                          disabled={isInstalled}
                          variant={isInstalled ? "outline" : "default"}
                          data-testid={`button-install-featured-${app.id}`}
                        >
                          {isInstalled ? "Installed" : "Install App"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}