import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  BarChart3,
  Download,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { formatTaka, toBengaliNumber, formatBengaliDate, formatBengaliDateTime } from '../utils/bengali';
import { calculateDashboardMetrics, calculateMonthlyReport } from '../utils/calculations';

interface DailyBusinessReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyBusinessReportModal: React.FC<DailyBusinessReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { sales, expenses, transactions, customers, products, cashEntries, settings } = useDokan();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  // Calculate metrics for selected date
  const metrics = calculateDashboardMetrics(customers, transactions, sales, products, cashEntries, selectedDate);
  
  // Calculate expenses for the selected date
  const targetDate = new Date(selectedDate);
  targetDate.setHours(0,0,0,0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const dailyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= targetDate && d < nextDate;
  });
  const totalDailyExpense = dailyExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Find record day (highest sales day)
  const salesByDate: Record<string, number> = {};
  sales.forEach(s => {
    const d = s.date.split('T')[0];
    salesByDate[d] = (salesByDate[d] || 0) + s.grandTotal;
  });
  let recordDate = '';
  let maxSale = 0;
  Object.entries(salesByDate).forEach(([d, val]) => {
    if (val > maxSale) {
      maxSale = val;
      recordDate = d;
    }
  });

  // Monthly stats
  const monthlyReports = calculateMonthlyReport(sales, expenses, transactions);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthReport = monthlyReports.find(r => r.yearMonth === currentMonthKey);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 print:p-0 print:bg-white print:relative print:z-0 overflow-hidden">
      <div className="bg-white rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:max-h-none print:rounded-none">
        {/* Header - Hidden in print */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10 print:hidden shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#b83a14]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-lg tracking-tight truncate">
                ব্যবসার পূর্ণাঙ্গ রিপোর্ট ও হিসাব
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">দৈনিক এবং মাসিক বিস্তারিত রিপোর্ট</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b83a14] text-white rounded-lg font-bold text-xs shadow-sm hover:brightness-110 active:scale-95 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Header - Only visible in print */}
        <div className="hidden print:block p-8 text-center border-b-2 border-black space-y-2">
          <h1 className="text-3xl font-black">{settings.shopName}</h1>
          <p className="text-sm font-bold">মালিক: {settings.ownerName} • {settings.phone}</p>
          <div className="pt-4 flex justify-between items-end border-t border-gray-200">
            <div className="text-left">
              <h2 className="text-xl font-bold underline">দৈনিক ও মাসিক রিপোর্ট</h2>
              <p className="text-xs">রিপোর্ট তৈরির তারিখ: {formatBengaliDateTime(new Date().toISOString())}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold">সিলেক্ট করা তারিখ: {formatBengaliDate(selectedDate)}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 print:overflow-visible print:p-8 print:space-y-8">
          
          <div className="flex items-center justify-between gap-2 bg-orange-50 p-3 rounded-2xl border border-orange-100 print:hidden">
            <div className="flex items-center gap-1.5 text-[#b83a14]">
              <Calendar className="w-4 h-4" />
              <span className="font-bold text-xs">তারিখ:</span>
            </div>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-orange-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b83a14] appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Daily Summary Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-orange-100 pb-2">
              <Clock className="w-5 h-5 text-[#b83a14]" />
              <h4 className="font-black text-gray-900 text-base">দৈনিক হিসাব ({formatBengaliDate(selectedDate)})</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="p-2 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
                <div className="text-[9px] sm:text-xs text-gray-500 font-bold mb-0.5 uppercase tracking-wider">মোট বিক্রি</div>
                <div className="text-base sm:text-2xl font-black text-[#b83a14]">{formatTaka(metrics.todaySalesAmount)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5 font-bold">({toBengaliNumber(metrics.todaySalesCount)})</div>
              </div>
              <div className="p-2 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
                <div className="text-[9px] sm:text-xs text-gray-500 font-bold mb-0.5 uppercase tracking-wider">বিক্রির লাভ</div>
                <div className="text-base sm:text-2xl font-black text-emerald-600">{formatTaka(metrics.todayProfit)}</div>
              </div>
              <div className="p-2 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
                <div className="text-[9px] sm:text-xs text-gray-500 font-bold mb-0.5 uppercase tracking-wider">দৈনিক খরচ</div>
                <div className="text-base sm:text-2xl font-black text-red-600">{formatTaka(totalDailyExpense)}</div>
              </div>
              <div className="p-2 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
                <div className="text-[9px] sm:text-xs text-gray-500 font-bold mb-0.5 uppercase tracking-wider">নিট লাভ</div>
                <div className={`text-base sm:text-2xl font-black ${metrics.todayProfit - totalDailyExpense >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {formatTaka(metrics.todayProfit - totalDailyExpense)}
                </div>
              </div>
            </div>

            {/* Daily Expense Breakdown Table */}
            {dailyExpenses.length > 0 && (
              <div className="mt-4 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/30">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px] tracking-widest">
                    <tr>
                      <th className="px-4 py-2.5">খরচের বিবরণ</th>
                      <th className="px-4 py-2.5">ক্যাটাগরি</th>
                      <th className="px-4 py-2.5 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {dailyExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td className="px-4 py-2.5 font-bold text-gray-800 break-words">{exp.title}</td>
                        <td className="px-4 py-2.5 text-gray-500">{exp.category}</td>
                        <td className="px-4 py-2.5 text-right font-black text-red-600 whitespace-nowrap">{formatTaka(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 3. Monthly Summary Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-blue-100 pb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-black text-gray-900 text-base">চলতি মাসের সারাংশ ({currentMonthReport?.monthNameBengali || 'মাসিক'})</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">মাসের লাভ</div>
                  <div className="text-xl font-black text-blue-700 mt-0.5">{formatTaka(currentMonthReport?.totalProfit || 0)}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
              <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-red-800 font-bold uppercase tracking-wider">মাসের খরচ</div>
                  <div className="text-xl font-black text-red-700 mt-0.5">{formatTaka(currentMonthReport?.totalExpenses || 0)}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <TrendingDown className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Business Records & Insights */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-emerald-100 pb-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h4 className="font-black text-gray-900 text-base">রেকর্ড ও মাইলফলক</h4>
            </div>

            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                  <span className="text-[9px] font-bold uppercase leading-none opacity-80">রেকর্ড</span>
                  <span className="text-base font-black leading-none mt-1">🏆</span>
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-900 uppercase tracking-wide">সর্বোচ্চ বিক্রির দিন</div>
                  <div className="text-[10px] text-emerald-700 font-bold">{recordDate ? formatBengaliDate(recordDate) : '---'}</div>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-2xl font-black text-emerald-700">{formatTaka(maxSale)}</div>
                <div className="text-[9px] text-emerald-600 font-bold">এক দিনে সবচেয়ে বেশি বিক্রি</div>
              </div>
            </div>
          </section>

          {/* Monthly Comparison History Table (Full Month View) */}
          <section className="space-y-4 print:mt-12">
            <div className="flex items-center gap-2 border-b-2 border-gray-100 pb-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h4 className="font-black text-gray-900 text-base">মাসওয়ারি তুলনামূলক রিপোর্ট</h4>
            </div>
            
            <div className="border border-gray-100 rounded-2xl overflow-x-auto bg-white shadow-sm print:border-black print:rounded-none">
              <table className="w-full text-[10px] sm:text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[9px] sm:text-[10px] tracking-widest border-b border-gray-100 print:bg-gray-100 print:border-black">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3">মাস</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">বিক্রি</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">লাভ</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">খরচ</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">নিট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 print:divide-black">
                  {monthlyReports.map(report => (
                    <tr key={report.yearMonth} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-gray-900 truncate max-w-[80px] sm:max-w-none">{report.monthNameBengali}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-600">{formatTaka(report.totalSales)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-emerald-600">+{formatTaka(report.totalProfit)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-red-500">-{formatTaka(report.totalExpenses)}</td>
                      <td className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-black ${report.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {formatTaka(report.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer - Hidden in print */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center print:hidden">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            ডাইনামিক বিজনেস রিপোর্ট জেনারেটর • {settings.shopName}
          </p>
        </div>

        {/* Print Footer - Only visible in print */}
        <div className="hidden print:block p-8 pt-0 mt-auto border-t border-gray-200">
          <div className="flex justify-between items-start pt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div>জেনারেটেড বাই: দোকান ম্যানেজার অ্যাপ</div>
            <div>স্বাক্ষর ও সিল: ___________________</div>
          </div>
        </div>
      </div>

      {/* Global CSS for Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:relative { position: relative !important; top: 0 !important; left: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          @page { size: A4; margin: 1cm; }
          .fixed { position: static !important; }
          .overflow-y-auto { overflow: visible !important; }
          .max-h-\\[95vh\\] { max-height: none !important; }
          .shadow-2xl { shadow: none !important; }
          .bg-black\\/60 { background: white !important; }
          .backdrop-blur-sm { backdrop-filter: none !important; }
        }
      `}} />
    </div>
  );
};
