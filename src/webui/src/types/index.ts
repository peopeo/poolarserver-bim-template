export interface MenuItem {
  label: string;
  expandable?: boolean;
  key?: string;
  active?: boolean;
  disabled?: boolean;
}

export interface MenuSection {
  category: string;
  items: MenuItem[];
}

export interface SubItem {
  label: string;
  badge?: string;
}

export interface ExpandedItems {
  [key: string]: boolean;
}
