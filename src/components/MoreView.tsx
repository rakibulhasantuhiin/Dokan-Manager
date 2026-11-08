import React, { useState } from 'react';
import {
  FileText,
  Truck,
  TrendingDown,
  BookOpen,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '../utils/bengali';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';

export const MoreView: React.FC = () => {
  const {
    products,
    updateProduct,
    suppliers,
    addSupplier,
    purchases,
    addPurchase,
    expenses,
    addExpense,
    deleteExpense,
    cashEntries,
    addCashEntry,
    sales,
    customers,
  } = useDokan();

  const [activeModal, setActiveModal] = useState<
    'purchase' | 'supplier' | 'expense' | 'cash' | 'business_report' | 'due_report' | null
  >(null);

  // Forms states
  // 1. Purchase
  const [purSupplier, setPurSupplier] = useState('');
  const [purItems, setPurItems] = useState('');
  const [purAmount, setPurAmount] = useState('');
  const [purPaid, setPurPaid] = useState('');

  // 2. Supplier
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCompany, setSupCompany] = useState('');

  // 3. Expense
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('দোকান ভাড়া');
  const [expAmount, setExpAmount] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string; amount: number } | null>(null);

  // 4. Cash Entry
  const [cashType, setCashType] = useState<'in' | 'out'>('in');
  const [cashAmount, setCashAmount] = useState('');
  const [cashCategory, setCashCategory] = useState('জমা');
  const [cashDesc, setCashDesc] = useState('');

  const menuItems = [
    {
      id: 'purchase' as const,
      icon: '📄',
      title: 'মাল কেনা',
      subtitle: 'কেনা মাল, স্টক বাড়ে',
    },
    {
      id: 'supplier' as const,
      icon: '🚚',
      title: 'সাপ্লায়ার',
      subtitle: 'কার কাছে কত দেনা',
    },
    {
      id: 'expense' as const,
      icon: '💸',
      title: 'খরচ',
      subtitle: 'দোকান ভাড়া, বিল, বেতন...',
    },
    {
      id: 'cash' as const,
      icon: '📒',
      title: 'ক্যাশ খাতা',
      subtitle: 'দিনে কত ঢুকল, কত গেল',
    },
    {
      id: 'business_report' as const,
      icon: '💹',
      title: 'ব্যবসার রিপোর্ট',
      subtitle: 'বিক্রি, লাভ, কোন পণ্য চলছে',
    },
    {
      id: 'due_report' as const,
      icon: '📈',
      title: 'রিপোর্ট',
      subtitle: 'বাকির তালিকা, মাসের হিসাব',
    },
  ];

  return (
    <div className="space-y-4 pb-24 pt-3">
      {/* Header matching image_1744dc87.png */}
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">
        আরও
      </h2>

      {/* List items card matching image_1744dc87.png */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModal(item.id)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/80 transition active:bg-gray-100"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl select-none">{item.icon}</span>
              <div>
                <div className="font-bold text-gray-800 text-sm sm:text-base">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.subtitle}
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Modal 1: মাল কেনা (Purchases) */}
      {activeModal === 'purchase' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">📄 মাল কেনার হিসাব</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!purItems || !purAmount) return;
                addPurchase({
                  supplierName: purSupplier.trim() || 'সাধারণ সরবরাহকারী',
                  itemsSummary: purItems.trim(),
                  amount: parseFloat(purAmount) || 0,
                  paidAmount: parseFloat(purPaid) || 0,
                  date: new Date().toISOString(),
                });
                setPurSupplier('');
                setPurItems('');
                setPurAmount('');
                setPurPaid('');
              }}
              className="mt-3 space-y-2.5 text-xs sm:text-sm"
            >
              <input
                type="text"
                placeholder="সাপ্লায়ারের নাম বা কোম্পানি"
                value={purSupplier}
                onChange={(e) => setPurSupplier(e.target.value)}
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
              />
              <input
                type="text"
                required
                placeholder="পণ্যের বিবরণ (যেমন: ৫ বস্তা চাল, ২ কার্টন তেল)"
                value={purItems}
                onChange={(e) => setPurItems(e.target.value)}
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  placeholder="মোট কেনা দাম (৳)"
                  value={purAmount}
                  onChange={(e) => setPurAmount(e.target.value)}
                  className="bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
                />
                <input
                  type="number"
                  placeholder="নগদ পরিশোধ (৳)"
                  value={purPaid}
                  onChange={(e) => setPurPaid(e.target.value)}
                  className="bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#b83a14] text-white rounded-lg font-bold text-sm"
              >
                মাল কেনার হিসাব যোগ করুন
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 divide-y divide-gray-100 max-h-48 overflow-y-auto">
              <div className="text-xs font-bold text-gray-500 mb-1">পূর্বের কেনাকাটা:</div>
              {purchases.length > 0 ? (
                purchases.map((p) => (
                  <div key={p.id} className="py-2 text-xs flex justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{p.itemsSummary}</div>
                      <div className="text-gray-500">{p.supplierName} • {formatBengaliDate(p.date)}</div>
                    </div>
                    <div className="text-right font-bold text-gray-800">
                      {formatTaka(p.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 py-3 text-center">কোনো কেনাকাটা লেখা হয়নি।</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: সাপ্লায়ার (Suppliers) */}
      {activeModal === 'supplier' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">🚚 সাপ্লায়ার তালিকা ও দেনা</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!supName.trim()) return;
                addSupplier({
                  name: supName.trim(),
                  phone: supPhone.trim() || undefined,
                  company: supCompany.trim() || undefined,
                });
                setSupName('');
                setSupPhone('');
                setSupCompany('');
              }}
              className="mt-3 space-y-2 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="সাপ্লায়ারের নাম"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
                />
                <input
                  type="text"
                  placeholder="কোম্পানি"
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  className="bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <input
                type="tel"
                placeholder="মোবাইল নম্বর"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#b83a14] text-white rounded-lg font-bold text-sm"
              >
                + নতুন সাপ্লায়ার যোগ করুন
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 divide-y divide-gray-100">
              {suppliers.map((s) => (
                <div key={s.id} className="py-2.5 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-bold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.company} {s.phone ? `• ${s.phone}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#b83a14]">{formatTaka(s.totalDebt)}</div>
                    <div className="text-[11px] text-gray-400">দেনা আছে</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: খরচ (Expenses) */}
      {activeModal === 'expense' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">💸 দোকান খরচ হিসাব</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!expTitle.trim() || !expAmount) return;
                addExpense({
                  title: expTitle.trim(),
                  category: expCategory,
                  amount: parseFloat(expAmount) || 0,
                  date: new Date().toISOString(),
                });
                setExpTitle('');
                setExpAmount('');
              }}
              className="mt-3 space-y-2.5 text-sm"
            >
              <input
                type="text"
                required
                placeholder="খরচের বিবরণ (যেমন: দোকান বিদ্যুৎ বিল)"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5 text-xs font-semibold"
                >
                  <option value="দোকান ভাড়া">দোকান ভাড়া</option>
                  <option value="বিদ্যুৎ বিল">বিদ্যুৎ বিল</option>
                  <option value="কর্মচারীর বেতন">কর্মচারীর বেতন</option>
                  <option value="নাস্তা / চা">নাস্তা / চা</option>
                  <option value="যাতায়াত">যাতায়াত</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="টাকার পরিমাণ (৳)"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#b83a14] text-white rounded-lg font-bold text-sm"
              >
                খরচ লিখে রাখুন
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 divide-y divide-gray-100 max-h-52 overflow-y-auto">
              <div className="text-xs font-bold text-gray-500 mb-1">সাম্প্রতিক খরচসমূহ:</div>
              {expenses.map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-gray-800">{e.title}</div>
                    <div className="text-xs text-gray-500">{e.category} • {formatBengaliDate(e.date)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">-{formatTaka(e.amount)}</span>
                    <button
                      onClick={() => setExpenseToDelete({ id: e.id, title: e.title, amount: e.amount })}
                      className="text-gray-400 hover:text-red-500 p-1"
                      aria-label="খরচ ডিলিট"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: ক্যাশ খাতা (Cash Book) */}
      {activeModal === 'cash' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">📒 ক্যাশ খাতা (নগদ জমা-খরচ)</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!cashAmount || !cashDesc) return;
                addCashEntry({
                  type: cashType,
                  amount: parseFloat(cashAmount) || 0,
                  category: cashCategory,
                  description: cashDesc.trim(),
                  date: new Date().toISOString(),
                });
                setCashAmount('');
                setCashDesc('');
              }}
              className="mt-3 space-y-2.5 text-sm"
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashType('in')}
                  className={`py-2 rounded-lg font-bold text-xs border ${
                    cashType === 'in' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  + ক্যাশ ইন (টাকা ঢুকল)
                </button>
                <button
                  type="button"
                  onClick={() => setCashType('out')}
                  className={`py-2 rounded-lg font-bold text-xs border ${
                    cashType === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  - ক্যাশ আউট (টাকা গেল)
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="বিবরণ"
                value={cashDesc}
                onChange={(e) => setCashDesc(e.target.value)}
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
              />
              <input
                type="number"
                required
                placeholder="টাকার পরিমাণ (৳)"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg p-2.5"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#b83a14] text-white rounded-lg font-bold text-sm"
              >
                এন্ট্রি যোগ করুন
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 divide-y divide-gray-100 max-h-52 overflow-y-auto">
              <div className="text-xs font-bold text-gray-500 mb-1">ক্যাশ এন্ট্রি তালিকা:</div>
              {cashEntries.map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <div className="font-semibold text-gray-800">{c.description}</div>
                    <div className="text-gray-400 text-xs">{formatBengaliDate(c.date)}</div>
                  </div>
                  <div className={`font-bold ${c.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {c.type === 'in' ? '+' : '-'}{formatTaka(c.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: ব্যবসার রিপোর্ট (Business Analytics) */}
      {activeModal === 'business_report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">💹 ব্যবসার লাভ-ক্ষতি ও পারফরম্যান্স</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs text-emerald-800 font-medium">মোট সর্বমোট বিক্রি</div>
                  <div className="text-lg font-bold text-emerald-700 mt-1">
                    {formatTaka(sales.reduce((s, x) => s + x.grandTotal, 0))}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    ({toBengaliNumber(sales.length)} টি বিক্রয় মেমো)
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs text-emerald-800 font-medium">মোট বিক্রির লাভ</div>
                  <div className="text-lg font-bold text-emerald-700 mt-1">
                    {formatTaka(sales.reduce((s, x) => s + x.profit, 0))}
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-xs text-red-800 font-medium">মোট দোকান খরচ</div>
                  <div className="text-lg font-bold text-red-700 mt-1">
                    {formatTaka(expenses.reduce((s, x) => s + x.amount, 0))}
                  </div>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="text-xs text-[#b83a14] font-medium">মোট বর্তমান বাকি</div>
                  <div className="text-lg font-bold text-[#b83a14] mt-1">
                    {formatTaka(customers.reduce((s, x) => s + x.currentDue, 0))}
                  </div>
                </div>
              </div>

              {/* Stock Value */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-gray-700">বর্তমান স্টকে থাকা পণ্যের ক্রয়মূল্য:</span>
                <span className="font-bold text-gray-900">
                  {formatTaka(products.reduce((s, p) => s + p.currentStock * p.purchasePrice, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: বাকির পূর্ণাঙ্গ তালিকা ও রিপোর্ট */}
      {activeModal === 'due_report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">📈 বাকির পূর্ণাঙ্গ তালিকা ও রিপোর্ট</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 font-medium">দোকানের সর্বমোট বাকি:</div>
                  <div className="text-2xl font-black text-[#b83a14]">
                    {formatTaka(customers.reduce((s, c) => s + c.currentDue, 0))}
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#b83a14] text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  প্রিন্ট রিপোর্ট
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {customers
                  .filter((c) => c.currentDue > 0)
                  .sort((a, b) => b.currentDue - a.currentDue)
                  .map((c, i) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5">{toBengaliNumber(i + 1)}.</span>
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                        </div>
                      </div>
                      <div className="font-bold text-[#b83a14]">
                        {formatTaka(c.currentDue)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense PIN Modal */}
      <DeletePinConfirmModal
        isOpen={!!expenseToDelete}
        title="খরচের হিসাব মুছে ফেলা"
        itemName={expenseToDelete ? `${expenseToDelete.title} (${formatTaka(expenseToDelete.amount)})` : undefined}
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        onClose={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
