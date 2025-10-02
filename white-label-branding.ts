// White-Label Branding System for Enterprise Clients
import { eq } from "drizzle-orm";
import { db } from "./db";
import { organizations } from "@shared/schema";

export interface BrandingConfig {
  organizationId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyName: string;
  brandingTheme: 'professional' | 'modern' | 'classic' | 'vibrant' | 'minimal';
  customCSS?: string;
  fontFamily: string;
  headerStyle: 'simple' | 'gradient' | 'image' | 'video';
  customDomain?: string;
  footerContent?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  customFeatures: string[];
  emailTemplates: EmailBrandingConfig;
  dashboardLayout: DashboardLayoutConfig;
}

export interface EmailBrandingConfig {
  headerTemplate: string;
  footerTemplate: string;
  primaryColor: string;
  logoUrl?: string;
  companyAddress?: string;
  unsubscribeUrl?: string;
}

export interface DashboardLayoutConfig {
  layout: 'sidebar' | 'topnav' | 'hybrid';
  sidebarCollapsible: boolean;
  quickActions: string[];
  defaultWidgets: string[];
  customWidgets: CustomWidget[];
}

export interface CustomWidget {
  id: string;
  name: string;
  type: 'metric' | 'chart' | 'table' | 'custom';
  position: { x: number; y: number; width: number; height: number };
  config: any;
}

// Pre-built branding themes
export const brandingThemes: Record<string, Partial<BrandingConfig>> = {
  professional: {
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    accentColor: '#0ea5e9',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter, sans-serif',
    brandingTheme: 'professional',
    headerStyle: 'simple'
  },
  modern: {
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    accentColor: '#f59e0b',
    backgroundColor: '#fafafa',
    textColor: '#111827',
    fontFamily: 'DM Sans, sans-serif',
    brandingTheme: 'modern',
    headerStyle: 'gradient'
  },
  classic: {
    primaryColor: '#1f2937',
    secondaryColor: '#6b7280',
    accentColor: '#dc2626',
    backgroundColor: '#f9fafb',
    textColor: '#374151',
    fontFamily: 'Georgia, serif',
    brandingTheme: 'classic',
    headerStyle: 'simple'
  },
  vibrant: {
    primaryColor: '#e11d48',
    secondaryColor: '#f97316',
    accentColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Poppins, sans-serif',
    brandingTheme: 'vibrant',
    headerStyle: 'gradient'
  },
  minimal: {
    primaryColor: '#000000',
    secondaryColor: '#6b7280',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Helvetica Neue, sans-serif',
    brandingTheme: 'minimal',
    headerStyle: 'simple'
  }
};

export class WhiteLabelBrandingEngine {
  private brandingConfigs = new Map<string, BrandingConfig>();

  // Apply branding to organization
  async applyBranding(organizationId: string, branding: Partial<BrandingConfig>): Promise<BrandingConfig> {
    const defaultBranding = brandingThemes.professional;
    
    const fullBranding: BrandingConfig = {
      organizationId,
      primaryColor: branding.primaryColor || defaultBranding.primaryColor!,
      secondaryColor: branding.secondaryColor || defaultBranding.secondaryColor!,
      accentColor: branding.accentColor || defaultBranding.accentColor!,
      backgroundColor: branding.backgroundColor || defaultBranding.backgroundColor!,
      textColor: branding.textColor || defaultBranding.textColor!,
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      companyName: branding.companyName || 'Workforce Platform',
      brandingTheme: branding.brandingTheme || 'professional',
      customCSS: branding.customCSS,
      fontFamily: branding.fontFamily || defaultBranding.fontFamily!,
      headerStyle: branding.headerStyle || 'simple',
      customDomain: branding.customDomain,
      footerContent: branding.footerContent,
      privacyPolicyUrl: branding.privacyPolicyUrl,
      termsOfServiceUrl: branding.termsOfServiceUrl,
      customFeatures: branding.customFeatures || [],
      emailTemplates: branding.emailTemplates || this.getDefaultEmailTemplates(branding),
      dashboardLayout: branding.dashboardLayout || this.getDefaultDashboardLayout()
    };

    this.brandingConfigs.set(organizationId, fullBranding);
    
    // Save to database (would extend organizations table)
    await this.saveBrandingToDatabase(fullBranding);
    
    return fullBranding;
  }

  // Generate CSS variables for theme
  generateThemeCSS(branding: BrandingConfig): string {
    return `
      :root {
        --primary: ${this.hexToHsl(branding.primaryColor)};
        --primary-foreground: ${this.getContrastColor(branding.primaryColor)};
        --secondary: ${this.hexToHsl(branding.secondaryColor)};
        --secondary-foreground: ${this.getContrastColor(branding.secondaryColor)};
        --accent: ${this.hexToHsl(branding.accentColor)};
        --accent-foreground: ${this.getContrastColor(branding.accentColor)};
        --background: ${this.hexToHsl(branding.backgroundColor)};
        --foreground: ${this.hexToHsl(branding.textColor)};
        --font-family: ${branding.fontFamily};
      }

      .branded-header {
        background: ${branding.headerStyle === 'gradient' ? 
          `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` : 
          branding.primaryColor};
      }

      .branded-logo {
        ${branding.logoUrl ? `background-image: url(${branding.logoUrl});` : ''}
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }

      ${branding.customCSS || ''}
    `;
  }

  // Get branding for organization
  async getBranding(organizationId: string): Promise<BrandingConfig> {
    let branding = this.brandingConfigs.get(organizationId);
    
    if (!branding) {
      const loadedBranding = await this.loadBrandingFromDatabase(organizationId);
      if (loadedBranding) {
        this.brandingConfigs.set(organizationId, loadedBranding);
        branding = loadedBranding;
      }
    }
    
    return branding || this.getDefaultBranding(organizationId);
  }

  // Custom domain management
  async setupCustomDomain(organizationId: string, domain: string): Promise<boolean> {
    try {
      // Validate domain
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }

      // Configure SSL certificate for custom domain
      await this.generateSSLForDomain(domain);
      
      // Update DNS configuration
      await this.updateDNSConfiguration(domain, organizationId);
      
      // Update branding config
      const branding = await this.getBranding(organizationId);
      branding.customDomain = domain;
      await this.applyBranding(organizationId, branding);
      
      return true;
    } catch (error) {
      console.error(`Failed to setup custom domain ${domain}:`, error);
      return false;
    }
  }

  // Industry-specific branding presets
  getIndustryBrandingPresets(): Record<string, Partial<BrandingConfig>> {
    return {
      healthcare: {
        primaryColor: '#059669', // Medical green
        secondaryColor: '#065f46',
        accentColor: '#0ea5e9', // Trust blue
        brandingTheme: 'professional',
        customFeatures: ['patient_privacy_mode', 'hipaa_compliance_dashboard', 'medical_certifications']
      },
      construction: {
        primaryColor: '#ea580c', // Safety orange
        secondaryColor: '#1f2937',
        accentColor: '#fbbf24', // High-vis yellow
        brandingTheme: 'professional',
        customFeatures: ['safety_alerts', 'equipment_tracking', 'weather_integration']
      },
      retail: {
        primaryColor: '#7c3aed', // Retail purple
        secondaryColor: '#a78bfa',
        accentColor: '#f59e0b', // Shopping gold
        brandingTheme: 'modern',
        customFeatures: ['customer_analytics', 'inventory_alerts', 'sales_tracking']
      },
      hospitality: {
        primaryColor: '#be185d', // Hospitality pink
        secondaryColor: '#ec4899',
        accentColor: '#06b6d4', // Service teal
        brandingTheme: 'vibrant',
        customFeatures: ['guest_satisfaction', 'event_management', 'tip_tracking']
      },
      manufacturing: {
        primaryColor: '#1e40af', // Industrial blue
        secondaryColor: '#475569',
        accentColor: '#dc2626', // Alert red
        brandingTheme: 'professional',
        customFeatures: ['production_metrics', 'quality_control', 'machine_integration']
      }
    };
  }

  // Helper methods
  private getDefaultBranding(organizationId: string): BrandingConfig {
    return {
      ...brandingThemes.professional,
      organizationId,
      companyName: 'Workforce Platform',
      customFeatures: [],
      emailTemplates: this.getDefaultEmailTemplates({}),
      dashboardLayout: this.getDefaultDashboardLayout()
    } as BrandingConfig;
  }

  private getDefaultEmailTemplates(branding: Partial<BrandingConfig>): EmailBrandingConfig {
    return {
      headerTemplate: `
        <div style="background: ${branding.primaryColor || '#1e40af'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${branding.companyName || 'Workforce Platform'}</h1>
        </div>
      `,
      footerTemplate: `
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2025 ${branding.companyName || 'Workforce Platform'}. All rights reserved.</p>
          <p>If you no longer wish to receive these emails, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
        </div>
      `,
      primaryColor: branding.primaryColor || '#1e40af',
      logoUrl: branding.logoUrl,
      companyAddress: branding.footerContent,
      unsubscribeUrl: '{{unsubscribe_url}}'
    };
  }

  private getDefaultDashboardLayout(): DashboardLayoutConfig {
    return {
      layout: 'sidebar',
      sidebarCollapsible: true,
      quickActions: ['create_job', 'add_worker', 'view_schedule', 'generate_report'],
      defaultWidgets: ['active_jobs', 'worker_status', 'recent_payments', 'upcoming_shifts'],
      customWidgets: []
    };
  }

  private hexToHsl(hex: string): string {
    // Convert hex to HSL for CSS variables
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  private getContrastColor(hex: string): string {
    // Calculate contrasting color for text
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '0 0% 0%' : '0 0% 100%';
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  private async generateSSLForDomain(domain: string): Promise<void> {
    // SSL certificate generation (would integrate with Let's Encrypt)
    console.log(`Generating SSL certificate for domain: ${domain}`);
  }

  private async updateDNSConfiguration(domain: string, organizationId: string): Promise<void> {
    // DNS configuration (would integrate with domain provider)
    console.log(`Updating DNS configuration for ${domain} -> organization ${organizationId}`);
  }

  private async saveBrandingToDatabase(branding: BrandingConfig): Promise<void> {
    // Save branding configuration to database
    // Would extend organizations table with branding fields
    console.log(`Saving branding configuration for organization: ${branding.organizationId}`);
  }

  private async loadBrandingFromDatabase(organizationId: string): Promise<BrandingConfig | null> {
    // Load branding configuration from database
    // Would query extended organizations table
    console.log(`Loading branding configuration for organization: ${organizationId}`);
    return null;
  }
}

// Export branding engine instance
export const brandingEngine = new WhiteLabelBrandingEngine();