import React from 'react';
import { Printer, Share2, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SaleRecord } from '../types';
import { useDokan } from '../context/DokanContext';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '../utils/bengali';

interface ReceiptModalProps {
  sale: SaleRecord;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { settings } = useDokan();

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `🧾 *${settings.shopName || 'তাওয়াক্কুল কর্নার'}*\nমেমো নং: ${sale.memoNo}\nতারিখ: ${formatBengaliDate(sale.date)}\nক্রেতা: ${sale.customerName}\n------------------------\n${sale.items
      .map(
        (it) =>
          `• ${it.product.name} (${toBengaliNumber(it.quantity)} ${it.product.unit} x ৳${toBengaliNumber(it.price)}) = ${formatTaka(it.total)}`
      )
      .join('\n')}\n------------------------\nমোট বিল: ${formatTaka(sale.grandTotal)}\nনগদ পরিশোধ: ${formatTaka(sale.paidAmount)}\nবাকি: ${formatTaka(sale.dueAmount)}\n\nধন্যবাদ! আবার আসবেন।`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-base">বিক্রয় রশিদ / মেমো</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div
          id="printable-receipt"
          className="my-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-gray-800 text-xs font-mono"
        >
          {/* Shop Header */}
          <div className="text-center pb-2 border-b border-gray-300">
            <div className="text-base font-bold tracking-tight text-gray-900 font-sans">
              {settings.shopName || 'TAWAKKUL CORNER'}
            </div>
            {settings.phone && (
              <div className="text-[11px] text-gray-600 mt-0.5">
                মোবাইল: {toBengaliNumber(settings.phone)}
              </div>
            )}
            {settings.address && (
              <div className="text-[11px] text-gray-500">{settings.address}</div>
            )}
          </div>

          {/* Meta Info */}
          <div className="py-2 text-[11px] space-y-0.5 border-b border-gray-300">
            <div className="flex justify-between">
              <span>মেমো: {sale.memoNo}</span>
              <span>{formatBengaliDate(sale.date)}</span>
            </div>
            <div>
              <span>ক্রেতা: <strong className="font-sans">{sale.customerName}</strong></span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2 border-b border-gray-300">
            <div className="flex justify-between font-bold pb-1 text-[11px]">
              <span>পণ্য ও পরিমাণ</span>
              <span>মূল্য</span>
            </div>
            <div className="space-y-1">
              {sale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <div className="truncate max-w-[180px] font-sans">
                    {it.product.name} ({toBengaliNumber(it.quantity)} {it.product.unit})
                  </div>
                  <div className="shrink-0">{formatTaka(it.total)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-2 space-y-1 text-[11px] border-b border-gray-300">
            <div className="flex justify-between">
              <span>মোট পণ্যের মূল্য:</span>
              <span>{formatTaka(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>ছাড়:</span>
                <span>-{formatTaka(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-0.5 text-gray-900">
              <span>সর্বমোট:</span>
              <span>{formatTaka(sale.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>নগদ পরিশোধ:</span>
              <span>{formatTaka(sale.paidAmount)}</span>
            </div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between font-bold text-[#b83a14]">
                <span>বাকি রইল:</span>
                <span>{formatTaka(sale.dueAmount)}</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-gray-500 font-sans">
            ধন্যবাদ! আবার আসবেন।
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-xs transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp শেয়ার</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
