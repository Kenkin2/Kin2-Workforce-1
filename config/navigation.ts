import { 
  LayoutDashboard, Brain, User, Calculator, Handshake, Settings, 
  Briefcase, ListTodo, Calendar, CalendarPlus, Clock, CreditCard, 
  MapPin, Shield, Users, Building, Warehouse, Box, FileText, 
  BarChart3, Zap, GraduationCap, ChartBar, Plug, ShieldCheck, 
  Gavel, Building2, Smartphone, PoundSterling, Store, MessageSquare,
  Crown, GitBranch as Workflow, Palette, Coins, Target, TrendingUp,
  Lock, Layers
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
}

export interface NavigationGroup {
  name: string;
  icon: any;
  items: NavigationItem[];
  defaultOpen?: boolean;
}

// Task-based navigation groups (replaces flat lists)
export const navigationGroups: NavigationGroup[] = [
  {
    name: "Quick Access",
    icon: Target,
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, badge: null },
      { name: "AI Intelligence", href: "/ai", icon: Brain, badge: "New" },
    ]
  },
  {
    name: "Work Management",
    icon: Briefcase,
    defaultOpen: true,
    items: [
      { name: "Jobs", href: "/jobs", icon: Briefcase, badge: "12" },
      { name: "Gig Management", href: "/gig-management", icon: ListTodo, badge: null },
      { name: "Schedule", href: "/schedule", icon: Calendar, badge: null },
      { name: "Advanced Scheduling", href: "/scheduling", icon: CalendarPlus, badge: null },
      { name: "Timesheets", href: "/timesheets", icon: Clock, badge: "3" },
    ]
  },
  {
    name: "People & Relationships",
    icon: Users,
    defaultOpen: false,
    items: [
      { name: "Workers", href: "/workers", icon: Users },
      { name: "Clients", href: "/clients", icon: Building },
      { name: "HR Management", href: "/hr-management", icon: User },
      { name: "CRM Management", href: "/crm-management", icon: Handshake },
    ]
  },
  {
    name: "Financial",
    icon: CreditCard,
    defaultOpen: false,
    items: [
      { name: "Payments", href: "/payments", icon: CreditCard, badge: null },
      { name: "Finance Management", href: "/finance-management", icon: Calculator },
      { name: "Subscriptions", href: "/subscription", icon: Crown },
    ]
  },
  {
    name: "Operations & Assets",
    icon: Layers,
    defaultOpen: false,
    items: [
      { name: "Operations", href: "/operations-management", icon: Settings },
      { name: "Asset Management", href: "/asset-management", icon: Box },
      { name: "Products & Facilities", href: "/products-facilities", icon: Warehouse },
      { name: "Map Tracking", href: "/map-tracking", icon: MapPin },
    ]
  },
  {
    name: "Analytics & Reports",
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Reports", href: "/reports", icon: ChartBar },
      { name: "Government & Benefits", href: "/government-reports", icon: PoundSterling },
    ]
  },
  {
    name: "Learning & Engagement",
    icon: GraduationCap,
    defaultOpen: false,
    items: [
      { name: "Learning Hub", href: "/learning", icon: GraduationCap },
      { name: "Karma Coins", href: "/karma-coins", icon: Coins, badge: "Rewards" },
    ]
  },
  {
    name: "Business Tools",
    icon: Zap,
    defaultOpen: false,
    items: [
      { name: "Marketplace", href: "/marketplace", icon: Store, badge: "8+" },
      { name: "Collaboration", href: "/collaboration", icon: MessageSquare, badge: "Live" },
      { name: "Workflows", href: "/workflows", icon: Workflow, badge: "Auto" },
      { name: "Automation", href: "/automation", icon: Zap },
      { name: "Document Management", href: "/document-management", icon: FileText },
    ]
  },
  {
    name: "Security & Compliance",
    icon: Lock,
    defaultOpen: false,
    items: [
      { name: "Security Center", href: "/security", icon: Shield, badge: "Quantum" },
      { name: "Security Monitor", href: "/security-monitoring", icon: Shield },
      { name: "Privacy", href: "/privacy", icon: ShieldCheck },
      { name: "Compliance", href: "/compliance-dashboard", icon: Gavel, badge: "GDPR" },
    ]
  },
  {
    name: "Settings & Configuration",
    icon: Settings,
    defaultOpen: false,
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Integrations", href: "/integrations", icon: Plug },
      { name: "Enterprise", href: "/enterprise", icon: Building2 },
      { name: "Mobile", href: "/mobile", icon: Smartphone },
      { name: "Graphics Showcase", href: "/graphics-showcase", icon: Palette, badge: "New" },
    ]
  }
];

// Legacy exports for backward compatibility (flatten groups)
export const primaryNavigation: NavigationItem[] = navigationGroups
  .slice(0, 2)
  .flatMap(group => group.items);

export const secondaryNavigation: NavigationItem[] = navigationGroups
  .slice(2)
  .flatMap(group => group.items);

// Simplified navigation for mobile
export const mobileNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Intelligence", href: "/ai", icon: Brain, badge: "New" },
  { name: "Marketplace", href: "/marketplace", icon: Store, badge: "8+" },
  { name: "Collaboration", href: "/collaboration", icon: MessageSquare, badge: "Live" },
  { name: "Security Center", href: "/security", icon: Shield, badge: "Quantum" },
  { name: "Jobs", href: "/jobs", icon: Briefcase, badge: "12" },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Advanced Scheduling", href: "/scheduling", icon: CalendarPlus },
  { name: "Timesheets", href: "/timesheets", icon: Clock, badge: "3" },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Learning Hub", href: "/learning", icon: GraduationCap },
  { name: "Karma Coins", href: "/karma-coins", icon: Coins, badge: "Rewards" },
  { name: "Graphics Showcase", href: "/graphics-showcase", icon: Palette, badge: "New" },
  { name: "Reports", href: "/reports", icon: ChartBar },
  { name: "Government & Benefits", href: "/government-reports", icon: PoundSterling },
  { name: "Workers", href: "/workers", icon: Users },
  { name: "Clients", href: "/clients", icon: Building },
  { name: "Compliance", href: "/compliance-dashboard", icon: Gavel, badge: "GDPR" },
  { name: "Settings", href: "/settings", icon: Settings },
];