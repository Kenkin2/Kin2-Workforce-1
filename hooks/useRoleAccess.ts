import { useAuth } from "@/hooks/useAuth";
import { isAdmin, isClient, isWorker } from "@/utils/type-guards";

export type UserRole = 'admin' | 'client' | 'worker';

export function useRoleAccess() {
  const { user } = useAuth() as { user: any };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  };

  const checkAdmin = (): boolean => {
    return user && isAdmin(user);
  };

  const checkClient = (): boolean => {
    return user && isClient(user);
  };

  const checkWorker = (): boolean => {
    return user && isWorker(user);
  };

  return {
    user,
    hasRole,
    isAdmin: checkAdmin(),
    isClient: checkClient(),
    isWorker: checkWorker(),
    canManageWorkers: hasRole('admin', 'client'),
    canManageClients: hasRole('admin'),
    canManageJobs: hasRole('admin', 'client'),
    canManagePayments: hasRole('admin', 'client'),
    canRunCompliance: hasRole('admin'),
    canManageSettings: hasRole('admin'),
    canViewAnalytics: hasRole('admin', 'client'),
  };
}
