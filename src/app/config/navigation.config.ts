export interface NavItem {
  id: string;
  label: string;
  icon: string;
  routerLink?: string;
  routerLinkActiveOptions?: { exact: boolean };
  command?: () => void;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'ti ti-dashboard',
    routerLink: '/dashboard',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'entry-log',
    label: 'Entry Log',
    icon: 'ti ti-calendar',
    routerLink: '/entry-log'
  },
  {
    id: 'soil-data',
    label: 'Soil data',
    icon: 'ti ti-shovel',
    routerLink: '/soil-data',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'ti ti-packages',
    routerLink: '/products',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'equipment',
    label: 'Equipment',
    icon: 'ti ti-assembly',
    routerLink: '/equipment',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'ti ti-chart-dots',
    routerLink: '/analytics',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'calculators',
    label: 'Calculators',
    icon: 'ti ti-calculator',
    routerLink: '/calculators',
    routerLinkActiveOptions: { exact: true }
  }
];

export const DEFAULT_MOBILE_NAV_ITEMS = NAV_ITEMS.toSpliced(0, 3).map(
  (item) => item.id
);
