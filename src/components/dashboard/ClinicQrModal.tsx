'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Download, Printer, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';

interface ClinicQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

export const ClinicQrModal: React.FC<ClinicQrModalProps> = ({
  isOpen,
  onClose,
  clinicId,
  clinicName,
}) => {
  const [loading, setLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [registrationUrl, setRegistrationUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQrCode();
    }
  }, [isOpen]);

  const fetchQrCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/clinic/qr');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setRegistrationUrl(data.registrationUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-patient-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${clinicName} - Patient Check-In QR</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 24px;
              color: #0f172a;
              text-align: center;
            }
            .standee {
              border: 3px solid #0284c7;
              border-radius: 24px;
              padding: 48px 40px;
              max-width: 480px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .badge {
              display: inline-block;
              background-color: #e0f2fe;
              color: #0369a1;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            h1 {
              font-size: 28px;
              margin: 0 0 8px 0;
              color: #0f172a;
            }
            p.sub {
              font-size: 15px;
              color: #64748b;
              margin: 0 0 24px 0;
            }
            .qr-container {
              background: #f8fafc;
              padding: 20px;
              border-radius: 16px;
              display: inline-block;
              margin-bottom: 24px;
              border: 1px solid #e2e8f0;
            }
            .qr-container img {
              width: 280px;
              height: 280px;
              display: block;
            }
            .instructions {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 12px;
              padding: 16px;
              font-size: 14px;
              color: #166534;
              line-height: 1.5;
            }
            .instructions strong {
              display: block;
              margin-bottom: 4px;
            }
            .footer {
              margin-top: 24px;
              font-size: 12px;
              color: #94a3b8;
            }
            @media print {
              body { padding: 0; }
              .standee { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="standee">
            <div class="badge">Official Clinic Check-In</div>
            <h1>${clinicName}</h1>
            <p class="sub">Scan with any mobile phone camera or QR reader to check in or register</p>
            <div class="qr-container">
              <img src="${qrCodeDataUrl}" alt="${clinicName} QR Code" />
            </div>
            <div class="instructions">
              <strong>Quick 1-Minute Digital Check-In</strong>
              No paperwork required. Returning patients simply enter their mobile number.
            </div>
            <div class="footer">
              Clinic ID: ${clinicId}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Clinic Patient QR Code</h3>
              <p className="text-xs text-slate-300">{clinicName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Generating secure QR code...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchQrCode}
                className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Place this QR code at your reception desk or entrance. Patients scan it with Android
                or iOS cameras to register or check in instantly.
              </p>

              {/* QR Container */}
              <div className="inline-block p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner mb-4">
                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt={`${clinicName} Patient Registration QR`}
                    className="w-64 h-64 object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Public URL Box */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-2 mb-6">
                <input
                  type="text"
                  readOnly
                  value={registrationUrl}
                  className="bg-transparent text-xs text-slate-700 flex-1 px-2 outline-none select-all truncate font-mono"
                />
                <button
                  onClick={handleCopyUrl}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500 mr-1" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <a
                  href={registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-sky-600 transition"
                  title="Open registration page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition shadow-sm"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Standee
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

