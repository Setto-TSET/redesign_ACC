/** label + ช่องกรอก + error ใต้ช่อง (หลักการ UX ข้อ 5) — error มี id `${htmlFor}-error` */
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
        className="block text-[13px] font-semibold text-slate-700 mb-1.5"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p
          id={htmlFor ? `${htmlFor}-hint` : undefined}
          className="mt-1 text-xs"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
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
  `input-field ${error ? '!border-[var(--danger)]' : ''}`;

/** aria ที่ผูก input กับ error/hint ของ Field */
export const fieldAria = (id: string, error?: string, hint?: string) => ({
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});
