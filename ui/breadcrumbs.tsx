import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
      <Link href="/" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors"
              data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" data-testid={`breadcrumb-current-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}