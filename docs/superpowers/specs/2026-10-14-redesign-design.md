# Acc-Pharm Redesign — Design Spec

วันที่: 2026-10-14
โปรเจกต์: `acc-pharm-redesign/`

## เป้าหมาย

Redesign ระบบรับรองร้านยาคุณภาพ (Acc-Pharm เดิม: ASP.NET WebForms) ให้ใช้งานง่ายขึ้นสำหรับทุก role
พร้อมเปลี่ยน frontend stack ไปตามระบบของสภาฯ

## ขอบเขต

- Frontend อย่างเดียว ข้อมูลทั้งหมดเป็น mock ไม่มี backend และไม่กำหนดสัญญา API ในรอบนี้
- คง business flow เดิมทั้งหมด (status, ลำดับ, role ตาม AdminManual) ปรับเฉพาะหน้าจอและวิธีเข้าถึง
- ให้ความสำคัญทุก role เท่ากัน: ร้านยา, ผู้ตรวจประเมิน, admin, สสจ., superadmin

## ปัญหาการใช้งานของระบบเดิม (จากโค้ดและคู่มือ)

1. `RequestDetail.aspx` เป็นหน้ายาวประมาณ 8 ส่วน มีปุ่มบันทึกแยกกันหลายปุ่ม และเปลี่ยน status ผ่าน dropdown อิสระ admin ต้องจำเองว่าขั้นถัดไปคืออะไร
2. ฟอร์มประเมิน GPP (`AsmGPP.aspx`, `GPP.aspx`) ยาวกว่า 2,000 บรรทัด มีราว 40 ข้อ ทุกคลิกเกิด postback (`AutoPostBack` 47 จุด) ไม่มีความคืบหน้า คะแนนรวมสด หรือบันทึกร่าง
3. ฟอร์มยื่นคำขอใช้ checkbox 8 ตัวสำหรับประเภทคำขอ เลือกชุดที่ขัดกันเองได้ และไม่บอกว่าต้องใช้เอกสารอะไร
4. ภาษาปนกัน เช่น placeholder "First Name", ปุ่ม "Save", "Work Flow Overview", "Remark/Status"
5. มีหน้าซ้ำหรือค้าง: Home1/Home2/"Home - Copy", Dashboard2/3, Maps2, PrintCert2
6. `RequestList.aspx` กรองได้เพียง 2 ช่อง และไม่มีมุมมอง "งานที่รอฉัน"

## Stack

ใช้ชุดเดียวกับ Conference Backoffice (ตั้งค่าไว้แล้วใน `acc-pharm-redesign`):

- Next 16.1.1, React 19.2.3, Tailwind 4 ใช้ component class ใน `src/app/globals.css` (`btn-primary`, `card`, `input-field`, `data-table`, `badge`, `stat-card`, `modal`)
- @tabler/icons-react, react-hot-toast, ฟอนต์ Outfit + Noto Sans Thai, accent `#0E6B45`
- ทุกหน้าดึงข้อมูลผ่าน `src/lib/api.ts` เท่านั้น ไม่ import `src/mock/` ตรง ตอนต่อ backend จะแก้แค่ไฟล์นี้
- เพิ่ม dependency เฉพาะเมื่อ flow ต้องใช้จริง: recharts และ xlsx ใน F7, ไลบรารีแผนที่ใน F6

## หลักการ UX ร่วม

ทุก flow ต้องทำตาม 6 ข้อนี้:

1. **หน้าแรกคือ "งานที่รอคุณ"** แต่ละ role เห็นรายการที่ต้องลงมือก่อน (ร้านยา: เอกสารที่ถูกขอแก้ไข, admin: คำขอรอตรวจ/รอ assign, ผู้ตรวจ: นัดประเมินสัปดาห์นี้) แล้วตามด้วยตัวเลขสถิติ
2. **ปุ่มขั้นถัดไปแทน dropdown** ระบบแสดงเฉพาะ action ที่ทำได้จาก status ปัจจุบันและ role จึงข้ามขั้นไม่ได้ ใช้ status และลำดับเดิม
3. **หน้ารายละเอียดเป็น tab + timeline** ส่วนบนเป็นสรุป, status badge และปุ่ม action ส่วนล่างเป็น tab: ข้อมูล, เอกสาร, การชำระเงิน, ผลประเมิน, ประวัติ
4. **ฟอร์มยาวเป็น stepper** มีแถบความคืบหน้า บันทึกร่างอัตโนมัติ (sessionStorage) และตรวจความถูกต้องทีละขั้น
5. **ภาษาไทยทั้งหมด** ทั้ง label, ปุ่ม, placeholder แสดง error ใต้ช่อง แจ้งสำเร็จด้วย toast และ action ที่ย้อนกลับไม่ได้ต้องมี modal ยืนยัน
6. **หน้ารายการรูปแบบเดียวกัน** มีช่องค้นหา, chip กรอง status, `data-table` บน desktop และ card บนมือถือ

## Flow และลำดับการทำ

แต่ละ flow คือ spec/plan ย่อย 1 ชุด ทำเสร็จแล้วให้ทีมรีวิวก่อนเริ่ม flow ถัดไป

| # | Flow | Route ใหม่ | แทนหน้าเดิม | จุดที่ทำให้ใช้ง่ายขึ้น |
|---|---|---|---|---|
| F0 | โครงหลัก (เสร็จแล้ว) | `/login`, layout, เมนู, guard | Default, Home*, Dashboard* | — |
| F1 | ยื่นคำขอ (ร้านยา) | `/requests/new`, `/requests`, `/my-pharmacy` | Request, RequestList, Register*, DrugStore* | เลือกประเภทคำขอแบบ radio พร้อมคำอธิบาย แสดง checklist เอกสารตามประเภท ฟอร์มเป็น stepper 4 ขั้น: ประเภท → ผู้ยื่น → เอกสาร → คำรับรอง |
| F2 | ตรวจคำขอและ assign (admin) | `/requests/[id]` | RequestDetail, Allocate*, AsmTimeManage | tab + timeline, ปุ่มขั้นถัดไปตาม status, เลือก template ตอบกลับในหน้าเดียว |
| F3 | ประเมิน GPP (ผู้ตรวจ) | `/schedule`, `/requests/[id]/assess` | AsmCalendar, AsmGPP, GPP, AsmTravel* | แบ่งตามหมวด, คะแนนรวมสด, "ไม่มี" ไม่ต้อง postback, บันทึกร่าง, ใช้บนแท็บเล็ตได้ |
| F4 | ออกใบรับรอง | `/certificates`, ส่วนท้าย `/requests/[id]` | PrintCert, GPPClose | ปุ่ม "+3 ปี" คำนวณวันหมดอายุ, ดูตัวอย่างใบรับรองก่อนพิมพ์ |
| F5 | Post-audit และข้อร้องเรียน | `/post-audit`, `/complaints` | PostAudit, PostList, Complain* | ใช้ฟอร์มประเมินจาก F3 และรายการแบบ F2 |
| F6 | ร้านยาและแผนที่ (admin, สสจ.) | `/pharmacies`, `/map`, `/gpp` | Location*, PharmacyList/Detail, Maps, PharmacyGPP* | รายการมาตรฐาน กรองตามจังหวัด หน้ารายละเอียดเป็น tab |
| F7 | รายงาน | `/reports` | Report* (10 หน้า) | หน้าเดียว เลือกประเภทรายงานและช่วงวันที่ กราฟ recharts และ export xlsx |
| F8 | เนื้อหาและงานผู้ดูแล | `/news`, `/documents`, `/users`, `/master-data`, `/templates`, `/settings`, `/allocation`, `/profile` | News*, Download*, Users, TemplateText, Setting, Knowledge, Manual | รายการมาตรฐานคู่กับ modal เพิ่มหรือแก้ไข |

ลำดับ: F1 → F2 → F3 → F4 ก่อน เพื่อ demo ได้ครบตั้งแต่ยื่นคำขอจนได้ใบรับรอง จากนั้น F5–F8 สลับลำดับได้

Component ที่ใช้ซ้ำ (StatusBadge, ActionBar, Stepper, Timeline, ListPage) สร้างใน flow แรกที่ต้องใช้ ไม่สร้างล่วงหน้า

### Mock data

- ดึงจาก `acc-pharm-poc/src/data/index.ts` เฉพาะส่วนที่ flow นั้นใช้ แล้วย้ายเข้า `src/mock/`
- status ที่เปลี่ยนระหว่าง demo เก็บใน sessionStorage ผ่าน `src/lib/api.ts` จึงสลับ role แล้วเห็นการเปลี่ยนสถานะต่อเนื่องกัน

### ไม่ทำในรอบนี้

- Import และ PharmacyImport (ต้องมี backend)
- FDA SOAP lookup ทำเป็นปุ่ม mock "ดึงข้อมูลจาก อย." ที่คืนข้อมูลตัวอย่าง
- ForgotPassword และ ChangePassword ทำเฉพาะหน้าตา ไม่มี logic
- หน้าซ้ำหรือค้าง (Home1/2, Dashboard2/3, Maps2, PrintCert2, ไฟล์ "- Copy") และหน้าที่แทนได้ด้วย toast หรือ empty state (ResultPage, RegisterComplete)

## Definition of Done (ต่อ flow)

1. `npm run lint`, `npx tsc --noEmit` และ `npm run build` ผ่าน
2. เดินเส้นทางหลักของ flow จนจบในเบราว์เซอร์ ด้วยบัญชีทดลองของทุก role ที่เกี่ยวข้อง (สลับผ่าน "Demo role")
3. ตรวจที่ความกว้าง 375px และ 1280px ไม่มี scroll แนวนอน (F3 ตรวจที่ 768px เพิ่ม)
4. ผ่าน checklist หลักการ UX ร่วมทั้ง 6 ข้อ
5. route ของ flow ไม่ไปตกที่ `src/app/[...slug]/page.tsx` อีก และเมื่อครบทุก route ให้ลบไฟล์นี้
6. อัปเดตบรรทัดความคืบหน้าในเอกสาร "แผน PoC Acc-Pharm (Frontend)" ของทีม

## การทดสอบ

- logic ที่มีเงื่อนไขมีเทสต์ 1 ไฟล์ต่อเรื่อง ใช้ `node --test` ไม่เพิ่ม test framework:
  - F2: ตาราง status + role → action ที่อนุญาต
  - F3: การคำนวณคะแนน GPP
  - F4: การคำนวณวันหมดอายุ +3 ปี
- หน้าที่แสดงผลอย่างเดียวตรวจในเบราว์เซอร์ตาม DoD ข้อ 2–3

## การรีวิว

หลังจบแต่ละ flow ทีมรีวิวผ่าน dev server (`npm --prefix acc-pharm-redesign run dev`, port 3001)
ถ้าทีมตัดสินข้อ 6 ในเอกสารแผนให้ใช้ Netlify preview ก็ใช้ preview แทน

## ความเสี่ยง

- ฟอร์ม GPP มีราว 40 ข้อ: ดึงข้อคำถามจาก `AsmGPP.aspx` มาเป็นข้อมูล (array ของหมวด/ข้อ/ตัวเลือกคะแนน) แล้ว render จาก array ไม่เขียน JSX ซ้ำทีละข้อ
- ลำดับ status อ้างอิงจาก AdminManual ถ้าไม่ตรงกับ stored procedure ของระบบเดิม ทีมต้องยืนยันก่อนเริ่ม F2
