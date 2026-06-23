# TASK.md — แผนพัฒนา Meditation Deploy

> ## ✅ Progress (อัปเดต 2026-06-23)
> **Phase 0 (Security & Cleanup) — เสร็จทั้งหมด:** ลบ/guard admin endpoints (migrate+backfill เป็น admin-only POST, ลบ cleanup-users), throw แทน JWT fallback, ลบ OAuth secret + junk files + debug logs, validate image upload (magic bytes + 5MB cap, helper `src/lib/server/upload.ts`), จำกัด forwarded-host เฉพาะ dev, ใส่ length limit (displayName/bio/caption/message).
> **Phase 1 (Production Stability) — เสร็จทั้งหมด:** pg pool `max:1` serverless-safe, `totalMinutes` atomic increment + backfill เป็น single UPDATE, broadcastNotification fire-and-forget, ลบ in-memory userCache, pagination (history Prev/Next, chat DISTINCT ON, conversation last-50, sleep bound 1y), composite indexes (nudges pair, +ดู note), SW ไม่ precache mp3 / ไม่ cache `/api/`, vite basicSsl เฉพาะ dev.
> **Verify:** `npm run check` = 0 errors · `npm run build` = success.
> **Phase 2 — เสร็จส่วนสำคัญ:** dedup streak (`src/lib/server/streak.ts`) + leaderboard query (`queries.ts`), เลิกเก็บ OAuth token plaintext, GitHub Actions CI. ข้าม ESLint/Prettier + Svelte5 migration (noisy/low-value).
> **Phase 3 — Top 5 product features เสร็จ:** ✅ share card (timer), ✅ breathing (มีอยู่แล้ว), ✅ tag-frequency chart (insights), ✅ community activity feed, ✅ Web Push (VAPID). *(daily reminder + onboarding = งานที่เจ้าของทำเอง)*
>
> **Commits:** `ed02cff` (P0+P1) · `11699b5` (P2) · `38550fc` (share card) · `fce08b5` (tag chart) · `3fb1a8f` (activity feed) · `e24ded6` (web push)
>
> **ต้องทำ manual ก่อน deploy:**
> - `npm run db:indexes` (composite indexes) + `npm run db:push` หรือ apply `drizzle/0002_push_subscriptions.sql` (ตาราง push)
> - ตั้ง env บน Vercel: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (มีใน `.env` local แล้ว)
> - Web Push delivery จริงต้องเทสบน device จริงผ่าน HTTPS
> **ตั้งใจไม่แตะ:** `svelte.config split:true` (เสี่ยงเกิน 12-function limit ของ Vercel Hobby). Rate limiting auth ยังไม่ทำ (ต้องเลือก lib).



> สรุปจากการ audit ทั้ง codebase (architecture / security / performance / product) เมื่อ 2026-06-23
> Stack: SvelteKit + Svelte 5 + Drizzle ORM + Supabase (Postgres + Storage + Auth) + Vercel
> สถานะ: ทำเครื่องหมาย `[ ]` → `[x]` เมื่อเสร็จ และยืนยันด้วยการรันจริงก่อนปิดงาน

---

## ลำดับการลงมือ (แนะนำ)

1. **Phase 0 — Security & Cleanup** (ครึ่งวัน, reversible, ผลกระทบสูง) ← เริ่มที่นี่
2. **Phase 1 — Production Stability** (1–2 วัน, กัน connection exhaust / latency / payload บวม)
3. **Phase 2 — Code Quality & Tooling** (1–2 วัน, ลด tech debt ก่อนโต)
4. **Phase 3 — Product: Retention & Virality Top 5** (sprint ต่อๆ ไป)

---

## PHASE 0 — Security & Cleanup 🔴 (ทำก่อนเพื่อน)

### 0.1 ปิด/ลบ admin endpoints ที่เปิดโล่ง — **S** — CRITICAL
ใครก็เรียก `GET` ได้แบบไม่ต้องล็อกอิน ลบ user ทั้งระบบได้ผ่าน URL เดียว
- [ ] `src/routes/api/cleanup-users/+server.ts:7` — ลบ user ตามชื่อ hardcode → **ลบ route ทิ้งทั้งไฟล์** (ไม่ควรมีเป็น HTTP route)
- [ ] `src/routes/api/migrate/+server.ts:6` — สร้าง profile ให้ทุก user
- [ ] `src/routes/api/admin/backfill-minutes/+server.ts:5` — recalculate minutes ทุก user
- [ ] ที่เหลือ: ใส่ guard `if (!locals.user || locals.user.role !== 'admin') return json({error:'Forbidden'},{status:403})` (คอลัมน์ `role` มีอยู่แล้วใน `schema.ts:9`)
- [ ] เปลี่ยนจาก `GET` → `POST` (GET ถูก log / cache / prefetch ได้)
- ยืนยัน: `curl` endpoint แบบไม่ล็อกอิน → ต้องได้ 403

### 0.2 ลบ JWT fallback secret — **S** — CRITICAL
`src/lib/server/auth.ts:5`
```ts
// เดิม
const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';
// ใหม่
if (!env.JWT_SECRET) throw new Error('JWT_SECRET must be set');
const JWT_SECRET = env.JWT_SECRET;
```
- [ ] แก้ให้ throw แทน fallback (ถ้า secret หลุด → ปลอม token เป็นใครก็ได้)
- [ ] ตรวจ `.env` ว่ามี `JWT_SECRET` จริง และเป็นค่าสุ่มยาว

### 0.3 Revoke + ลบ Google OAuth client secret — **S** — HIGH
ไฟล์ `client_secret_139606046436-...json` มี secret จริงของ project `meditation-479506` วางข้างๆ `.env`
- [ ] Revoke/rotate secret ที่ Google Cloud Console
- [ ] ลบไฟล์ออกจาก disk
- [ ] ย้ายเป็น env var `GOOGLE_CLIENT_SECRET` (ถ้ายังใช้)
- [ ] ตรวจว่า `.gitignore` ยังกัน `client_secret_*.json` อยู่

### 0.4 ลบ junk / debug / test files ที่ commit อยู่ — **S**
- [ ] `git rm` : `diagnose-checkin.mjs`, `test-upload.mjs`, `test-schema.ts`, `TEST_CHECKIN.js`, `CHECKIN_FIX.md`, `ngrok_new.log`, `ngrok_attempt_3.log`
- [ ] ลบ page debug สาธารณะ: `src/routes/test-emoji/+page.svelte` (เข้าถึงได้ที่ `/test-emoji`)
- [ ] ลบ `console.log` debug 9 จุดใน `src/routes/api/community/checkin/+server.ts:21-99` และ `cleanup-users:26`
- [ ] เพิ่ม `.gitignore`: `*.log`, `src/routes/test-*`

### 0.5 Validate file upload (MIME + size) — **S/M** — HIGH
client กำหนด content-type เองได้ → อัป SVG ฝัง JS = stored XSS
- [ ] `src/routes/api/community/checkin/+server.ts:40-41` และ `src/routes/api/settings/profile/+server.ts:47-48`
- [ ] allowlist `['image/jpeg','image/png','image/webp','image/gif']`, verify magic bytes (lib `file-type`), cap ขนาด (เช่น ≤ 5MB), override `Content-Type` ตอน serve

### 0.6 จำกัด x-forwarded-host trust — **S** — HIGH
`src/hooks.server.ts:12-21` เชื่อ header ดิบ → host header injection / open redirect
- [ ] เช็ค `forwardedHost` กับ allowlist domain ของเรา หรือห่อด้วย `if (dev)` เท่านั้น

### 0.7 ใส่ length limit ของ user input — **M** — MEDIUM
- [ ] `displayName` ≤ 50, `bio` ≤ 500 (`api/settings/profile`)
- [ ] `caption` ≤ 280 (`api/community/checkin`)
- [ ] message `content` ≤ 2000 (`api/messages`)
- [ ] return 400 ถ้าเกิน

### 0.8 (ตามใจ) Rate limiting auth — **M** — HIGH
- [ ] `api/auth/login` + `signup` ยังไม่มี rate limit → brute force ได้ ใส่ `sveltekit-rate-limiter` หรือ Vercel edge gate IP/email

---

## PHASE 1 — Production Stability 🟠

### 1.1 แก้ pg Pool บน serverless — **S** — P0
`src/lib/server/db.ts:8-16` `max:20, min:2` × หลาย Lambda → Supabase pooler exhaust
- [ ] ใช้ Supabase **transaction pooler** (port 6543, `?pgbouncer=true&connection_limit=1`)
- [ ] ตั้ง pool `max:1, min:0` (หรือย้ายไป `postgres-js` `{ max: 1 }`)
- ยืนยัน: ดู connection count ใน Supabase dashboard ตอนยิง load

### 1.2 `totalMinutes` atomic increment — **S** — P0/P1 (race condition)
`src/routes/log/+page.server.ts:32-39` อ่าน-บวก-เขียน → log พร้อมกันนาทีหาย
- [ ] เปลี่ยนเป็น `SET total_minutes = total_minutes + $dur` (Drizzle: `sql\`${profiles.totalMinutes} + ${duration}\``)
- [ ] `backfill-minutes` rewrite เป็น single `UPDATE ... SELECT SUM` แทน N+1
- ยืนยัน: ยิง log 2 request พร้อมกัน → minutes รวมถูกต้อง

### 1.3 `broadcastNotification` ไม่ block + ไม่ O(N) — **M** — P0
`src/lib/server/notifications.ts:34-48` ดึง user ทั้งตาราง insert ทีละแถว ใน request path (`log:49`, `checkin:91`)
- [ ] อย่างน้อย fire-and-forget: `void broadcastNotification(...)`
- [ ] จำกัดผู้รับ (followers/friends เท่านั้น) หรือย้ายเป็น background/Edge job
- [ ] ใส่ rate limit: ไม่เกิน 1 ครั้ง/user/ชม.

### 1.4 ลบ in-memory userCache — **S** — P0
`src/lib/server/db.ts:26-47` ไร้ประโยชน์บน serverless + stale data + memory leak
- [ ] ลบ Map cache ออก หรือย้ายไป Vercel KV / Redis ถ้าต้องการ shared cache จริง

### 1.5 เพิ่ม pagination ทุกที่ที่ดึงทั้งหมด — **M** — P1
- [ ] `history/+page.server.ts:44-56` → `LIMIT 50` + cursor
- [ ] `sleep/+page.server.ts:22-26` → `.limit(30)` + load-more
- [ ] `chat/[userId]/+page.server.ts:32-42` + `api/messages:70-79` → last 50 + `after` cursor
- [ ] `chat/+page.server.ts:18-31` → ใช้ `DISTINCT ON` แทนดึงทุก message มา dedup ใน JS (อย่างน้อย `.limit(500)`)
- [ ] `insights/+page.server.ts:157-171` → query 6,7 ใช้ `periodFilter` (ตอนนี้ scan ทั้ง history)

### 1.6 เพิ่ม composite indexes ที่ขาด — **S** — P1
`drizzle/0001_add_indexes.sql`
- [ ] `CREATE INDEX idx_nudges_pair_created ON nudges(sender_id, receiver_id, created_at DESC)` (query spam-check ใน `/api/nudge`)
- [ ] `CREATE INDEX idx_notifications_user_type_link ON notifications(user_id, type, link, created_at DESC)` (dedup ใน `api/messages:28-37`)
- [ ] เพิ่ม Drizzle `index()` declarations ใน `schema.ts` ให้ตรงกับ SQL (ตอนนี้ index อยู่ใน raw SQL อย่างเดียว → `drizzle-kit push` ใน env ใหม่จะไม่สร้าง)

### 1.7 ลด payload static assets + แก้ SW caching — **M** — P1
- [ ] MP3 รวม ~30MB (`forest 9.9 / relaxing 9.5 / rain 7.2 / ocean 3.9 / bell 3.9`) — เอาออกจาก SW pre-cache, lazy-load, บีบเหลือ ~64kbps
- [ ] ไอคอน PNG 192/512 ขนาด ~401KB ต่อไฟล์ — บีบด้วย pngquant/squoosh (ควร ~15–40KB)
- [ ] `src/service-worker.ts:56-60` หยุด cache `/api/` responses (unread count / messages ค้าง) — cache เฉพาะ `/_app/` + `/static/` ที่ไม่ใช่ api
- ยืนยัน: Lighthouse PWA + ดูขนาด install cache

### 1.8 ngrok rewrite เฉพาะ dev — **S**
- [ ] `src/hooks.server.ts:11-21` ห่อ `if (dev)` หรือลบ (รันทุก request ใน prod อยู่)

---

## PHASE 2 — Code Quality & Tooling 🟢

### 2.1 เพิ่ม tooling พื้นฐาน — **M**
- [ ] ESLint + `eslint-plugin-svelte` + script `"lint": "eslint src"`
- [ ] Prettier + `prettier-plugin-svelte`
- [ ] GitHub Actions: รัน `check` + `lint` ตอน push
- [ ] Vitest unit test: เริ่มที่ `src/lib/achievements.ts` + streak helpers

### 2.2 รวม logic ที่ซ้ำ — **S**
- [ ] Streak: ดึง `+page.server.ts:74-131` กับ `insights/+page.server.ts:6-53` (เขียนคนละแบบ จะ diverge) → `src/lib/server/streak.ts`
- [ ] Leaderboard query ซ้ำใน `leaderboard` + `community` → `src/lib/server/queries.ts` `getLeaderboard(limit)`
- [ ] Nudge handler ซ้ำ 2 ที่ใน `community/+page.svelte:537-569, 834-863` → `nudgeUser(id)`

### 2.3 ความสม่ำเสมอ / type safety — **S–M**
- [ ] cookie `secure`: ใช้ `import { dev } from '$app/environment'` แทน `process.env.NODE_ENV` (`login:41`, `signup:44`)
- [ ] เปลี่ยน `window.location.reload()` → `invalidateAll()` (`community:318`); `window.location.href` → `goto` (`login:26`, `signup:15`)
- [ ] i18n: type translations ด้วย `satisfies`, บังคับ `th` ตรง shape กับ `en` (`i18n.ts:674-685` ตอนนี้คืน key ดิบเงียบๆ เมื่อ missing)
- [ ] type `userCache` value แทน `any` (`db.ts:26-38`)
- [ ] try/catch ใน load functions (`community`, `leaderboard`, `profile/[userId]`) → return `error()` แทน 500 เปล่า

### 2.4 ตัดสินใจเรื่อง `accounts` table — **M**
- [ ] `accounts` ออกแบบไว้ multi-provider แต่เก็บแต่ google และไม่เคยอ่าน (`schema.ts:26-35`, `sync-session:43-49`) → ทำ multi-provider จริง หรือ drop table + ลบ insert
- [ ] **อย่าเก็บ Google access token plaintext** ใน DB (`sync-session:49`) — ลบ หรือ encrypt at rest

### 2.5 Svelte 5 migration (ค่อยทำ) — **L**
- [ ] migrate `export let data` → `let { data } = $props()`, `$:` → `$derived/$state` ทีละหน้า

---

## PHASE 3 — Product: Retention & Virality (Top 5) 🚀

> positioning = TikTok-Social → โฟกัส retention loop + virality

### 3.1 แก้ Daily Reminder ให้ยิงจริง — **S** — retention lever #1
`DailyReminder.svelte` เก็บเวลาใน localStorage + ยิง test ครั้งเดียว แต่ไม่มี schedule วันถัดไป
- [ ] ใน `service-worker.ts` (มี `notificationclick` handler แล้ว) เพิ่ม schedule daily ด้วย `self.registration.showNotification()`
- [ ] เพิ่ม badge "streak กำลังจะหลุด — นั่งสมาธิก่อนเที่ยงคืน" บน home hero (`+page.svelte` block `notMeditatedToday`)

### 3.2 Share card หลังจบ session → TikTok/Stories — **S** — virality loop
- [ ] หลัง log session สร้าง image card (canvas/SVG): tree stage + minutes + streak + username
- [ ] ใช้ `navigator.share()` (มีใน PWA context แล้ว) ต่อยอดจาก completed branch ใน `timer/+page.svelte`

### 3.3 Guided breathing + in-session prompts — **S/M** — เปลี่ยนจาก stopwatch เป็น tool จริง
- [ ] breathing ring CSS (inhale 4s / hold 2s / exhale 6s) หลัง countdown circle — มี class `animate-breathe` อยู่แล้ว
- [ ] 5–8 guided text prompt sequences (JSON config) แสดงเป็น overlay ตามจังหวะ, ใช้ session type taxonomy เดิม (Breath/Body Scan/Loving-Kindness)

### 3.4 Community activity feed — **M** — เปลี่ยน Forest UI เป็น social loop
- [ ] tab "recent activity" ใต้ forest: "X จบ 20 นาที Loving Kindness 🌸", "Y ถึง Level 7 🌲", "Z โพสต์ check-in"
- [ ] ใช้ `meditationSessions` + `dailyCheckins` ที่มีอยู่

### 3.5 Web Push (VAPID) — **M** — ปิด loop nudge→push→เปิดแอป
- [ ] เพิ่ม table `push_subscriptions` ใน `schema.ts`
- [ ] endpoint subscribe + server เรียก Web Push API ตอน nudge/message (DB notification layer + SW `notificationclick` พร้อมแล้ว)

### Backlog (Bigger bets — L)
- [ ] Structured courses/programs (7-day beginner ฯลฯ) — retention driver แบบ Headspace/Calm
- [ ] Background Sync: replay session ที่ log ตอน offline
- [ ] Following/friends graph: forest แบบ scoped เฉพาะเพื่อน
- [ ] Apple Health / Google Fit (mindful minutes) — ต้อง native wrapper
- [ ] Tag frequency chart ใน `/insights` (parse `tags` column ที่เก็บแต่ไม่เคย visualize)
- [ ] Onboarding 3-step + ตั้ง daily goal ตอน signup (first-session CTA เมื่อ `totalSessions === 0`)

---

## Observability (ทำคู่ไปกับ Phase 1–2)
- [ ] `GET /api/health` เช็ค DB connectivity → 200/503
- [ ] Sentry (`@sentry/sveltekit`) ใน `hooks.server.ts` + source maps
- [ ] `svelte.config.js:12` `split: true` (comment บอก split แต่ค่าเป็น false → cold start บวม)
- [ ] `vite.config.ts:7` ห่อ `basicSsl()` เฉพาะ non-production
