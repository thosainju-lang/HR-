import React, { useState } from 'react';
import { Book, Customer, Product, PaymentLog, Installment } from '../types';
import { 
  Folder, Plus, UserPlus, FileText, Search, Tag, MapPin, Calendar, 
  ArrowRight, ArrowLeft, Edit2, Trash2, Phone, UserCheck, Clock 
} from 'lucide-react';

interface BookListProps {
  books: Book[];
  customers: Customer[];
  products: Product[];
  paymentsLogs: PaymentLog[];
  installments: Installment[];
  onSelectCustomer: (customer: Customer) => void;
  onAddBook: (name: string) => Promise<void>;
  onAddProduct: (bookId: string, name: string, price: number) => Promise<void>;
  onAddCustomer: (customerData: {
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
  }) => Promise<void>;
  onUpdateBook?: (id: string, name: string) => Promise<void>;
  onDeleteBook?: (id: string) => Promise<void>;
  onUpdateProduct?: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateCustomer?: (id: string, updates: Partial<Customer>) => Promise<void>;
  onDeleteCustomer?: (id: string) => Promise<void>;
}

export default function BookList({
  books,
  customers,
  products,
  paymentsLogs,
  installments,
  onSelectCustomer,
  onAddBook,
  onAddProduct,
  onAddCustomer,
  onUpdateBook,
  onDeleteBook,
  onUpdateProduct,
  onDeleteProduct,
}: BookListProps) {
  // Empty selectedBookId means showing the Books list
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Form Inputs - Book & Product
  const [newBookName, setNewBookName] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  
  // Form Inputs - Customer Registration (Expanded)
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custGuarantor, setCustGuarantor] = useState('');
  const [custCollector, setCustCollector] = useState('');
  const [custArea, setCustArea] = useState('');
  const [custFrequency, setCustFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [custTotalInstallments, setCustTotalInstallments] = useState('10');
  const [custMemo, setCustMemo] = useState('');
  const [custSaleDate, setCustSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [custProductId, setCustProductId] = useState('');
  const [custUpfront, setCustUpfront] = useState('');

  // Filtering based on active selected book
  const activeBook = books.find(b => b.id === selectedBookId);
  const activeBookId = activeBook?.id || '';

  const bookCustomers = customers.filter(c => c.book_id === activeBookId);
  const filteredCustomers = bookCustomers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.memo_no && c.memo_no.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.area && c.area.toLowerCase().includes(term)) ||
      (c.assigned_collector && c.assigned_collector.toLowerCase().includes(term))
    );
  });

  const bookProducts = products.filter(p => p.book_id === activeBookId);

  // Calculates financial summary for customers inside selected book
  const getCustomerStats = (customer: Customer) => {
    const cashLogs = paymentsLogs.filter(p => p.customer_id === customer.id);
    const totalUpfront = cashLogs.reduce((sum, item) => sum + item.amount, 0);

    const customerInsts = installments.filter(i => i.customer_id === customer.id);
    const totalInstPaid = customerInsts.reduce((sum, item) => sum + item.amount, 0);

    const productNote = cashLogs[0]?.notes || '';
    let productPrice = 0;
    const match = products.find(p => productNote.includes(p.name));
    if (match) {
      productPrice = match.price_per_unit;
    } else {
      productPrice = bookProducts.find(p => p.book_id === customer.book_id)?.price_per_unit || 30000;
    }

    const totalPaid = totalUpfront + totalInstPaid;
    const remaining = Math.max(0, productPrice - totalPaid);

    return {
      totalUpfront,
      totalInstPaid,
      totalPaid,
      productPrice,
      remaining
    };
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) return;
    await onAddBook(newBookName);
    setNewBookName('');
    setShowAddBook(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !activeBookId) return;
    await onAddProduct(activeBookId, newProdName, Number(newProdPrice));
    setNewProdName('');
    setNewProdPrice('');
    setShowAddProduct(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custProductId || !activeBookId) return;
    await onAddCustomer({
      book_id: activeBookId,
      name: custName,
      address: custAddress,
      guarantor_name: custGuarantor,
      phone: custPhone,
      assigned_collector: custCollector,
      area: custArea,
      installment_frequency: custFrequency,
      total_installments: Number(custTotalInstallments) || 10,
      memo_no: custMemo,
      sale_date: custSaleDate,
      product_id: custProductId,
      upfront_cash: Number(custUpfront) || 0
    });

    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustGuarantor('');
    setCustCollector('');
    setCustArea('');
    setCustFrequency('weekly');
    setCustTotalInstallments('10');
    setCustMemo('');
    setCustProductId('');
    setCustUpfront('');
    setShowAddCustomer(false);
  };

  // State 1: Render Books Gallery when no selectedBookId is active
  if (!selectedBookId) {
    return (
      <div className="space-y-6" id="books-gallery">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Folder className="h-5.5 w-5.5 text-indigo-600" />
              <span>আমার কিস্তি খাতা সমূহ</span>
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">আপনার ব্যবসার সকল সক্রিয় কিস্তি খাতা বা ক্লায়েন্ট লেজার বইয়ের তালিকা</p>
          </div>
          <button
            onClick={() => setShowAddBook(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-660 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            id="btn-add-book-header"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন খাতা তৈরি করুন</span>
          </button>
        </div>

        {books.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-450">
              <Folder className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-705">কোনো খাতা বা লেজার তৈরি করা হয়নি</h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">শুরু করতে নিচের বাটনে ক্লিক করে একটি নতুন খাতা তৈরি করুন</p>
            </div>
            <button
              onClick={() => setShowAddBook(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন খাতা তৈরি করুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {books.map(b => {
              const count = customers.filter(c => c.book_id === b.id).length;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookId(b.id)}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group h-44"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner group-hover:bg-indigo-650 group-hover:text-white transition-colors">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      
                      {/* Books Management (Edit / Delete) */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => {
                            const newName = prompt('নতুন খাতার নাম দিন:', b.name);
                            if (newName && onUpdateBook) onUpdateBook(b.id, newName);
                          }}
                          className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-650 rounded transition-colors"
                          title="এডিট খাতা"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই খাতা এবং এর আওতাভুক্ত সব কাস্টমার ও কিস্তি ডাটা ডিলিট করতে চান?')) {
                              if (onDeleteBook) onDeleteBook(b.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="ডিলিট খাতা"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-800 tracking-tight group-hover:text-indigo-650 transition-colors">{b.name}</h4>
                      <p className="text-[10px] font-sans text-slate-410 mt-0.5">ম্যানেজার: {b.created_by || 'এডমিন'}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-xs text-slate-500">
                    <span className="font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-sans">
                      {count} জন গ্রাহক
                    </span>
                    <span className="text-indigo-600 text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      <span>খুলুন</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Book Trigger Form Button at the bottom */}
        <div className="flex justify-center pt-8 border-t border-slate-100/70">
          <button
            onClick={() => setShowAddBook(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            id="bottom-add-book-trigger-button"
          >
            <Plus className="h-5 w-5" />
            <span>নতুন খাতা অ্যাড করুন</span>
          </button>
        </div>

        {/* Create Book Modal Form */}
        {showAddBook && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl" id="modal-add-book-inside">
              <h3 className="text-lg font-bold text-slate-850 mb-1">নতুন কিস্তি খাতা তৈরি করুন</h3>
              <p className="text-xs text-slate-400 mb-4 font-sans">যেমন: LED, Led-1, Freez, Solar ইত্যাদি</p>
              <form onSubmit={handleCreateBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">খাতার নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: LED TV Ledger, Fridge Book 1"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans font-medium"
                  />
                </div>
                <div className="flex gap-3 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddBook(false)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                  >
                    তৈরি নিশ্চিত
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 2: Selected Book Detail Page
  return (
    <div className="space-y-6" id="book-detail-page">
      {/* Top Header Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setSelectedBookId(''); setSearchTerm(''); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>খাতা তালিকায় ফিরুন</span>
        </button>

        <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 font-bold rounded-md font-sans">
          খাতা: {activeBook.name} (ID: {activeBookId})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Product listing of active book */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-indigo-500" />
                <span>{activeBook.name} খাতার পণ্যসমূহ</span>
              </h3>
              <button
                onClick={() => setShowAddProduct(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                id="btn-add-product-detail"
              >
                <Plus className="h-3.5 w-3.5" /> পণ্য যোগ
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {bookProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">কোনো পণ্য এখনো যোগ করা হয়নি</p>
              ) : (
                bookProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-55/40 border border-slate-200 rounded-lg text-xs font-sans">
                    <span className="font-bold text-slate-700">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-650 font-bold bg-white border border-slate-150 px-2 py-0.5 rounded shadow-3xs">{p.price_per_unit.toLocaleString('bn-BD')} BDT</span>
                      
                      {/* Product Edit / Delete buttons */}
                      <button
                        onClick={() => {
                          const newPrice = prompt(`'${p.name}' এর জন্য নতুন মূল্য দিন:`, p.price_per_unit.toString());
                          if (newPrice && onUpdateProduct) {
                            onUpdateProduct(p.id, { price_per_unit: Number(newPrice) });
                          }
                        }}
                        className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="রিমূল্যায়ন"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('আপনি কি নিশ্চিত যে পণ্যটি ডিলিট করতে চান?')) {
                            if (onDeleteProduct) onDeleteProduct(p.id);
                          }
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="পণ্য ডিলিট"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Book Customers List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {/* Table Header actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-805 flex items-center gap-1.5 font-sans">
                  <span>{activeBook.name} খাতার কাস্টমার তালিকা</span>
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">এই কিস্তি খাতার আওতাভুক্ত সকল গ্রাহকদের বিবরণী</p>
              </div>

              <button
                onClick={() => {
                  if (bookProducts.length === 0) {
                    alert('গ্রাহক রেজিস্টার করার আগে কমপক্ষে একটি পণ্য উক্ত খাতায় যোগ করুন।');
                    return;
                  }
                  setShowAddCustomer(true);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                id="btn-add-customer-detail-register"
              >
                <UserPlus className="h-4 w-4" />
                <span>নতুন গ্রাহক নিবন্ধন</span>
              </button>
            </div>

            {/* Customers Search */}
            <div className="relative mb-5" id="customer-search-inside-detail">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="গ্রাহকের নাম, মোবাইল নম্বর, মেমো নং অথবা এলাকা দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-sans"
              />
            </div>

            {/* Customers inside selected book Table */}
            <div className="overflow-x-auto">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 italic font-sans animate-pulse">কোনো গ্রাহকের রেকর্ড পাওয়া যায়নি। নতুন গ্রাহক নিবন্ধন করতে পারেন।</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse" id="customers-book-details-table">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">ক্রমিক</th>
                      <th className="pb-3 text-left">নাম ও মোবাইল</th>
                      <th className="pb-3 text-left">এলাকা ও কর্মী</th>
                      <th className="pb-3 text-left">মেমো নং</th>
                      <th className="pb-3 text-left">মোট মূল্য</th>
                      <th className="pb-3 text-left">আদায়কৃত</th>
                      <th className="pb-3 text-right">বাকি পাওনা</th>
                      <th className="pb-3 text-right text-xs">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                    {filteredCustomers.map((customer, index) => {
                      const stats = getCustomerStats(customer);
                      return (
                        <tr key={customer.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 font-mono text-slate-450 font-bold">{index + 1}</td>
                          <td className="py-3.5 pr-2">
                            <div className="font-bold text-slate-800 text-xs font-sans">{customer.name}</div>
                            {customer.phone && (
                              <div className="text-[10px] font-mono text-indigo-650 flex items-center gap-1 mt-0.5 font-bold">
                                <Phone className="h-2.5 w-2.5" /> {customer.phone}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5">
                            {customer.area && (
                              <div className="text-slate-550 flex items-center gap-0.5 text-[10px] font-bold max-w-36 truncate">
                                <MapPin className="h-3 w-3 text-indigo-500 shrink-0" />
                                <span>{customer.area}</span>
                              </div>
                            )}
                            {customer.assigned_collector && (
                              <div className="text-slate-400 flex items-center gap-0.5 text-[9px] max-w-36 truncate mt-0.5">
                                <UserCheck className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                <span>কর্মী: {customer.assigned_collector}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 font-mono font-bold text-indigo-700">{customer.memo_no || 'N/A'}</td>
                          <td className="py-3.5 font-mono font-semibold text-slate-700">{stats.productPrice.toLocaleString('bn-BD')} ৳</td>
                          <td className="py-3.5 font-mono text-[11px]">
                            <div className="text-emerald-700 font-bold">{stats.totalPaid.toLocaleString('bn-BD')} ৳</div>
                            <div className="text-[9px] text-slate-400">অগ্রিম: {stats.totalUpfront.toLocaleString('bn-BD')} | কিস্তি: {stats.totalInstPaid.toLocaleString('bn-BD')}</div>
                          </td>
                          <td className="py-3.5 font-mono text-right font-bold text-red-650">
                            {stats.remaining > 0 ? (
                              <span>{stats.remaining.toLocaleString('bn-BD')} ৳</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold">পরিশোধিত</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right font-sans">
                            <button
                              onClick={() => onSelectCustomer(customer)}
                              className="inline-flex items-center gap-0.5 px-2.5 py-1.5 text-[11px] font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                            >
                              <span>হিসাব দেখুন</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Creation Modal Inside selected book */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl" id="modal-add-product-inside-details">
            <h3 className="text-lg font-bold text-slate-850 mb-1">নতুন পণ্য সংযুক্ত করুন</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">এই খাতায় কিস্তি বিক্রয়ের জন্য পণ্য যোগ করুন</p>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পণ্যের নাম (Product Name)</label>
                <input
                  type="text"
                  required
                  placeholder='যেমন: Singer Split AC 1.5 Ton'
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">মূল্য (BDT)</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 45000"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                />
              </div>
              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs"
                >
                  পণ্য যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Registration Modal inside selected book */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm md:max-w-lg w-full border border-slate-100 shadow-2xl my-8" id="modal-register-customer-inside-details">
            <h3 className="text-base font-bold text-slate-850 mb-1">নতুন গ্রাহক রেজিস্টার করুন</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">নতুন কাস্টমার নিবন্ধন করুন এবং কিস্তি শিডিউল সেটআপ দিন।</p>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">গ্রাহকের নাম (Customer Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আব্দুর রহমান"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">মোবাইল নম্বর (জরুরি) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ০১৭১২৩৪৫৬৭৮"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="font-sans text-xs">
                <label className="block font-bold text-slate-600 mb-1">গ্রাহকের ঠিকানা</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বাসা নং ১২, রোড নং ৫, ব্লক সি, নিকেতন, ঢাকা"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">জামিনদার / রেফারেন্স নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: মোঃ আজহার (মামাতো ভাই)"
                    value={custGuarantor}
                    onChange={(e) => setCustGuarantor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">মেমো / রশিদ নং (Memo No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: MB-4012"
                    value={custMemo}
                    onChange={(e) => setCustMemo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-sans"
                  />
                </div>
              </div>

              {/* Multi-Collector & Area coverage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-150/40 font-sans text-xs">
                <div>
                  <label className="block font-bold text-indigo-950 mb-1 inline-flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> কর্মী/সংগ্রাহক
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ম্যানেজার হাসিব"
                    value={custCollector}
                    onChange={(e) => setCustCollector(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-indigo-950 mb-1 inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> এলাকা/জোন
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মিরপুর ১১, ঢাকা"
                    value={custArea}
                    onChange={(e) => setCustArea(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Installment planning options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs border-t border-slate-100 pt-3">
                <div>
                  <label className="block font-bold text-slate-650 mb-1 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-indigo-500" /> কিস্তির ধরন (Frequency)
                  </label>
                  <select
                    value={custFrequency}
                    onChange={(e) => setCustFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="weekly">সাপ্তাহিক কিস্তি (Weekly)</option>
                    <option value="daily">দৈনিক কিস্তি (Daily)</option>
                    <option value="monthly">মাসিক কিস্তি (Monthly)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-650 mb-1 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-indigo-500" /> মোট কিস্তির সংখ্যা (Installments count)
                  </label>
                  <input
                    type="number"
                    value={custTotalInstallments}
                    onChange={(e) => setCustTotalInstallments(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-1 font-sans text-xs">
                <p className="text-xs font-bold text-indigo-700 mb-2">ক্রয়কৃত প্রোডাক্ট ও অগ্রিম ডাউনপেমেন্ট</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">পণ্যটি নির্বাচন করুন *</label>
                    <select
                      required
                      value={custProductId}
                      onChange={(e) => setCustProductId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                    >
                      <option value="">সিলেক্ট করুন</option>
                      {bookProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.price_per_unit.toLocaleString('bn-BD')}৳)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">অগ্রিম নগদ জমা / ডাউনপেমেন্ট (BDT)</label>
                    <input
                      type="number"
                      placeholder="যেমন: ১০০০০"
                      value={custUpfront}
                      onChange={(e) => setCustUpfront(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-bold text-slate-600 mb-1">বিক্রয়ের তারিখ</label>
                  <input
                    type="date"
                    value={custSaleDate}
                    onChange={(e) => setCustSaleDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 justify-end border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  গ্রাহক নিবন্ধন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
