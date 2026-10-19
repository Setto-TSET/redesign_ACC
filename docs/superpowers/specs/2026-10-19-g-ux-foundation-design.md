# G ฐาน UX: Web Interface Guidelines + animation — Design Spec

วันที่: 2026-10-19
โปรเจกต์: `acc-pharm-redesign/` · branch `feat/g-ux-foundation` (จาก `main`)
อ้างอิง: `docs/superpowers/specs/2026-10-14-redesign-design.md` (หลักการ UX ร่วม), `docs/guidelines/web-interface-guidelines.md` (Vercel Web Interface Guidelines ฉบับที่ดึงมา 2026-10-19)

## เป้าหมาย

วางฐานที่ F3–F8 ทุกหน้าจะใช้ และแก้หน้าเดิม (F0–F2) ให้ผ่าน Web Interface Guidelines พร้อม animation ระดับ "พอดี" ที่ช่วยบอกว่าเกิดอะไรขึ้นโดยไม่ทำให้งานช้าลง

## ขอบเขต

- ทำด้วย CSS ใน `src/app/globals.css` + hook เล็ก ๆ — ไม่เพิ่ม dependency (stack ของสภาฯ มีคลาส `animate-*` อยู่แล้ว)
- แก้ทุกไฟล์ใน `src/app` และ `src/components` ให้ผ่าน guidelines
- ไม่เปลี่ยน business logic, ข้อมูล หรือ flow ของ F1–F2

## 1. ระบบ animation

| จุด                         | การเคลื่อนไหว                                                                                    | เวลา  | คลาส                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ----- | -------------------------------------------------------------------------------------- |
| เนื้อหาหลักเมื่อเปลี่ยนหน้า | opacity 0→1 + translateY 6px→0                                                                   | 200ms | `animate-page` บน `<main>` ของ `AdminLayout` และ root ของหน้า public (login, register) |
| รายการ, การ์ด, แถวตาราง     | เหมือน `animate-page` เลื่อนเวลาเริ่ม `calc(var(--i) * 30ms)` จำกัด 8 รายการแรก (`--i` สูงสุด 7) | 200ms | `animate-stagger` + `style={{ '--i': Math.min(i, 7) }}`                                |
| modal                       | overlay opacity 0→1; กล่อง scale 0.96→1 + opacity                                                | 180ms | `modal-overlay`, `modal-content` (ปรับของเดิม)                                         |
| เปลี่ยน tab                 | opacity 0→1                                                                                      | 150ms | `animate-fade` บน tabpanel (ใส่ `key={tab}`)                                           |
| Stepper                     | เส้นเชื่อมเติมสี scaleX 0→1, `transform-origin: left`                                            | 250ms | ใน `Stepper.tsx`                                                                       |
| ปุ่ม                        | `:active` scale 0.98                                                                             | 100ms | `btn-primary`, `btn-secondary`, `btn-danger`                                           |
| toast                       | ของ react-hot-toast เดิม                                                                         | —     | —                                                                                      |

กฎ:

- animate เฉพาะ `transform` และ `opacity`
- easing `cubic-bezier(0.16, 1, 0.3, 1)` (ตรงกับ `modalIn` เดิม)
- `@media (prefers-reduced-motion: reduce)`: ปิด translate/scale ทั้งหมด เหลือ opacity ≤ 150ms; `:active` scale ปิด; Stepper เปลี่ยนสีทันที
- ไม่มี `transition: all` / `transition-all` ในโปรเจกต์ — ระบุ property ที่เปลี่ยนจริง (`background-color, border-color, color, box-shadow, opacity, transform`)

## 2. Focus และคีย์บอร์ด

- `:focus-visible` ring ทั่วทั้งเว็บใน `globals.css`: `outline: 2px solid var(--accent); outline-offset: 2px` สำหรับ `a, button, [role="tab"], input[type=checkbox], input[type=radio], summary`; input/textarea/select ใช้ border + `box-shadow: 0 0 0 3px var(--accent-soft)` (มีอยู่แล้วบน `:focus` — ย้ายไป `:focus-visible` ไม่ได้เพราะ input ต้องเห็นเสมอ จึงคงไว้ แต่ห้าม `outline-none` โดยไม่มีตัวแทน)
- Skip link "ข้ามไปยังเนื้อหาหลัก" เป็นลิงก์แรกใน `AdminLayout` (ซ่อนจนกว่าจะ focus) ชี้ไป `<main id="main" tabIndex={-1}>`
- ปุ่มเลือกไฟล์ (`label.btn-secondary` ที่ซ่อน `input.sr-only`) แสดง ring ด้วย `:focus-within`
- Modal (`ActionDialog`) และ drawer ของ Sidebar บนมือถือ:
  - เปิดแล้ว focus ไปที่ control แรกที่กรอกได้ (หรือปุ่มยืนยันถ้าไม่มี)
  - Tab / Shift+Tab วนอยู่ใน modal
  - ปิดแล้ว focus กลับไปที่ปุ่มที่เปิด
  - `overscroll-behavior: contain` บนกล่องที่ scroll ได้
  - Esc ปิด; คลิก overlay ปิดได้เฉพาะเมื่อไม่ได้กำลังบันทึก และ mousedown เริ่มบน overlay เอง
- Hook `useFocusTrap(ref, active)` ใน `src/lib/useFocusTrap.ts` ใช้ร่วมกัน

## 3. ฟอร์ม

- กดส่งแล้วมี error → focus ช่องแรกที่ผิด (stepper `/requests/new` ทุกขั้น, `/register`, `ActionDialog`, `PaymentsTab`, `DocsTab`) — ทำด้วย helper `focusFirstError(container)` ที่หา `[aria-invalid="true"]` ตัวแรก
- placeholder ลงท้ายด้วย `…` และแสดงตัวอย่าง (เช่น `กท.28/2565…`, `name@example.com…`)
- ช่องอีเมล, ชื่อผู้ใช้, เลขใบอนุญาต, เลขใบประกอบวิชาชีพ: `spellCheck={false}`; ทุก input มี `name` และ `autoComplete` ที่ถูก (ช่องที่ไม่ใช่ข้อมูลส่วนตัวใช้ `autoComplete="off"`)
- `select` กำหนด `background-color: var(--surface); color: var(--ink)` ใน `globals.css`
- ปุ่มส่งยังกดได้จนกว่าจะเริ่มส่ง และแสดงข้อความลงท้าย `…` ระหว่างส่ง (มีแล้ว — ตรวจให้ครบ)
- `ActionDialog`: ถ้ามีข้อความที่พิมพ์ค้างแล้วกดปิด/Esc/คลิกนอก → ถามยืนยัน "ทิ้งข้อความที่พิมพ์ไว้?" ด้วย `window.confirm`

## 4. สถานะใน URL

ใช้ `useSearchParams` + `router.replace(…, { scroll: false })` ของ Next — ไม่เพิ่ม library; ห่อส่วนที่อ่าน search params ด้วย `<Suspense>` ตามที่ Next 16 ต้องการสำหรับหน้า static

- `/requests?q=<คำค้น>&group=<all|active|need_docs|closed>` — ค่าเริ่ม `all` ไม่ใส่ใน URL
- `/requests/[id]?tab=<info|docs|payments|result|history>` — ค่าเริ่ม `info` ไม่ใส่ใน URL; ปุ่ม "แนบเอกสารเพิ่ม" ไป `?tab=docs`
- helper `useQueryState(key, defaultValue)` ใน `src/lib/useQueryState.ts`

## 5. เนื้อหา, ตัวเลข, ไอคอน

- ตัวเลขในตาราง สลิป สถิติ คะแนน: `tabular-nums`; จำนวนเงินจัดรูปแบบผ่าน `Intl.NumberFormat('th-TH')`; วันที่ผ่าน `src/lib/format.ts` (ใช้ `Intl` อยู่แล้ว)
- หัวข้อ `h1`–`h3`: `text-wrap: balance` ใน `globals.css`
- ทุก flex child ที่มีข้อความยาวมี `min-w-0`; ข้อความผู้ใช้ใส่ (ชื่อ, ที่อยู่, ข้อความ, ชื่อไฟล์) มี `break-words`
- ปุ่มที่มีแต่ไอคอนใน Header, Sidebar, modal มี `aria-label` ภาษาไทย
- ไอคอนตกแต่งทุกตัวมี `aria-hidden="true"`
- `…` แทน `...` และข้อความ loading ลงท้าย `…`

## 6. มือถือและ meta

- `html { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }` (มี hover/active state ทดแทนอยู่แล้ว)
- `export const viewport = { themeColor: '#fafaf9' }` ใน `src/app/layout.tsx` (ตรงกับ `--bg`)
- ไม่ปิดการซูม (`user-scalable` / `maximum-scale` ห้ามใช้)

## ไม่ทำ (ไม่ตรงกับระบบนี้)

- Title Case (ภาษาไทย), รูปภาพ/วิดีโอ (ไม่มี), virtualization (ยังไม่มีรายการเกิน 50 แถว — ทบทวนใน F6), `beforeunload` ทั้งหน้า (stepper บันทึกร่างอัตโนมัติ), dark mode (ระบบเดิมและ Conference Backoffice ไม่มี)

## Definition of Done

1. `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run format:check`, `npm run build` ผ่าน
2. `grep -rn "transition-all\|transition: all\|outline-none" src` ไม่เจอ (ยกเว้น `outline-none` ที่มีตัวแทนในบรรทัดเดียวกันหรือกฎ `:focus-visible` ครอบ)
3. ตรวจทุกไฟล์ใน `src/app` และ `src/components` ตามรูปแบบผลลัพธ์ของ skill `web-design-guidelines` → ไม่มีข้อค้าง (ยกเว้นข้อใน "ไม่ทำ")
4. เดินทั้งเส้นแบบ F2 ด้วยคีย์บอร์ดอย่างเดียว (Tab / Shift+Tab / Enter / Space / Esc) ได้ครบ และเห็น focus ring ตลอด
5. เปิด DevTools emulate `prefers-reduced-motion: reduce` → ไม่มีอะไรเลื่อนหรือขยาย
6. `/requests?group=closed&q=REN` เปิดตรงแล้วตัวกรองถูก; `/requests/<id>?tab=history` เปิดตรงที่ tab ประวัติ; กดย้อนกลับไม่หลุดตัวกรอง
7. 375px และ 1280px ไม่มี scroll แนวนอน
8. Push แล้ว Vercel สร้าง preview ของ branch นี้ได้
