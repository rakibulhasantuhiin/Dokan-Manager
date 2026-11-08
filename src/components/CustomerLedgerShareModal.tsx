import React, { useEffect, useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Share2,
  Printer,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Customer, Transaction, ShopSettings } from '../types';
import { formatTaka } from '../utils/bengali';
import {
  generateCustomerLedgerData,
  buildCustomerShareUrl,
  generateCustomerQRCode,
  PublicLedgerData,
} from '../utils/customerShare';

interface CustomerLedgerShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transactions: Transaction[];
  settings: ShopSettings;
}

export const CustomerLedgerShareModal: React.FC<CustomerLedgerShareModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactions,
  settings,
}) => {
  const { currentUser } = useDokan();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [ledgerData, setLedgerData] = useState<PublicLedgerData | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      const data = generateCustomerLedgerData(customer, transactions, settings, currentUser?.uid);
      setLedgerData(data);
      const url = buildCustomerShareUrl(data);
      setShareUrl(url);

      generateCustomerQRCode(url)
        .then((qr) => setQrCodeUrl(qr))
        .catch((err) => console.error(err));
    }
  }, [isOpen, customer, transactions, settings, currentUser]);

  if (!isOpen || !customer) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const shopName = settings.shopName || 'আমাদের দোকান';
    const text = `আসসালামু আলাইকুম ${customer.name}, ${shopName}-এ আপনার বর্তমান বকেয়া ও লেনদেনের সকল হিসাব দেখতে এই লিঙ্কে ক্লিক করুন:\n${shareUrl}`;

    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      const internationalPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
      window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${customer.name} - বাকি খাতার লিঙ্ক`,
          text: `আসসালামু আলাইকুম ${customer.name}, আপনার বাকি খাতা ও লেনদেনের হিসাব দেখতে এই লিঙ্কে ক্লিক করুন:`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-[#b83a14]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                বাকি খাতার পাবলিক লিঙ্ক ও QR কোড
              </h3>
              <p className="text-[11px] text-gray-500">
                কাস্টমার যেকোনো সময় লিঙ্ক থেকে হিসাব দেখতে পাবেন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable slip area (also the modal visual body) */}
        <div className="py-3.5 space-y-3.5" id="customer-qr-slip">
          {/* Customer Badge */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">কাস্টমারের নাম:</div>
              <div className="font-bold text-gray-900 text-sm sm:text-base">{customer.name}</div>
              {customer.phone && (
                <div className="text-xs text-gray-500">{customer.phone}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium">বর্তমান বাকি:</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#b83a14]">
                {formatTaka(customer.currentDue)}
              </div>
            </div>
          </div>

          {/* QR Code Centerpiece */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
            {qrCodeUrl ? (
              <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-200">
                <img
                  src={qrCodeUrl}
                  alt={`QR code for ${customer.name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-gray-400 text-xs">
                QR কোড তৈরি হচ্ছে...
              </div>
            )}
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ক্যামেরা দিয়ে স্ক্যান করলেই খাতা খুলবে
              </span>
            </div>
          </div>

          {/* Shareable Link Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 block">
              কাস্টমারের নিজস্ব পাবলিক লিঙ্ক:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-700 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#b83a14] hover:bg-[#a33210] text-white active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: WhatsApp & Open */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs transition shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp এ পাঠান</span>
            </button>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs transition shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>নিজে ওপেন করে দেখুন</span>
            </a>
          </div>

          {/* Secondary Actions: Native Share & Print Slip */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium py-1 px-2 rounded-lg hover:bg-gray-100"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>অন্য অ্যাপে শেয়ার</span>
            </button>
            <button
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium py-1 px-2 rounded-lg hover:bg-gray-100"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>QR স্লিপ প্রিন্ট করুন</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>সুরক্ষিত ও নিরাপদ:</strong> এই লিঙ্কের মাধ্যমে কাস্টমার কেবল তার নিজের বাকি ও লেনদেনের ইতিহাস দেখতে পারবেন। আপনার দোকানের অন্য কোনো হিসাব বা সেটিংস দেখতে পারবেন না।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
