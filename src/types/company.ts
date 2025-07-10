export interface Company {
  id: string;
  name: string;
  business_name?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  default_currency: string;
  fiscal_year_start: number;
  drive_folder_id?: string;
  logo_url?: string;
  settings: any;
  active: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions: UserPermissions;
  active: boolean;
  created_at: string;
}

export interface UserPermissions {
  expenses: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  suppliers: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  categories: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  reports: {
    export: boolean;
    view_all: boolean;
  };
  company?: {
    manage_users: boolean;
    manage_settings: boolean;
    view_sensitive: boolean;
  };
}

export type UserRole = 'owner' | 'admin' | 'user' | 'viewer';

export interface CompanyFormData {
  name: string;
  business_name?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  default_currency: string;
  fiscal_year_start: number;
  active: boolean;
  settings?: Record<string, any>;
}