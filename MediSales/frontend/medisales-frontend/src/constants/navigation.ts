import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  Eye,
  LayoutDashboard,
  LineChart,
  Mail,
  Package,
  PackageSearch,
  Receipt,
  ShoppingCart,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { UserRole } from '../types/User';

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
};

export const NAVIGATION_ITEMS: Record<UserRole, NavItem[]> = {
  Administrator: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, roles: ['Administrator'] },
    { label: 'Products', to: '/admin/products', icon: Package, roles: ['Administrator'] },
    { label: 'Expiration', to: '/admin/expiration-monitoring', icon: Timer, roles: ['Administrator'] },
    { label: 'Stock Alerts', to: '/admin/stock-alerts', icon: AlertTriangle, roles: ['Administrator'] },
    { label: 'Inventory Movements', to: '/admin/inventory-movements', icon: PackageSearch, roles: ['Administrator'] },
    { label: 'Transactions', to: '/admin/transactions', icon: Receipt, roles: ['Administrator'] },
    { label: 'Reports', to: '/admin/sales-reports', icon: BarChart3, roles: ['Administrator'] },
    { label: 'Sales Analysis', to: '/admin/sales-analysis', icon: TrendingUp, roles: ['Administrator'] },
    { label: 'Messages', to: '/admin/messages', icon: Mail, roles: ['Administrator'] },
    { label: 'Staff', to: '/admin/staff', icon: Users, roles: ['Administrator'] },
  ],
  Staff: [
    { label: 'POS', to: '/staff/pos', icon: ShoppingCart, roles: ['Staff', 'Administrator'] },
    { label: 'Products', to: '/staff/products', icon: Package, roles: ['Staff', 'Administrator'] },
    { label: 'Expiration', to: '/staff/expiry-monitor', icon: Timer, roles: ['Staff', 'Administrator'] },
    { label: 'Alerts', to: '/staff/stock-alerts', icon: AlertTriangle, roles: ['Staff', 'Administrator'] },
    { label: 'Inventory', to: '/staff/inventory-view', icon: Eye, roles: ['Staff', 'Administrator'] },
    { label: 'Sales', to: '/staff/daily-sales', icon: LineChart, roles: ['Staff', 'Administrator'] },
    { label: 'Messages', to: '/staff/messages', icon: Mail, roles: ['Staff', 'Administrator'] },
  ],
};

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAVIGATION_ITEMS.Administrator,
  ...NAVIGATION_ITEMS.Staff,
];
