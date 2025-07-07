export interface Service {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  currency: 'EUR' | 'ILS';
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  hourlyRate: number;
  currency: 'EUR' | 'ILS';
  category: string;
}