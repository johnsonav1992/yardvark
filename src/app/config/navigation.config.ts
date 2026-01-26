export interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: string;
  routerLink?: string;
  routerLinkActiveOptions?: { exact: boolean };
  command?: () => void;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Dash',
    icon: 'ti ti-dashboard',
    routerLink: '/dashboard',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'entry-log',
    label: 'Entry Log',
    shortLabel: 'Entries',
    icon: 'ti ti-calendar',
    routerLink: '/entry-log'
  },
  {
    id: 'soil-data',
    label: 'Soil data',
    shortLabel: 'Soil',
    icon: 'ti ti-shovel',
    routerLink: '/soil-data',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'gdd-tracking',
    label: 'GDD Tracking',
    shortLabel: 'GDD',
    icon: 'ti ti-flame',
    routerLink: '/gdd-tracking',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'products',
    label: 'Products',
    shortLabel: 'Products',
    icon: 'ti ti-packages',
    routerLink: '/products',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'equipment',
    label: 'Equipment',
    shortLabel: 'Equipment',
    icon: 'ti ti-assembly',
    routerLink: '/equipment',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    icon: 'ti ti-chart-dots',
    routerLink: '/analytics',
    routerLinkActiveOptions: { exact: true }
  },
  {
    id: 'calculators',
    label: 'Calculators',
    shortLabel: 'Calculators',
    icon: 'ti ti-calculator',
    routerLink: '/calculators',
    routerLinkActiveOptions: { exact: true }
  }
];

export const DEFAULT_MOBILE_NAV_ITEMS = NAV_ITEMS.toSpliced(0, 3).map(
  (item) => item.id
);
