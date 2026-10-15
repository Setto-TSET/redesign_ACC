# F2 ตรวจคำขอและมอบหมายผู้ตรวจ — Design Spec

วันที่: 2026-10-15
โปรเจกต์: `acc-pharm-redesign/` · branch `feat/f2-request-review` (แตกจาก `feat/f1-submit-request`)
อ้างอิง: `docs/superpowers/specs/2026-10-14-redesign-design.md` (หลักการ UX ร่วม, Definition of Done)

## เป้าหมาย

หน้า `/requests/[id]` หน้าเดียวที่แสดงต่างกันตาม role แทน `RequestDetail.aspx`
admin ทำงานตรวจคำขอทั้งหมดจากปุ่มขั้นถัดไป ร้านยาติดตามสถานะและส่งเอกสารเพิ่มได้ ผู้ตรวจดูได้อย่างเดียว

## ขอบเขต

- Frontend + mock เหมือน F1 ข้อมูลผ่าน `src/lib/api.ts` เท่านั้น
- คง business flow เดิม ใช้ 9 สถานะเดิมจาก F1 (`RequestStatus`)
- ไม่ทำ: ลบคำขอ, เปลี่ยนประเภทคำขอ, แก้ข้อมูลผู้ยื่น, ช่องผลรับรอง/เลขใบรับรอง/+3 ปี (F4), แบบประเมิน GPP (F3), ส่งอีเมล/LINE จริง

## ที่มาของสถานะ

ระบบเดิมเก็บสถานะใน DB (`AssessmentStatus`: ValueCode, Descriptions) ซึ่งไม่อยู่ในโค้ด จาก `RequestDetail.aspx.vb` และ AdminManual รู้เพียง:

- `0` ยกเลิก · `10–55` กำลังดำเนินการ · `60–80` ผ่าน
- ร้านยายกเลิกเองได้เมื่อ status < 30 (ก่อนมอบหมายผู้ตรวจ)
- admin เลือก status ใดก็ได้จาก dropdown ในส่วน "ส่งข้อความตอบกลับ" และ "บันทึกผลการตรวจประเมิน"
- template ข้อความ 4 อัน: ตรวจสอบเอกสาร, ขอเอกสารเพิ่ม, รอยื่นคณะกรรมการ, ผ่านคณะกรรมการ
- มอบหมายผู้ตรวจได้หลายคน แล้วกด "ส่งแจ้งผู้ตรวจประเมิน"

ตารางด้านล่างจึงเป็นตารางชั่วคราว อยู่ใน `src/lib/requestRules.ts` ที่เดียว พร้อม comment ให้เทียบกับ `AssessmentStatus` ก่อนต่อ backend

## ตาราง status และ action

ทุก action เพิ่มรายการลง timeline (`messages`): เวลา, ผู้ทำ, ข้อความ, สถานะใหม่

| สถานะปัจจุบัน | Action                               | ใครทำ   | สถานะใหม่    | input ที่ต้องมี          |
| ------------- | ------------------------------------ | ------- | ------------ | ------------------------ |
| `submitted`   | รับตรวจเอกสาร (`start_review`)       | admin   | `doc_review` | —                        |
| `doc_review`  | ขอเอกสารเพิ่มเติม (`request_docs`)   | admin   | `need_docs`  | ข้อความ                  |
| `doc_review`  | มอบหมายผู้ตรวจ (`assign`)            | admin   | `assigned`   | ผู้ตรวจ ≥ 1 คน           |
| `need_docs`   | ส่งเอกสารเพิ่มแล้ว (`resubmit_docs`) | ร้านยา  | `doc_review` | ไฟล์ใหม่ ≥ 1 ไฟล์        |
| `assigned`    | บันทึกผลประเมิน                      | ผู้ตรวจ | `assessed`   | **F3** — F2 ไม่มีปุ่มนี้ |
| `assessed`    | ส่งคณะกรรมการ (`to_committee`)       | admin   | `committee`  | —                        |
| `committee`   | ผ่านการรับรอง (`approve`)            | admin   | `approved`   | ยืนยันใน modal           |
| `committee`   | ไม่ผ่าน (`reject`)                   | admin   | `rejected`   | เหตุผล + ยืนยันใน modal  |

Action ที่ทำได้ทุกสถานะที่ยังไม่จบ (`isAlive`):

| Action                  | ใครทำ                                                                                     | ผล              | input                   |
| ----------------------- | ----------------------------------------------------------------------------------------- | --------------- | ----------------------- |
| ตอบกลับร้านยา (`reply`) | admin                                                                                     | สถานะไม่เปลี่ยน | ข้อความ                 |
| ยกเลิกคำขอ (`cancel`)   | ร้านยา เมื่อสถานะเป็น `submitted` / `doc_review` / `need_docs`; admin ทุกสถานะที่ยังไม่จบ | `cancelled`     | เหตุผล + ยืนยันใน modal |

กรณีพิเศษ:

| Action                        | ใครทำ                                          | ผล                                      | input                                                        |
| ----------------------------- | ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| เปลี่ยนสถานะอื่น (`override`) | admin, superadmin — ทุกสถานะ รวมสถานะที่จบแล้ว | สถานะที่เลือก (ต้องไม่ใช่สถานะปัจจุบัน) | สถานะ + เหตุผล + ยืนยันใน modal; timeline ติดป้าย "แก้สถานะ" |

- `superadmin` ทำทุกอย่างที่ `admin` ทำได้
- `assessor` ไม่มี action ใน F2
- `ppho` ไม่มีสิทธิ์เข้า `/requests` (ตาม `rolePageAccess` ของ F0)

## Layout

**ส่วนหัว (card)**

- เลขที่คำขอ + `StatusBadge`, ชื่อร้าน · จังหวัด, ประเภทคำขอ, วันที่ยื่น
- แถบความคืบหน้า 6 ขั้น ใช้ `Stepper` จาก F1: รับคำขอ → ตรวจเอกสาร → มอบหมาย → ประเมิน → คณะกรรมการ → ผล (สถานะ `need_docs` นับเป็นขั้น "ตรวจเอกสาร") ถ้าสถานะเป็น `cancelled` หรือ `rejected` แสดงแถบสีแดงพร้อมเหตุผลล่าสุดแทน
- ActionBar: ปุ่มหลักจาก `actionsFor` เป็น `btn-primary`, ปุ่มรอง (ตอบกลับ, ยกเลิก, เปลี่ยนสถานะอื่น) เป็น `btn-secondary`; มือถือเรียงเต็มความกว้าง
- ร้านยาที่สถานะเป็น `need_docs`: แถบเหลืองแสดงข้อความล่าสุดจาก สรร. + ปุ่มไป tab เอกสาร

**Tab** (มือถือ: แถบ tab เลื่อนแนวนอนเฉพาะตัวแถบ)

1. **ข้อมูล** — ผู้ยื่น + ความเกี่ยวข้อง, ประเภท (+ ตัวเลือกย่อยประเภท 5), ข้อมูลร้าน, ผู้ตรวจที่ได้รับมอบหมาย
2. **เอกสาร (n)** — รายการไฟล์; ร้านยาแนบไฟล์เพิ่มได้เมื่อสถานะ `need_docs` แล้วกด "ส่งเอกสารเพิ่มแล้ว"
3. **การชำระเงิน** — รายการสลิป (จำนวนเงิน, ชื่อไฟล์, วันที่); ร้านยาเพิ่มได้เมื่อสถานะเป็น `submitted` / `doc_review` / `need_docs`
4. **ผลประเมิน** — คะแนน GPP ถ้ามี (`gppScore`), ถ้าไม่มีแสดง "ยังไม่มีผลประเมิน"
5. **ประวัติ (n)** — timeline ใหม่สุดก่อน: เวลา, ผู้ทำ, ข้อความ, badge สถานะ, ป้าย "แก้สถานะ" ถ้า `override`

**ActionDialog** — modal ตัวเดียว แสดงช่องตาม action

- `reply`, `request_docs`: chip template 4 อันจากระบบเดิม กดแล้วเติมลงช่องข้อความ แก้ต่อได้
- `assign`: checkbox รายชื่อผู้ตรวจ (mock 3 คน)
- `cancel`, `reject`, `override`: ช่องเหตุผล (บังคับ); `override` มี select สถานะ
- `approve`, `start_review`, `to_committee`: ยืนยันอย่างเดียว (`start_review`, `to_committee` ไม่ต้องเปิด modal — กดแล้วทำเลย พร้อม toast)
- error ใต้ช่อง, สำเร็จแจ้งด้วย toast แล้วโหลดคำขอใหม่

## ข้อมูลและ API

`src/types/api.ts`

- `AccRequest` เพิ่ม `assessorIds: number[]`, `payments: Payment[]`, `gppScore?: number`
- `Payment { amount: number; fileName: string; paidAt: string }`
- `RequestMessage` เพิ่ม `override?: boolean`
- `Assessor { id: number; name: string }`

`src/lib/requestRules.ts` (pure, มีเทสต์)

- `type RequestAction = 'start_review' | 'request_docs' | 'assign' | 'resubmit_docs' | 'to_committee' | 'approve' | 'reject' | 'reply' | 'cancel' | 'override'`
- `actionsFor(status, role): RequestAction[]`
- `applyAction(req, action, input, actor, now): { request: AccRequest } | { error: string }` — ไม่แก้ `req` เดิม คืนข้อมูลชุดใหม่
- `input`: `{ message?: string; assessorIds?: number[]; newDocs?: RequestDoc[]; status?: RequestStatus }`
- `actor`: `{ name: string; role: UserRole }`

`src/lib/format.ts` (ใหม่, ย้ายของซ้ำจาก F1)

- `typeLabel(ids: number[]): string` — ข้าม id ที่ไม่รู้จัก ไม่มีช่องว่างโผล่
- `formatDate(iso: string): string`, `formatDateTime(iso: string): string` (th-TH)
- แก้ `/requests`, `/my-pharmacy`, `PharmacyHome`, `steps.tsx` ให้ใช้ helper ชุดนี้

`src/lib/api.ts`

- `requests.get(id, user): Promise<AccRequest | null>` — ร้านยาเห็นเฉพาะร้านตัวเอง, ผู้ตรวจเห็นเฉพาะคำขอที่มี id ตัวเองใน `assessorIds`; ไม่มีสิทธิ์ = `null` (หน้าแสดง "ไม่พบคำขอ" เหมือนไม่มี id)
- `requests.act(id, action, input, user): Promise<ActionResult>` — เรียก `applyAction` แล้วบันทึกด้วย `map` + spread ไม่ mutate seed; คืน `{ error, field }` (ข้อความไทย + ช่องที่ผิด) ให้หน้าแสดง error ใต้ช่อง
- `requests.addPayment(id, payment, user): Promise<ActionResult>` — เฉพาะร้านยาเจ้าของคำขอ และสถานะ `submitted` / `doc_review` / `need_docs`
- `assessors.list(): Promise<Assessor[]>`

`src/mock/index.ts`

- `assessors`: 3 คน (id 2 = ภญ.วรรณา ตรวจไว ตรงกับบัญชี `assessor01` + อีก 2 คน id 6, 7)
- seed requests เพิ่ม `assessorIds`, `payments` ให้ครบ; คำขอ `r3` (committee) มี `assessorIds: [2]` และ `gppScore`

## Definition of Done

ใช้ 6 ข้อจาก spec หลัก และเพิ่ม:

**เทสต์ (`node --test`)**

- `actionsFor`: ทุกสถานะ × ทุก role ตรงตาราง — ร้านยายกเลิกได้ก่อน `assigned` แต่ไม่ได้หลังจากนั้น, ผู้ตรวจได้ `[]`, `override` มีเฉพาะ admin/superadmin
- `applyAction`: เปลี่ยนสถานะ + ต่อ timeline ถูก; action ที่ role ไม่มีสิทธิ์หรือ input ไม่ครบ (ไม่มีผู้ตรวจ/เหตุผล/ไฟล์ใหม่/override เป็นสถานะเดิม) คืน error และ `req` เดิมไม่เปลี่ยน
- `typeLabel` กับ id ที่ไม่รู้จัก

**เดินทั้งเส้นในเบราว์เซอร์** (แท็บเดียว สลับ role ด้วย Demo role)
ร้านยายื่นคำขอ → admin รับตรวจเอกสาร → ขอเอกสารเพิ่ม (ใช้ template) → ร้านยาเห็นแถบเหลือง แนบไฟล์ ส่งเอกสารเพิ่ม → admin มอบหมายผู้ตรวจ 2 คน → ผู้ตรวจเปิดได้แบบดูอย่างเดียว เปิดคำขอที่ไม่ได้รับมอบหมายไม่ได้ → admin เปลี่ยนสถานะอื่นเป็น `assessed` (แทน F3) → ส่งคณะกรรมการ → ผ่านการรับรอง

**กรณีอื่น**

- ร้านยาพิมพ์ URL คำขอของร้านอื่น → "ไม่พบคำขอ"
- ยกเลิก / ไม่ผ่านโดยไม่ใส่เหตุผล → error ใต้ช่อง
- timeline ครบทุกขั้น และรายการ override มีป้าย "แก้สถานะ"
- 375px และ 1280px ไม่มี scroll แนวนอน ทั้งตอนเปิด modal และแถบ tab
- `/requests` แสดงสถานะใหม่; หน้าแรกร้านยาขึ้นการ์ด "ส่งเอกสารเพิ่มเติม" เมื่อสถานะ `need_docs`
- route `/requests/[id]` ไม่ตกที่ `src/app/[...slug]/page.tsx` อีก

## ความเสี่ยง

- ตารางสถานะเป็นของชั่วคราวจนกว่า สรร. ยืนยันกับ `AssessmentStatus` — แก้ที่ `requestRules.ts` จุดเดียว
- ระหว่างยังไม่มี F3 สถานะจะหยุดที่ `assigned`; demo ใช้ `override` เลื่อนไป `assessed`
