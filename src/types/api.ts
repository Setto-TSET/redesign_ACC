/**
 * สิทธิ์ผู้ใช้ — เทียบกับ RoleID ของระบบเดิม
 * 1 ร้านยา · 2 ผู้ตรวจ · 3 Admin สรร. · 4–6 สสจ. · 9 Super Admin
 */
export type UserRole =
  'pharmacy' | 'assessor' | 'admin' | 'ppho' | 'superadmin';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  /** หน่วยงาน หรือชื่อร้าน */
  org: string;
  /** ร้านที่ผูกกับบัญชี (role ร้านยา) */
  pharmacyId?: number;
  /** จังหวัดที่รับผิดชอบ (role สสจ.) */
  province?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}
