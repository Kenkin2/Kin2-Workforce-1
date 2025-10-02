import logoUrl from '@assets/generated_images/Kin2_Workforce_professional_logo_f8fd9064.png';
import emblemUrl from '@assets/generated_images/Kin2_Workforce_circular_emblem_364ffd7e.png';

interface LogoProps {
  variant?: 'full' | 'emblem';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: variant === 'full' ? 'h-8' : 'w-8 h-8',
    md: variant === 'full' ? 'h-12' : 'w-12 h-12', 
    lg: variant === 'full' ? 'h-16' : 'w-16 h-16',
    xl: variant === 'full' ? 'h-24' : 'w-24 h-24'
  };

  const logoSrc = variant === 'full' ? logoUrl : emblemUrl;
  const altText = variant === 'full' ? 'Kin2 Workforce Logo' : 'Kin2 Workforce Emblem';

  return (
    <img 
      src={logoSrc}
      alt={altText}
      className={`${sizeClasses[size]} object-contain ${className}`}
      data-testid={`logo-${variant}`}
    />
  );
}