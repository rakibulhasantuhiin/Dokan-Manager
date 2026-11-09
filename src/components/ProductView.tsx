import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Product, MainCategory } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';

interface ProductViewProps {
  onOpenScanner?: (onScan: (code: string) => void) => void;
}

export const ProductView: React.FC<ProductViewProps> = () => {
  const { products, deleteProduct, setActiveGlobalModal, setProductModalData } = useDokan();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Section Category Filter (মুদি, স্টেশনারি, কম্পিউটার সার্ভিস)
  const [selectedMainCategory, setSelectedMainCategory] = useState<'সব' | MainCategory>('সব');
  // Stock status filter (সব, কম স্টক, স্টক শেষ)
  const [stockTab, setStockTab] = useState<'all' | 'low' | 'out'>('all');

  const openAddModal = () => {
    setProductModalData({ id: null });
    setActiveGlobalModal('product_form');
  };

  const openEditModal = (prod: Product) => {
    setProductModalData({ id: prod.id });
    setActiveGlobalModal('product_form');
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
    <div className="h-[calc(100dvh-7rem)] lg:h-auto flex flex-col space-y-2 pb-1 lg:pb-20 pt-1.5 sm:pt-3 overflow-hidden lg:overflow-visible font-['SolaimanLipi',sans-serif]">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <span>পণ্য তালিকা</span>
            <span className="text-xs font-semibold bg-[#b83a14]/10 text-[#b83a14] px-2 py-0.5 rounded-full">
              {toBengaliNumber(products.length)} টি পণ্য
            </span>
          </h2>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1 animate-gradient-terracotta hover:brightness-105 active:scale-95 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ নতুন পণ্য</span>
        </button>
      </div>

      {/* 3 Main Product Sections Tabs */}
      <div className="bg-white rounded-xl p-1 border border-gray-200 shadow-2xs shrink-0">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setSelectedMainCategory('সব')}
            className={`py-1.5 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-100 flex items-center justify-center gap-1 cursor-pointer ${
              selectedMainCategory === 'সব'
                ? 'animate-gradient-terracotta text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>সব</span>
            <span className={`text-[10px] px-1 rounded-full ${selectedMainCategory === 'সব' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.all)}
            </span>
          </button>

          <button
            onClick={() => setSelectedMainCategory('মুদি')}
            className={`py-1.5 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-100 flex items-center justify-center gap-1 cursor-pointer ${
              selectedMainCategory === 'মুদি'
                ? 'animate-gradient-terracotta text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="truncate">১. মুদি</span>
            <span className={`text-[10px] px-1 rounded-full ${selectedMainCategory === 'মুদি' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.grocery)}
            </span>
          </button>

          <button
            onClick={() => setSelectedMainCategory('স্টেশনারি')}
            className={`py-1.5 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-100 flex items-center justify-center gap-1 cursor-pointer ${
              selectedMainCategory === 'স্টেশনারি'
                ? 'animate-gradient-terracotta text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="truncate">২. স্টেশনারি</span>
            <span className={`text-[10px] px-1 rounded-full ${selectedMainCategory === 'স্টেশনারি' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.stationery)}
            </span>
          </button>

          <button
            onClick={() => setSelectedMainCategory('কম্পিউটার সার্ভিস')}
            className={`py-1.5 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-100 flex items-center justify-center gap-1 cursor-pointer ${
              selectedMainCategory === 'কম্পিউটার সার্ভিস'
                ? 'animate-gradient-purple text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="truncate">৩. সার্ভিস</span>
            <span className={`text-[10px] px-1 rounded-full ${selectedMainCategory === 'কম্পিউটার সার্ভিস' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
              {toBengaliNumber(counts.computer)}
            </span>
          </button>
        </div>
      </div>

      {/* Search Input Bar + Stock Status Tabs */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পণ্য বা বারকোড খুঁজুন..."
            className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-7 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-transparent shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-1 text-[11px] font-bold shrink-0">
          <button
            onClick={() => setStockTab('all')}
            className={`px-2 py-1.5 rounded-xl border transition ${
              stockTab === 'all'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            সব
          </button>
          <button
            onClick={() => setStockTab('low')}
            className={`px-2 py-1.5 rounded-xl border transition ${
              stockTab === 'low'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            কম
          </button>
          <button
            onClick={() => setStockTab('out')}
            className={`px-2 py-1.5 rounded-xl border transition ${
              stockTab === 'out'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            শেষ
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((prod) => {
            const isLowStock = prod.currentStock <= prod.lowStockAlert && prod.currentStock > 0;
            const isOutOfStock = prod.currentStock <= 0;
            const categoryBadge = prod.mainCategory || 'মুদি';

            return (
              <div
                key={prod.id}
                className="p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-gray-50/80 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                        categoryBadge === 'মুদি'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : categoryBadge === 'স্টেশনারি'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}
                    >
                      {categoryBadge}
                    </span>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    <span>
                      বিক্রি: <strong className="text-gray-900 font-bold">{formatTaka(prod.sellingPrice)}</strong>
                      <span className="text-gray-400">/{prod.unit}</span>
                    </span>
                    <span>
                      কেনা: <strong className="text-gray-600">{formatTaka(prod.purchasePrice)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg inline-block ${
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
                      <div className="text-[9px] text-amber-700 flex items-center justify-end gap-0.5 font-semibold">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>কম স্টক</span>
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="text-[9px] text-red-600 font-bold">স্টক শেষ</div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                      aria-label="সম্পাদনা"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(prod)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-gray-500 text-xs sm:text-sm">
            এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।
          </div>
        )}
      </div>

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
