import React from 'react';

// Base component props
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// Button component types
export interface ButtonProps extends ComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

// Input component types
export interface InputProps extends ComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// Navigation types
export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  permission?: string;
  badge?: string | number;
}

export interface NavigationState {
  currentPath: string;
  breadcrumbs: Breadcrumb[];
  isLoading: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}