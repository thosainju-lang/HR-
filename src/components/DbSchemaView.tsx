import React, { useState } from 'react';
import { Check, Copy, Code, HelpCircle } from 'lucide-react';

export default function DbSchemaView() {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- ==========================================
-- HR কিস্তি (HR Kisti) Supabase Migration SQL
-- ==========================================
-- এটি আপনার Supabase SQL Editor-এ রান করুন।

-- ১. Books (বক্তা বই বা কিস্তি বই)
CREATE TABLE IF NOT EXISTS books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ২. Products (পণ্যসমূহ)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- ৩. Customers (গ্রাহক তালিকা)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    guarantor_name TEXT,
    memo_no TEXT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৪. Installments (পরিশোধিত কিস্তি তালিকা)
CREATE TABLE IF NOT EXISTS installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    memo_no TEXT,
    paid_to TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৫. Payments Log (নগদ অগ্রিম বা ডাউন পেমেন্ট লগ)
CREATE TABLE IF NOT EXISTS payments_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    amount_type TEXT NOT NULL DEFAULT 'Cash Deposit', -- "নগদ জমা" / "ডাউন পেমেন্ট" 
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT
);

-- ৬. Call Logs (ফোন কল আলাপচারিতা বিবরণ)
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    called_by TEXT NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    conversation_summary TEXT,
    status TEXT NOT NULL, -- "Reached", "No Answer", "Busy", "Switched Off" 
    next_action TEXT
);

-- ৭. Call Targets (তাত্ক্ষণিক বা স্বয়ংক্রিয় কল টার্গেট তালিকা)
CREATE TABLE IF NOT EXISTS call_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    due_date DATE NOT NULL,
    is_called BOOLEAN DEFAULT false NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' -- 'High', 'Medium', 'Low'
);

-- Row Level Security (RLS) সক্রিয় করার জন্য নিচের স্ক্রিপ্টগুলো রান করতে পারেন (ঐচ্ছিক)
-- ALTER TABLE books ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_targets ENABLE ROW LEVEL SECURITY;

-- সবার জন্য পড়ার অনুমতি দিয়ে সাধারণ পলিসি (পরীক্ষামূলক):
-- CREATE POLICY "Allow public read" ON books FOR SELECT USING (true);
-- CREATE POLICY "Allow public write" ON books FOR INSERT WITH CHECK (true);
-- (অনুরূপ পলিসি অন্য টেবিলগুলোর জন্যও সংযুক্ত করতে পারেন)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6" id="db-schema-viewer">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Supabase SQL মাইগ্রেশন কোড</h2>
            <p className="text-sm text-slate-500 font-sans mt-0.5">HR কিস্তি ডাটাবেজ সেটআপ স্ক্রিপ্ট</p>
          </div>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm self-start md:self-auto cursor-pointer"
          id="btn-copy-schema"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span>কপি করা হয়েছে!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>SQL কপি করুন</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-6 flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">কিভাবে এটি ব্যবহার করবেন?</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
            <li>আপনার <b>Supabase Dashboard</b> এ যান।</li>
            <li>বাম পাশের মেনু থেকে <b>SQL Editor</b> নির্বাচন করুন এবং <b>New Query</b> তৈরি করুন।</li>
            <li>ওপরের সবুজ বাটনে ক্লিক করে কোডটি কপি করে সেখানে পেস্ট করুন।</li>
            <li><b>Run</b> বাটনে ক্লিক করে টেবিলগুলো সফলভাবে তৈরি করুন।</li>
            <li>তারপর আপনার ৩টি এনভায়রনমেন্ট ভেরিয়েবল <code className="bg-amber-100 px-1 py-0.5 rounded font-mono select-all">.env</code> ফাইলে যোগ করুন।</li>
          </ul>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono max-h-96 leading-relaxed border border-slate-800 shadow-inner">
          <code>{sqlSchema}</code>
        </pre>
        <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 uppercase font-mono tracking-wider pointer-events-none select-none">
          PostgreSQL / Supabase Schema
        </div>
      </div>
    </div>
  );
}
