import React, { useState } from 'react';
import { Customer, Installment, PaymentLog, CallLog, Product } from '../types';
import { 
  ArrowLeft, Plus, Calendar, User, Phone, CheckCircle, Clock, Info, 
  Shield, HelpCircle, AlertCircle, Edit2, Trash2, Printer, Download, Check, X, MapPin, UserCheck
} from 'lucide-react';

interface CustomerDetailsProps {
  customer: Customer;
  installments: Installment[];
  paymentsLogs: PaymentLog[];
  callLogs: CallLog[];
  products: Product[];
  onBack: () => void;
  onAddInstallment: (installment: Omit<Installment, 'id' | 'created_at'>) => Promise<void>;
  onAddPaymentLog: (paymentLog: Omit<PaymentLog, 'id'>) => Promise<void>;
  onAddCallLog: (callLog: Omit<CallLog, 'id' | 'call_date'>) => Promise<void>;
  onUpdateCustomer?: (id: string, updates: Partial<Customer>) => Promise<void>;
  onDeleteCustomer?: (id: string) => Promise<void>;
  onUpdateInstallment?: (id: string, updates: Partial<Installment>) => Promise<void>;
  onDeleteInstallment?: (id: string) => Promise<void>;
  onUpdatePaymentLog?: (id: string, updates: Partial<PaymentLog>) => Promise<void>;
  onDeletePaymentLog?: (id: string) => Promise<void>;
}

export default function CustomerDetails({
  customer,
  installments,
  paymentsLogs,
  callLogs,
  products,
  onBack,
  onAddInstallment,
  onAddPaymentLog,
  onAddCallLog,
  onUpdateCustomer,
  onDeleteCustomer,
  onUpdateInstallment,
  onDeleteInstallment,
  onUpdatePaymentLog,
  onDeletePaymentLog,
}: CustomerDetailsProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<'installments' | 'payments' | 'calls' | 'schedule'>('installments');

  // Modals state
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);

  // Form Inputs - Add Installment
  const [instAmount, setInstAmount] = useState('');
  const [instDate, setInstDate] = useState(new Date().toISOString().split('T')[0]);
  const [instMemo, setInstMemo] = useState('');
  const [instPaidTo, setInstPaidTo] = useState('');
  const [instNotes, setInstNotes] = useState('');

  // Form Inputs - Add Payment Log
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('নগদ জমা');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  // Form Inputs - Add Call Log
  const [callBy, setCallBy] = useState('');
  const [callSummary, setCallSummary] = useState('');
  const [callStatus, setCallStatus] = useState('Reached');
  const [callNextAction, setCallNextAction] = useState('');

  // Form Inputs - Edit Customer
  const [editName, setEditName] = useState(customer.name || '');
  const [editPhone, setEditPhone] = useState(customer.phone || '');
  const [editAddress, setEditAddress] = useState(customer.address || '');
  const [editGuarantor, setEditGuarantor] = useState(customer.guarantor_name || '');
  const [editCollector, setEditCollector] = useState(customer.assigned_collector || '');
  const [editArea, setEditArea] = useState(customer.area || '');
  const [editFrequency, setEditFrequency] = useState<'daily' | 'weekly' | 'monthly'>(customer.installment_frequency || 'weekly');
  const [editTotalInstallments, setEditTotalInstallments] = useState(customer.total_installments || 10);
  const [editMemoNo, setEditMemoNo] = useState(customer.memo_no || '');
  const [editSaleDate, setEditSaleDate] = useState(customer.sale_date || '');

  // Filter lists for active customer
  const customerInstallments = installments.filter(i => i.customer_id === customer.id);
  const customerPayments = paymentsLogs.filter(p => p.customer_id === customer.id);
  const customerCalls = callLogs.filter(c => c.customer_id === customer.id);

  // Calculate Financial Breakdown
  const purchasePayment = customerPayments.find(p => p.notes?.includes('ক্রয়কৃত পণ্য:'));
  let productName = '';
  if (purchasePayment) {
    const match = purchasePayment.notes.match(/ক্রয়কৃত পণ্য:\s*(.+)/);
    if (match && match[1]) {
      productName = match[1].trim();
    }
  }

  // Fallback to active book's first product if not found
  if (!productName) {
    const bookProducts = products.filter(p => p.book_id === customer.book_id);
    if (bookProducts.length > 0) {
      productName = bookProducts[0].name;
    } else {
      productName = 'ডিফল্ট পণ্য';
    }
  }

  const matchedProd = products.find(p => p.name === productName || (purchasePayment && purchasePayment.notes?.includes(p.name)));
  const productPrice = matchedProd ? matchedProd.price_per_unit : 30000;

  const totalPaymentsDeposit = customerPayments.reduce((sum, item) => sum + item.amount, 0);
  const totalInstallmentsPaid = customerInstallments.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = totalPaymentsDeposit + totalInstallmentsPaid;
  const remainingDebt = Math.max(0, productPrice - totalPaid);
  const paidPercent = productPrice > 0 ? Math.min(100, Math.round((totalPaid / productPrice) * 100)) : 0;

  // Submit methods
  const submitInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instAmount) return;
    await onAddInstallment({
      customer_id: customer.id,
      amount: Number(instAmount),
      date: instDate,
      memo_no: instMemo,
      paid_to: instPaidTo,
      notes: instNotes,
    });
    setInstAmount('');
    setInstMemo('');
    setInstPaidTo('');
    setInstNotes('');
    setShowInstallmentModal(false);
  };

  const submitPaymentLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    await onAddPaymentLog({
      customer_id: customer.id,
      amount_type: payType,
      amount: Number(payAmount),
      date: payDate,
      notes: payNotes,
    });
    setPayAmount('');
    setPayNotes('');
    setShowPaymentModal(false);
  };

  const submitCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callBy.trim() || !callSummary.trim()) return;
    await onAddCallLog({
      customer_id: customer.id,
      called_by: callBy,
      conversation_summary: callSummary,
      status: callStatus,
      next_action: callNextAction,
    });
    setCallBy('');
    setCallSummary('');
    setCallNextAction('');
    setShowCallModal(false);
  };

  const submitEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCustomer) return;
    await onUpdateCustomer(customer.id, {
      name: editName,
      phone: editPhone,
      address: editAddress,
      guarantor_name: editGuarantor,
      assigned_collector: editCollector,
      area: editArea,
      installment_frequency: editFrequency,
      total_installments: Number(editTotalInstallments),
      memo_no: editMemoNo,
      sale_date: editSaleDate,
    });
    setShowEditCustomerModal(false);
  };

  const handleDeleteCustomerClick = async () => {
    if (!onDeleteCustomer) return;
    const confirmDelete = window.confirm('আপনি কি নিশ্চিত যে আপনি এই গ্রাহকের সমস্ত ডাটা মুছে ফেলতে চান? এটি রিভার্স করা সম্ভব নয়!');
    if (confirmDelete) {
      await onDeleteCustomer(customer.id);
      onBack();
    }
  };

  const handleDeleteInstallmentClick = async (id: string) => {
    if (!onDeleteInstallment) return;
    const confirmDelete = window.confirm('আপনি কি নিশ্চিত যে আপনি এই কিস্তি পরিশোধ রেকর্ডটি মুছে ফেলতে চান?');
    if (confirmDelete) {
      await onDeleteInstallment(id);
    }
  };

  const handleDeletePaymentClick = async (id: string) => {
    if (!onDeletePaymentLog) return;
    const confirmDelete = window.confirm('আপনি কি নিশ্চিত যে আপনি এই নগদ আমানত রেকর্ডটি মুছে ফেলতে চান?');
    if (confirmDelete) {
      await onDeletePaymentLog(id);
    }
  };

  // Excel/CSV Exporter
  const handleDownloadCSV = () => {
    const rows = [
      ["গ্রাহক বিবরণী ও লেজার রিপোর্ট (Customer Statement)"],
      ["গ্রাহকের নাম / ID", `${customer.name} (ID: ${customer.id})`],
      ["মোবাইল নম্বর", customer.phone || 'N/A'],
      ["ঠিকানা", customer.address || 'N/A'],
      ["জামিন্দার", customer.guarantor_name || 'N/A'],
      ["মেমো নং", customer.memo_no],
      ["এলাকা/জোন", customer.area || 'N/A'],
      ["দ্বায়িত্বপ্রাপ্ত কর্মী", customer.assigned_collector || 'N/A'],
      ["কিস্তির ধরন", customer.installment_frequency ? (customer.installment_frequency === 'daily' ? 'দৈনিক' : customer.installment_frequency === 'weekly' ? 'সাপ্তাহিক' : 'মাসিক') : 'সাপ্তাহিক'],
      ["মোট কিস্তির সংখ্যা", customer.total_installments || 10],
      [],
      ["আর্থিক বিবরণী"],
      ["মোট মূল্য", `${productPrice} ৳`],
      ["মোট নগদ জমা ও ডাউন পেমেন্ট", `${totalPaymentsDeposit} ৳`],
      ["মোট কিস্তি পরিশোধ", `${totalInstallmentsPaid} ৳`],
      ["সর্বমোট পরিশোধ", `${totalPaid} ৳`],
      ["বকেয়া দেনা", `${remainingDebt} ৳`],
      ["আদায় অনুপাত", `${paidPercent}%`],
      [],
      ["কিস্তি পরিশোধের তালিকা"],
      ["তারিখ (Date)", "মেমো নং (Memo)", "পরিমাণ (Amount)", "কালেক্টর (Collector)", "মন্তব্য (Notes)"]
    ];

    customerInstallments.forEach(i => {
      rows.push([i.date, i.memo_no, `${i.amount} ৳`, i.paid_to || 'N/A', i.notes || '']);
    });

    rows.push([]);
    rows.push(["নগদ আদায় ও আমানতের তালিকা"]);
    rows.push(["তারিখ (Date)", "আদায়ের ধরণ (Type)", "পরিমাণ (Amount)", "মন্তব্য (Notes)"]);
    customerPayments.forEach(p => {
      rows.push([p.date, p.amount_type, `${p.amount} ৳`, p.notes || '-']);
    });

    // Handle Bangla characters using UTF-8 BOM
    const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Statement_${customer.name}_Memo_${customer.memo_no}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Date Calculator for Installment Planner
  const getNextPlanDate = (startDateStr: string, index: number, freq: 'daily' | 'weekly' | 'monthly') => {
    const d = new Date(startDateStr || new Date());
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    if (freq === 'daily') {
      d.setDate(d.getDate() + index);
    } else if (freq === 'monthly') {
      d.setMonth(d.getMonth() + index);
    } else {
      // weekly
      d.setDate(d.getDate() + index * 7);
    }
    return d.toISOString().split('T')[0];
  };

  // Generate Installment Schedule Plan List
  const planTotalCount = customer.total_installments || 10;
  const planFrequency = customer.installment_frequency || 'weekly';
  const planIndividualAmount = Math.ceil((productPrice - totalPaymentsDeposit) / planTotalCount);
  const plannedSchedules = Array.from({ length: planTotalCount }).map((_, idx) => {
    const orderNo = idx + 1;
    const dueDate = getNextPlanDate(customer.sale_date, orderNo, planFrequency);
    return {
      index: orderNo,
      dueDate,
      amount: planIndividualAmount,
    };
  });

  return (
    <div className="space-y-6" id="customer-details-section">
      {/* Dynamic print configuration style tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* Top bar with Back Button & Print/Export actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>তালিকায় ফিরে যান</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Print ledger button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="গ্রাহকের সম্পূর্ণ হিসাব রসিদ প্রিন্ট করুন"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>প্রিন্ট করুন (PDF)</span>
          </button>

          {/* Export ledger button */}
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="এক্সেল এ এক্সপোর্ট করুন"
          >
            <Download className="h-3.5 w-3.5" />
            <span>এক্সেল এক্সপোর্ট</span>
          </button>

          {/* Edit customer profile */}
          <button
            onClick={() => setShowEditCustomerModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>প্রোফাইল এডিট</span>
          </button>

          {/* Delete customer profile */}
          <button
            onClick={handleDeleteCustomerClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-650 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer animate-pulse"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>গ্রাহক ডিলিট</span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Customer Card Statistics, 2. Interactive Ledger logs inside a printable container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="print-area">
        {/* Left 4/12 pane: Customer identity, purchase info, and progress chart */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner no-print">
                {customer.name?.charAt(0) || 'C'}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">{customer.name}</h3>
                <p className="text-xs text-indigo-650 font-sans font-semibold">মেমো নম্বর: {customer.memo_no}</p>
              </div>
            </div>

            {/* Profile Info Details in Bangla */}
            <div className="space-y-4 text-xs text-slate-700 font-sans">
              <div>
                <span className="block text-slate-400 font-bold mb-0.5">নাম (Name)</span>
                <span className="font-bold text-slate-800 block text-xs">{customer.name}</span>
              </div>

              {/* Customer Phone - MOST IMPORTANT */}
              <div>
                <span className="block text-slate-400 font-bold mb-0.5">মোবাইল নম্বর (Phone)</span>
                {customer.phone ? (
                  <a 
                    href={`tel:${customer.phone}`} 
                    className="inline-flex items-center gap-1.5 font-bold text-indigo-650 hover:underline text-sm font-mono"
                  >
                    <Phone className="h-3.5 w-3.5 no-print" />
                    <span>{customer.phone}</span>
                  </a>
                ) : (
                  <span className="italic text-slate-450 text-xs">কোনো মোবাইল নম্বর যুক্ত করা হয়নি</span>
                )}
              </div>

              <div>
                <span className="block text-slate-400 font-bold mb-0.5">ঠিকানা (Address)</span>
                <span className="font-medium text-slate-705 leading-relaxed block text-xs">{customer.address || 'কোনো ঠিকানা এন্ট্রি করা হয়নি'}</span>
              </div>

              {/* Collector & Area Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold mb-0.5 inline-flex items-center gap-1">
                    <UserCheck className="h-2.5 w-2.5" /> কর্মী/সংগ্রাহক
                  </span>
                  <span className="font-bold text-slate-800 block text-[11px]">{customer.assigned_collector || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold mb-0.5 inline-flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> এলাকা/জোন
                  </span>
                  <span className="font-bold text-slate-850 block text-[11px]">{customer.area || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-slate-400 font-bold mb-0.5">জামিন্দারের নাম</span>
                  <span className="font-semibold text-slate-800 block text-xs">{customer.guarantor_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold mb-0.5">কিস্তির ধরন</span>
                  <span className="font-bold text-indigo-700 block text-xs">
                    {customer.installment_frequency === 'daily' ? 'দৈনিক কিস্তি' : customer.installment_frequency === 'monthly' ? 'মাসিক কিস্তি' : 'সাপ্তাহিক কিস্তি'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="block text-slate-400 font-bold mb-0.5">কবে বিক্রি হয়েছে</span>
                  <span className="font-mono font-semibold text-slate-800 block text-xs">{customer.sale_date || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold mb-0.5">অগ্রিম ডাউন পেমেন্ট</span>
                  <span className="font-mono font-bold text-emerald-700 block text-xs">{totalPaymentsDeposit.toLocaleString('bn-BD')} BDT</span>
                </div>
              </div>

              {/* Product details */}
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 space-y-2">
                <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider">ক্রয়কৃত পণ্যের বিবরণ</span>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold">পণ্যের নাম</span>
                  <span className="font-bold text-slate-800 text-xs block">{productName}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold">পণ্যের মূল্য</span>
                  <span className="font-mono font-bold text-indigo-700 block text-xs">{productPrice.toLocaleString('bn-BD')} BDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown card with beautiful Bengali text */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-sm border border-slate-800">
            <h4 className="text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-4 font-sans">আর্থিক স্থিতি বিশ্লেষণ</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                <span className="text-slate-400 font-semibold">মোট পণ্যের মূল্য:</span>
                <span className="font-mono font-bold">{productPrice.toLocaleString('bn-BD')} BDT</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                <span className="text-slate-400 font-semibold">অগ্রিম নগদ জমা:</span>
                <span className="font-mono font-semibold text-emerald-300">(-) {totalPaymentsDeposit.toLocaleString('bn-BD')} BDT</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                <span className="text-slate-400 font-semibold">মোট কিস্তি পরিশোধ:</span>
                <span className="font-mono font-semibold text-emerald-300">(-) {totalInstallmentsPaid.toLocaleString('bn-BD')} BDT</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-indigo-200 text-sm font-bold">মোট বকেয়া পাওনা:</span>
                <span className="font-mono text-amber-300 font-bold text-base">{remainingDebt.toLocaleString('bn-BD')} BDT</span>
              </div>
            </div>

            {/* Custom progress visual */}
            <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-200">মোট আদায় অনুপাত</span>
                <span className="text-emerald-400 font-mono">{paidPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-350"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-450 leading-normal font-sans pt-1">
                * নগদ জমা বা কিস্তির পরিমাণ যোগ করা হলে অনুপাত স্বয়ংক্রিয়ভাবে আপডেট হবে।
              </p>
            </div>
          </div>
        </div>

        {/* Right 8/12 pane: Tabs of transaction logs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Tab header buttons - hides during physical print */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
              <div className="flex flex-wrap p-0.5 bg-slate-200/60 rounded-xl" id="details-tab-nav">
                <button
                  onClick={() => setActiveTab('installments')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'installments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-550 hover:text-slate-880'
                  }`}
                >
                  কিস্তি পরিশোধ ({customerInstallments.length})
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'schedule' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-550 hover:text-slate-880'
                  }`}
                >
                  সময়সূচি পরিকল্পনা ({planTotalCount})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-550 hover:text-slate-880'
                  }`}
                >
                  ডাউন পেমেন্ট/জমা ({customerPayments.length})
                </button>
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'calls' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-550 hover:text-slate-880'
                  }`}
                >
                  ফোন কল রেকর্ড ({customerCalls.length})
                </button>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="flex gap-2">
                {activeTab === 'installments' && (
                  <button
                    onClick={() => setShowInstallmentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    id="btn-add-installment-trigger"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>কিস্তি অ্যাড করুন</span>
                  </button>
                )}
                {activeTab === 'payments' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    id="btn-add-payment-trigger"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>নগদ জমা যোগ</span>
                  </button>
                )}
                {activeTab === 'calls' && (
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    id="btn-add-call-trigger"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>নতুন কল ট্র্যাকিং</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {/* INSTALLMENTS TABS */}
              {(activeTab === 'installments' || activeTab === 'schedule') && (
                <div className={`${activeTab === 'schedule' ? 'no-print' : ''} space-y-4`}>
                  <h3 className="hidden print:block text-sm font-bold text-slate-800 mb-2">কিস্তি পরিশোধ লেজার স্টেটমেন্ট (Paid Installment History)</h3>
                  {customerInstallments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic">
                      কোনো কিস্তির হিসাব পাওয়া যায়নি। কিস্তি রেজিস্টার করতে ওপরে ক্লিক করুন।
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" id="installments-inner-table">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-sans text-slate-450 font-bold pb-2">
                            <th className="pb-3 text-xs">তারিখ</th>
                            <th className="pb-3 text-xs">পরিমাণ</th>
                            <th className="pb-3 text-xs">মেমো নং</th>
                            <th className="pb-3 text-xs">কালেকশন কর্মী</th>
                            <th className="pb-3 text-xs">মন্তব্য</th>
                            <th className="pb-3 text-right text-xs no-print">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-sans">
                          {customerInstallments.map(inst => (
                            <tr key={inst.id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-mono font-semibold">{inst.date}</td>
                              <td className="py-3 font-mono font-bold text-indigo-600">{inst.amount.toLocaleString('bn-BD')} ৳</td>
                              <td className="py-3 font-semibold text-slate-800">{inst.memo_no || 'N/A'}</td>
                              <td className="py-3 text-slate-500 font-bold">{inst.paid_to || 'N/A'}</td>
                              <td className="py-3 text-slate-400">{inst.notes || 'কোনো মন্তব্য নেই'}</td>
                              <td className="py-3 text-right no-print">
                                <button 
                                  onClick={() => handleDeleteInstallmentClick(inst.id)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-red-650 rounded transition-colors cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* INSTALLMENT SCHEDULE PLANNING (সময়সূচী পরিকল্পনা) */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-900 inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-600" /> কিস্তির অগ্রিম শিডিউল ক্যালকুলেটর
                    </h4>
                    <p className="text-slate-650 text-xs font-normal leading-normal">
                      গ্রাহকের কিস্তির ধরণ <b>{customer.installment_frequency === 'daily' ? 'দৈনিক' : customer.installment_frequency === 'monthly' ? 'মাসিক' : 'সাপ্তাহিক'}</b> এবং মোট কিস্তির সংখ্যা <b>{customer.total_installments || 10} টি</b> এর উপর ভিত্তি করে স্বয়ংক্রিয়ভাবে কিস্তির অগ্রিম সময়সূচি তৈরি করা হয়েছে।
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] text-slate-450 font-bold pb-2">
                          <th className="pb-3 text-xs">কিস্তি নং</th>
                          <th className="pb-3 text-xs">পরিকল্পিত তারিখ (Due Date)</th>
                          <th className="pb-3 text-xs">প্রত্যাশিত কিস্তি পরিমাণ (Expected)</th>
                          <th className="pb-3 text-right text-xs">স্থিতি (Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                        {plannedSchedules.map((schedule, index) => {
                          const isPaid = index < customerInstallments.length;
                          const isOverdue = !isPaid && new Date(schedule.dueDate) < new Date();
                          return (
                            <tr key={schedule.index} className="hover:bg-slate-50/50">
                              <td className="py-3 font-bold text-slate-800">কিস্তি #{schedule.index}</td>
                              <td className="py-3 font-mono font-medium text-slate-650">{schedule.dueDate}</td>
                              <td className="py-3 font-mono font-bold text-indigo-650">{schedule.amount.toLocaleString('bn-BD')} ৳</td>
                              <td className="py-3 text-right font-sans">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    <Check className="h-3 w-3" /> পরিশোধিত
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                    <AlertCircle className="h-3 w-3" /> কিস্তি ডেডলাইন বিলম্বিত
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                                    <Clock className="h-3 w-3" /> পরিশোধের তারিখ বাকি
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAYMENTS TABS */}
              {(activeTab === 'payments' || activeTab === 'schedule') && (
                <div className={`${activeTab === 'schedule' ? 'no-print' : ''} space-y-4 pt-4`}>
                  <h3 className="hidden print:block text-sm font-bold text-slate-800 mb-2">নগদ এন্ট্রি জমা ও ডাউন পেমেন্ট বিস্তারিত (Upfront & Advance Deposits)</h3>
                  {customerPayments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic">
                      কোনো নগদ জমা বা অগ্রিম ট্র্যাকিং হিস্ট্রি পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans" id="payments-inner-table">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] text-slate-450 font-bold pb-2">
                            <th className="pb-3 text-xs">তারিখ</th>
                            <th className="pb-3 text-xs">জমার ধরণ</th>
                            <th className="pb-3 text-xs">পরিমাণ (BDT)</th>
                            <th className="pb-3 text-xs">বিবরণ / নোটস</th>
                            <th className="pb-3 text-right text-xs no-print">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                          {customerPayments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-mono font-medium">{p.date}</td>
                              <td className="py-3">
                                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 font-sans text-[10px] font-bold">
                                  {p.amount_type}
                                </span>
                              </td>
                              <td className="py-3 font-mono font-bold text-emerald-700">{p.amount.toLocaleString('bn-BD')} ৳</td>
                              <td className="py-3 text-slate-550">{p.notes || '-'}</td>
                              <td className="py-3 text-right no-print">
                                <button 
                                  onClick={() => handleDeletePaymentClick(p.id)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-red-650 rounded transition-colors cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* CALL LOGS TAB */}
              {activeTab === 'calls' && (
                <div className="space-y-4 no-print">
                  {customerCalls.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic">
                      কোনো ফোন কল ট্র্যাকিং ডাটা নেই। গ্রাহককে কল করার পর নোটস এন্ট্রি করতে পারেন।
                    </div>
                  ) : (
                    <div className="space-y-4" id="call-logs-container">
                      {customerCalls.map(call => (
                        <div key={call.id} className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-850 text-xs">কল করেছেন: {call.called_by}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">সময়: {new Date(call.call_date).toLocaleString('bn-BD')}</div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              call.status === 'Reached'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {call.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-650 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-50/50">
                            <b>কথোপকথন সংক্ষেপ:</b> {call.conversation_summary}
                          </p>

                          {call.next_action && (
                            <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-bold pt-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>পরবর্তী পদক্ষেপ: {call.next_action}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Add Installment Modal */}
      {showInstallmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl" id="modal-installment-form">
            <h3 className="text-lg font-bold text-slate-850 mb-1">কিস্তি অ্যাড করুন</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">নতুন কিস্তির পেমেন্ট রেকর্ডটি যোগ করুন।</p>
            <form onSubmit={submitInstallment} className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">পরিমাণ (Amount)</label>
                  <input
                    type="number"
                    required
                    placeholder="যেমন: ৩০০০"
                    value={instAmount}
                    onChange={(e) => setInstAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">তারিখ (Date)</label>
                  <input
                    type="date"
                    required
                    value={instDate}
                    onChange={(e) => setInstDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">মেমো নম্বর (Memo No)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: INST-102"
                    value={instMemo}
                    onChange={(e) => setInstMemo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">কালেক্টরের নাম (Paid To)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: হাসিব"
                    value={instPaidTo}
                    onChange={(e) => setInstPaidTo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1">নোটস / মন্তব্য</label>
                <textarea
                  placeholder="যেমন: সময়মতো কিস্তি পরিশোধ করেছেন"
                  value={instNotes}
                  onChange={(e) => setInstNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs h-20 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInstallmentModal(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  কিস্তি অ্যাড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl" id="modal-payment-form">
            <h3 className="text-lg font-bold text-slate-850 mb-1">নগদ জমা এন্ট্রি করুন</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">অন্যান্য ডাউন পেমেন্ট বা আপফ্রন্ট ক্যাশ যোগ করুন।</p>
            <form onSubmit={submitPaymentLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">জমার পরিমাণ</label>
                  <input
                    type="number"
                    required
                    placeholder="যেমন: ৫০০০"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">জমার ধরণ</label>
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-sans"
                >
                  <option value="নগদ জমা">নগদ জমা (Regular Deposit)</option>
                  <option value="বুকিং মানি">বুকিং মানি (Booking Money)</option>
                  <option value="জরিমানা আদায়">জরিমানা আদায় (Fines)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">বিবরণ / নোটস</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ডাউনপেমেন্ট ঘাটতি পূরণ"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold font-sans"
                >
                  এন্ট্রি নিশ্চিত
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Call Log Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl" id="modal-call-form">
            <h3 className="text-lg font-bold text-slate-850 mb-1">ফোন কল আলাপচারিতা রেকর্ড</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">গ্রাহকের ফোনে কল করার পর তাদের মনোভাব নোট করুন।</p>
            <form onSubmit={submitCallLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">কল করেছেন কে?</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ম্যানেজার হাসিব"
                    value={callBy}
                    onChange={(e) => setCallBy(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">কলের স্ট্যাটাস</label>
                  <select
                    value={callStatus}
                    onChange={(e) => setCallStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-sans"
                  >
                    <option value="Reached">Reached (কথা হয়েছে)</option>
                    <option value="No Answer">No Answer (কল ধরেনি)</option>
                    <option value="Busy">Busy (ব্যস্ত)</option>
                    <option value="Switched Off">Switched Off (বন্ধ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">কথোপকথন সংক্ষেপ</label>
                <textarea
                  required
                  placeholder="যেমন: কাস্টমার আগামী সোমবার কিস্তি পরিশোধ করার জন্য আশ্বাস দিয়েছেন"
                  value={callSummary}
                  onChange={(e) => setCallSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পরবর্তী পদক্ষেপ / Next Action</label>
                <input
                  type="text"
                  placeholder="যেমন: সোমবার পুনরায় ফোন করুন"
                  value={callNextAction}
                  onChange={(e) => setCallNextAction(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold font-sans"
                >
                  কল রেকর্ড যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT CUSTOMER PROFILING MODAL */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-1 pb-2 border-b border-slate-150">
              <h3 className="text-base font-bold text-slate-850">গ্রাহকের প্রোফাইল তথ্য এডিট করুন</h3>
              <button 
                onClick={() => setShowEditCustomerModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={submitEditCustomer} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-650 mb-1">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-650 mb-1">মোবাইল নম্বর (জরুরি) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ০১৭১২৩৪৫৬৭৮"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-650 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-650 mb-1">জামিন্দারের নাম</label>
                  <input
                    type="text"
                    value={editGuarantor}
                    onChange={(e) => setEditGuarantor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-650 mb-1">মেমো নম্বর</label>
                  <input
                    type="text"
                    required
                    value={editMemoNo}
                    onChange={(e) => setEditMemoNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs select-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                <div>
                  <label className="block font-bold text-indigo-950 mb-1 inline-flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> কর্মী/সংগ্রাহক
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: কালেকশন কর্মী আবির"
                    value={editCollector}
                    onChange={(e) => setEditCollector(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-indigo-950 mb-1 inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> এলাকা/জোন
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মিরপুর ১০, ঢাকা"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-650 mb-1">কিস্তির ফ্রিকোয়েন্সি</label>
                  <select
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="daily">দৈনিক কিস্তি (Daily)</option>
                    <option value="weekly">সাপ্তাহিক কিস্তি (Weekly)</option>
                    <option value="monthly">মাসিক কিস্তি (Monthly)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-650 mb-1">মোট কিস্তির সংখ্যা (এক কিস্তি মূল্য পুনঃহিসাব হবে)</label>
                  <input
                    type="number"
                    value={editTotalInstallments}
                    onChange={(e) => setEditTotalInstallments(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-650 mb-1">বিক্রির তারিখ</label>
                <input
                  type="date"
                  value={editSaleDate}
                  onChange={(e) => setEditSaleDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
