import React, { useState, useMemo } from 'react';
import { Plus, Search, Camera, Edit2, Trash2, AlertTriangle, Package, ShoppingBasket, BookOpen, Monitor } from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Product, MeasurementType, UnitType, MainCategory } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';

interface ProductViewProps {
  onOpenScanner?: (onScan: (code: string) => void) => void;
}

export const ProductView: React.FC<ProductViewProps> = ({ onOpenScanner }) => {
  const { products, addProduct, updateProduct, deleteProduct } = useDokan();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Section Category Filter (মুদি, স্টেশনারি, কম্পিউটার সার্ভিস)
  const [selectedMainCategory, setSelectedMainCategory] = useState<'সব' | MainCategory>('সব');
  // Stock status filter (সব, কম স্টক, স্টক শেষ)
  const [stockTab, setStockTab] = useState<'all' | 'low' | 'out'>('all');

  // Form states matching image_797ab7cc.png with 3-section support
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

  const openAddModal = (presetCategory?: MainCategory) => {
    setEditingProductId(null);
    const initialCategory: MainCategory = presetCategory || (selectedMainCategory !== 'সব' ? selectedMainCategory : 'মুদি');
    setName('');
    setPurchasePrice('');
    setSellingPrice('');
    setCurrentStock(initialCategory === 'কম্পিউটার সার্ভিস' ? '999' : '10');
    setLowStockAlert('5');
    setBarcode('');
    setFormError('');
    handleMainCategoryChange(initialCategory);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    const cat = prod.mainCategory || 'মুদি';
    setMainCategory(cat);
    setSubCategory(prod.category);
    setMeasurementType(prod.measurementType);
    setUnit(prod.unit);
    setPurchasePrice(prod.purchasePrice.toString());
    setSellingPrice(prod.sellingPrice.toString());
    setCurrentStock(prod.currentStock.toString());
    setLowStockAlert(prod.lowStockAlert.toString());
    setBarcode(prod.barcode || '');
    setFormError('');
    setIsModalOpen(true);
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

    if (editingProductId) {
      updateProduct(editingProductId, {
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

    setIsModalOpen(false);
  };

  // Counts for each category
  const counts = useMemo(() => {
    return {
      all: products.length,
      grocery: products.filter((p) => (p.mainCategory || 'মুদি') === 'মুদি').length,
      stationery: products.filter((p) => p.mainCategory === 'স্টেশনারি').length,
      computer: products.filter((p) => p.mainCategory === 'কম্পিউটার সার্ভিস').length,
    };
  }, [products]);

  // Filter products by Main Category, Stock Tab, and Search Query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Main Category filter
      const prodMain = p.mainCategory || 'মুদি';
      if (selectedMainCategory !== 'সব' && prodMain !== selectedMainCategory) {
        return false;
      }

      // 2. Stock status filter
      if (stockTab === 'low') {
        if (p.currentStock > p.lowStockAlert || p.currentStock <= 0) return false;
      } else if (stockTab === 'out') {
        if (p.currentStock > 0) return false;
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        prodMain.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, selectedMainCategory, stockTab, searchQuery]);

  return (
    <div className="space-y-3.5 pb-20 pt-2 sm:pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <span>পণ্য তালিকা</span>
            <span className="text-xs sm:text-sm font-semibold bg-[#b83a14]/10 text-[#b83a14] px-2 py-0.5 rounded-full">
              {toBengaliNumber(products.length)} টি পণ্য
            </span>
          </h2>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-95 text-white text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ নতুন পণ্য</span>
        </button>
      </div>

      {/* 3 Main Product Sections Tabs (মুদি, স্টেশনারি, কম্পিউটার সার্ভিস) */}
      <div className="bg-white rounded-xl p-1.5 border border-gray-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
          <button
            onClick={() => setSelectedMainCategory('সব')}
            className={`py-2 px-1 text-center rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 ${
              selectedMainCategory === 'সব'
                ? 'bg-[#b83a14] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>সব পণ্য</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedMainCategory === 'সব' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.all)}
            </span>
          </button>

          <button
            onClick={() => setSelectedMainCategory('মুদি')}
            className={`py-2 px-1 text-center rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 ${
              selectedMainCategory === 'মুদি'
                ? 'bg-[#b83a14] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShoppingBasket className="w-3.5 h-3.5 hidden xs:inline" />
            <span>১. মুদি</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedMainCategory === 'মুদি' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.grocery)}
            </span>
          </button>

          <button
            onClick={() => setSelectedMainCategory('স্টেশনারি')}
            className={`py-2 px-1 text-center rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 ${
              selectedMainCategory === 'স্টেশনারি'
                ? 'bg-[#b83a14] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 hidden xs:inline" />
            <span>২. স্টেশনারি</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedMainCategory === 'স্টেশনারি' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.stationery)}
            </span>
          </button>

          <button
            onClick={() => setSelectedMainCategory('কম্পিউটার সার্ভিস')}
            className={`py-2 px-1 text-center rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 ${
              selectedMainCategory === 'কম্পিউটার সার্ভিস'
                ? 'bg-[#b83a14] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 hidden xs:inline" />
            <span className="truncate">৩. সার্ভিস</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedMainCategory === 'কম্পিউটার সার্ভিস' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.computer)}
            </span>
          </button>
        </div>
      </div>

      {/* Search Input Bar + Stock Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পণ্যের নাম, বারকোড বা ক্যাটাগরি..."
            className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-transparent shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Stock status filter buttons matching screenshot */}
        <div className="flex gap-1.5 text-xs font-semibold shrink-0">
          <button
            onClick={() => setStockTab('all')}
            className={`px-3 py-2 rounded-xl border transition ${
              stockTab === 'all'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            সব স্টক
          </button>
          <button
            onClick={() => setStockTab('low')}
            className={`px-3 py-2 rounded-xl border transition ${
              stockTab === 'low'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            কম স্টক
          </button>
          <button
            onClick={() => setStockTab('out')}
            className={`px-3 py-2 rounded-xl border transition ${
              stockTab === 'out'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            স্টক শেষ
          </button>
        </div>
      </div>

      {/* Product List: Responsive Cards / Rows */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((prod) => {
            const isLowStock = prod.currentStock <= prod.lowStockAlert && prod.currentStock > 0;
            const isOutOfStock = prod.currentStock <= 0;
            const categoryBadge = prod.mainCategory || 'মুদি';

            return (
              <div
                key={prod.id}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span
                      className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                        categoryBadge === 'মুদি'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : categoryBadge === 'স্টেশনারি'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}
                    >
                      {categoryBadge}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {prod.name}
                    </h3>
                    {prod.category && prod.category !== categoryBadge && (
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                        {prod.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 mt-1">
                    <span>
                      বিক্রি: <strong className="text-gray-900 font-bold">{formatTaka(prod.sellingPrice)}</strong>
                      <span className="text-gray-400">/{prod.unit}</span>
                    </span>
                    <span>
                      কেনা: <strong className="text-gray-600">{formatTaka(prod.purchasePrice)}</strong>
                    </span>
                    {prod.barcode && (
                      <span className="font-mono text-gray-400 hidden xs:inline">
                        #{prod.barcode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Badge & Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {toBengaliNumber(prod.currentStock)} {prod.unit}
                    </div>
                    {isLowStock && (
                      <div className="text-[10px] text-amber-700 mt-0.5 flex items-center justify-end gap-0.5 font-semibold">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>কম স্টক</span>
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="text-[10px] text-red-600 mt-0.5 font-bold">স্টক শেষ</div>
                    )}
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                      aria-label="সম্পাদনা"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(prod)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি। উপরে "+ নতুন পণ্য" চাপ দিয়ে পণ্য যোগ করুন।
          </div>
        )}
      </div>

      {/* Modal Dialog matching image_797ab7cc.png with equal 3 sections */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto transition-all transform duration-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>{editingProductId ? 'পণ্য সম্পাদনা' : '+ নতুন পণ্য যোগ'}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#b83a14]">
                {mainCategory}
              </span>
            </h3>

            {formError && (
              <div className="mb-3 text-xs bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-200 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-sm">
              {/* 3 Prominent Section Buttons */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  প্রধান সেকশন নির্বাচন করুন <span className="text-[#b83a14]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMainCategoryChange('মুদি')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      mainCategory === 'মুদি'
                        ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ShoppingBasket className="w-5 h-5" />
                    <span className="text-xs sm:text-sm">১. মুদি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMainCategoryChange('স্টেশনারি')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      mainCategory === 'স্টেশনারি'
                        ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="text-xs sm:text-sm">২. স্টেশনারি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMainCategoryChange('কম্পিউটার সার্ভিস')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      mainCategory === 'কম্পিউটার সার্ভিস'
                        ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs sm:text-sm leading-tight">৩. কম্পিউটার সার্ভিস</span>
                  </button>
                </div>
              </div>

              {/* Product Name * */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  পণ্যের নাম <span className="text-[#b83a14]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    mainCategory === 'মুদি'
                      ? 'যেমন: মিনিকেট চাল / তীর সয়াবিন তেল'
                      : mainCategory === 'স্টেশনারি'
                      ? 'যেমন: এ৪ পেপার রিম / মাতার বলপেন বক্স'
                      : 'যেমন: ফটোকপি / চাকরির আবেদন ফরম'
                  }
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white text-sm"
                />
              </div>

              {/* Sub-category / Tag */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  সাব-ক্যাটাগরি বা ট্যাগ
                </label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="যেমন: চাল, তেল, খাতা, কলম, ফটোকপি"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white text-sm"
                />
              </div>

              {/* Measurement Type & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white text-xs font-medium"
                  >
                    <option value="weight">ওজন (কেজি/গ্রাম)</option>
                    <option value="count">পিস/সংখ্যা/রিম</option>
                    <option value="liquid">তরল (লিটার/মি.লি.)</option>
                    <option value="service">সার্ভিস/কাজ/পাতা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    একক
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitType)}
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white text-xs font-medium"
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

              {/* Buying Price & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    কেনা দাম (৳/{unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="০"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    বিক্রির দাম (৳/{unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="০"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>
              </div>

              {/* Starting Stock & Low Stock Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    স্টক সংখ্যা ({unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="০"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    কম স্টক সতর্কতা ({unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.value)}
                    placeholder="১০"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>
              </div>

              {/* Barcode (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  বারকোড (ঐচ্ছিক)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="বারকোড নম্বর লিখুন বা স্ক্যান করুন"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white font-mono"
                  />
                  {onOpenScanner && (
                    <button
                      type="button"
                      onClick={() => onOpenScanner((code) => setBarcode(code))}
                      className="absolute right-2.5 p-1.5 text-gray-500 hover:text-[#b83a14] bg-white border border-gray-200 rounded-lg shadow-2xs"
                      title="ক্যামেরা স্ক্যান"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-base shadow-xs transition"
                >
                  সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-700 border border-gray-300 rounded-xl font-bold text-sm transition"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation with Security PIN 7078 */}
      <DeletePinConfirmModal
        isOpen={!!productToDelete}
        title="পণ্য মুছে ফেলা"
        itemName={productToDelete?.name}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
};
