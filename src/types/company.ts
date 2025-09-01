export interface Company {
  id: string;
  name: string;
  code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
