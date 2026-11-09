import React, { useState, useEffect } from 'react';
import { X, Scale, Calculator, Zap } from 'lucide-react';
import { Product } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface WeightSelectorModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (quantity: number, total: number) => void;
}

export const WeightSelectorModal: React.FC<WeightSelectorModalProps> = ({
  product,
  onClose,
  onConfirm,
}) => {
  const [mode, setMode] = useState<'weight' | 'price'>('weight');
  const [weightGrams, setWeightGrams] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<string>('');

  useEffect(() => {
    if (product) {
      setWeightGrams('');
      setTotalPrice('');
      setMode('weight');
    }
  }, [product]);

  if (!product) return null;

  const pricePerKg = product.sellingPrice;

  const handleWeightChange = (grams: string) => {
    setWeightGrams(grams);
    const g = parseFloat(grams) || 0;
    const kg = g / 1000;
    const price = kg * pricePerKg;
    setTotalPrice(price > 0 ? price.toFixed(2) : '');
  };

  const handlePriceChange = (price: string) => {
    setTotalPrice(price);
    const p = parseFloat(price) || 0;
    const kg = p / pricePerKg;
    const grams = kg * 1000;
    setWeightGrams(grams > 0 ? Math.round(grams).toString() : '');
  };

  const quickWeights = [
    { label: '৫০ গ্রাম', value: 50 },
    { label: '১০০ গ্রাম', value: 100 },
    { label: '২৫০ গ্রাম', value: 250 },
    { label: '৫০০ গ্রাম', value: 500 },
    { label: '১ কেজি', value: 1000 },
  ];

  const handleConfirm = () => {
    const g = parseFloat(weightGrams) || 0;
    const p = parseFloat(totalPrice) || 0;
    if (g > 0 && p > 0) {
      onConfirm(g / 1000, p);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#b83a14]" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-[200px]">
              {product.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setMode('weight')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'weight' ? 'bg-white text-[#b83a14] shadow-sm' : 'text-gray-500'
              }`}
            >
              ওজন অনুযায়ী
            </button>
            <button
              onClick={() => setMode('price')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'price' ? 'bg-white text-[#b83a14] shadow-sm' : 'text-gray-500'
              }`}
            >
              টাকা অনুযায়ী
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'weight' ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  ওজন দিন (গ্রাম)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    autoFocus
                    value={weightGrams}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    placeholder="যেমন: ২৫০"
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-2xl px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b83a14] transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    গ্রাম
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  টাকার পরিমাণ দিন (৳)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    autoFocus
                    value={totalPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="যেমন: ২০"
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-2xl px-4 py-3 text-xl font-black text-[#b83a14] focus:outline-none focus:ring-2 focus:ring-[#b83a14] transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ৳
                  </div>
                </div>
              </div>
            )}

            {/* Quick Weight Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {quickWeights.map((qw) => (
                <button
                  key={qw.value}
                  onClick={() => handleWeightChange(qw.value.toString())}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all ${
                    weightGrams === qw.value.toString()
                      ? 'bg-[#b83a14] text-white border-[#b83a14] shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {qw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-400 font-bold uppercase">হিসাব:</div>
              <div className="text-xs font-bold text-gray-700">
                {weightGrams ? toBengaliNumber(weightGrams) : '০'} গ্রাম × {formatTaka(pricePerKg)}/কেজি
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 font-bold uppercase">মোট দাম:</div>
              <div className="text-lg font-black text-[#b83a14]">
                {totalPrice ? formatTaka(parseFloat(totalPrice)) : '৳০'}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!weightGrams || !totalPrice}
            className="w-full py-4 bg-[#b83a14] hover:bg-[#a33210] disabled:bg-gray-300 text-white rounded-2xl font-black text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 fill-white" />
            <span>কার্টে যোগ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
