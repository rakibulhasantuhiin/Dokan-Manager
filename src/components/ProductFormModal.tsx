import React, { useState, useEffect } from 'react';
import { X, Camera, ShoppingBasket, BookOpen, Monitor, Plus, Save } from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Product, MeasurementType, UnitType, MainCategory } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null; // null for add, string for edit
  onOpenScanner?: (onScan: (code: string) => void) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productId,
  onOpenScanner,
}) => {
  const { products, addProduct, updateProduct } = useDokan();

  const [name, setName] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('মুদি');
  const [subCategory, setSubCategory] = useState('');
  const [measurementType, setMeasurementType] = useState<MeasurementType>('weight');
  const [unit, setUnit] = useState<UnitType>('কেজি');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState('');
  const [barcode, setBarcode] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productId) {
        const prod = products.find((p) => p.id === productId);
        if (prod) {
          setName(prod.name);
          setMainCategory(prod.mainCategory || 'মুদি');
          setSubCategory(prod.category);
          setMeasurementType(prod.measurementType);
          setUnit(prod.unit);
          setPurchasePrice(prod.purchasePrice.toString());
          setSellingPrice(prod.sellingPrice.toString());
          setCurrentStock(prod.currentStock.toString());
          setLowStockAlert(prod.lowStockAlert.toString());
          setBarcode(prod.barcode || '');
        }
      } else {
        // Reset for new product
        setName('');
        setMainCategory('মুদি');
        setSubCategory('চাল/তেল/মুদি');
        setMeasurementType('weight');
        setUnit('কেজি');
        setPurchasePrice('');
        setSellingPrice('');
        setCurrentStock('10');
        setLowStockAlert('5');
        setBarcode('');
      }
      setFormError('');
    }
  }, [isOpen, productId, products]);

  const handleMainCategoryChange = (cat: MainCategory) => {
    setMainCategory(cat);
    if (cat === 'মুদি') {
      setMeasurementType('weight');
      setUnit('কেজি');
      setSubCategory('চাল/তেল/মুদি');
    } else if (cat === 'স্টেশনারি') {
      setMeasurementType('count');
      setUnit('পিস');
      setSubCategory('খাতা/কলম/কাগজ');
    } else if (cat === 'কম্পিউটার সার্ভিস') {
      setMeasurementType('service');
      setUnit('পাতা');
      setSubCategory('ফটোকপি/প্রিন্ট/ফরম');
      if (currentStock === '' || currentStock === '0') {
        setCurrentStock('999');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('পণ্যের নাম লিখুন');
      return;
    }

    const pPrice = parseFloat(purchasePrice) || 0;
    const sPrice = parseFloat(sellingPrice) || 0;
    const stock = parseFloat(currentStock) || 0;
    const lowStock = parseFloat(lowStockAlert) || 0;

    if (productId) {
      updateProduct(productId, {
        name: name.trim(),
        category: subCategory.trim() || mainCategory,
        mainCategory,
        measurementType,
        unit,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        currentStock: stock,
        lowStockAlert: lowStock,
        barcode: barcode.trim() || undefined,
      });
    } else {
      addProduct({
        name: name.trim(),
        category: subCategory.trim() || mainCategory,
        mainCategory,
        measurementType,
        unit,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        currentStock: stock,
        lowStockAlert: lowStock,
        barcode: barcode.trim() || undefined,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-xl sm:max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>{productId ? 'পণ্য সম্পাদনা' : '+ নতুন পণ্য যোগ'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#b83a14]">
              {mainCategory}
            </span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 active:scale-90 transition-transform">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:p-8 space-y-4 pb-24 sm:pb-8">
          {formError && (
            <div className="mb-2 text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-200 font-semibold">
              {formError}
            </div>
          )}

          <form id="product-form-modal" onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            {/* 3 Category Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleMainCategoryChange('মুদি')}
                className={`py-3 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  mainCategory === 'মুদি'
                    ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm scale-[1.02]'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <ShoppingBasket className="w-4 h-4" />
                <span className="text-[10px] sm:text-xs">১. মুদি</span>
              </button>

              <button
                type="button"
                onClick={() => handleMainCategoryChange('স্টেশনারি')}
                className={`py-3 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  mainCategory === 'স্টেশনারি'
                    ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-sm scale-[1.02]'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px] sm:text-xs">২. স্টেশনারি</span>
              </button>

              <button
                type="button"
                onClick={() => handleMainCategoryChange('কম্পিউটার সার্ভিস')}
                className={`py-3 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  mainCategory === 'কম্পিউটার সার্ভিস'
                    ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-sm scale-[1.02]'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-[10px] sm:text-xs truncate">৩. সার্ভিস</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  পণ্যের নাম <span className="text-[#b83a14]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মিনিকেট চাল / বলপেন"
                  className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-[#b83a14] focus:bg-white transition-all text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  সাব-ক্যাটাগরি বা ট্যাগ
                </label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="যেমন: চাল, তেল, খাতা"
                  className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    মাপের ধরন
                  </label>
                  <select
                    value={measurementType}
                    onChange={(e) => {
                      const val = e.target.value as MeasurementType;
                      setMeasurementType(val);
                      if (val === 'weight') setUnit('কেজি');
                      else if (val === 'liquid') setUnit('লিটার');
                      else if (val === 'service') setUnit('কাজ');
                      else setUnit('পিস');
                    }}
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] font-bold text-xs"
                  >
                    <option value="weight">ওজন (কেজি/গ্রাম)</option>
                    <option value="count">পিস/সংখ্যা/রিম</option>
                    <option value="liquid">তরল (লিটার)</option>
                    <option value="service">সার্ভিস/পাতা</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    একক
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitType)}
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] font-bold text-xs"
                  >
                    <option value="কেজি">কেজি</option>
                    <option value="গ্রাম">গ্রাম</option>
                    <option value="পিস">পিস</option>
                    <option value="ডজন">ডজন</option>
                    <option value="রিম">রিম (কাগজ)</option>
                    <option value="পাতা">পাতা (প্রিন্ট/ফটোকপি)</option>
                    <option value="কাজ">কাজ / সার্ভিস</option>
                    <option value="ঘণ্টা">ঘণ্টা</option>
                    <option value="লিটার">লিটার</option>
                    <option value="প্যাকেট">প্যাকেট</option>
                    <option value="বস্তা">বস্তা</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    কেনা দাম (৳)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="০"
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] font-black text-[#b83a14]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    বিক্রির দাম (৳)
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="০"
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-black text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    স্টক ({unit})
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    সতর্কতা ({unit})
                  </label>
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.value)}
                    className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] font-bold text-amber-700"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    বারকোড
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="স্ক্যান"
                      className="w-full bg-[#fbfaf8] border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#b83a14] font-mono text-xs"
                    />
                    {onOpenScanner && (
                      <button
                        type="button"
                        onClick={() => onOpenScanner((code) => setBarcode(code))}
                        className="absolute right-2 p-1.5 text-gray-500 hover:text-[#b83a14] bg-white rounded-lg shadow-sm"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white/95 backdrop-blur-md shrink-0">
          <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-white hover:bg-gray-100 active:scale-95 text-gray-700 border-2 border-gray-200 rounded-2xl font-bold text-sm transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              form="product-form-modal"
              className="w-full py-3.5 animate-gradient-terracotta hover:brightness-110 active:scale-95 text-white rounded-2xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>পণ্য সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
