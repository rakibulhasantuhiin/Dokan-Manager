import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Barcode } from 'lucide-react';
import { useDokan } from '../context/DokanContext';

interface BarcodeScannerModalProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScan, onClose }) => {
  const { products } = useDokan();
  const [manualCode, setManualCode] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Try camera access
    let isMounted = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (isMounted) {
            streamRef.current = stream;
            setHasCamera(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        })
        .catch(() => {
          if (isMounted) setHasCamera(false);
        });
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleSelectCode = (code: string) => {
    onScan(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#b83a14]" />
            <h3 className="font-bold text-gray-900 text-base">বারকোড স্ক্যানার</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="mt-3 relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          {hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 text-gray-400">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <div className="text-xs">ক্যামেরা ভিউ সক্রিয় নেই বা অনুমতি দেওয়া হয়নি</div>
            </div>
          )}

          {/* Scanner Overlay Red Line Laser Animation */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse pointer-events-none" />
          <div className="absolute inset-6 border-2 border-white/60 rounded-lg pointer-events-none" />
        </div>

        {/* Manual Barcode Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) {
              handleSelectCode(manualCode.trim());
            }
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="বারকোড নম্বর লিখুন..."
            className="flex-1 bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b83a14] font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#b83a14] hover:bg-[#a33210] text-white rounded-xl font-bold text-xs shadow-xs"
          >
            যোগ করুন
          </button>
        </form>

        {/* Quick Sample Barcodes from Products */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            দোকানের পণ্যের বারকোড থেকে বাছুন:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {products
              .filter((p) => p.barcode)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectCode(p.barcode!)}
                  className="text-xs bg-gray-100 hover:bg-orange-50 hover:text-[#b83a14] border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 flex items-center gap-1 active:scale-95"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                  <span className="font-mono text-gray-400">({p.barcode})</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
