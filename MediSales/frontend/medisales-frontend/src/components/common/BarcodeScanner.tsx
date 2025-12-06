import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, StopCircle, X } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  onError?: (type: 'permission' | 'not-found' | 'general', message: string) => void;
};

type ScannerStatus = 'idle' | 'scanning' | 'error' | 'denied';

const SCANNER_ID = 'html5-qrcode-scanner';

const BarcodeScanner = ({ open, onClose, onDetected, onError }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [message, setMessage] = useState<string>('');

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
    onClose();
  }, [onClose, stopScanner]);

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
            setMessage('Barcode detected. Processing...');
            void stopScanner().then(() => {
              onDetected(decodedText);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Scan Barcode</h2>
            <p className="text-sm text-brand-muted">Point camera at barcode</p>
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            className="rounded-full bg-brand-background p-2 text-brand-muted transition hover:text-brand-primary"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div id={SCANNER_ID} className="aspect-[5/3] w-full overflow-hidden rounded-2xl bg-slate-900/80" />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-brand-muted">
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span>{message}</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Status: {status}
          </span>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleClose()}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void stopScanner()}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:brightness-105"
          >
            <StopCircle className="h-4 w-4" aria-hidden="true" />
            Stop Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
