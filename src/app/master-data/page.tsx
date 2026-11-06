'use client';

import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { Tabs } from '@/components/prototype/Tabs';
import { useQueryState } from '@/lib/useQueryState';
import {
  masterItems,
  masterKindLabels,
  type MasterItem,
  type MasterKind,
} from '@/mock/prototype/admin';
import { MasterModal, type MasterDraft } from './MasterModal';

const KINDS = Object.keys(masterKindLabels) as MasterKind[];

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? 'badge-success' : ''}`}>
      {active ? 'ใช้งาน' : 'ปิดใช้งาน'}
    </span>
  );
}

function MasterData() {
  const [tab, setTab] = useQueryState<MasterKind>('tab', 'type', KINDS);
  const [list, setList] = useState<MasterItem[]>(masterItems);
  const [editing, setEditing] = useState<MasterItem | 'new' | null>(null);

  const rows = list.filter((m) => m.kind === tab);

  const save = (d: MasterDraft) => {
    if (editing === 'new') {
      const id = Math.max(0, ...list.map((m) => m.id)) + 1;
      setList((xs) => [...xs, { ...d, id, kind: tab }]);
    } else if (editing) {
      const id = editing.id;
      setList((xs) => xs.map((m) => (m.id === id ? { ...m, ...d } : m)));
    }
    setEditing(null);
  };

  const remove = (m: MasterItem) => {
    if (!window.confirm(`ลบ "${m.name}"?`)) return;
    setList((xs) => xs.filter((x) => x.id !== m.id));
    toast.success('ลบข้อมูลแล้ว');
  };

  const actions = (m: MasterItem) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-secondary gap-1.5"
        aria-label={`แก้ไข ${m.name}`}
        onClick={() => setEditing(m)}
      >
        <IconPencil aria-hidden="true" size={16} />
        แก้ไข
      </button>
      <button
        type="button"
        className="btn-secondary gap-1.5"
        aria-label={`ลบ ${m.name}`}
        onClick={() => remove(m)}
      >
        <IconTrash aria-hidden="true" size={16} />
        ลบ
      </button>
    </div>
  );

  return (
    <AdminLayout title="ข้อมูลหลัก">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            จัดการประเภท กลุ่ม และเครือข่ายของร้านยา
          </p>
        </div>
        <button
          type="button"
          className="btn-primary gap-2"
          onClick={() => setEditing('new')}
        >
          <IconPlus aria-hidden="true" size={18} stroke={1.75} />
          เพิ่ม{masterKindLabels[tab]}
        </button>
      </div>

      <Tabs
        label="หมวดข้อมูลหลัก"
        tabs={KINDS.map((k) => ({
          key: k,
          label: masterKindLabels[k],
          count: list.filter((m) => m.kind === k).length,
        }))}
        value={tab}
        onChange={setTab}
      >
        {rows.length === 0 ? (
          <p className="py-10 text-center font-semibold">ยังไม่มีข้อมูล</p>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto relative">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>ชื่อ</th>
                    <th>สถานะ</th>
                    <th>
                      <span className="sr-only">การดำเนินการ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, i) => (
                    <tr
                      key={m.id}
                      className="animate-stagger"
                      style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                    >
                      <td className="font-mono text-sm tabular-nums">
                        {m.code}
                      </td>
                      <td className="break-words">{m.name}</td>
                      <td>
                        <ActiveBadge active={m.active} />
                      </td>
                      <td>{actions(m)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="sm:hidden divide-y divide-slate-100">
              {rows.map((m, i) => (
                <li
                  key={m.id}
                  className="animate-stagger py-4"
                  style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold min-w-0 break-words">
                      {m.name}
                    </p>
                    <ActiveBadge active={m.active} />
                  </div>
                  <p className="font-mono text-xs mt-0.5 tabular-nums">
                    {m.code}
                  </p>
                  <div className="mt-3">{actions(m)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tabs>

      {editing && (
        <MasterModal
          initial={editing === 'new' ? undefined : editing}
          siblings={rows}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </AdminLayout>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense>
      <MasterData />
    </Suspense>
  );
}
