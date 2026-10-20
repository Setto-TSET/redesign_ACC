import { IconFlask } from '@tabler/icons-react';

/** บอกผู้ทดลองว่าหน้านี้เป็นต้นแบบ — ข้อมูลไม่ถูกบันทึก */
export function PrototypeBadge() {
  return (
    <p
      className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
    >
      <IconFlask aria-hidden="true" size={14} />
      ต้นแบบ — ข้อมูลตัวอย่าง
    </p>
  );
}
