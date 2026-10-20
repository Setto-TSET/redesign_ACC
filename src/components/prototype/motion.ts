/** ผู้ใช้ขอลดการเคลื่อนไหว — animejs ต้องข้ามไปสถานะสุดท้าย */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
