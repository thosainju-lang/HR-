export interface Book {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  book_id: string;
  name: string;
  price_per_unit: number;
}

export interface Customer {
  id: string;
  book_id: string;
  name: string;
  address: string;
  guarantor_name: string;
  phone?: string;
  assigned_collector?: string;
  area?: string;
  installment_frequency?: 'daily' | 'weekly' | 'monthly';
  total_installments?: number;
  memo_no: string;
  sale_date: string;
  created_at?: string;
}

export interface Installment {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  memo_no: string;
  paid_to: string;
  notes: string;
  created_at?: string;
}

export interface PaymentLog {
  id: string;
  customer_id: string;
  amount_type: 'Cash Deposit' | 'নগদ জমা' | string;
  amount: number;
  date: string;
  notes: string;
}

export interface CallLog {
  id: string;
  customer_id: string;
  called_by: string;
  call_date: string;
  conversation_summary: string;
  status: 'Reached' | 'No Answer' | 'Busy' | 'Switched Off' | string;
  next_action: string;
}

export interface CallTarget {
  id: string;
  customer_id: string;
  due_date: string;
  is_called: boolean;
  priority: 'High' | 'Medium' | 'Low';
}
