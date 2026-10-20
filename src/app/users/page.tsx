'use client';

import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { IconPencil, IconPlus, IconSearch } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { FilterChips } from '@/components/prototype/FilterChips';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryState } from '@/lib/useQueryState';
import { roleLabels } from '@/mock';
import { protoUsers, type ProtoUser } from '@/mock/prototype/admin';
import type { UserRole } from '@/types/api';
import { UserModal, type UserDraft } from './UserModal';

const ROLE_KEYS = ['all', ...(Object.keys(roleLabels) as UserRole[])] as const;
type RoleKey = (typeof ROLE_KEYS)[number];

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={
        active
          ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
          : { background: 'var(--border-light)', color: 'var(--ink-secondary)' }
      }
    >
      {active ? 'ใช้งาน' : 'ปิดใช้งาน'}
    </span>
  );
}

function UserList() {
  const { user } = useAuth();
  const [q, setQ] = useQueryState<string>('q', '');
  const [role, setRole] = useQueryState<RoleKey>('role', 'all', ROLE_KEYS);
  const [showInactive, setShowInactive] = useState(false);
  const [list, setList] = useState<ProtoUser[]>(protoUsers);
  const [editing, setEditing] = useState<ProtoUser | 'new' | null>(null);
  if (!user) return <AdminLayout title="ผู้ใช้งาน">{null}</AdminLayout>;

  const term = q.trim().toLowerCase();
  const byOther = list.filter(
    (u) =>
      (showInactive || u.active) &&
      (!term ||
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)),
  );
  const visible = byOther.filter((u) => role === 'all' || u.role === role);
  const options = ROLE_KEYS.map((k) => ({
    key: k,
    label: k === 'all' ? 'ทั้งหมด' : roleLabels[k],
    count:
      k === 'all' ? byOther.length : byOther.filter((u) => u.role === k).length,
  }));

  const save = (d: UserDraft) => {
    if (editing === 'new') {
      const id = Math.max(0, ...list.map((u) => u.id)) + 1;
      setList((xs) => [...xs, { ...d, id, active: true }]);
      toast.success('เพิ่มผู้ใช้แล้ว');
    } else if (editing) {
      const id = editing.id;
      setList((xs) => xs.map((u) => (u.id === id ? { ...u, ...d } : u)));
      toast.success('บันทึกการแก้ไขผู้ใช้แล้ว');
    }
    setEditing(null);
  };

  const toggle = (u: ProtoUser) => {
    if (u.active && !window.confirm(`ปิดใช้งานบัญชี "${u.name}"?`)) return;
    setList((xs) =>
      xs.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)),
    );
    toast.success(u.active ? 'ปิดใช้งานบัญชีแล้ว' : 'เปิดใช้งานบัญชีแล้ว');
  };

  const actions = (u: ProtoUser) => {
    const self = u.active && u.id === user.id;
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary gap-1.5"
          aria-label={`แก้ไข ${u.name}`}
          onClick={() => setEditing(u)}
        >
          <IconPencil aria-hidden="true" size={16} />
          แก้ไข
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={self}
          title={self ? 'ไม่สามารถปิดใช้งานบัญชีของตัวเองได้' : undefined}
          aria-label={`${u.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} ${u.name}`}
          onClick={() => toggle(u)}
        >
          {u.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
        </button>
      </div>
    );
  };

  return (
    <AdminLayout title="ผู้ใช้งาน">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">ผู้ใช้งาน</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            จัดการบัญชีและบทบาทของผู้ใช้ระบบ
          </p>
        </div>
        <button
          type="button"
          className="btn-primary gap-2"
          onClick={() => setEditing('new')}
        >
          <IconPlus aria-hidden="true" size={18} stroke={1.75} />
          เพิ่มผู้ใช้
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-zinc-100">
          <div className="relative">
            <IconSearch
              aria-hidden="true"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-tertiary)' }}
            />
            <input
              type="search"
              name="q"
              autoComplete="off"
              spellCheck={false}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-field !pl-10"
              placeholder="ค้นหาชื่อ username หรืออีเมล…"
              aria-label="ค้นหาผู้ใช้"
            />
          </div>
          <FilterChips
            label="บทบาท"
            options={options}
            value={role}
            onChange={setRole}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="show-inactive"
              autoComplete="off"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            แสดงผู้ใช้ที่ปิดใช้งาน
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold">ไม่พบผู้ใช้ที่ตรงกับตัวกรอง</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto relative">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>Username</th>
                    <th>บทบาท</th>
                    <th>หน่วยงาน</th>
                    <th>จังหวัด</th>
                    <th>สถานะ</th>
                    <th>
                      <span className="sr-only">การดำเนินการ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u, i) => (
                    <tr
                      key={u.id}
                      className="animate-stagger"
                      style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                    >
                      <td className="break-words min-w-40">
                        <p className="font-medium">{u.name}</p>
                        <p
                          className="text-xs break-all"
                          style={{ color: 'var(--ink-secondary)' }}
                        >
                          {u.email}
                        </p>
                      </td>
                      <td className="font-mono text-sm break-all">
                        {u.username}
                      </td>
                      <td className="whitespace-nowrap">
                        {roleLabels[u.role]}
                      </td>
                      <td className="break-words">{u.org}</td>
                      <td>{u.province ?? '-'}</td>
                      <td>
                        <ActiveBadge active={u.active} />
                      </td>
                      <td>{actions(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="sm:hidden divide-y divide-zinc-100">
              {visible.map((u, i) => (
                <li
                  key={u.id}
                  className="animate-stagger px-4 py-4"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold min-w-0 break-words">
                      {u.name}
                    </p>
                    <ActiveBadge active={u.active} />
                  </div>
                  <p className="font-mono text-xs mt-0.5 break-all">
                    {u.username}
                  </p>
                  <p
                    className="text-xs mt-0.5 break-all"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    {u.email}
                  </p>
                  <p className="text-sm mt-1 break-words">
                    {roleLabels[u.role]} · {u.org}
                    {u.province ? ` · ${u.province}` : ''}
                  </p>
                  <div className="mt-3">{actions(u)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {editing && (
        <UserModal
          initial={editing === 'new' ? undefined : editing}
          existing={list}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </AdminLayout>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UserList />
    </Suspense>
  );
}
