# BREATHE — Feature Strategy & Action Plan

> Research-based roadmap: ควรพัฒนาฟีเจอร์อะไร, ตัดอะไร, และลงมือทำอย่างไร
> อัปเดต: 2026-06-23 · สถานะ: pre-PMF, ผู้ใช้ยังน้อย, TH-first PWA

---

## 1. สรุปผู้บริหาร (TL;DR)

แอปนี้มี **core loop ที่แข็งแรง** — นั่งสมาธิ → สะสมนาที → ต้นไม้เติบโต (24 ระดับ) → streak → dashboard — แต่ถูกถ่วงด้วย **social layer ที่บวมเกินตัว** (community feed, leaderboard, chat 1:1, nudge, notifications) ซึ่งทุกตัว **ต้องการ network effect ที่แอปยังไม่มี** และ **ฟีเจอร์ตายสนิท 1 ตัว (Sleep)** ที่ไม่มีลิงก์จาก navigation เลย

**คำตัดสิน:** หยุดสร้างฟีเจอร์สังคมเพิ่ม, ตัด/ซ่อนของที่ยังไม่มีคนใช้, แล้วทุ่มลงลึกที่ **core meditation experience + retention loop** ให้คนกลับมาใช้คนเดียวได้จริงก่อน แล้วค่อยเปิด social เมื่อมี user density

**3 การเคลื่อนไหวหลัก:**
1. **CUT/HIDE** — ซ่อน Sleep, Leaderboard, Nudge ออกจากเส้นทางหลัก (ลด surface area ~30%)
2. **FIX** — แก้ navigation ให้ Insights/History เข้าถึงง่าย, ลบ dead code
3. **BUILD** — Guided breathing/meditation content + Daily reminder ที่ทำงานจริง + Onboarding (3 ตัวนี้ขับ retention)

---

## 2. Feature Inventory — สถานะจริง

| Feature | LOC | เข้าถึงจาก | คุณค่าต่อ core | ต้นทุนดูแล | คำตัดสิน |
|---|---|---|---|---|---|
| **Timer / Meditate** | 589 | Bottom nav | 🟢 หัวใจ | กลาง | **KEEP + ลงทุน** |
| **Tree growth** (home) | 1159 | Bottom nav | 🟢 หัวใจ (motivation) | กลาง | **KEEP** |
| **Insights / Mood Journal** | 558 | ลิงก์จาก home | 🟢 หนุน retention | กลาง | **KEEP** (ใหม่ล่าสุด) |
| **History** | 303 | ลิงก์จาก home | 🟡 ดี | ต่ำ | **KEEP** |
| **Achievements / Streak** | — | home | 🟢 หนุน retention | ต่ำ | **KEEP** |
| **Community check-in** | 1048 | Bottom nav | 🟡 ต้อง network | **สูง** | **DEFER** (ซ่อนจนมี users) |
| **Leaderboard** | 159 | Bottom nav | 🔴 ขัด ethos สมาธิ | กลาง | **CUT/HIDE** |
| **Chat 1:1** | 307 | Bottom nav | 🔴 ต้อง network | **สูง** (realtime, moderation) | **DEFER** |
| **Nudge** | 106 | Community | 🔴 ต้อง network | กลาง | **CUT** |
| **Notifications (bell)** | — | layout | 🟡 ดีถ้ามี content | กลาง | **KEEP โครง, เปลี่ยน use** |
| **Sleep tracking** | 552 | ❌ **ไม่มีลิงก์** | 🔴 ฟีเจอร์ตาย | สูง | **CUT** (หรือ archive) |
| **Profile (others)** | 200 | Community | 🔴 ต้อง network | ต่ำ | **DEFER** |
| **Settings / Profile** | 252 | nav | 🟢 จำเป็น | ต่ำ | **KEEP** |
| **Log (manual entry)** | 276 | orphaned? | 🟡 | ต่ำ | **ตรวจสอบ/รวมเข้า History** |

**ตัวเลขที่บอกอะไร:** ~2,400 LOC (≈33% ของ route code) อยู่ในฟีเจอร์สังคมที่ยังไม่มีคนใช้พอจะทำงาน + 552 LOC อยู่ในฟีเจอร์ที่เข้าไม่ถึงเลย

---

## 3. หลักการตัดสินใจ (ทำไมถึงตัดแบบนี้)

**(1) Network-effect trap.** Leaderboard/Chat/Community/Nudge ให้คุณค่าเป็นสัดส่วนกับจำนวนผู้ใช้ที่ active พร้อมกัน. ที่ pre-PMF สิ่งเหล่านี้แสดงผลเป็น "ห้องว่าง" — leaderboard ที่มีแต่ test users, chat ที่ไม่มีใครตอบ — ซึ่ง **ทำลายความน่าเชื่อถือ** มากกว่าช่วย. เก็บโค้ดไว้ แต่ซ่อนจน DAU มากพอ

**(2) Competition ขัดกับ meditation.** การจัดอันดับนาทีสมาธิเปลี่ยน intrinsic motivation (ทำเพื่อใจตัวเอง) เป็น extrinsic (ทำเพื่อชนะ) — งานวิจัย wellbeing ชี้ว่าบั่นทอน habit ระยะยาว. Tree growth เป็น progression ส่วนตัวที่ดีกว่ามากอยู่แล้ว

**(3) Core loop ต้องชนะก่อน.** คนต้องอยากกลับมานั่งสมาธิ "คนเดียว" ทุกวันให้ได้ก่อน. Retention ของ solo loop คือ leading indicator ของ PMF. Social เป็น amplifier ของ PMF ไม่ใช่ตัวสร้าง

**(4) Surface area = ต้นทุนซ่อนเร้น.** ทุกฟีเจอร์ที่ค้างเติม bug, i18n, edge case, และทำให้ navigation รก. ตัด = เร็วขึ้น + โฟกัสขึ้น

---

## 4. KEEP / CUT / DEFER — ชัด ๆ

### ✅ KEEP & ลงทุนต่อ (the core)
- **Timer** — เพิ่ม guided content (ดูข้อ 5.1)
- **Tree growth + Streak + Achievements** — engine ของ motivation
- **Insights / Mood Journal** — ปิด loop "นั่งแล้วรู้สึกดีขึ้นจริง"
- **History, Settings** — สนับสนุน

### 🟡 DEFER (ซ่อน, เก็บโค้ด, เปิดเมื่อ DAU > เกณฑ์)
- **Community check-in** — เปิดเมื่อมี ≥ 50 weekly-active users
- **Chat 1:1** — เปิดทีหลัง + ต้องมี moderation/report ก่อน
- **Profile (others)** — ผูกกับ Community

### 🔴 CUT (ลบ/archive ออกจาก production path)
- **Sleep tracking** — ตายอยู่แล้ว (เข้าไม่ถึง). archive เป็น branch, ลบออกจาก build
- **Leaderboard** — ขัด ethos. ลบจาก bottom nav
- **Nudge** — poke feature ที่ไม่จำเป็น

---

## 5. ควรพัฒนาอะไรใหม่ (จัดลำดับด้วย impact × ความง่าย)

### 5.1 🥇 Guided Breathing & Meditation Content — *content moat*
ตอนนี้ timer มีแค่ ambient sound + bell — ไม่มี "เนื้อหา" ให้ทำตาม ซึ่งเป็นเหตุผลอันดับ 1 ที่คนเปิดแอป meditation
- **Breathing patterns** แบบมี visual guide: Box (4-4-4-4), 4-7-8, Calm (4-6) — โค้ด launch screen มี "หายใจเข้า/กลั้น/ออก" อยู่แล้ว ต่อยอดได้ทันที
- **Guided sessions สั้น ๆ** 3–10 นาที (เริ่มจากบทพูด TH 3–5 บท: คลายเครียด, ก่อนนอน, โฟกัส)
- **Impact: สูงมาก** (retention + เหตุผลให้กลับมา) · **Effort: กลาง**

### 5.2 🥈 Working Daily Reminder + Notifications ที่มีประโยชน์
มี `DailyReminder.svelte` + `notifications` table + realtime อยู่แล้ว แต่ notification ปัจจุบันใช้กับ social (message/nudge) ซึ่งกำลังจะ defer
- เปลี่ยน notification engine ไปขับ **"ได้เวลานั่งสมาธิแล้ว"** + **"streak กำลังจะหลุด!"** (PWA push / local reminder)
- **Impact: สูง** (retention driver อันดับต้น ๆ ของ habit app) · **Effort: กลาง**

### 5.3 🥉 First-run Onboarding (3 หน้าจอ)
ยังไม่มี onboarding — ผู้ใช้ใหม่เจอ dashboard เปล่า
- เลือกเป้าหมาย (คลายเครียด/นอนหลับ/โฟกัส) → ตั้ง daily goal → นั่งสมาธิครั้งแรก 1 นาทีทันที (aha moment)
- **Impact: สูง** (activation rate) · **Effort: ต่ำ-กลาง**

### 5.4 Quick wins (ต่ำ effort, เก็บได้เลย)
- รวม **Log** เข้ากับ History (ลดความซ้ำซ้อน)
- เพิ่ม **"นั่งต่อ"/resume** จากหน้า home ให้ปุ่มเดียวเริ่มได้เลย
- **Empty states** ที่ดีในทุกหน้า (แทนที่จะโชว์ลิสต์ว่าง)

---

## 6. แผนลงมือ (3 เฟส)

### Phase 0 — Declutter (1–2 วัน) · ทำก่อน ลด surface area
**สถานะ: ทำเสร็จแล้ว (ผ่าน `svelte-check` 0 error)** — ใช้ feature flag เป็นกลไกหลัก กลับด้านได้ทันทีโดยพลิกค่าใน `src/lib/features.ts`
- [x] สร้าง `src/lib/features.ts` — flag `ENABLE_SOCIAL=false`, `ENABLE_SLEEP=false`
- [x] Central route guard ใน `src/hooks.server.ts` — page ที่ปิดอยู่ → redirect `/`, API → 404 (ไม่ต้องแก้ทุก load)
- [x] เอา Leaderboard / Community / Chat ออกจาก bottom nav (`+layout.svelte`) เมื่อ social ปิด
- [x] เพิ่ม **Insights** เป็น tab หลักถาวร + **History** เข้าแทนช่องที่ว่างเมื่อ social ปิด (i18n: `nav.insights`, `nav.history`)
- [x] ปิด notification bell + unread popup + realtime subscription (เป็น social ล้วน) เมื่อ social ปิด
- [x] Sleep: gate ด้วย `ENABLE_SLEEP` (เดิม unreachable อยู่แล้ว) — โค้ดยังอยู่ ไม่ลบ
- [x] Nudge: gate ผ่าน `SOCIAL_API_PREFIXES` (API คืน 404 เมื่อ social ปิด)
- [x] แก้ลิงก์ค้าง "Back to Community" ใน settings → "Back to Home"
- [ ] (ค้าง — ต้องผู้ใช้อนุมัติลบ) ลบไฟล์ dev ที่ค้างใน working dir: `test-emoji/`, `TEST_CHECKIN.js`, `diagnose-checkin.mjs`, `ngrok_*.log`, `client_secret_*.json`, `test-*.{ts,mjs}` — auto-mode บล็อก `rm` ของไฟล์ untracked ที่ผมตั้งเอง

> 📌 **`/log` ไม่ใช่ orphan:** ตรวจแล้ว timer ลิงก์ไป `/log?duration=...&type=...` เป็นหน้าบันทึกหลังจบเซสชัน = core logging flow **เก็บไว้ ห้ามรวม/ลบ** (แก้สมมติฐานเดิมในแผน)

> ✅ **Security check (ผ่าน):** ตรวจแล้ว — `.env` และ `client_secret_*.json` ถูก `.gitignore` ครอบไว้ และ **ไม่ได้ถูก track ใน git** (track แค่ `.env.example`). ไฟล์เหล่านี้ยังนั่งอยู่ใน working dir เฉย ๆ ลบทิ้งได้เพื่อความสะอาด ไม่ต้อง rotate key

### Phase 1 — Deepen the Core (1–2 สัปดาห์) · retention
- [ ] **Onboarding flow** 3 หน้าจอ (5.3) → activation
- [ ] **Breathing patterns** พร้อม visual guide ในหน้า timer (5.1 ส่วนแรก)
- [ ] **Daily reminder** ที่ทำงานจริง: PWA notification + "streak กำลังหลุด" (5.2)
- [ ] Empty states + resume button (5.4)

### Phase 2 — Content & Habit (2–4 สัปดาห์)
- [ ] **Guided sessions** TH 3–5 บท (อัดเสียง/TTS) ในหน้า timer (5.1 ส่วนสอง)
- [ ] **Weekly insight summary** push ("สัปดาห์นี้คุณนั่งสมาธิ X นาที, อารมณ์ดีขึ้น Y%")
- [ ] วัดผล retention (D1/D7/D30) ก่อนตัดสินใจเปิด social

### Phase 3 — Social (เปิดเมื่อถึงเกณฑ์ ไม่ใช่ตามเวลา)
- เกณฑ์เปิด: **WAU ≥ 50** และ **D7 retention ≥ 25%**
- เปิด Community check-in ก่อน (low-pressure, async) → ดูผล → ค่อยเปิด Chat พร้อม moderation

---

## 7. Metrics ที่ต้องวัด (ก่อนตัดสินใจอะไรต่อ)

| Metric | ทำไม | เป้าเบื้องต้น |
|---|---|---|
| **Activation** (จบ session แรกใน 24 ชม.) | onboarding ดีไหม | > 40% |
| **D1 / D7 retention** | core loop ติดไหม | D7 > 25% |
| **Sessions / weekly-active user** | habit ก่อตัวไหม | > 3 |
| **Streak ≥ 7 ratio** | gamification เวิร์กไหม | ติดตามเทรนด์ |

> ตอนนี้ยังไม่มี analytics — **เพิ่ม event tracking เบา ๆ (เช่น PostHog/Plausible) เป็นงานแฝงใน Phase 1** ไม่งั้นทุกการตัดสินใจหลังจากนี้คือเดา

---

## 8. สรุปการเปลี่ยนแปลงเชิงตัวเลข

- **ตัด/ซ่อน:** Sleep, Leaderboard, Nudge, Chat, Community → ลด active surface ~33%
- **โฟกัสใหม่:** Timer + Tree + Insights + Onboarding + Reminder + Guided content
- **ผลที่คาด:** navigation สะอาดขึ้น, retention loop ชัดขึ้น, ทุกบรรทัดที่ดูแลมีคนใช้จริง

**หลักคิดเดียวที่ต้องจำ:** *ทำให้คน 1 คนรักการนั่งสมาธิคนเดียวทุกวันให้ได้ก่อน — แล้ว social จะมีความหมาย*
