import { isSupabaseConfigured, supabaseClient } from './supabaseClient';
import { Book, Product, Customer, Installment, PaymentLog, CallLog, CallTarget } from './types';

// Helper to handle real Supabase or cloud emulation API fallback
export const api = {
  // BOOKS
  getBooks: async (userEmail?: string): Promise<Book[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      let query = supabaseClient.from('books').select('*');
      if (userEmail) {
        if (userEmail === 'thosainju@gmail.com') {
          query = query.or(`created_by.eq.${userEmail},created_by.eq.admin`);
        } else {
          query = query.eq('created_by', userEmail);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch(`/api/books?userEmail=${encodeURIComponent(userEmail || '')}`);
      return res.json();
    }
  },

  createBook: async (name: string, userEmail?: string): Promise<Book> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('books')
        .insert([{ name, created_by: userEmail || 'admin' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, created_by: userEmail }),
      });
      return res.json();
    }
  },

  // PRODUCTS
  getProducts: async (): Promise<Product[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient.from('products').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch('/api/products');
      return res.json();
    }
  },

  createProduct: async (book_id: string, name: string, price_per_unit: number): Promise<Product> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('products')
        .insert([{ book_id, name, price_per_unit }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id, name, price_per_unit }),
      });
      return res.json();
    }
  },

  // CUSTOMERS
  getCustomers: async (): Promise<Customer[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient.from('customers').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch('/api/customers');
      return res.json();
    }
  },

  createCustomer: async (customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('customers')
        .insert([customer])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      return res.json();
    }
  },

  // INSTALLMENTS
  getInstallments: async (): Promise<Installment[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient.from('installments').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch('/api/installments');
      return res.json();
    }
  },

  createInstallment: async (installment: Omit<Installment, 'id' | 'created_at'>): Promise<Installment> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('installments')
        .insert([installment])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installment),
      });
      return res.json();
    }
  },

  // PAYMENTS LOGS
  getPaymentsLogs: async (): Promise<PaymentLog[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient.from('payments_log').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch('/api/payments_log');
      return res.json();
    }
  },

  createPaymentLog: async (paymentLog: Omit<PaymentLog, 'id'>): Promise<PaymentLog> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('payments_log')
        .insert([paymentLog])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/payments_log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentLog),
      });
      return res.json();
    }
  },

  // CALL LOGS
  getCallLogs: async (): Promise<CallLog[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient.from('call_logs').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch('/api/call_logs');
      return res.json();
    }
  },

  createCallLog: async (callLog: Omit<CallLog, 'id' | 'call_date'>): Promise<CallLog> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('call_logs')
        .insert([callLog])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/call_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callLog),
      });
      return res.json();
    }
  },

  // CALL TARGETS
  getCallTargets: async (): Promise<CallTarget[]> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient.from('call_targets').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const res = await fetch('/api/call_targets');
      return res.json();
    }
  },

  createCallTarget: async (target: Omit<CallTarget, 'id' | 'is_called'>): Promise<CallTarget> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('call_targets')
        .insert([target])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch('/api/call_targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target),
      });
      return res.json();
    }
  },

  updateCallTarget: async (id: string, updates: Partial<CallTarget>): Promise<CallTarget> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('call_targets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch(`/api/call_targets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    }
  },

  autoGenerateCallTargets: async (allowedCustomerIds?: string[]): Promise<{ count: number; items: CallTarget[] }> => {
    if (isSupabaseConfigured && supabaseClient) {
      const customersRes = await supabaseClient.from('customers').select('*');
      const targetsRes = await supabaseClient.from('call_targets').select('*');
      const installmentsRes = await supabaseClient.from('installments').select('*');
      const booksRes = await supabaseClient.from('books').select('*');

      let customers = customersRes.data || [];
      if (allowedCustomerIds) {
        customers = customers.filter(c => allowedCustomerIds.includes(c.id));
      }
      const targets = targetsRes.data || [];
      const installments = installmentsRes.data || [];
      const books = booksRes.data || [];

      const generated: any[] = [];
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);

      for (const customer of customers) {
        // Only generate if there isn't a pending target already
        const existing = targets.find(t => t.customer_id === customer.id && !t.is_called);
        if (!existing) {
          // Get all installments for this customer
          const custInsts = installments.filter(i => i.customer_id === customer.id);
          let lastInstallmentDateStr = customer.sale_date;
          if (custInsts.length > 0) {
            custInsts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            lastInstallmentDateStr = custInsts[0].date;
          }

          // Intercept frequency logic: assume Weekly (7 days) for mobile book or sale day <= 7, else Monthly (30 days)
          const book = books.find(b => b.id === customer.book_id);
          const bookName = book?.name?.toLowerCase() || '';
          const isMobileBook = bookName.includes('mobile') || bookName.includes('মোবাইল');
          const saleDay = new Date(customer.sale_date).getDate();

          const intervalDays = (isMobileBook || saleDay <= 7) ? 7 : 30;

          // Next installment due date
          const lastDate = new Date(lastInstallmentDateStr);
          const nextDueDate = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
          const isDue = today > nextDueDate;

          if (isDue) {
            const nextDueDateStr = nextDueDate.toISOString().split('T')[0];
            const { data, error } = await supabaseClient
              .from('call_targets')
              .insert([{ customer_id: customer.id, due_date: nextDueDateStr, is_called: false, priority: 'High' }])
              .select()
              .single();
            
            if (!error && data) {
              generated.push(data);
            }
          }
        }
      }
      return { count: generated.length, items: generated };
    } else {
      const res = await fetch('/api/generate-call-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    }
  },

  // UPDATE / DELETE METHODS
  updateBook: async (id: string, name: string): Promise<Book> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('books')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      return res.json();
    }
  },

  deleteBook: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient.from('books').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    }
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    }
  },

  updateCustomer: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    }
  },

  deleteCustomer: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient.from('customers').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    }
  },

  updateInstallment: async (id: string, updates: Partial<Installment>): Promise<Installment> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('installments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch(`/api/installments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    }
  },

  deleteInstallment: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient.from('installments').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const res = await fetch(`/api/installments/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    }
  },

  updatePaymentLog: async (id: string, updates: Partial<PaymentLog>): Promise<PaymentLog> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('payments_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const res = await fetch(`/api/payments_log/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    }
  },

  deletePaymentLog: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabaseClient) {
      const { error } = await supabaseClient.from('payments_log').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const res = await fetch(`/api/payments_log/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    }
  },
};
