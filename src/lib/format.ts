// รูปแบบวันที่ภาษาไทย (พ.ศ.) ที่ใช้ร่วมกันทุกหน้า

/** เช่น 14 ต.ค. 69 */
export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : '-';

/** เช่น 31 ธันวาคม 2569 */
export const formatDateLong = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

/** เช่น 14 ต.ค. 69 10:15 */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
