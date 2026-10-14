/** label + ช่องกรอก + error ใต้ช่อง (หลักการ UX ข้อ 5) */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p
          className="mt-1 text-xs"
          style={{ color: 'var(--danger)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** class ของ input ตามสถานะ error */
export const inputClass = (error?: string) =>
  `input-field ${error ? '!border-red-500' : ''}`;
