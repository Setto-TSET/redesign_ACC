// ข้อร้องเรียนสมมติ — ขั้นตอน 15 ขั้นจาก CPAQA/ComplainDetail.aspx; ชื่อ/เบอร์ทั้งหมดเป็นข้อมูลสมมติ
import { protoPharmacies } from './pharmacies';

export type ComplaintStage =
  | 'intake'
  | 'factfinding'
  | 'subcommittee'
  | 'council'
  | 'resolution'
  | 'closed';

export const complaintStageLabels: Record<ComplaintStage, string> = {
  intake: 'รับเรื่อง',
  factfinding: 'แสวงหาข้อเท็จจริง',
  subcommittee: 'คณะอนุกรรมการ',
  council: 'คณะกรรมการสภาฯ',
  resolution: 'ดำเนินการตามมติ',
  closed: 'ปิดแล้ว',
};

export const complaintSteps = [
  'ช่องทางการแจ้งเรื่อง',
  'ผู้ร้องเรียน',
  'ร้านที่ถูกร้องเรียน',
  'ผู้รับคำร้องเรียน',
  'ประเด็นปัญหา',
  'มาตรฐานและบริการที่เกี่ยวข้อง',
  'ส่งคณะทำงานแสวงหาข้อเท็จจริง',
  'แสวงหาและสืบค้น',
  'คณะทำงานสรุป',
  'คณะอนุกรรมการฯ สรุป',
  'พิจารณาดำเนินการ',
  'เข้าคณะกรรมการสภาฯ',
  'ผลการพิจารณา',
  'อนุกรรมการฯ ดำเนินการตามมติ',
  'ปิดข้อร้องเรียน',
];

/** step = จำนวนขั้นที่บันทึกแล้ว */
export const stageOfStep = (step: number): ComplaintStage =>
  step <= 6
    ? 'intake'
    : step <= 9
      ? 'factfinding'
      : step <= 11
        ? 'subcommittee'
        : step <= 13
          ? 'council'
          : step === 14
            ? 'resolution'
            : 'closed';

export const channels = [
  'โทรศัพท์',
  'อีเมล',
  'จดหมาย',
  'Walk-in',
  'สปสช.',
  'อื่น ๆ',
];
export const severities = ['ต่ำ', 'ปานกลาง', 'สูง'];
export const standards = [
  'มาตรฐานที่ 1 สถานที่',
  'มาตรฐานที่ 2 อุปกรณ์',
  'มาตรฐานที่ 3 บุคลากร',
  'มาตรฐานที่ 4 การควบคุมคุณภาพยา',
  'มาตรฐานที่ 5 การปฏิบัติทางเภสัชกรรมชุมชน',
];
export const services = [
  'Common illness',
  'บริการเลิกบุหรี่',
  'บริการเภสัชกรรมทางไกล',
  'ร้านยาใกล้บ้านใกล้ใจ',
  'อื่น ๆ',
];
export const actionOptions = [
  'จำหน่าย',
  'ตักเตือนด้วยวาจา',
  'ตักเตือนด้วยจดหมาย',
  'เสนอกรรมการสภาเภสัชกรรม',
  'แจ้งให้หยุดการบริการ',
  'ส่งเรื่อง สปสช.',
];
export const councilResults = [
  'ดำเนินการจรรยาบรรณ',
  'แจ้งอนุกรรมการดำเนินการ',
  'อื่น ๆ',
];
export const findingResults = [
  'ไม่มีมูลความจริง',
  'เป็นเรื่องจริงตามข้อร้องเรียน',
  'อื่น ๆ',
];

export interface Complaint {
  id: string;
  no: string;
  receivedAt: string;
  channel: string;
  complainant: { name: string; contact: string };
  pharmacyId?: number;
  /** ระบุเองเมื่อร้านไม่อยู่ในรายชื่อ */
  pharmacyText?: string;
  receiver: string;
  standards: string[];
  service: string;
  issue: string;
  severity: string;
  detail: string;
  photos: number;
  /** ขั้นที่บันทึกแล้ว — index ของ complaintSteps ที่ถัดไปคือขั้นปัจจุบัน */
  step: number;
  log: { step: number; date: string; text: string }[];
}

const stepText = [
  'รับเรื่องทางช่องทางที่ระบุ',
  'บันทึกข้อมูลผู้ร้องเรียน',
  'ระบุร้านที่ถูกร้องเรียน',
  'มอบหมายผู้รับเรื่อง',
  'บันทึกประเด็นปัญหา',
  'ระบุมาตรฐานและบริการที่เกี่ยวข้อง',
  'ส่งเรื่องให้คณะทำงานแสวงหาข้อเท็จจริง',
  'คณะทำงานลงพื้นที่และสืบค้นข้อมูล',
  'คณะทำงานสรุปผลการแสวงหาข้อเท็จจริง',
  'คณะอนุกรรมการฯ สรุปผล',
  'พิจารณาแนวทางดำเนินการ',
  'นำเข้าที่ประชุมคณะกรรมการสภาฯ',
  'คณะกรรมการสภาฯ มีมติ',
  'อนุกรรมการฯ แจ้งดำเนินการตามมติ',
  'ปิดข้อร้องเรียน',
];

const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

type Rest = Omit<
  Complaint,
  'id' | 'no' | 'receivedAt' | 'step' | 'log' | 'photos'
> & { photos?: number };

function make(
  seq: number,
  receivedAt: string,
  step: number,
  rest: Rest,
): Complaint {
  const n = String(seq).padStart(3, '0');
  return {
    id: `cp-${n}`,
    no: `ร.2569/${n}`,
    receivedAt,
    step,
    photos: 0,
    ...rest,
    log: Array.from({ length: step }, (_, i) => ({
      step: i,
      date: addDays(receivedAt, i < 6 ? 0 : (i - 5) * 9),
      text: stepText[i],
    })),
  };
}

const p = protoPharmacies;
const std = (...i: number[]) => i.map((k) => standards[k]);
const RECEIVER = 'เจ้าหน้าที่ สภาเภสัชกรรม';

export const complaints: Complaint[] = [
  make(1, '2026-09-28', 6, {
    channel: 'โทรศัพท์',
    complainant: { name: 'คุณสมศรี ใจดี', contact: '081-234-5678' },
    pharmacyId: p[0].id,
    receiver: RECEIVER,
    standards: std(2),
    service: 'Common illness',
    issue: 'ไม่พบเภสัชกรขณะเปิดให้บริการ',
    severity: 'สูง',
    detail: 'ไปซื้อยาช่วงเย็น ผู้ขายไม่ใช่เภสัชกรและไม่มีป้ายแสดงตัว',
  }),
  make(2, '2026-10-02', 6, {
    channel: 'อีเมล',
    complainant: { name: 'คุณวิชัย รักษ์สุข', contact: 'wichai@example.com' },
    pharmacyText: 'ร้านยาไม่ทราบชื่อ ตลาดเช้า อ.เมือง จ.ขอนแก่น',
    receiver: RECEIVER,
    standards: std(0, 3),
    service: 'อื่น ๆ',
    issue: 'เก็บยาในที่ร้อนและมียาหมดอายุบนชั้น',
    severity: 'ปานกลาง',
    detail: 'พบยาหมดอายุวางจำหน่ายและเก็บยาใกล้แหล่งความร้อน',
    photos: 2,
  }),
  make(3, '2026-09-10', 7, {
    channel: 'Walk-in',
    complainant: { name: 'คุณนภา แสงทอง', contact: '089-111-2233' },
    pharmacyId: p[1].id,
    receiver: RECEIVER,
    standards: std(4),
    service: 'บริการเลิกบุหรี่',
    issue: 'ให้คำแนะนำการใช้ยาไม่ครบถ้วน',
    severity: 'ต่ำ',
    detail: 'ไม่ได้รับคำอธิบายผลข้างเคียงของยาที่จ่าย',
  }),
  make(4, '2026-08-25', 8, {
    channel: 'สปสช.',
    complainant: { name: 'สปสช. เขต 1', contact: 'nhso-r1@example.com' },
    pharmacyId: p[2].id,
    receiver: RECEIVER,
    standards: std(4),
    service: 'ร้านยาใกล้บ้านใกล้ใจ',
    issue: 'เบิกจ่ายบริการไม่ตรงกับการให้บริการจริง',
    severity: 'สูง',
    detail: 'ได้รับแจ้งความผิดปกติของรายการเบิกจ่ายบริการเภสัชกรรม',
  }),
  make(5, '2026-07-30', 10, {
    channel: 'จดหมาย',
    complainant: { name: 'คุณประสิทธิ์ มั่นคง', contact: '02-345-6789' },
    pharmacyId: p[3].id,
    receiver: RECEIVER,
    standards: std(1, 2),
    service: 'บริการเภสัชกรรมทางไกล',
    issue: 'ระบบเภสัชกรรมทางไกลไม่เชื่อมต่อกับเภสัชกร',
    severity: 'ปานกลาง',
    detail: 'ใช้บริการทางไกลแต่ไม่มีเภสัชกรตอบกลับตลอดการใช้บริการ',
  }),
  make(6, '2026-06-18', 12, {
    channel: 'โทรศัพท์',
    complainant: { name: 'คุณมาลี ศรีสุข', contact: '086-777-8899' },
    pharmacyId: p[4].id,
    receiver: RECEIVER,
    standards: std(2, 3),
    service: 'Common illness',
    issue: 'จำหน่ายยาอันตรายโดยไม่ซักประวัติ',
    severity: 'สูง',
    detail: 'ขอซื้อยาปฏิชีวนะ ได้รับยาทันทีโดยไม่ถูกซักประวัติแพ้ยา',
  }),
  make(7, '2026-05-05', 14, {
    channel: 'อีเมล',
    complainant: { name: 'คุณธนา วงศ์ดี', contact: 'thana@example.com' },
    pharmacyId: p[5].id,
    receiver: RECEIVER,
    standards: std(0),
    service: 'อื่น ๆ',
    issue: 'ป้ายและใบอนุญาตไม่แสดงในที่เปิดเผย',
    severity: 'ต่ำ',
    detail: 'ไม่พบการแสดงใบอนุญาตและป้ายเภสัชกรประจำร้าน',
  }),
  make(8, '2026-03-12', 15, {
    channel: 'Walk-in',
    complainant: { name: 'คุณอรทัย บุญมี', contact: '092-555-0101' },
    pharmacyId: p[6].id,
    receiver: RECEIVER,
    standards: std(3),
    service: 'บริการเลิกบุหรี่',
    issue: 'จัดเก็บยาควบคุมพิเศษไม่เป็นระเบียบ',
    severity: 'ปานกลาง',
    detail: 'พบยาควบคุมพิเศษวางปะปนกับสินค้าทั่วไป',
  }),
];

export const findComplaint = (id: string) =>
  complaints.find((c) => c.id === id);
