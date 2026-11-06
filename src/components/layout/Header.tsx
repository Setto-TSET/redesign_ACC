'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconChevronDown,
  IconLogout,
  IconMenu2,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { roleLabels, users } from '@/mock';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        profileBtnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!profileRef.current?.contains(e.target as Node))
        setShowProfileMenu(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [showProfileMenu]);

  // PoC เท่านั้น: สลับ role เพื่อ demo — ระบบจริงไม่มีตัวนี้
  const switchRole = async (username: string) => {
    const res = await api.auth.login({ username });
    if (res.success && res.user && res.token) {
      login(res.user, res.token);
      router.push('/');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 sticky top-0 z-30 flex items-center">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            aria-label="เปิดเมนู"
          >
            <IconMenu2 aria-hidden="true" size={20} className="text-slate-500" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate">
            {title || 'หน้าหลัก'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <label className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            Demo role
            <select
              name="demoRole"
              value={user?.username}
              onChange={(e) => switchRole(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
            >
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  {roleLabels[u.role]}
                </option>
              ))}
            </select>
          </label>

          <div className="relative" ref={profileRef}>
            <button
              ref={profileBtnRef}
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-expanded={showProfileMenu}
              aria-label={`เมนูของ ${user?.name ?? 'ผู้ใช้'}`}
              className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                {user?.name.replace(/^(ภก\.|ภญ\.)/, '').charAt(0)}
              </span>
              <span className="hidden md:flex flex-col items-start">
                <span className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {user?.name}
                </span>
                <span className="text-xs text-slate-500">
                  {user && roleLabels[user.role]}
                </span>
              </span>
              <IconChevronDown
                aria-hidden="true"
                size={14}
                className="text-slate-400 hidden md:block"
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-scale-in">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="font-semibold text-slate-800 text-[13px]">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.org}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-600 text-[13px]"
                >
                  <IconUser aria-hidden="true" size={15} /> ข้อมูลส่วนตัว
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.replace('/login');
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-red-500 w-full text-left text-[13px]"
                  >
                    <IconLogout aria-hidden="true" size={15} /> ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
