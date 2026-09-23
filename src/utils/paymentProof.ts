/**
 * Helper utilities for payment proof handling:
 * 1. Compressing user-uploaded payment screenshot files into web-friendly Base64 DataURLs
 * 2. Generating realistic sample UPI payment receipts for immediate demo & testing
 */

export interface CompressedProofResult {
  dataUrl: string;
  fileName: string;
  fileSizeKb: number;
}

/**
 * Compresses an image file (from <input type="file"> or drag-and-drop)
 * to a lightweight JPEG DataURL to keep Firestore payload well below size limits.
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.75
): Promise<CompressedProofResult> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please upload an image file (PNG, JPG, JPEG, WEBP).'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to create canvas context for image compression.'));
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG DataURL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const fileSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          fileName: file.name,
          fileSizeKb,
        });
      };
      img.onerror = () => reject(new Error('Failed to parse the selected image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a realistic, clean Indian UPI Payment Receipt canvas image.
 * Useful for demo/test seed requests and test transactions.
 */
export function generateSampleUpiReceipt(details: {
  amount: number;
  utrNumber: string;
  senderName?: string;
  senderUpi?: string;
  app?: string;
  txDate?: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 580;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const appName = details.app || 'Google Pay';
  const sender = details.senderName || 'Rahul Sharma';
  const senderUpi = details.senderUpi || 'rahul.sharma@okhdfcbank';
  const dateStr = details.txDate || new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Background
  ctx.fillStyle = '#0F172A'; // Deep slate
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card container
  ctx.fillStyle = '#1E293B';
  ctx.roundRect(16, 16, 408, 548, 20);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // App Header
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`UPI Fast Pay • ${appName}`, 220, 52);

  // Success Green Circle with Checkmark
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(220, 108, 32, 0, Math.PI * 2);
  ctx.fill();

  // Draw Checkmark
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(208, 108);
  ctx.lineTo(217, 117);
  ctx.lineTo(233, 99);
  ctx.stroke();

  // Payment Status
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Payment Successful', 220, 168);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(dateStr, 220, 188);

  // Amount
  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`₹${details.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 220, 235);

  // Divider
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 260);
  ctx.lineTo(404, 260);
  ctx.stroke();

  // Receipt Details Table
  ctx.textAlign = 'left';
  const startY = 295;
  const rowHeight = 38;

  const rows = [
    { label: 'Paid To', val: 'WinXbet Official Merchant' },
    { label: 'Merchant UPI', val: 'alex9241@ptaxis' },
    { label: 'Sent By', val: `${sender} (${senderUpi})` },
    { label: 'UPI Ref / UTR', val: details.utrNumber, highlight: true },
    { label: 'Debited From', val: 'HDFC Bank •••• 4892' },
    { label: 'Status', val: 'COMPLETED (Bank Confirmed)', green: true }
  ];

  rows.forEach((r, idx) => {
    const y = startY + idx * rowHeight;
    ctx.fillStyle = '#64748B';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(r.label, 36, y);

    if (r.green) {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else if (r.highlight) {
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 12px "Courier New", Courier, monospace';
    } else {
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
    ctx.fillText(r.val, 36, y + 16);
  });

  // Footer Security watermark
  ctx.fillStyle = '#475569';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NPCI / UPI 2.0 Certified Security Seal • Instant Settlement', 220, 542);

  return canvas.toDataURL('image/jpeg', 0.85);
}
