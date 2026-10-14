'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserRole } from '@/types/api';

// หน้าที่แต่ละ role เข้าได้ — จุดเดียวที่กำหนดสิทธิ์ ทั้งเมนูและ AuthGuard อ่านจากตรงนี้
// (แทนเงื่อนไข ROLE_ID ที่กระจายอยู่ใน Site.Master ของระบบเดิม)
const adminPages = [
  '/',
  '/requests',
  '/pharmacies',
  '/map',
  '/schedule',
  '/post-audit',
  '/complaints',
  '/reports',
  '/certificates',
  '/news',
  '/documents',
  '/users',
  '/master-data',
  '/templates',
  '/profile',
];

const rolePageAccess: Record<UserRole, string[]> = {
  pharmacy: [
    '/',
    '/my-pharmacy',
    '/requests',
    '/news',
    '/documents',
    '/profile',
  ],
  assessor: [
    '/',
    '/requests',
    '/schedule',
    '/post-audit',
    '/pharmacies',
    '/news',
    '/documents',
    '/profile',
  ],
  admin: adminPages,
  ppho: [
    '/',
    '/pharmacies',
    '/gpp',
    '/reports',
    '/news',
    '/documents',
    '/profile',
  ],
  // Super Admin = Admin + เมนูที่ระบบเดิมเปิดให้ RoleID 9 เท่านั้น
  superadmin: [...adminPages, '/allocation', '/gpp', '/settings'],
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// PoC เก็บใน sessionStorage (แยกต่อแท็บ เปิดหลาย role พร้อมกันได้)
const TOKEN_KEY = 'accpharm_token';
const USER_KEY = 'accpharm_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      if (stored && sessionStorage.getItem(TOKEN_KEY))
        setUser(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
    setIsLoading(false);
  }, []);

  const hasAccess = (page: string): boolean => {
    if (!user) return false;
    const allowed = rolePageAccess[user.role];
    return allowed.some((p) =>
      p === '/' ? page === '/' : page === p || page.startsWith(p + '/'),
    );
  };

  const login = (newUser: User, token: string) => {
    setUser(newUser);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
