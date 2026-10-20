'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconBuildingStore,
  IconFileCertificate,
  IconCalendarEvent,
  IconClipboardCheck,
  IconMessageReport,
  IconChecklist,
  IconUserShare,
  IconReportAnalytics,
  IconCertificate,
  IconNews,
  IconFolder,
  IconUsersGroup,
  IconCategory,
  IconMessages,
  IconSettings,
  IconLogout,
  IconX,
  IconChevronDown,
  IconPill,
  type Icon,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusTrap } from '@/lib/a11y';
import type { UserRole } from '@/types/api';

type MenuItem =
  | { type: 'category'; label: string }
  | {
      type: 'link';
      href: string;
      label: string;
      icon: Icon;
      roleLabel?: Partial<Record<UserRole, string>>;
    }
  | {
      type: 'submenu';
      label: string;
      icon: Icon;
      children: { href: string; label: string }[];
    };

// โครงเมนูทั้งหมด — แต่ละ role เห็นเฉพาะรายการที่ hasAccess() อนุญาต
const menuStructure: MenuItem[] = [
  { type: 'link', href: '/', label: 'หน้าหลัก', icon: IconLayoutDashboard },
  { type: 'category', label: 'งานรับรอง' },
  {
    type: 'link',
    href: '/my-pharmacy',
    label: 'ข้อมูลร้านของฉัน',
    icon: IconBuildingStore,
  },
  {
    type: 'link',
    href: '/requests',
    label: 'คำขอรับรอง',
    icon: IconFileCertificate,
  },
  {
    type: 'submenu',
    label: 'ร้านยา',
    icon: IconBuildingStore,
    children: [
      { href: '/pharmacies', label: 'ร้านยาทั้งหมด' },
      { href: '/map', label: 'ร้านยาตามพื้นที่' },
    ],
  },
  {
    type: 'link',
    href: '/schedule',
    label: 'ตารางผู้ตรวจ',
    icon: IconCalendarEvent,
  },
  {
    type: 'link',
    href: '/post-audit',
    label: 'ตรวจรักษาคุณภาพ',
    icon: IconClipboardCheck,
    roleLabel: { pharmacy: 'ผลตรวจรักษาคุณภาพ' },
  },
  {
    type: 'link',
    href: '/complaints',
    label: 'ข้อร้องเรียน',
    icon: IconMessageReport,
  },
  { type: 'link', href: '/gpp', label: 'ประเมิน GPP', icon: IconChecklist },
  {
    type: 'link',
    href: '/allocation',
    label: 'มอบหมายงาน',
    icon: IconUserShare,
  },
  { type: 'category', label: 'รายงานและใบรับรอง' },
  {
    type: 'link',
    href: '/reports',
    label: 'รายงาน',
    icon: IconReportAnalytics,
  },
  {
    type: 'link',
    href: '/certificates',
    label: 'พิมพ์ใบรับรอง',
    icon: IconCertificate,
  },
  { type: 'category', label: 'ข่าวสารและเอกสาร' },
  { type: 'link', href: '/news', label: 'ข่าวประชาสัมพันธ์', icon: IconNews },
  {
    type: 'link',
    href: '/documents',
    label: 'ระเบียบ เอกสาร และคู่มือ',
    icon: IconFolder,
  },
  { type: 'category', label: 'ผู้ดูแลระบบ' },
  { type: 'link', href: '/users', label: 'ผู้ใช้งาน', icon: IconUsersGroup },
  {
    type: 'link',
    href: '/master-data',
    label: 'ข้อมูลพื้นฐาน',
    icon: IconCategory,
  },
  {
    type: 'link',
    href: '/templates',
    label: 'Template ข้อความ',
    icon: IconMessages,
  },
  { type: 'link', href: '/settings', label: 'ตั้งค่าระบบ', icon: IconSettings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAccess, logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const asideRef = useRef<HTMLElement>(null);
  // isOpen เป็น true เฉพาะ drawer บนมือถือ — desktop แสดงตลอดจึงไม่กัน focus
  // desktop (lg+) แสดง sidebar ตลอด; มือถือที่ปิดอยู่ใช้ inert ไม่ให้ Tab เข้าถึงลิงก์นอกจอ
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  // ขยายถึง lg ขณะ drawer เปิด → ปิด drawer (คืน overlay/focus trap)
  useEffect(() => {
    if (isDesktop && isOpen) onClose();
  }, [isDesktop, isOpen, onClose]);
  useFocusTrap(asideRef, isOpen && !isDesktop);

  const isActiveLink = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/');

  // กรองตามสิทธิ์ แล้วตัดหัวหมวดที่ไม่มีรายการเหลือ
  const visible = menuStructure
    .map((item): MenuItem | null => {
      if (item.type === 'link') return hasAccess(item.href) ? item : null;
      if (item.type === 'submenu') {
        const children = item.children.filter((c) => hasAccess(c.href));
        if (children.length === 0) return null;
        // เหลือรายการเดียว → แสดงเป็นลิงก์ธรรมดา ไม่ต้องมีเมนูซ้อน
        if (children.length === 1)
          return {
            type: 'link',
            href: children[0].href,
            label: item.label,
            icon: item.icon,
          };
        return { ...item, children };
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null)
    .filter(
      (item, i, arr) =>
        item.type !== 'category' ||
        (arr[i + 1] !== undefined && arr[i + 1].type !== 'category'),
    );

  return (
    <aside
      ref={asideRef}
      className={`sidebar transform transition-transform duration-300 ease-out motion-reduce:transition-none overscroll-contain lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="เมนูหลัก"
      inert={!isOpen && !isDesktop}
    >
      <div className="flex items-center justify-between px-5 h-16 shrink-0">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <IconPill aria-hidden="true" size={16} className="text-white" />
          </span>
          <span className="text-slate-900 font-bold text-sm tracking-tight">
            Acc-Pharm
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
          aria-label="ปิดเมนู"
        >
          <IconX aria-hidden="true" size={18} />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {visible.map((item) => {
            if (item.type === 'category') {
              return (
                <li key={item.label} className="px-5 pt-6 pb-1.5">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-400">
                    {item.label}
                  </span>
                </li>
              );
            }

            if (item.type === 'link') {
              const ItemIcon = item.icon;
              const active = isActiveLink(item.href);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <ItemIcon aria-hidden="true" size={18} stroke={1.5} />
                    <span>
                      {(user && item.roleLabel?.[user.role]) ?? item.label}
                    </span>
                  </Link>
                </li>
              );
            }

            const ItemIcon = item.icon;
            const expanded = !collapsed.includes(item.label);
            const active = item.children.some((c) => isActiveLink(c.href));
            return (
              <li key={item.label}>
                <button
                  onClick={() =>
                    setCollapsed((xs) =>
                      expanded
                        ? [...xs, item.label]
                        : xs.filter((x) => x !== item.label),
                    )
                  }
                  aria-expanded={expanded}
                  className={`sidebar-link w-full justify-between ${active ? '!text-slate-900 font-semibold' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <ItemIcon aria-hidden="true" size={18} stroke={1.5} />
                    <span>{item.label}</span>
                  </span>
                  <IconChevronDown
                    aria-hidden="true"
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>
                {expanded && (
                  <ul>
                    {item.children.map((child) => {
                      const childActive = isActiveLink(child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            aria-current={childActive ? 'page' : undefined}
                            className={`flex items-center gap-2.5 text-[13px] font-medium py-1.5 pl-14 pr-4 mx-2.5 rounded-md transition-colors duration-150 ${childActive ? 'text-emerald-700 font-semibold bg-emerald-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                          >
                            <span
                              aria-hidden="true"
                              className="w-1 h-1 rounded-full shrink-0"
                              style={{
                                background: childActive
                                  ? 'var(--accent)'
                                  : 'var(--ink-faint)',
                              }}
                            />
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2.5 border-t border-slate-100 shrink-0">
        <button
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="sidebar-link w-full !text-slate-500 hover:!text-rose-600 hover:!bg-rose-50"
        >
          <IconLogout aria-hidden="true" size={18} stroke={1.5} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
