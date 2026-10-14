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

/**
 * สถานะคำขอ — ระบบเดิมเก็บในตาราง AssessmentStatus
 * ประกอบจากคู่มือ Admin ต้องยืนยันกับ DB จริงก่อนเริ่ม F2
 */
export type RequestStatus =
  | 'submitted'
  | 'doc_review'
  | 'need_docs'
  | 'assigned'
  | 'assessed'
  | 'committee'
  | 'approved'
  | 'rejected'
  | 'cancelled';

/** สถานะใบรับรอง: N ยังไม่ได้รับรอง · A รับรองแล้ว · E หมดอายุ · X ถูกยกเลิก */
export type CertStatus = 'N' | 'A' | 'E' | 'X';

export interface Pharmacist {
  name: string;
  license: string;
  role: string;
  hours: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  /** เลขที่ใบอนุญาตขายยา ขย.5 */
  licenseNo: string;
  /** เลขที่ใบรับรองร้านยาคุณภาพ */
  qualityNo?: string;
  type: string;
  address: string;
  province: string;
  licensee: string;
  phone: string;
  certStatus: CertStatus;
  certIssued?: string;
  certExpires?: string;
  /** เวลาทำการ เช่น 'ทุกวัน 08:00–21:00' */
  hours: string;
  pharmacists: Pharmacist[];
}

export interface RequestType {
  id: number;
  code: 'NEW' | 'REN' | 'CHG';
  label: string;
  /** คำอธิบายสั้นใต้ตัวเลือก */
  hint: string;
  /** เอกสารที่ต้องแนบ */
  docs: string[];
}

/** ความเกี่ยวข้องกับร้านยา (ddlRequesterType ของระบบเดิม) */
export type ApplicantRelation = 1 | 2 | 3 | 9;

export interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lineId: string;
  relation: ApplicantRelation | null;
  /** ใช้เมื่อ relation = 9 (อื่น ๆ) */
  relationOther: string;
}

export interface RequestDoc {
  /** ชื่อไฟล์ */
  name: string;
  /** ประเภทเอกสาร ตรงกับรายการใน RequestType.docs */
  type: string;
  uploadedAt: string;
}

export interface RequestMessage {
  from: string;
  at: string;
  text: string;
  status?: RequestStatus;
}

export interface AccRequest {
  id: string;
  no: string;
  pharmacyId: number;
  typeIds: number[];
  /** ประเภท 5: 1 บุคคล→บุคคล · 2 บุคคล→นิติบุคคล */
  changeMode?: 1 | 2;
  submittedAt: string;
  status: RequestStatus;
  applicant: Applicant;
  docs: RequestDoc[];
  messages: RequestMessage[];
}

/** ร่างคำขอระหว่างกรอก stepper (เก็บใน sessionStorage) */
export interface RequestDraft {
  typeIds: number[];
  changeMode: 1 | 2;
  applicant: Applicant;
  /** ประเภทเอกสาร → ชื่อไฟล์ */
  docs: Record<string, string>;
  pledged: boolean;
}

/** ข้อมูลลงทะเบียนร้านยาใหม่ */
export interface Registration {
  licenseNo: string;
  name: string;
  address: string;
  province: string;
  licensee: string;
  /** ผู้มีหน้าที่ปฏิบัติการ */
  operator: string;
  /** เลขใบประกอบวิชาชีพของผู้มีหน้าที่ปฏิบัติการ */
  operatorLicense: string;
  phone: string;
  email: string;
}
