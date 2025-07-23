export interface Service {
  id: string;
  name: string;
  description: string;
  default_rate: number;
  hourlyRate: number; // alias for default_rate
  rate?: number; // for invoice services
  currency: 'EUR' | 'ILS';
  category?: string;
  isActive?: boolean;
  created_at: string;
  createdAt: string; // alias for created_at
  updated_at: string;
  updatedAt: string; // alias for updated_at
  user_id?: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  hourlyRate: number;
  currency: 'EUR' | 'ILS';
  category: string;
}