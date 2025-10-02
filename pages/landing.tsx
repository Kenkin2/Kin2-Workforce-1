import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Rocket, Compass, Brain, Shield, Users, Zap, BarChart3, Settings, Clock, Building2, Smartphone, Plug, Check, Gauge, ArrowRight, Info } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32 relative">
          <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
            <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
              <div className="flex items-center mb-8">
                <Logo variant="full" size="lg" className="mr-4" />
                <div className="flex items-center">
                  <Logo variant="emblem" size="md" className="mr-3" />
                  <h1 className="text-2xl font-bold text-foreground">Kin2 Workforce</h1>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent sm:text-6xl animate-slideIn">
                Enterprise Workforce & AI Solutions Platform
              </h2>
              
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Kin2 Services Limited delivers the complete enterprise workforce solution with AI-powered analytics, multi-tenant architecture, 
                advanced security, mobile PWA capabilities, and seamless integrations with 15+ business tools. Built for scale, security, and performance.
              </p>
              
              <div className="mt-10 flex items-center gap-x-6">
                <Button 
                  size="lg" 
                  onClick={() => {
                    setLocation('/auth');
                  }}
                  data-testid="button-login"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 pulse-on-hover"
                >
                  <Rocket className="w-5 h-5 mr-2 animate-pulse" />
                  Get Started
                </Button>
                
                <Button variant="outline" size="lg" data-testid="button-learn-more" onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Compass className="w-5 h-5 mr-2" />
                  Explore Features
                </Button>
              </div>
            </div>
            
            <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
              <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=176&h=264" 
                    alt="Modern workspace"
                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                </div>
              </div>
              
              <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=176&h=264" 
                    alt="Professional office"
                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=176&h=264" 
                    alt="Healthcare professional"
                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                </div>
              </div>
              
              <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=176&h=264" 
                    alt="Business professional"
                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=176&h=264" 
                    alt="Team collaboration"
                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Enterprise-Grade Platform</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Complete Business Management Ecosystem
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Advanced analytics, predictive insights, multi-tenant architecture, enterprise security, and comprehensive 
            integrations. Everything your organization needs for modern workforce management at scale.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                AI Analytics
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">Predictive insights, demand forecasting, intelligent job matching, and automated workforce optimization.</p>
              </dd>
            </div>
            
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary">
                  <Building2 className="w-5 h-5 text-secondary-foreground" />
                </div>
                Multi-Tenant
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">Organization isolation, white-label branding, custom domains, and enterprise-grade tenant management.</p>
              </dd>
            </div>
            
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-accent">
                  <Shield className="w-5 h-5 text-accent-foreground" />
                </div>
                Enterprise Security
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">2FA authentication, advanced audit trails, role-based permissions, and comprehensive security monitoring.</p>
              </dd>
            </div>
            
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                Mobile PWA
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">Progressive web app with offline capabilities, push notifications, and native mobile experience.</p>
              </dd>
            </div>
          </dl>
        </div>
        
        {/* Enterprise Features Grid */}
        <div className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Enterprise Capabilities</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Advanced Features for Modern Organizations
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-600">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">Business Intelligence</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Interactive analytics dashboards
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Custom report builders
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Predictive workforce insights
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Real-time performance monitoring
                  </li>
                </ul>
              </div>
              
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-purple-600">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">Workflow Automation</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Intelligent automation rules
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Conditional logic triggers
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Automated notifications
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Smart scheduling optimization
                  </li>
                </ul>
              </div>
              
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-green-600">
                    <Plug className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">15+ Integrations</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Microsoft Teams, Zoom, Google Workspace
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Stripe, PayPal, Square payments
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Salesforce, HubSpot CRM
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    QuickBooks, Xero accounting
                  </li>
                </ul>
              </div>
              
              <div className="relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-red-600">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">GDPR Compliance</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Automated data retention policies
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Cookie consent management
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Data subject rights automation
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Comprehensive audit logging
                  </li>
                </ul>
              </div>
              
              <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-yellow-600">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">Performance Optimized</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Advanced caching layers
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Database query optimization
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    API response improvements
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Real-time monitoring
                  </li>
                </ul>
              </div>
              
              <div className="relative bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-cyan-600">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">Mobile Experience</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Progressive Web App (PWA)
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Offline functionality
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Push notifications
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-3" />
                    Native app experience
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Transform Your Workforce Management?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join organizations worldwide using Kin2 Workforce for enterprise-grade workforce management with AI intelligence, 
              advanced security, and comprehensive integrations.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-get-started"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-4 text-lg"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                data-testid="button-contact-sales"
                className="px-8 py-4 text-lg"
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
                <Info className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
