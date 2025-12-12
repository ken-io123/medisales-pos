import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, StopCircle, X, CheckCircle, Keyboard } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  onError?: (type: 'permission' | 'not-found' | 'general', message: string) => void;
};

type ScannerStatus = 'idle' | 'scanning' | 'error' | 'denied' | 'success';

const SCANNER_ID = 'html5-qrcode-scanner';

const BarcodeScanner = ({ open, onClose, onDetected, onError }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        console.error('Failed to stop scanner', error);
      }
      scannerRef.current = null;
    }
    setStatus('idle');
    setMessage('');
  }, []);

  const handleClose = useCallback(async () => {
    await stopScanner();
    setManualInput('');
    setShowManualInput(false);
    onClose();
  }, [onClose, stopScanner]);

  const handleManualSubmit = useCallback(() => {
    const trimmed = manualInput.trim();
    if (trimmed) {
      setStatus('success');
      setMessage('Barcode submitted successfully!');
      setTimeout(() => {
        onDetected(trimmed);
        void handleClose();
      }, 500);
    }
  }, [manualInput, onDetected, handleClose]);

  const toggleManualInput = useCallback(() => {
    setShowManualInput(prev => !prev);
    if (!showManualInput) {
      void stopScanner();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showManualInput, stopScanner]);

  useEffect(() => {
    if (!open) {
      void stopScanner();
      return () => undefined;
    }

    const initializeScanner = async () => {
      if (scannerRef.current) {
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(SCANNER_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
        });
        scannerRef.current = html5QrCode;
        setStatus('scanning');
        setMessage('Point camera at barcode');

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            setStatus('success');
            setMessage('✓ Barcode detected successfully!');
            void stopScanner().then(() => {
              setTimeout(() => {
                onDetected(decodedText);
              }, 300);
            });
          },
          (errorMessage) => {
            console.debug('Scanner error', errorMessage);
          },
        );
      } catch (error) {
        console.error('Failed to start barcode scanner', error);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          setStatus('denied');
          setMessage('Camera access denied. Please allow camera permissions.');
          onError?.('permission', 'Camera access denied. Enable camera permissions or use manual entry.');
        } else if (error instanceof Error && error.name === 'NotFoundError') {
          setStatus('error');
          setMessage('No suitable camera found. Try manual entry.');
          onError?.('not-found', 'No suitable camera found. Use manual entry instead.');
        } else {
          setStatus('error');
          setMessage('Unable to access camera. Please try again.');
          onError?.('general', 'Unable to start camera. Check device settings or try manual entry.');
        }
      }
    };

    void initializeScanner();

    return () => {
      void stopScanner();
    };
  }, [onDetected, onError, open, stopScanner]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Scan Barcode</h2>
            <p className="text-sm text-slate-500">{showManualInput ? 'Enter barcode manually' : 'Point camera at barcode'}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!showManualInput ? (
          <div className="mt-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <div 
              id={SCANNER_ID} 
              className={`aspect-[5/3] w-full overflow-hidden rounded-2xl transition-all ${
                status === 'success' ? 'ring-4 ring-green-500' : 'bg-slate-900/80'
              }`} 
            />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
            <label htmlFor="manual-barcode" className="block text-sm font-medium text-slate-700 mb-2">
              Enter Barcode Number
            </label>
            <input
              ref={inputRef}
              id="manual-barcode"
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              placeholder="Type or scan barcode..."
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoComplete="off"
            />
            <p className="mt-2 text-xs text-slate-500">Press Enter to submit</p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {status === 'success' ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="font-medium text-green-700">{message}</span>
              </>
            ) : status === 'error' || status === 'denied' ? (
              <>
                <Camera className="h-4 w-4 text-rose-600" aria-hidden="true" />
                <span className="font-medium text-rose-700">{message}</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="text-slate-600">{message}</span>
              </>
            )}
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wide ${
            status === 'success' ? 'text-green-600' :
            status === 'error' || status === 'denied' ? 'text-rose-600' :
            status === 'scanning' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            {status === 'success' ? '✓ Success' : 
             status === 'error' ? '✗ Error' :
             status === 'denied' ? '✗ Denied' :
             status === 'scanning' ? '● Scanning' : 'Ready'}
          </span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={toggleManualInput}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-blue-500 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            {showManualInput ? 'Use Camera' : 'Manual Entry'}
          </button>
          
          {showManualInput ? (
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stopScanner()}
              disabled={status !== 'scanning'}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopCircle className="h-4 w-4" aria-hidden="true" />
              Stop Scanner
            </button>
          )}
          
          <button
            type="button"
            onClick={() => void handleClose()}
            className="rounded-2xl border-2 border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
