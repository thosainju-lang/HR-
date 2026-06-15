import React from 'react';
import { isSupabaseConfigured } from '../supabaseClient';
import { Database, HelpCircle, Layers, Users, PhoneCall, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'calls' | 'schema';
  setView: (view: 'home' | 'calls' | 'schema') => void;
}

export default function Navbar({ currentView, setView }: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm">
              <span className="font-bold text-lg tracking-wider">HR</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                HR কিস্তি
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-sans font-medium px-1.5 py-0.5 rounded border border-indigo-100">
                  SaaS v1.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">বাংলাদেশি ক্ষুদ্র ও মাঝারি ব্যবসার কিস্তি ট্র্যাকার</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setView('calls')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === 'calls'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PhoneCall className="h-4 w-4" />
              <span>তালিকা (কল টার্গেট)</span>
            </button>
            <button
              onClick={() => setView('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>খাতা (বই সমূহ)</span>
            </button>
            <button
              onClick={() => setView('schema')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === 'schema'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Supabase সেটআপ</span>
            </button>
          </nav>

          {/* Integrations Indicator */}
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-sans font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full font-sans font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                ডেমো মোড (Cloud Memory)
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Bar menu */}
      <div className="md:hidden flex border-t border-slate-100 justify-around py-2.5 bg-slate-50/50">
        <button
          onClick={() => setView('calls')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'calls' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PhoneCall className="h-4.5 w-4.5" />
          <span>তালিকা</span>
        </button>
        <button
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4.5 w-4.5" />
          <span>খাতা</span>
        </button>
        <button
          onClick={() => setView('schema')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'schema' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="h-4.5 w-4.5" />
          <span>সেটআপ</span>
        </button>
      </div>
    </header>
  );
}
