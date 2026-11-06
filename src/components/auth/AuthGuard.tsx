'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// หน้าที่ไม่ต้อง login
const publicPaths = ['/login', '/register'];

/** guard ฝั่ง client ของ PoC — ระบบจริงต้องตรวจสิทธิ์ที่ API ด้วยทุกครั้ง */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, hasAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic) router.replace('/login');
    else if (user && (isPublic || !hasAccess(pathname))) router.replace('/');
  }, [user, isLoading, pathname, router, hasAccess, isPublic]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200"
          style={{ borderTopColor: 'var(--accent)' }}
          role="status"
          aria-label="กำลังโหลด"
        />
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && !isPublic && !hasAccess(pathname)) return null;
  return <>{children}</>;
}
