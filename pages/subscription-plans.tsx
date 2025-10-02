import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Star, Users, BarChart3, Shield, Cpu, Globe } from "lucide-react";

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  description: string;
  icon: any;
  features: PlanFeature[];
  popular?: boolean;
  enterprise?: boolean;
  badge?: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    billingPeriod: 'month',
    description: 'Perfect for small teams getting started with workforce management',
    icon: Users,
    features: [
      { name: 'Up to 25 employees', included: true },
      { name: 'Basic scheduling', included: true },
      { name: 'Time tracking', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Email support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'AI insights', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'White-label branding', included: false }
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 89,
    billingPeriod: 'month',
    description: 'Advanced features for growing businesses and teams',
    icon: BarChart3,
    popular: true,
    badge: 'Most Popular',
    features: [
      { name: 'Up to 100 employees', included: true },
      { name: 'Advanced scheduling with AI', included: true },
      { name: 'Time tracking & payroll', included: true },
      { name: 'Advanced reporting & analytics', included: true },
      { name: 'Priority support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'AI workforce insights', included: true },
      { name: 'Performance predictions', included: true },
      { name: 'Basic integrations', included: true, limit: '10 integrations' },
      { name: 'Learning management system', included: true },
      { name: 'White-label branding', included: false }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    billingPeriod: 'month',
    description: 'Complete enterprise solution with unlimited scalability',
    icon: Crown,
    enterprise: true,
    badge: 'Enterprise',
    features: [
      { name: 'Unlimited employees', included: true },
      { name: 'AI-powered everything', included: true },
      { name: 'Advanced payroll & benefits', included: true },
      { name: 'Custom reporting & dashboards', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Full AI suite', included: true },
      { name: 'Predictive analytics', included: true },
      { name: 'Unlimited integrations', included: true },
      { name: 'Complete LMS', included: true },
      { name: 'White-label branding', included: true },
      { name: 'Custom development', included: true },
      { name: 'Dedicated account manager', included: true }
    ]
  },
  {
    id: 'ai_premium',
    name: 'AI Premium',
    price: 399,
    billingPeriod: 'month',
    description: 'Next-generation AI-powered workforce optimization',
    icon: Cpu,
    badge: 'AI Powered',
    features: [
      { name: 'Everything in Enterprise', included: true },
      { name: 'Advanced machine learning', included: true },
      { name: 'Predictive workforce modeling', included: true },
      { name: 'Real-time optimization', included: true },
      { name: 'Voice-powered AI assistant', included: true },
      { name: 'Blockchain integration', included: true },
      { name: 'IoT workplace monitoring', included: true },
      { name: 'Quantum-secure encryption', included: true },
      { name: 'Multi-language support (25+)', included: true },
      { name: 'Global compliance automation', included: true },
      { name: 'Custom AI model training', included: true },
      { name: 'Priority AI feature access', included: true }
    ]
  }
];

const addOnServices = [
  {
    id: 'compliance_suite',
    name: 'Compliance Suite',
    price: 49,
    description: 'Automated compliance monitoring and reporting for multiple jurisdictions',
    icon: Shield
  },
  {
    id: 'global_expansion',
    name: 'Global Expansion Pack',
    price: 99,
    description: 'Multi-currency, multi-language, and international compliance features',
    icon: Globe
  },
  {
    id: 'ai_training',
    name: 'Custom AI Training',
    price: 199,
    description: 'Train AI models specifically for your industry and business needs',
    icon: Sparkles
  },
  {
    id: 'white_label_pro',
    name: 'White Label Pro',
    price: 149,
    description: 'Complete branding customization with your logo, colors, and domain',
    icon: Star
  }
];

export default function SubscriptionPlans() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const handlePlanSelect = async (planId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlan(planId);
    const plan = subscriptionPlans.find(p => p.id === planId);
    
    toast({
      title: "Plan Selected",
      description: `You've selected the ${plan?.name} plan. Redirecting to checkout...`,
    });

    // Here you would integrate with Stripe or payment processor
    setTimeout(() => {
      toast({
        title: "Subscription Activated",
        description: `Welcome to ${plan?.name}! Your subscription is now active.`,
      });
      setSelectedPlan(null);
    }, 2000);
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    const selectedPlanData = subscriptionPlans.find(p => p.id === selectedPlan);
    const planCost = selectedPlanData ? selectedPlanData.price : 0;
    const addOnsCost = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price : 0);
    }, 0);
    
    const subtotal = planCost + addOnsCost;
    const discount = billingCycle === 'yearly' ? subtotal * 0.2 : 0; // 20% yearly discount
    const total = subtotal - discount;
    
    return { subtotal, discount, total };
  };

  return (
    <AppLayout 
      title="Subscription Plans"
      breadcrumbs={[{ label: "System", href: "/dashboard" }, { label: "Subscription Plans" }]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Choose Your Workforce Management Plan
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From small teams to enterprise organizations, we have the perfect plan to scale your workforce management needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 bg-muted p-1 rounded-lg w-fit mx-auto">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
              data-testid="button-monthly-billing"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              data-testid="button-yearly-billing"
              className="relative"
            >
              Yearly
              <Badge className="ml-2 bg-green-500 text-white text-xs">20% OFF</Badge>
            </Button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionPlans.map((plan) => {
            const Icon = plan.icon;
            const yearlyPrice = Math.round(plan.price * 12 * 0.8); // 20% discount
            const displayPrice = billingCycle === 'yearly' ? yearlyPrice : plan.price;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  plan.popular 
                    ? 'border-primary bg-gradient-to-b from-primary/5 to-primary/10 scale-105' 
                    : plan.enterprise
                    ? 'border-purple-500/50 bg-gradient-to-b from-purple-500/5 to-purple-500/10'
                    : ''
                } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${
                      plan.popular ? 'bg-primary' : 
                      plan.enterprise ? 'bg-purple-500' : 'bg-blue-500'
                    } text-white`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    plan.popular ? 'bg-primary/20 text-primary' :
                    plan.enterprise ? 'bg-purple-500/20 text-purple-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      ${billingCycle === 'yearly' ? yearlyPrice : plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600">
                        Save ${(plan.price * 12) - yearlyPrice}/year
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className={`w-4 h-4 mt-0.5 ${
                          feature.included ? 'text-green-500' : 'text-muted-foreground'
                        }`} />
                        <span className={`text-sm ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground line-through'
                        }`}>
                          {feature.name}
                          {feature.limit && feature.included && (
                            <span className="text-muted-foreground ml-1">({feature.limit})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant={plan.popular || plan.enterprise ? 'default' : 'outline'}
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={selectedPlan === plan.id}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {selectedPlan === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add-on Services */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground">Add-on Services</h3>
            <p className="text-muted-foreground">Enhance your plan with additional features and capabilities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOnServices.map((addOn) => {
              const Icon = addOn.icon;
              const isSelected = selectedAddOns.includes(addOn.id);
              
              return (
                <Card 
                  key={addOn.id} 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => toggleAddOn(addOn.id)}
                  data-testid={`card-addon-${addOn.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <CardTitle className="text-lg">{addOn.name}</CardTitle>
                    <div className="text-xl font-bold">
                      ${addOn.price}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{addOn.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Selected Plan:</span>
                  <span className="font-medium">
                    {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                  </span>
                </div>
                
                {selectedAddOns.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Add-ons:</div>
                    {selectedAddOns.map(addOnId => {
                      const addOn = addOnServices.find(a => a.id === addOnId);
                      return addOn ? (
                        <div key={addOnId} className="flex justify-between ml-4">
                          <span>• {addOn.name}</span>
                          <span>${addOn.price}/month</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateTotal().subtotal}/month</span>
                  </div>
                  
                  {billingCycle === 'yearly' && calculateTotal().discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Yearly Discount (20%):</span>
                      <span>-${calculateTotal().discount.toFixed(2)}/year</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-1">
                    <span>Total:</span>
                    <span>
                      ${calculateTotal().total}
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enterprise Contact */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="text-center py-8">
            <Crown className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">Need Something Custom?</h3>
            <p className="text-muted-foreground mb-4">
              Large organization or unique requirements? We'll create a custom solution just for you.
            </p>
            <Button variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white">
              Contact Enterprise Sales
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}