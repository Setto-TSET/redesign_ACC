'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { AdminLayout } from '@/components/layout';
import { PrototypeBadge } from '@/components/prototype/PrototypeBadge';
import { templates, type ReplyTemplate } from '@/mock/prototype/admin';
import { TemplateModal, type TemplateDraft } from './TemplateModal';

export default function TemplatesPage() {
  const [list, setList] = useState<ReplyTemplate[]>(templates);
  const [editing, setEditing] = useState<ReplyTemplate | 'new' | null>(null);

  const save = (d: TemplateDraft) => {
    if (editing === 'new') {
      const id = Math.max(0, ...list.map((t) => t.id)) + 1;
      setList((xs) => [...xs, { ...d, id }]);
    } else if (editing) {
      const id = editing.id;
      setList((xs) => xs.map((t) => (t.id === id ? { ...t, ...d } : t)));
    }
    setEditing(null);
  };

  const remove = (t: ReplyTemplate) => {
    if (!window.confirm(`ลบ template "${t.name}"?`)) return;
    setList((xs) => xs.filter((x) => x.id !== t.id));
    toast.success('ลบ template แล้ว');
  };

  return (
    <AdminLayout title="Template ข้อความตอบกลับ">
      <PrototypeBadge />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            ข้อความสำเร็จรูปสำหรับตอบคำขอ ใช้ตัวแปรแทนชื่อร้านและเลขที่คำขอได้
          </p>
        </div>
        <button
          type="button"
          className="btn-primary gap-2"
          onClick={() => setEditing('new')}
        >
          <IconPlus aria-hidden="true" size={18} stroke={1.75} />
          เพิ่ม template
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="font-semibold">ยังไม่มี template</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((t, i) => (
            <li
              key={t.id}
              className="card animate-stagger flex flex-wrap items-start justify-between gap-3"
              style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
            >
              <div className="min-w-0 flex-1 basis-60">
                <p className="font-semibold break-words">{t.name}</p>
                <p
                  className="text-sm mt-1 line-clamp-2 break-words"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {t.body}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary gap-1.5"
                  aria-label={`แก้ไข ${t.name}`}
                  onClick={() => setEditing(t)}
                >
                  <IconPencil aria-hidden="true" size={16} />
                  แก้ไข
                </button>
                <button
                  type="button"
                  className="btn-secondary gap-1.5"
                  aria-label={`ลบ ${t.name}`}
                  onClick={() => remove(t)}
                >
                  <IconTrash aria-hidden="true" size={16} />
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TemplateModal
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </AdminLayout>
  );
}
