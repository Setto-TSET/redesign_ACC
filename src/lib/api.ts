// จุดเดียวที่ดึงข้อมูล — PoC คืนค่าจาก mock
// ตอนต่อ backend ให้แก้แค่ไฟล์นี้เป็น fetch(`${process.env.NEXT_PUBLIC_API_URL}/...`)
import type { LoginResponse } from '@/types/api';
import { users } from '@/mock';

export const api = {
  auth: {
    // PoC: ไม่ตรวจรหัสผ่าน — ระบบจริงตรวจที่ API แล้วคืน JWT
    async login({ username }: { username: string }): Promise<LoginResponse> {
      const user = users.find((u) => u.username === username.trim());
      if (!user) return { success: false, error: 'ไม่พบชื่อผู้ใช้นี้' };
      return { success: true, user, token: `mock-${user.id}` };
    },
  },
};
