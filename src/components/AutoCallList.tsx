import React, { useState } from 'react';
import { CallTarget, Customer, Book } from '../types';
import { 
  Phone, 
  Calendar, 
  Check, 
  Play, 
  User, 
  RefreshCw, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle, 
  MapPin, 
  BookOpen, 
  Clock, 
  Copy, 
  Database, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';

interface AutoCallListProps {
  callTargets: CallTarget[];
  customers: Customer[];
  books: Book[];
  installments: any[];
  onGenerateTargets: () => Promise<void>;
  onUpdateTarget: (id: string, updates: Partial<CallTarget>) => Promise<void>;
  onLogCall: (customerId: string, calledBy: string, summary: string, status: string, nextAction: string) => Promise<void>;
}

export default function AutoCallList({
  callTargets,
  customers,
  books,
  installments,
  onGenerateTargets,
  onUpdateTarget,
  onLogCall,
}: AutoCallListProps) {
  const [generating, setGenerating] = useState(false);
  const [loggingCallForCustId, setLoggingCallForCustId] = useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'checklist' | 'targets'>('checklist');

  // Form Inputs for logging calls
  const [callerName, setCallerName] = useState('ম্যানেজার');
  const [convoSummary, setConvoSummary] = useState('');
  const [callStatus, setCallStatus] = useState('Promise to pay');
  const [nextActionDate, setNextActionDate] = useState('');

  // 1. Core On-the-Fly Due Calculator Logic
  const getDueDetails = (customer: Customer) => {
    const custInsts = installments.filter(i => i.customer_id === customer.id);
    let lastInstallmentDateStr = customer.sale_date;
    let hasPaidInstallment = false;
    
    if (custInsts.length > 0) {
      custInsts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      lastInstallmentDateStr = custInsts[0].date;
      hasPaidInstallment = true;
    }

    const book = books.find(b => b.id === customer.book_id);
    const bookName = book?.name?.toLowerCase() || '';
    const isMobileBook = bookName.includes('mobile') || bookName.includes('মোবাইল');
    const saleDay = new Date(customer.sale_date).getDate();
    const intervalDays = (isMobileBook || saleDay <= 7) ? 7 : 30;

    const lastDate = new Date(lastInstallmentDateStr);
    const nextDueDate = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    
    // System Local Reference Date from Additional Metadata
    const todayStr = "2026-06-14";
    const today = new Date(todayStr);

    const diffTime = nextDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusText = "চলতি (Upcoming)";
    let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
    let isDue = false;

    if (diffDays <= 0) {
      statusText = "বকেয়া (Due)";
      statusColor = "bg-rose-50 text-rose-700 border-rose-100 font-bold";
      isDue = true;
    } else if (diffDays <= 7) {
      statusText = "এই সপ্তাহে প্রদেয়";
      statusColor = "bg-amber-50 text-amber-700 border-amber-100 font-semibold";
      isDue = true; // Arriving this week
    }

    return {
      lastInstallmentDate: hasPaidInstallment ? lastInstallmentDateStr : `${customer.sale_date} (বিক্রয় তারিখ)`,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      isDue,
      statusText,
      statusColor,
      intervalType: intervalDays === 7 ? "সাপ্তাহিক (7 দিন)" : "মাসিক (30 দিন)",
      diffDays
    };
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerateTargets();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogCallSubmit = async (e: React.FormEvent, custId: string) => {
    e.preventDefault();
    if (!convoSummary.trim()) return;
    
    // Log Call
    await onLogCall(custId, callerName || 'ম্যানেজার', convoSummary, callStatus, nextActionDate);
    
    // If a call target exists for this customer, mark it as called
    const matchedTarget = callTargets.find(t => t.customer_id === custId && !t.is_called);
    if (matchedTarget) {
      await onUpdateTarget(matchedTarget.id, { is_called: true });
    }
    
    // Reset Form
    setLoggingCallForCustId(null);
    setCallerName('ম্যানেজার');
    setConvoSummary('');
    setCallStatus('Promise to pay');
    setNextActionDate('');
  };

  // Grouping Customers by Book for Part 2 ("তালিকা" tab)
  const customersWithDueData = customers.map(customer => {
    const dueInfo = getDueDetails(customer);
    const book = books.find(b => b.id === customer.book_id);
    return {
      ...customer,
      dueInfo,
      book
    };
  });

  const dueCustomersOnly = customersWithDueData.filter(c => {
    // If they have been called already, they have been marked is_called = true on their call target
    // Filter them out of the list of customers who need a call so they disappear from active call list!
    const customerTargets = callTargets.filter(t => t.customer_id === c.id);
    if (customerTargets.length > 0) {
      const hasPending = customerTargets.some(t => !t.is_called);
      if (!hasPending) {
        return false;
      }
    }
    return c.dueInfo.isDue;
  });

  // Group by book ID
  const groupedByBook = books.map(book => {
    const bookCustomers = dueCustomersOnly.filter(c => c.book_id === book.id);
    return {
      book,
      customers: bookCustomers
    };
  }).filter(g => g.customers.length >= 0); // Keep all books to show full view or empty state info

  // Call Targets matching (Not called list)
  const preparedTargets = callTargets.map(target => {
    const customer = customers.find(c => c.id === target.customer_id);
    const book = customer ? books.find(b => b.id === customer.book_id) : null;
    return {
      ...target,
      customer,
      book,
    };
  }).filter(t => t.customer);

  const pendingTargets = preparedTargets.filter(t => !t.is_called);
  const completedTargets = preparedTargets.filter(t => t.is_called);

  // SQL Query explanation for Part 3
  const sqlQueryForDues = `-- ==========================================
-- SQL QUERY LOGIC FOR CALCULATING DUE CUSTOMERS
-- ==========================================
-- This query determines who has exceeded their frequency period
-- (Weekly = 7 days if mobile/odd-schedule, Monthly = 30 days otherwise)
-- relative to their last installment date (or sale_date fallback).

WITH customer_calculations AS (
  SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.address,
    c.sale_date,
    b.id AS book_id,
    b.name AS book_name,
    COALESCE(MAX(i.date), c.sale_date) AS last_installment_date,
    CASE 
      WHEN b.name LIKE '%Mobile%' OR b.name LIKE '%মোবাইল%' OR EXTRACT(DAY FROM c.sale_date) <= 7 THEN 'Weekly'
      ELSE 'Monthly'
    END AS interval_type,
    CASE 
      WHEN b.name LIKE '%Mobile%' OR b.name LIKE '%মোবাইল%' OR EXTRACT(DAY FROM c.sale_date) <= 7 THEN INTERVAL '7 days'
      ELSE INTERVAL '30 days'
    END AS interval_duration
  FROM customers c
  JOIN books b ON c.book_id = b.id
  LEFT JOIN installments i ON c.id = i.customer_id
  GROUP BY c.id, c.name, c.address, c.sale_date, b.id, b.name
)
SELECT 
  customer_id,
  customer_name,
  address,
  book_name,
  last_installment_date,
  interval_type,
  (last_installment_date + interval_duration)::DATE AS next_due_date,
  CURRENT_DATE AS reference_date,
  CASE 
    WHEN CURRENT_DATE > (last_installment_date + interval_duration) THEN 'Due (বকেয়া)'
    WHEN CURRENT_DATE >= (last_installment_date + interval_duration - INTERVAL '7 days') THEN 'Due This Week (চলতি সপ্তাহ)'
    ELSE 'Regular (চলতি)'
  END AS due_status
FROM customer_calculations
WHERE CURRENT_DATE >= (last_installment_date + interval_duration - INTERVAL '7 days')
ORDER BY book_name, next_due_date ASC;`;

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(sqlQueryForDues);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  return (
    <div className="space-y-6" id="autocall-tab-wrapper">
      {/* Tab Selectors */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm max-w-md">
        <button
          onClick={() => setActiveSegment('checklist')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSegment === 'checklist'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>তাত্ক্ষণিক বকেয়া খাতা তালিকা</span>
        </button>
        <button
          onClick={() => setActiveSegment('targets')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSegment === 'targets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          <span>কল টার্গেট সেটিংস</span>
        </button>
      </div>

      {activeSegment === 'checklist' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6 animate-fade-in" id="live-checks-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span>সাপ্তাহিক ও মাসিক বকেয়া কিস্তির খাতা তালিকা</span>
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">রিয়েল-টাইম Supabase ডাটা ও অ্যালগরিদম ভিত্তিক অটো হিসাব</p>
            </div>
            <div className="text-xs text-indigo-750 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>সিস্টেম তারিখ: 2026-06-14</span>
            </div>
          </div>

          {/* Grouped by Books */}
          <div className="space-y-6">
            {groupedByBook.map(({ book, customers }) => (
              <div key={book.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50/80 px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    <h3 className="font-bold text-sm text-slate-800">{book.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-sans">
                    {customers.length === 0 ? "কোনো বকেয়া নেই" : `${customers.length} জনের কিস্তি সময় এসেছে`}
                  </span>
                </div>

                {customers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 italic bg-white font-sans">
                    এই খাতায় বকেয়া বা চলতি সপ্তাহে কিস্তির সময় পার হওয়া কোনো কাস্টমার পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-50/20 font-sans">
                          <th className="py-3 px-4 text-left">ক্রমিক</th>
                          <th className="py-3 px-3 text-left">নাম ও বিবরণ</th>
                          <th className="py-3 px-3 text-left">ঠিকানা</th>
                          <th className="py-3 px-3 text-center">ফ্রিকোয়েন্সি</th>
                          <th className="py-3 px-3 text-left">আজ পর্যন্ত শেষ কিস্তি</th>
                          <th className="py-3 px-3 text-left">পরবর্তী কিস্তির সময়</th>
                          <th className="py-3 px-3 text-center">বর্তমান অবস্থা</th>
                          <th className="py-3 px-4 text-center">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                        {customers.map((cust, idx) => (
                          <tr key={cust.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-800 text-[13px]">{cust.name}</div>
                              <span className="text-[10px] text-slate-400 font-mono block">মেমো: {cust.memo_no}</span>
                            </td>
                            <td className="py-3.5 px-3 max-w-48 truncate">
                              <div className="flex items-center gap-0.5 font-sans text-slate-500">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>{cust.address || 'ঠিকানা নেই'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold text-slate-800 font-sans">
                              {cust.dueInfo.intervalType}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500 font-mono text-xs">
                              {cust.dueInfo.lastInstallmentDate}
                            </td>
                            <td className="py-3.5 px-3 text-indigo-750 font-mono font-bold">
                              {cust.dueInfo.nextDueDate}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border ${cust.dueInfo.statusColor}`}>
                                {cust.dueInfo.statusText}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setLoggingCallForCustId(cust.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>কল দেওয়া হয়েছে</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Call Logging for live check view */}
          {loggingCallForCustId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl animate-fade-in font-sans">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm">গ্রাহক ফোন কল অগ্রগতি ট্র্যাকার</h4>
                  <button onClick={() => {
                    setLoggingCallForCustId(null);
                    setCallerName('ম্যানেজার');
                    setConvoSummary('');
                    setCallStatus('Promise to pay');
                    setNextActionDate('');
                  }} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">বন্ধ করুন</button>
                </div>
                
                <form onSubmit={(e) => handleLogCallSubmit(e, loggingCallForCustId)} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">কল সম্পন্নকারী কর্মী </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: হাসিব"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">কলের বর্তমান অবস্থা (Status)</label>
                    <select
                      value={callStatus}
                      onChange={(e) => setCallStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705"
                    >
                      <option value="Paid">Paid (পরিশোধিত)</option>
                      <option value="Promise to pay">Promise to pay (পরিশোধের প্রতিশ্রুতি)</option>
                      <option value="Not reachable">Not reachable (যোগাযোগ করা যায়নি / বন্ধ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">কথোপকথন সারসংক্ষেপ (Conversation Summary)</label>
                    <textarea
                      required
                      placeholder="যেমন: কাস্টমার আগামী শুক্রবার ৩০০০ টাকা পরিশোধ করার নিশ্চয়তা দিয়েছেন।"
                      value={convoSummary}
                      onChange={(e) => setConvoSummary(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs h-16"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">পরবর্তী অনুসরণের তারিখ (Next Action Date)</label>
                    <input
                      type="date"
                      required
                      value={nextActionDate}
                      onChange={(e) => setNextActionDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setLoggingCallForCustId(null);
                        setCallerName('ম্যানেজার');
                        setConvoSummary('');
                        setCallStatus('Promise to pay');
                        setNextActionDate('');
                      }}
                      className="px-3 py-2 bg-slate-100 rounded-lg font-bold text-slate-600 block text-xs cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-bold block text-xs cursor-pointer"
                    >
                      সংরক্ষণ ও ক্লিয়ার
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {activeSegment === 'targets' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6" id="autocall-target-list">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-850 flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-indigo-500" />
                <span>স্বয়ংক্রিয় ফোন কল টার্গেট তালিকা</span>
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">মাসিক বকেয়া কিস্তির ভিত্তিতে ডেডিকেটেড ফোন কল লক্ষ্যমাত্রা</p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-indigo-650 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              id="btn-auto-generate-calls"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'জেনারেট হচ্ছে...' : 'নতুন টার্গেট অটো-জেনারেট করুন'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left segment: Pending calls */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-rose-100 pb-2 text-rose-800">
                <Phone className="h-4 w-4 text-rose-500" />
                <span>কল করা প্রয়োজন ({pendingTargets.length} জন)</span>
              </h3>

              {pendingTargets.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">কোনো নতুন পেন্ডিং কল টার্গেট পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTargets.map(target => (
                    <div key={target.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs hover:border-slate-200 transition-colors space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{target.customer?.name}</h4>
                          <p className="text-[10px] text-slate-500 font-sans mt-0.5">বই: {target.book?.name} | মেমো: {target.customer?.memo_no}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          target.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {target.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-50 pt-2.5">
                        <div className="flex items-center gap-1.5 text-slate-500 font-sans">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>কিস্তি তাগাদার শেষ সময়: <b>{target.due_date}</b></span>
                        </div>

                        <button
                          onClick={() => setLoggingCallForCustId(target.customer_id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>কল দেওয়া হয়েছে</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right segment: Completed calls */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-emerald-100 pb-2 text-emerald-800">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>সম্পন্ন হয়েছে ({completedTargets.length} জন)</span>
              </h3>

              {completedTargets.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  এখনো কোনো সম্পন্ন কলের রেকর্ড সংরক্ষিত হয়নি।
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {completedTargets.map(target => (
                    <div key={target.id} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 flex justify-between items-center text-xs text-slate-700">
                      <div>
                        <h5 className="font-bold text-slate-800">{target.customer?.name}</h5>
                        <div className="text-[10px] text-slate-450 mt-0.5 flex gap-1 font-sans">
                          <span>মেমো নম্বর: {target.customer?.memo_no}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">Called</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                        <Check className="h-3.5 w-3.5" />
                        সংরক্ষিত
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
