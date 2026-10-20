'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';
import { useFocusTrap } from '@/lib/a11y';

/** dialog ใช้ร่วมของหน้าต้นแบบ — ผู้เรียกจัดการ "ทิ้งข้อมูลที่กรอก?" เองใน onClose ถ้าต้องการ */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  busy?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(boxRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-content ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'} p-6 max-h-[90vh] overflow-y-auto overscroll-contain`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold min-w-0 break-words">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="ปิด"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500"
          >
            <IconX aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
