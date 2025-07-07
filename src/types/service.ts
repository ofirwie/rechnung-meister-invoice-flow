export interface Service {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  hourlyRate: number;
  category: string;
}