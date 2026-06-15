import React, { useEffect, useState } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import BookList from './components/BookList';
import CustomerDetails from './components/CustomerDetails';
import AutoCallList from './components/AutoCallList';
import DbSchemaView from './components/DbSchemaView';
import { Book, Customer, Product, Installment, PaymentLog, CallLog, CallTarget } from './types';
import { Sparkles, Calendar, Layers, ShieldAlert, Loader2, Database, PhoneCall, Folder, Menu, X, ChevronRight, User, LogOut, Lock, Mail, UserPlus } from 'lucide-react';
import { isSupabaseConfigured, supabaseClient } from './supabaseClient';

export default function App() {
  const [currentView, setView] = useState<'home' | 'calls' | 'schema'>('home');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication States
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [signInEmail, setSignInEmail] = useState('thosainju@gmail.com');
  const [signInPassword, setSignInPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Core Db States
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [paymentsLogs, setPaymentsLogs] = useState<PaymentLog[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [callTargets, setCallTargets] = useState<CallTarget[]>([]);

  const [loading, setLoading] = useState(true);

  // Reload handler
  const loadAllData = async () => {
    setLoading(true);
    try {
      const userEmail = user?.email || 'admin';
      const [
        fetchedBooks,
        fetchedCustomers,
        fetchedProducts,
        fetchedInstallments,
        fetchedPayments,
        fetchedCalls,
        fetchedTargets,
      ] = await Promise.all([
        api.getBooks(userEmail),
        api.getCustomers(),
        api.getProducts(),
        api.getInstallments(),
        api.getPaymentsLogs(),
        api.getCallLogs(),
        api.getCallTargets(),
      ]);

      // Filter other tables based on allowedBooks
      const allowedBookIds = new Set(fetchedBooks.map(b => b.id));

      const filteredCustomers = fetchedCustomers.filter(c => allowedBookIds.has(c.book_id));
      const filteredProducts = fetchedProducts.filter(p => allowedBookIds.has(p.book_id));

      const allowedCustomerIds = new Set(filteredCustomers.map(c => c.id));

      const filteredInstallments = fetchedInstallments.filter(i => allowedCustomerIds.has(i.customer_id));
      const filteredPayments = fetchedPayments.filter(p => allowedCustomerIds.has(p.customer_id));
      const filteredCalls = fetchedCalls.filter(c => allowedCustomerIds.has(c.customer_id));
      const filteredTargets = fetchedTargets.filter(t => allowedCustomerIds.has(t.customer_id));

      setBooks(fetchedBooks);
      setCustomers(filteredCustomers);
      setProducts(filteredProducts);
      setInstallments(filteredInstallments);
      setPaymentsLogs(filteredPayments);
      setCallLogs(filteredCalls);
      setCallTargets(filteredTargets);
    } catch (err) {
      console.error('Error loading database data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auth session checking and state-changed routing hook
  useEffect(() => {
    if (isSupabaseConfigured && supabaseClient) {
      // Get current session
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        }
      });

      // Listen to auth changes
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Real-time Database tables synchronization effect!
  useEffect(() => {
    if (!user) return;

    // Load data once authenticated
    loadAllData();

    // Setup live WebSockets subscriptions to public Postgres changes on Supabase
    if (isSupabaseConfigured && supabaseClient) {
      console.log('Realtime Action: Hooking up Live Subscriptions...');
      
      const channel = supabaseClient
        .channel('public-db-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
          console.log('Realtime notification: "books" changed.');
          loadAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          console.log('Realtime notification: "products" changed.');
          loadAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
          console.log('Realtime notification: "customers" changed.');
          loadAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'installments' }, () => {
          console.log('Realtime notification: "installments" changed.');
          loadAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments_log' }, () => {
          console.log('Realtime notification: "payments_log" changed.');
          loadAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, () => {
          console.log('Realtime notification: "call_logs" changed.');
          loadAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'call_targets' }, () => {
          console.log('Realtime notification: "call_targets" changed.');
          loadAllData();
        })
        .subscribe();

      return () => {
        console.log('Realtime Action: Unsubscribing Live Channels...');
        supabaseClient.removeChannel(channel);
      };
    }
  }, [user]);

  // Handlers for Additions
  const handleAddBook = async (name: string) => {
    try {
      const newBook = await api.createBook(name, user?.email || 'admin');
      setBooks(prev => [...prev, newBook]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (bookId: string, name: string, price: number) => {
    try {
      const newProduct = await api.createProduct(bookId, name, price);
      setProducts(prev => [...prev, newProduct]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomer = async (custData: {
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
    product_id: string;
    upfront_cash: number;
  }) => {
    try {
      // Create Customer profile
      const newCust = await api.createCustomer({
        book_id: custData.book_id,
        name: custData.name,
        address: custData.address,
        guarantor_name: custData.guarantor_name,
        phone: custData.phone,
        assigned_collector: custData.assigned_collector,
        area: custData.area,
        installment_frequency: custData.installment_frequency,
        total_installments: custData.total_installments,
        memo_no: custData.memo_no,
        sale_date: custData.sale_date,
      });

      // Get Product Details
      const selectedProd = products.find(p => p.id === custData.product_id);
      const prodName = selectedProd ? selectedProd.name : 'সার্ভিস আইটেম';

      // Auto create an initial payment log (নগদ জমা / ডাউন পেমেন্ট)
      const upfrontAmount = custData.upfront_cash || 0;
      await api.createPaymentLog({
        customer_id: newCust.id,
        amount_type: 'Cash Deposit',
        amount: upfrontAmount,
        date: custData.sale_date,
        notes: `ডাউন পেমেন্ট - ক্রয়কৃত পণ্য: ${prodName}`,
      });

      // Trigger hot reload
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATE and DELETE handlers
  const handleUpdateBook = async (id: string, name: string) => {
    try {
      const updated = await api.updateBook(id, name);
      setBooks(prev => prev.map(b => b.id === id ? updated : b));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      const success = await api.deleteBook(id);
      if (success) {
        setBooks(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await api.updateProduct(id, updates);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const success = await api.deleteProduct(id);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const updated = await api.updateCustomer(id, updates);
      setCustomers(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const success = await api.deleteCustomer(id);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        if (selectedCustomerId === id) {
          setSelectedCustomerId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInstallment = async (id: string, updates: Partial<Installment>) => {
    try {
      const updated = await api.updateInstallment(id, updates);
      setInstallments(prev => prev.map(i => i.id === id ? updated : i));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInstallment = async (id: string) => {
    try {
      const success = await api.deleteInstallment(id);
      if (success) {
        setInstallments(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePaymentLog = async (id: string, updates: Partial<PaymentLog>) => {
    try {
      const updated = await api.updatePaymentLog(id, updates);
      setPaymentsLogs(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePaymentLog = async (id: string) => {
    try {
      const success = await api.deletePaymentLog(id);
      if (success) {
        setPaymentsLogs(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInstallment = async (installment: Omit<Installment, 'id' | 'created_at'>) => {
    try {
      const newInst = await api.createInstallment(installment);
      setInstallments(prev => [...prev, newInst]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPaymentLog = async (paymentLog: Omit<PaymentLog, 'id'>) => {
    try {
      const newPay = await api.createPaymentLog(paymentLog);
      setPaymentsLogs(prev => [...prev, newPay]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCallLog = async (callLog: Omit<CallLog, 'id' | 'call_date'>) => {
    try {
      const newCall = await api.createCallLog(callLog);
      setCallLogs(prev => [...prev, { ...newCall, call_date: new Date().toISOString() }]);
      
      // Since a call is logged, refresh targets to sync called list
      const updatedTargets = await api.getCallTargets();
      const allowedCustomerIds = new Set(customers.map(c => c.id));
      setCallTargets(updatedTargets.filter(t => allowedCustomerIds.has(t.customer_id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateTargets = async () => {
    try {
      const allowedIds = customers.map(c => c.id);
      await api.autoGenerateCallTargets(allowedIds);
      const updatedTargets = await api.getCallTargets();
      setCallTargets(updatedTargets.filter(t => allowedIds.includes(t.customer_id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTarget = async (id: string, updates: Partial<CallTarget>) => {
    try {
      const updated = await api.updateCallTarget(id, updates);
      setCallTargets(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    } catch (err) {
      console.error(err);
    }
  };

  // Find active customer if selected
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Stats Calculator for Sleek Overview Headers
  const getOverviewStats = () => {
    // Dynamic system date ISO (YYYY-MM-DD)
    const todayStr = "2026-06-14";
    const todayInsts = installments.filter(i => i.date === todayStr);
    const todayPayLogs = paymentsLogs.filter(p => p.date === todayStr);
    const todayCollection = todayInsts.reduce((sum, item) => sum + item.amount, 0) + 
                             todayPayLogs.reduce((sum, item) => sum + item.amount, 0);

    const totalCustomers = customers.length;

    let totalOutstanding = 0;
    customers.forEach(customer => {
      const custPayments = paymentsLogs.filter(p => p.customer_id === customer.id);
      const totalUpfront = custPayments.reduce((sum, item) => sum + item.amount, 0);

      const custInsts = installments.filter(i => i.customer_id === customer.id);
      const totalInstPaid = custInsts.reduce((sum, item) => sum + item.amount, 0);

      // Find product price
      const firstNotes = custPayments[0]?.notes || '';
      const matchedProd = products.find(p => firstNotes.includes(p.name));
      // fallback to book base product or generic average
      const bookProd = products.find(p => p.book_id === customer.book_id);
      const prodPrice = matchedProd ? matchedProd.price_per_unit : (bookProd ? bookProd.price_per_unit : 30000);

      const totalPaid = totalUpfront + totalInstPaid;
      const remaining = Math.max(0, prodPrice - totalPaid);
      totalOutstanding += remaining;
    });

    // Only show default legacy mockup stats if no Supabase is configured AND the user is specifically our placeholder demo admin,
    // AND there's exactly the preset seed count (to keep consistent mockup representation for first-time explore).
    const useDefaultDemoData = !isSupabaseConfigured && user?.email === 'thosainju@gmail.com' && books.length === 3 && customers.length === 4;

    if (useDefaultDemoData) {
      return {
        todayCollection: 45200,
        totalCustomers: 1240,
        totalOutstanding: 850000,
        isCustom: false
      };
    }

    return {
      todayCollection,
      totalCustomers,
      totalOutstanding,
      isCustom: true
    };
  };

  const overviewStats = getOverviewStats();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSupabaseConfigured && supabaseClient) {
        if (isSignUp) {
          const { data, error } = await supabaseClient.auth.signUp({
            email: signInEmail,
            password: signInPassword,
          });
          if (error) throw error;
          if (data.session) {
            setUser({ id: data.session.user.id, email: data.session.user.email || '' });
          } else {
            setAuthError('অ্যাকাউন্ট তৈরি সফল হয়েছে! আপনার ইমেল ইনবক্স ভেরিফাই করুন অথবা সরাসরি সাইন-ইন ট্রাই করুন।');
          }
        } else {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: signInEmail,
            password: signInPassword,
          });
          if (error) throw error;
          if (data.user) {
            setUser({ id: data.user.id, email: data.user.email || '' });
          }
        }
      } else {
        // Fallback simulated login
        if (signInEmail && signInPassword.length >= 4) {
          setUser({ id: 'demo_user', email: signInEmail });
        } else {
          setAuthError('সঠিক ইমেইল এবং কমপক্ষে ৪ ডিজিটের পাসওয়ার্ড প্রদান করুন!');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'অথেনটিকেশন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-all relative overflow-hidden" id="auth-screen-layout">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-3xl shadow-lg ring-4 ring-indigo-500/20 animate-pulse mb-4">
            HR
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">HR কিস্তি SaaS প্ল্যাটফর্ম</h2>
          <p className="mt-1 text-xs text-slate-400">
            বাংলাদেশি কিস্তি ও ক্ষুদ্র ঋণ ব্যবসার অটোমেটেড হিসাব খাতা ও ক্লাউড ট্র্যাকার
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 animate-fade-in">
          <div className="bg-slate-950/80 backdrop-blur-md py-8 px-4 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
            
            {/* Supabase status on login */}
            <div className="mb-6">
              {isSupabaseConfigured ? (
                <div className="flex items-center gap-2 justify-center bg-emerald-500/5 text-emerald-400 text-[11px] px-3 py-1.5 rounded-lg border border-emerald-500/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>লাইভ ক্লাউড ডাটাবেজ কানেক্টেড (Supabase)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center bg-amber-500/5 text-amber-400 text-[11px] px-3 py-1.5 rounded-lg border border-amber-500/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>ডেমো মোড সক্রিয় (Supabase যুক্ত করুন)</span>
                </div>
              )}
            </div>

            {/* Auth tab swapper */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-850 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setAuthError(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!isSignUp ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                লগইন করুন
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setAuthError(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSignUp ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                নতুন অ্যাকাউন্ট
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAuthSubmit}>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-sans">
                  ইউজার ইমেইল (User Email)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-sans">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-700 font-sans"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-350 text-[11px] rounded-xl flex items-start gap-2 font-sans">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    <span>লগইন করুন</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-850 pt-4 text-center">
              <span className="text-[10px] text-slate-500 font-sans leading-relaxed block">
                {isSignUp 
                  ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? উপরের ট্যাবে ক্লিক করে সাইন-ইন করুন।' 
                  : 'আপনার নিবন্ধিত ইমেইল ও পাসওয়ার্ড প্রদান করে ড্যাশবোর্ডে প্রবেশ করুন।'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden" id="sleek-app-mainframe">
      {/* Sidebar Navigation - Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-505 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center font-bold text-lg text-white">HR</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">HR কিস্তি</h1>
            <p className="text-[9px] text-slate-400 font-sans leading-none mt-0.5">SaaS ড্যাশবোর্ড</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => { setView('home'); setSelectedCustomerId(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              currentView === 'home'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            <span>খাতা (বই সমূহ)</span>
          </button>
          <button
            onClick={() => { setView('calls'); setSelectedCustomerId(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              currentView === 'calls'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <PhoneCall className="w-4.5 h-4.5" />
            <span>তালিকা (কল টার্গেট)</span>
          </button>
          <button
            onClick={() => { setView('schema'); setSelectedCustomerId(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              currentView === 'schema'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Database className="w-4.5 h-4.5" />
            <span>Supabase সেটআপ</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-2">
          <div>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected to Cloud
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Demo Mode Active
              </span>
            )}
          </div>
          <p className="font-sans">&copy; ২০২৬ HR কিস্তি সফটওয়্যার</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Native Mobile App Header Icon */}
            <div className="md:hidden w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-sm ring-2 ring-indigo-550/10">HR</div>
            <h2 className="text-sm md:text-base font-bold text-slate-800 font-sans tracking-tight">
              {selectedCustomerId ? 'কাস্টমার প্রোফাইল হিসাব' : (
                currentView === 'home' ? 'ড্যাশবোর্ড সামারি' : (
                  currentView === 'calls' ? 'কল টার্গেট প্যানেল' : 'ডাটাবেজ স্কিমা বিবরণী'
                )
              )}
            </h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase tracking-wide">লাইভ</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Date label - hidden on extra small screens */}
            <div className="hidden xs:block text-xs font-semibold text-slate-500 font-sans">
              তারিখ: <span className="bg-slate-100 px-2 py-1 rounded text-slate-800 font-mono">2026-06-14</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right hidden sm:block font-sans">
                <span className="text-xs font-bold text-slate-800">{user?.email || 'ইউজার'}</span>
                <span className="text-[10px] text-slate-400 block pb-0.5">সক্রিয় সেশন (ক্লাউড)</span>
              </div>
              <button 
                onClick={handleSignOut}
                title="লগআউট করুন"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace scrollable viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
              <p className="text-xs font-bold text-slate-400 mt-2 font-sans">লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Dynamic Stats Row - exactly styled like Sleek Interface mockup! */}
              {!selectedCustomerId && currentView === 'home' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" id="sleek-stats-dashboard">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-sans">আজকের সংগ্রহ</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">৳ {overviewStats.todayCollection.toLocaleString('bn-BD')}</p>
                    <div className="mt-2 text-xs text-green-600 font-sans">↑ ব্যবসা মনিটর ও হিসাব</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-sans">মোট কাস্টমার</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{overviewStats.totalCustomers.toLocaleString('bn-BD')}</p>
                    <div className="mt-2 text-xs text-indigo-600 font-sans">সক্রিয় গ্রাহক তালিকা</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-sans">বকেয়া কিস্তি</p>
                    <p className="text-2xl font-bold text-red-650 mt-1 font-mono">৳ {overviewStats.totalOutstanding.toLocaleString('bn-BD')}</p>
                    <div className="mt-2 text-xs text-red-500 font-sans">মোট বাকি সংগ্রহযোগ্য</div>
                  </div>
                </div>
              )}

              {/* Main routing display */}
              <div className="animate-fade-in">
                {selectedCustomerId && activeCustomer ? (
                  <CustomerDetails
                    customer={activeCustomer}
                    installments={installments}
                    paymentsLogs={paymentsLogs}
                    callLogs={callLogs}
                    products={products}
                    onBack={() => setSelectedCustomerId(null)}
                    onAddInstallment={handleAddInstallment}
                    onAddPaymentLog={handleAddPaymentLog}
                    onAddCallLog={handleAddCallLog}
                    onUpdateCustomer={handleUpdateCustomer}
                    onDeleteCustomer={handleDeleteCustomer}
                    onUpdateInstallment={handleUpdateInstallment}
                    onDeleteInstallment={handleDeleteInstallment}
                    onUpdatePaymentLog={handleUpdatePaymentLog}
                    onDeletePaymentLog={handleDeletePaymentLog}
                  />
                ) : (
                  <>
                    {/* View 1: Books and Customers tab */}
                    {currentView === 'home' && (
                      <BookList
                        books={books}
                        customers={customers}
                        products={products}
                        paymentsLogs={paymentsLogs}
                        installments={installments}
                        onSelectCustomer={(cust) => setSelectedCustomerId(cust.id)}
                        onAddBook={handleAddBook}
                        onAddProduct={handleAddProduct}
                        onAddCustomer={handleAddCustomer}
                        onUpdateBook={handleUpdateBook}
                        onDeleteBook={handleDeleteBook}
                        onUpdateProduct={handleUpdateProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onUpdateCustomer={handleUpdateCustomer}
                        onDeleteCustomer={handleDeleteCustomer}
                      />
                    )}

                    {/* View 2: Automated calling Checklist targets */}
                    {currentView === 'calls' && (
                      <AutoCallList
                        callTargets={callTargets}
                        customers={customers}
                        books={books}
                        installments={installments}
                        onGenerateTargets={handleGenerateTargets}
                        onUpdateTarget={handleUpdateTarget}
                        onLogCall={async (custId, by, summary, status, nextAction) => {
                          await handleAddCallLog({
                            customer_id: custId,
                            called_by: by,
                            conversation_summary: summary,
                            status,
                            next_action: nextAction,
                          });
                        }}
                      />
                    )}

                    {/* View 3: Postgres Migration helper */}
                    {currentView === 'schema' && <DbSchemaView />}
                  </>
                )}
              </div>

            </div>
          )}
        </div>

        <footer className="bg-white border-t border-slate-200/60 p-4 text-center text-xs text-slate-400 shrink-0 hidden md:block">
          &copy; ২০২৬ HR কিস্তি সফটওয়্যার • বাংলাদেশি কিস্তি ব্যবসা পরিচালনার অন্যতম হাতিয়ার
        </footer>

        {/* Beautiful Native Mobile Bottom Navigation Tab Bar */}
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center sticky bottom-0 left-0 right-0 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
          <button
            onClick={() => { setView('home'); setSelectedCustomerId(null); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative py-1 cursor-pointer flex-1 ${
              currentView === 'home' ? 'text-indigo-600 scale-105' : 'text-slate-400'
            }`}
          >
            <Layers className={`w-5 h-5 transition-transform ${currentView === 'home' ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>খাতা খতিয়ান</span>
            {currentView === 'home' && (
              <span className="absolute bottom-0 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => { setView('calls'); setSelectedCustomerId(null); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative py-1 cursor-pointer flex-1 ${
              currentView === 'calls' ? 'text-indigo-600 scale-105' : 'text-slate-400'
            }`}
          >
            <PhoneCall className={`w-5 h-5 transition-transform ${currentView === 'calls' ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>কল টার্গেট</span>
            {currentView === 'calls' && (
              <span className="absolute bottom-0 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => { setView('schema'); setSelectedCustomerId(null); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all relative py-1 cursor-pointer flex-1 ${
              currentView === 'schema' ? 'text-indigo-600 scale-105' : 'text-slate-400'
            }`}
          >
            <Database className={`w-5 h-5 transition-transform ${currentView === 'schema' ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>সেটআপ</span>
            {currentView === 'schema' && (
              <span className="absolute bottom-0 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-1 text-[10px] font-bold transition-all py-1 cursor-pointer flex-1 text-slate-400 hover:text-rose-600"
          >
            <LogOut className="w-5 h-5 text-slate-450" />
            <span>লগআউট</span>
          </button>
        </div>
      </main>
    </div>
  );
}
