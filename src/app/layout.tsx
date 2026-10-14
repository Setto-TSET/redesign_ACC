import type { Metadata } from 'next';
import { Noto_Sans_Thai, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ToastProvider } from '@/components/common/ToastProvider';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Outfit ไม่มีตัวอักษรไทย — โหลด Noto Sans Thai มาเป็นฟอนต์สำรองของภาษาไทย
const notoThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['thai'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Acc-Pharm — ระบบประเมินร้านยาคุณภาพ',
  description: 'สำนักงานรับรองร้านยาคุณภาพ สภาเภสัชกรรม (PoC)',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body
        className={`${outfit.variable} ${notoThai.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
