// The Olympic Club by PT-Palm — แอปติดตามอาหารและการเทรน (ลูกค้า / เทรนเนอร์ / เจ้าของระบบ)
import { firebaseConfig, OWNER_EMAIL, LOGIN_DOMAIN, RECAPTCHA_SITE_KEY } from './firebase-config.js?v=20260929b';
import { FOODS, FOOD, MEALS, TH_M, QUICK, NOODLE, quickCalc, noodleCalc, normTh } from './foods.js?v=20261008a';
import { CAFE, cafeCalc, bakeryCalc, cafeTemps } from './cafe.js?v=20260929c';

const FBV = 'https://www.gstatic.com/firebasejs/11.10.0/';
const VER = '20261008b';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n0 = x => Math.round(Number(x) || 0).toLocaleString('en-US');
const r1 = x => Math.round((Number(x) || 0) * 10) / 10;
const num = x => { const v = parseFloat(String(x ?? '').replace(/,/g, '')); return Number.isFinite(v) ? v : null; };
/* น้ำหนักท่าเล่น: เก็บ kg เสมอ (ใช้คิดสถิติ/Volume) + lb + หน่วยที่โค้ชใส่ (m.u) */
const LB = 0.45359237;
const r2 = x => Math.round((Number(x) || 0) * 100) / 100;
const setKg = (u, w) => u === 'lb' ? (num(w) || 0) * LB : (num(w) || 0);
const wBoth = (x, u) => { const kg = +x.kg || 0; const lb = x.lb != null ? +x.lb : kg / LB; return u === 'lb' ? [`${r1(lb)} lb`, `${r1(kg)} kg`] : [`${r1(kg)} kg`, `${r1(lb)} lb`]; };
const convHint = (el, m) => { const c = document.querySelector(`[data-conv="${el.dataset.mi}-${el.dataset.si}"]`); const w = num(el.value); if (c) c.innerHTML = w ? `≈ ${r1(m.u === 'lb' ? w * LB : w / LB)} ${m.u === 'lb' ? 'kg' : 'lb'}` : '&nbsp;'; };
const wText = (kg, u) => u === 'lb' ? `${r1(kg / LB)} lb (${r1(kg)} kg)` : `${r1(kg)} kg (${r1(kg / LB)} lb)`;
const TH_D = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const TH_DL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

/* ============ วันที่ (เวลาไทย) ============ */
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const nowHM = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });
function addDays(ds, n) { const d = new Date(ds + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const dowOf = ds => new Date(ds + 'T12:00:00Z').getUTCDay();
function thDate(ds, full) { const d = new Date(ds + 'T12:00:00Z'); return (full ? TH_DL : TH_D)[d.getUTCDay()] + (full ? ' ' : '. ') + d.getUTCDate() + ' ' + TH_M[d.getUTCMonth()]; }
const weekStart = ds => addDays(ds, -((dowOf(ds) + 6) % 7));

/* ============ ค่าคงที่ ============ */
const ACT = {
  swim: ['ว่ายน้ำ', 7], coach: ['เทรนกับโค้ช', 5], class: ['เข้าคลาส', 7], walk: ['เดิน / วิ่ง', 5],
  bike: ['ปั่นจักรยาน', 6], yoga: ['โยคะ / พิลาทิส', 3], weights: ['เวทเทรนนิ่งเอง', 5], other: ['อื่นๆ', 5]
};
const SESSION_TYPES = ['Push', 'Pull', 'Legs', 'Full body', 'คาร์ดิโอ'];
const MOVES = ['Lat Pulldown', 'Seated Cable Row', 'Face Pull', 'Dumbbell Curl', 'Bench Press', 'Chest Press', 'Shoulder Press',
  'Lateral Raise', 'Triceps Pushdown', 'Squat', 'Leg Press', 'Romanian Deadlift', 'Hip Thrust', 'Leg Curl', 'Leg Extension', 'Plank'];
const P = {
  plate: 'M4 12a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M8.5 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0',
  dumb: 'M3 10v4 M6.5 7v10 M17.5 7v10 M21 10v4 M6.5 12h11',
  chart: 'M4 20V11 M10 20V5 M16 20v-7 M21 20H3',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  users: 'M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8 M2 21v-1a7 7 0 0 1 14 0v1 M16 3.5a4 4 0 0 1 0 7.5 M22 21v-1a6 6 0 0 0-4-5.6',
  chat: 'M4 5h16v11H9l-5 4z',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  person: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8 M5 21a7 7 0 0 1 14 0',
  sliders: 'M4 7h10 M18 7h2 M16 5v4 M4 17h4 M12 17h8 M10 15v4',
  cam: 'M4 7h3l2-3h6l2 3h3v13H4z M12 17a4 4 0 1 0 0-8a4 4 0 1 0 0 8',
  clip: 'M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  spark: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'
};
const svg = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[k]}"/></svg>`;
const TABS = {
  member: [['today', 'วันนี้', 'plate'], ['exercise', 'ออกกำลัง', 'dumb'], ['body', 'ร่างกาย', 'chart'], ['coach', 'โค้ช', 'cal'], ['more', 'เพิ่มเติม', 'more']],
  trainer: [['clients', 'ลูกค้า', 'users'], ['schedule', 'ตารางงาน', 'cal'], ['log', 'บันทึกเทรน', 'dumb'], ['summary', 'สรุปวันนี้', 'chat'], ['more', 'เพิ่มเติม', 'more']],
  owner: [['overview', 'ภาพรวม', 'grid'], ['clients', 'ลูกค้า', 'users'], ['trainers', 'เทรนเนอร์', 'person'], ['system', 'ระบบ', 'sliders'], ['more', 'เพิ่มเติม', 'more']]
};
const CONSENT_TEXT = [
  'แอปนี้เก็บข้อมูลอาหาร การออกกำลังกาย น้ำหนัก และผลวัดร่างกายของคุณ เพื่อใช้ติดตามผลกับโค้ช',
  'ผู้ที่เห็นข้อมูลของคุณ: ตัวคุณเอง โค้ชที่ดูแลคุณ และเจ้าของระบบ (ผู้ดูแลแอป) ลูกค้าคนอื่นมองไม่เห็นข้อมูลของคุณ',
  'รูปที่แนบเป็นหลักฐานจะเก็บไว้กับรายการนั้น ถ้ากดให้ AI อ่านรูป รูปจะถูกส่งให้ AI ของ Google อ่านตัวเลขเท่านั้น',
  'ขอลบข้อมูลหรือเลิกใช้งานได้ตลอดเวลา โดยแจ้งโค้ชหรือเจ้าของระบบ'
];

/* ============ สถานะ ============ */
let fb = null, app = null, auth = null, db = null, auth2 = null;
const S = { me: null, config: {}, view: null, cache: new Map(), photoCache: new Map() };
const ui = { tab: null, date: todayStr(), exDate: todayStr(), schedDate: todayStr(), log: null, wkSel: 0, wkMove: null, filter: 'all', sumDate: todayStr() };
let sheet = null; // ข้อมูลของหน้าต่างที่เปิดอยู่

/* ============ UI พื้นฐาน ============ */
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms); }
function setMain(html) { $('#main').innerHTML = html; }
function isStaff() { return S.me && (S.me.role === 'owner' || S.me.role === 'trainer'); }
// หัวหน้าเทรนเนอร์ = เทรนเนอร์ที่เจ้าของระบบให้สิทธิ์สร้าง/พักงาน/ลบเทรนเนอร์ และย้ายลูกค้าระหว่างเทรนเนอร์
function isHead() { return S.me?.role === 'trainer' && S.me.person?.canManageTrainers === true; }
function canManageTeam() { return S.me?.role === 'owner' || isHead(); }
// เทรนเนอร์คนนี้ถูกจัดการโดยผู้ใช้ปัจจุบันได้ไหม (หัวหน้าจัดการตัวเองหรือหัวหน้าคนอื่นไม่ได้)
function canManageTrainer(t) { if (S.me?.role === 'owner') return true; return isHead() && t.role === 'trainer' && !t.canManageTrainers && t.id !== S.me.pid; }
function viewingClient() { return isStaff() && !!S.view; }
function roleTabs() {
  if (S.me.role === 'member' || viewingClient()) return TABS.member;
  if (isHead()) return [...TABS.trainer.slice(0, 4), ['team', 'ทีม', 'person'], TABS.trainer[4]];
  return TABS[S.me.role];
}
function renderTabs() {
  const bar = $('#tabbar'); const tabs = roleTabs();
  bar.hidden = false;
  bar.innerHTML = `<div class="in">${tabs.map(([k, l, ic]) => `<button class="tab" data-act="tab" data-v="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${svg(ic, 24)}<span>${l}</span></button>`).join('')}</div>`;
  const v = $('#viewing');
  if (viewingClient()) { v.hidden = false; v.innerHTML = `<span>กำลังดูข้อมูลของ <b>${esc(S.cache.get('p:' + S.view)?.name || '')}</b></span><button class="btn sm ghost" style="color:#fff;border-color:#C9D3DF;background:transparent" data-act="exitClient">‹ กลับ</button>`; }
  else v.hidden = true;
}
function openSheet(title, body, ctx = {}) {
  sheet = { ...ctx, title };
  $('#sheetRoot').innerHTML = `<div class="sheet-bg" data-act="sheetBg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="head"><h2>${esc(title)}</h2><button class="iconbtn" data-act="closeSheet" aria-label="ปิด" style="font-size:24px">×</button></div><div id="sheetBody" style="display:flex;flex-direction:column;gap:12px">${body}</div></div></div>`;
}
function refreshSheet(body) { const b = $('#sheetBody'); if (b) b.innerHTML = body; }
function closeSheet() { sheet = null; $('#sheetRoot').innerHTML = ''; }

/* ============ Firebase ============ */
async function boot() {
  try {
    const [appM, authM, fsM] = await Promise.all([import(FBV + 'firebase-app.js'), import(FBV + 'firebase-auth.js'), import(FBV + 'firebase-firestore.js')]);
    fb = { ...appM, ...authM, ...fsM };
    app = fb.initializeApp(firebaseConfig);
    auth = fb.getAuth(app);
    try { db = fb.initializeFirestore(app, { localCache: fb.persistentLocalCache({ tabManager: fb.persistentMultipleTabManager() }) }); } catch (e) { db = fb.getFirestore(app); }
    try { await fb.getRedirectResult(auth); } catch (e) { /* ไม่มี redirect ค้าง */ }
    fb.onAuthStateChanged(auth, u => handleUser(u).catch(err => { console.error(err); setMain(`<section class="card"><h2>เปิดข้อมูลไม่สำเร็จ</h2><p class="small muted">${esc(err.message)}</p><button class="btn" data-act="logout">ออกจากระบบ</button></section>`); }));
  } catch (e) { console.error(e); setMain('<section class="card"><h2>โหลดไม่สำเร็จ</h2><p class="small">ตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้านี้</p></section>'); }
}
const D = (...p) => fb.doc(db, ...p);
const C = (...p) => fb.collection(db, ...p);
async function get(ref) { const s = await fb.getDoc(ref); return s.exists() ? { id: s.id, ...s.data() } : null; }
async function list(q) { const s = await fb.getDocs(q); return s.docs.map(d => ({ id: d.id, ...d.data() })); }
function secondaryAuth() {
  if (!auth2) { const a2 = fb.initializeApp(firebaseConfig, 'creator'); auth2 = fb.initializeAuth(a2, { persistence: fb.inMemoryPersistence }); }
  return auth2;
}

/* ============ เข้าสู่ระบบ ============ */
function renderLogin(msg = '') {
  $('#tabbar').hidden = true; $('#viewing').hidden = true;
  setMain(`<section class="card login">
    <h1>เข้าสู่ระบบ</h1>
    <p class="small muted">ใช้ชื่อผู้ใช้และรหัสผ่านที่โค้ชหรือเจ้าของระบบให้ไว้</p>
    ${msg ? `<div class="warn">${esc(msg)}</div>` : ''}
    <label class="f">ชื่อผู้ใช้<input class="in" id="lgUser" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
    <label class="f">รหัสผ่าน<input class="in" id="lgPass" type="password" autocomplete="current-password"></label>
    <button class="btn pri block" data-act="login">เข้าสู่ระบบ</button>
    <div class="hr"></div>
    <button class="btn ghost" data-act="ownerLogin">เจ้าของระบบ: เข้าด้วย Google</button>
    <a class="small center" href="manual.html">คู่มือการใช้งาน</a>
  </section>`);
}
async function doLogin() {
  const u = ($('#lgUser').value || '').trim().toLowerCase(); const pw = $('#lgPass').value || '';
  if (!u || !pw) return toast('กรอกชื่อผู้ใช้และรหัสผ่าน');
  try {
    const lg = await get(D('logins', u));
    if (!lg) return renderLogin('ไม่พบชื่อผู้ใช้นี้ ตรวจตัวสะกดอีกครั้ง');
    await fb.signInWithEmailAndPassword(auth, lg.email, pw);
  } catch (e) {
    const c = e.code || '';
    renderLogin(c.includes('invalid-credential') || c.includes('wrong-password') ? 'รหัสผ่านไม่ถูกต้อง' : c.includes('too-many') ? 'ลองผิดหลายครั้ง รอสักครู่แล้วลองใหม่' : 'เข้าสู่ระบบไม่สำเร็จ (' + c + ')');
  }
}
async function ownerLogin() {
  const pr = new fb.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' });
  try { await fb.signInWithPopup(auth, pr); }
  catch (e) { if (String(e.code).includes('popup')) await fb.signInWithRedirect(auth, pr); else toast('เข้าด้วย Google ไม่สำเร็จ (' + e.code + ')'); }
}
async function handleUser(u) {
  S.cache.clear(); S.view = null; ui.log = null; S.moveLib = null; closeSheet();
  if (!u) { S.me = null; return renderLogin(); }
  if ((u.email || '').toLowerCase() === OWNER_EMAIL && u.emailVerified) {
    S.me = { role: 'owner', name: 'เจ้าของระบบ', pid: null, uid: u.uid };
    S.config = (await get(D('config', 'app'))) || {};
    if (!S.config.createdAt) { S.config = { name: 'The Olympic Club by PT-Palm', aiOn: true, aiModel: 'gemini-3.5-flash', digestTime: '21:00', workoutDelayMin: 60, createdAt: fb.serverTimestamp() }; await fb.setDoc(D('config', 'app'), S.config, { merge: true }); }
  } else {
    const acc = await get(D('accounts', u.uid));
    if (!acc) { S.me = null; return renderLogin('บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน ติดต่อโค้ชหรือเจ้าของระบบ'); }
    const person = await get(D('people', acc.pid));
    if (!person || person.active !== true) { await fb.signOut(auth); return renderLogin('บัญชีนี้ถูกปิดการใช้งาน ติดต่อโค้ชหรือเจ้าของระบบ'); }
    S.me = { role: acc.role, pid: acc.pid, name: person.name, uid: u.uid, person };
    S.cache.set('p:' + acc.pid, person);
    S.config = (await get(D('config', 'app'))) || {};
    if (acc.role === 'member' && !person.consentAt) return renderConsent();
  }
  startApp();
}
function renderConsent() {
  $('#tabbar').hidden = true;
  setMain(`<section class="card"><h1>ก่อนเริ่มใช้งาน</h1>
    ${CONSENT_TEXT.map(t => `<p class="small" style="margin:0">• ${esc(t)}</p>`).join('')}
    <button class="btn gold block" data-act="consent">ยินยอมและเริ่มใช้งาน</button>
    <button class="btn ghost" data-act="logout">ไม่ยินยอม / ออกจากระบบ</button></section>`);
}
/* ============ LINE (ผ่าน Apps Script relay ยืนยันตัวตนด้วย Firebase ID token) ============ */
const line = { info: null, busy: false };
// ใครได้รับอะไร: config/app.alerts[k] = { on, types } · k = 'owner' หรือ pid · ถ้ายังไม่ตั้ง ใช้ค่าเริ่มต้นตามบทบาท (ตรงกับ ocWants_ ใน Apps Script)
const ALERT_TYPES = [['digest', 'สรุปรายวัน'], ['workout', 'ผลการเทรน']];
const ALERT_HINT = {
  owner: 'สรุปรายวัน = ลูกค้าทุกคน · ผลการเทรนไม่ส่งสำเนามาที่เจ้าของ (ดูในแอปได้)',
  trainer: 'สรุปรายวัน = ลูกค้าของตัวเอง · ผลการเทรนไม่ส่งกลับมาที่โค้ช (ส่งถึงลูกค้าคนนั้นคนเดียว)',
  member: 'สรุปรายวัน = ของตัวเองคนเดียว · ผลการเทรน = เฉพาะผลของตัวเอง หลังโค้ชบันทึก'
};
// ผลการเทรนส่งถึงลูกค้าเจ้าของผลคนเดียว: เทรนเนอร์/เจ้าของเลือกได้แค่สรุปรายวัน
const alertTypesFor = role => role === 'member' ? ALERT_TYPES : ALERT_TYPES.filter(([t]) => t !== 'workout');
function alertOf(k, role) {
  const a = (S.config.alerts || {})[k];
  if (a) return { on: a.on !== false, types: (Array.isArray(a.types) ? a.types : []).filter(t => role === 'member' || t !== 'workout') };
  if (role === 'owner') return { on: !!S.config.digestToOwner, types: S.config.digestToOwner ? ['digest'] : [] };
  return { on: true, types: role === 'trainer' ? ['digest'] : ['workout'] };
}
async function saveAlert(k, a) {
  const alerts = { ...(S.config.alerts || {}), [k]: a };
  await fb.setDoc(D('config', 'app'), { alerts: { [k]: a } }, { merge: true }); S.config.alerts = alerts;
}
function lineOn() { return !!(S.config.lineUrl && S.config.lineOn !== false); }
async function relay(oc, extra = {}) {
  if (!S.config.lineUrl) throw new Error('เจ้าของระบบยังไม่ได้ตั้งค่า LINE');
  const idToken = await auth.currentUser.getIdToken();
  const r = await fetch(S.config.lineUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ oc, idToken, ...extra }) });
  return r.json();
}
async function lineInfo(force) {
  if (!S.config.lineUrl) return null;
  if (line.info && !force) return line.info;
  try { line.info = await relay('info'); } catch (e) { line.info = { ok: false, error: 'เชื่อมต่อระบบ LINE ไม่ได้' }; }
  return line.info;
}
async function lineLink() {
  toast('กำลังเปิด LINE…', 6000);
  const r = await relay('start', { back: location.origin + location.pathname });
  if (!r.ok) return toast(r.error || 'เปิด LINE ไม่สำเร็จ');
  location.href = r.url;
}
function lineCardHtml() {
  if (!S.config.lineUrl) return '';
  const i = line.info; const L = i?.link;
  const myA = alertOf(S.me.role === 'owner' ? 'owner' : S.me.pid, S.me.role);
  const what = myA.on && myA.types.length ? myA.types.map(t => t === 'digest' ? `สรุปรายวัน (${esc(S.config.digestTime || '21:00')})` : 'ผลการเทรน').join(' และ ') : 'ยังไม่มีหัวข้อที่เปิดรับ (เจ้าของระบบเป็นคนเลือก)';
  return `<section class="card"><div class="between"><b>LINE ของฉัน</b>${!i ? '<span class="tag grey">กำลังตรวจ…</span>' : L ? `<span class="tag blue">เชื่อมแล้ว · ${esc(L.name || '')}</span>` : '<span class="tag alert">ยังไม่เชื่อม</span>'}</div>
    <div class="pill-note">บัญชีในแอปที่จะผูก: <b>${esc(S.me.name)}</b> · ${S.me.role === 'owner' ? 'เจ้าของระบบ' : S.me.role === 'trainer' ? 'เทรนเนอร์' : 'ลูกค้า'}${S.me.person?.username ? ' (@' + esc(S.me.person.username) + ')' : ''}</div>
    <span class="small muted">เชื่อมครั้งเดียว แล้วจะได้รับ ${what} เป็นแชต 1:1 จาก LINE OA</span>
    ${S.me.role === 'member' ? '<span class="xs muted">กดเชื่อมจากมือถือที่เปิด LINE ของตัวเองเท่านั้น (1 LINE ต่อลูกค้า 1 คน) ระบบจะส่งเฉพาะผลเทรนของคุณ</span>' : ''}
    ${i && !i.ok ? `<div class="warn">${esc(i.error || 'เชื่อมต่อไม่ได้')}</div>` : ''}
    ${L && L.friend === false ? '<div class="warn">ยังไม่ได้เพิ่มเพื่อน LINE OA ต้องเพิ่มเพื่อนก่อนถึงจะได้รับข้อความ กด “เชื่อมใหม่” แล้วเลือกเพิ่มเพื่อน</div>' : ''}
    <div class="row"><button class="btn ${L ? '' : 'gold'}" data-act="lineLink">${L ? 'เชื่อมใหม่' : 'เชื่อม LINE'}</button>
    ${L ? `<button class="btn" data-act="lineTest">ส่งทดสอบถึงฉัน</button>${isStaff() ? '<button class="btn" data-act="lineDigestTest">ส่งสรุปวันนี้ถึงฉัน</button>' : ''}<button class="btn ghost danger" data-act="lineUnlink">ยกเลิกการเชื่อม</button>` : ''}</div></section>`;
}
async function refreshLineCard() { await lineInfo(true); if (['more', 'system'].includes(ui.tab) && !viewingClient()) render(); }
function startApp() {
  const qp = new URLSearchParams(location.search);
  if (qp.has('u')) { qp.delete('u'); history.replaceState(null, '', location.pathname + (qp.toString() ? '?' + qp : '') + location.hash); }
  if (qp.has('line')) { const v = qp.get('line'); history.replaceState(null, '', location.pathname); setTimeout(() => toast(v === 'linked' ? 'เชื่อม LINE แล้ว ✅' : v === 'cancel' ? 'ยกเลิกการเชื่อม LINE' : 'เชื่อม LINE ไม่สำเร็จ ลองใหม่อีกครั้ง', 3500), 300); line.info = null; }
  if (S.me.role === 'member') { S.view = S.me.pid; ui.tab = 'today'; }
  else ui.tab = TABS[S.me.role][0][0];
  render();
}
async function logout() { await fb.signOut(auth); }

/* ============ เปลี่ยนรหัสผ่านของตัวเอง ============ */
// ใช้ได้กับบัญชีชื่อผู้ใช้ + รหัสผ่าน (ลูกค้าและเทรนเนอร์) · เจ้าของเข้าด้วย Google จึงไม่มีรหัสในแอป
function hasPwLogin() { return !!auth?.currentUser?.providerData?.some(x => x.providerId === 'password'); }
function pwCardHtml() {
  if (!hasPwLogin() || viewingClient()) return '';
  return `<section class="card"><div class="between"><b>รหัสผ่านของฉัน</b><button class="btn sm" data-act="changePw">เปลี่ยนรหัสผ่าน</button></div>
    <span class="small muted">ตั้งรหัสใหม่ที่จำได้เอง ไม่ต้องรอโค้ช · ใช้กับชื่อผู้ใช้ @${esc(S.me.person?.username || '')}</span></section>`;
}
function pwSheetBody(msg = '') {
  const t = sheet?.show ? 'text' : 'password';
  return `${msg ? `<div class="warn">${esc(msg)}</div>` : ''}
    <label class="f">รหัสผ่านปัจจุบัน<input class="in" id="cpOld" type="${t}" autocomplete="current-password"></label>
    <label class="f">รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)<input class="in" id="cpNew" type="${t}" autocomplete="new-password"></label>
    <label class="f">พิมพ์รหัสผ่านใหม่อีกครั้ง<input class="in" id="cpNew2" type="${t}" autocomplete="new-password"></label>
    <button class="btn sm ghost" data-act="pwShow" style="align-self:flex-start">${sheet?.show ? 'ซ่อนรหัส' : 'แสดงรหัส'}</button>
    <button class="btn gold block" data-act="savePw">บันทึกรหัสผ่านใหม่</button>
    <span class="xs muted">ลืมรหัสปัจจุบัน? แจ้งโค้ช (หรือหัวหน้าเทรนเนอร์/เจ้าของระบบ) ให้กด “ตั้งรหัสผ่านใหม่” ให้</span>`;
}
function openChangePw() { openSheet('เปลี่ยนรหัสผ่าน', '', { kind: 'pw', show: false }); refreshSheet(pwSheetBody()); setTimeout(() => $('#cpOld')?.focus(), 50); }
function pwVals() { return { o: $('#cpOld')?.value || '', n: $('#cpNew')?.value || '', n2: $('#cpNew2')?.value || '' }; }
function pwRedraw(msg) { const v = pwVals(); refreshSheet(pwSheetBody(msg)); $('#cpOld').value = v.o; $('#cpNew').value = v.n; $('#cpNew2').value = v.n2; }
async function savePw() {
  if (!sheet || sheet.kind !== 'pw' || sheet.busy) return;
  const { o, n, n2 } = pwVals(); const u = auth.currentUser;
  const uname = (S.me.person?.username || '').toLowerCase();
  const err = !o ? 'กรอกรหัสผ่านปัจจุบัน'
    : n.length < 6 ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว'
    : /\s/.test(n) ? 'รหัสผ่านใหม่ห้ามมีช่องว่าง'
    : n !== n2 ? 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'
    : n === o ? 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม'
    : uname && n.toLowerCase() === uname ? 'รหัสผ่านต้องไม่เหมือนชื่อผู้ใช้'
    : '';
  if (err) return pwRedraw(err);
  if (!u || !hasPwLogin()) return pwRedraw('บัญชีนี้ไม่ได้ใช้รหัสผ่าน');
  sheet.busy = true; const b = document.querySelector('[data-act="savePw"]'); if (b) { b.disabled = true; b.textContent = 'กำลังบันทึก…'; }
  try {
    await fb.reauthenticateWithCredential(u, fb.EmailAuthProvider.credential(u.email, o));
    await fb.updatePassword(u, n);
    closeSheet(); toast('เปลี่ยนรหัสผ่านแล้ว ✅ ครั้งหน้าใช้รหัสใหม่เข้าสู่ระบบ', 4000);
  } catch (e) {
    const c = String(e.code || '');
    sheet.busy = false;
    pwRedraw(c.includes('invalid-credential') || c.includes('wrong-password') ? 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      : c.includes('too-many') ? 'ลองผิดหลายครั้ง รอสักครู่แล้วลองใหม่'
      : c.includes('weak-password') ? 'รหัสผ่านใหม่ง่ายเกินไป ลองตั้งให้ยาวขึ้น'
      : c.includes('password-does-not-meet') ? 'รหัสผ่านใหม่ยังไม่ตรงตามเงื่อนไขของระบบ ลองตั้งให้ยาวขึ้นและผสมตัวเลข'
      : c.includes('network') ? 'อินเทอร์เน็ตขัดข้อง ลองใหม่อีกครั้ง'
      : 'เปลี่ยนรหัสผ่านไม่สำเร็จ (' + c + ')');
  }
}

/* ============ ข้อมูล ============ */
async function person(pid, fresh) {
  const k = 'p:' + pid;
  if (!fresh && S.cache.has(k)) return S.cache.get(k);
  const p = await get(D('people', pid)); S.cache.set(k, p); return p;
}
async function dayDoc(pid, ds) { return (await get(D('people', pid, 'days', ds))) || { meals: {}, water: 0 }; }
async function actsRange(pid, a, b) {
  const rows = await list(fb.query(C('people', pid, 'activities'), fb.where('date', '>=', a), fb.where('date', '<=', b)));
  return rows.sort((x, y) => (x.date + (x.t || '')).localeCompare(y.date + (y.t || '')));
}
async function bodyRows(pid) { return (await list(C('people', pid, 'body'))).sort((a, b) => (a.date + (a.t || '')).localeCompare(b.date + (b.t || ''))); }
async function sessionsFor(pid) {
  let q;
  let rows;
  try { rows = await list(fb.query(C('sessions'), fb.where('memberPid', '==', pid))); }
  catch (e) {
    if (S.me.role !== 'trainer') throw e;
    // สำรอง: อ่านเฉพาะรอบที่ตัวเองเป็นโค้ช
    rows = await list(fb.query(C('sessions'), fb.where('trainerPid', '==', S.me.pid), fb.where('memberPid', '==', pid)));
  }
  return rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
async function myMembers() {
  const q = S.me.role === 'owner' ? fb.query(C('people'), fb.where('role', '==', 'member')) : fb.query(C('people'), fb.where('trainerPid', '==', S.me.pid));
  const rows = (await list(q)).sort((a, b) => String(a.name).localeCompare(String(b.name), 'th'));
  rows.forEach(r => S.cache.set('p:' + r.id, r));
  return rows;
}
async function trainers() { return (await list(fb.query(C('people'), fb.where('role', '==', 'trainer')))).sort((a, b) => String(a.name).localeCompare(String(b.name), 'th')); }
function mealItems(day) { const out = []; for (const m of MEALS) (day.meals?.[m] || []).forEach((it, i) => out.push({ ...it, meal: m, i })); return out; }
function dayTotals(day) {
  const t = { k: 0, p: 0, c: 0, f: 0, byMeal: {} };
  for (const m of MEALS) {
    const items = day.meals?.[m] || []; let mk = 0;
    for (const it of items) { t.k += +it.k || 0; t.p += +it.p || 0; t.c += +it.c || 0; t.f += +it.f || 0; mk += +it.k || 0; }
    if (items.length) t.byMeal[m] = mk;
  }
  return t;
}
const burnOf = acts => acts.reduce((a, x) => a + (+x.kcal || 0), 0);
function latestWeight(rows) { for (let i = rows.length - 1; i >= 0; i--) if (num(rows[i].weight)) return num(rows[i].weight); return null; }
function foodCalc(f, q) { const x = f.u === 'g' ? q / 100 : q; return { k: Math.round(f.k * x), p: r1(f.p * x), c: r1(f.c * x), f: r1(f.f * x) }; }

/* ============ รูปภาพ ============ */
function readFile(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
async function compress(file) {
  const src = await readFile(file);
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  let max = 1400, q = 0.82, out = src;
  for (let k = 0; k < 7; k++) {
    const sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    out = c.toDataURL('image/jpeg', q);
    if (out.length < 380000) break;
    max = Math.round(max * 0.8); q = Math.max(0.5, q - 0.08);
  }
  return out;
}
async function savePhoto(pid, dataUrl) {
  const ref = await fb.addDoc(C('photos'), { pid, data: dataUrl, byUid: auth.currentUser.uid, at: fb.serverTimestamp() });
  S.photoCache.set(ref.id, dataUrl); return ref.id;
}
async function photoData(id) {
  if (S.photoCache.has(id)) return S.photoCache.get(id);
  const p = await get(D('photos', id)); const d = p?.data || ''; S.photoCache.set(id, d); return d;
}
async function fillThumbs(root = document) {
  for (const img of root.querySelectorAll('img[data-photo]')) { if (img.src) continue; try { img.src = await photoData(img.dataset.photo); } catch (e) { } }
}
const clipTag = ph => (ph && ph.length) ? ` <span class="clip">${svg('clip', 13)} ${ph.length} รูป</span>` : '';
function thumbsHtml(ids, editable) {
  return (ids || []).map((id, i) => `<div class="thumb"><button type="button" style="border:none;padding:0;width:100%;height:100%;background:none" data-act="viewPhoto" data-id="${id}" data-set="${(ids || []).join(',')}" data-i="${i}" aria-label="ดูรูป ${i + 1}"><img data-photo="${id}" alt=""></button>${editable ? `<button type="button" class="x" data-act="rmPhoto" data-i="${i}" aria-label="ลบรูป ${i + 1}">×</button>` : ''}</div>`).join('');
}
/* ---------- ตัวดูรูปเต็มจอ ---------- */
const lb = { ids: [], i: 0, x: null };
function openViewer(ids, i = 0) {
  if (!ids.length) return;
  lb.ids = ids; lb.i = Math.max(0, Math.min(i, ids.length - 1));
  let el = document.getElementById('viewer');
  if (!el) {
    el = document.createElement('div'); el.id = 'viewer'; el.className = 'lb'; el.dataset.act = 'lbBg';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'ดูรูป');
    el.addEventListener('click', e => { if (e.target === el || e.target.classList.contains('lb-stage')) closeViewer(); });
    el.addEventListener('touchstart', e => { lb.x = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (lb.x == null || el.querySelector('img.zoom')) return; const dx = e.changedTouches[0].clientX - lb.x; lb.x = null;
      if (Math.abs(dx) > 50) navViewer(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.body.appendChild(el);
  }
  document.body.style.overflow = 'hidden';
  drawViewer();
}
async function drawViewer() {
  const el = document.getElementById('viewer'); if (!el) return;
  const n = lb.ids.length, i = lb.i, id = lb.ids[i];
  el.innerHTML = `<button type="button" class="lb-x" data-act="lbClose" aria-label="ปิด">×</button>
    <div class="lb-stage"><div class="lb-load">กำลังโหลดรูป…</div></div>
    ${n > 1 ? `<div class="lb-bar"><button type="button" class="lb-nav" data-act="lbNav" data-d="-1" aria-label="รูปก่อนหน้า" ${i ? '' : 'disabled'}>‹</button><span>${i + 1} / ${n}</span><button type="button" class="lb-nav" data-act="lbNav" data-d="1" aria-label="รูปถัดไป" ${i < n - 1 ? '' : 'disabled'}>›</button></div>` : ''}`;
  let d = ''; try { d = await photoData(id); } catch (e) { console.error(e); }
  if (lb.ids[lb.i] !== id || !document.getElementById('viewer')) return;
  const st = el.querySelector('.lb-stage');
  st.innerHTML = d ? `<img src="${d}" alt="รูปที่ ${i + 1}" data-act="lbZoom" title="แตะเพื่อซูม">` : '<div class="lb-load">เปิดรูปนี้ไม่ได้ (อาจถูกลบไปแล้ว)</div>';
  lb.ids.forEach(x => { if (x !== id) photoData(x).catch(() => {}); });
}
function navViewer(d) { const j = lb.i + d; if (j < 0 || j >= lb.ids.length) return; lb.i = j; drawViewer(); }
function closeViewer() { document.getElementById('viewer')?.remove(); document.body.style.overflow = ''; }
function photoPicker(label = 'แนบรูป') {
  return `<div class="thumbs" id="thumbs">${thumbsHtml(sheet?.ph, true)}<label class="addthumb">${svg('cam', 22)}${label}<input type="file" accept="image/*" multiple hidden data-act="pickPhoto"></label></div>`;
}

/* ============ AI อ่านรูป ============ */
const AI_PROMPT = {
  watch: 'This is a screenshot from a fitness watch, fitness app or gym machine. Read only what is visible. Reply JSON: {"activity": one of "swim","walk","bike","class","weights","yoga","other" or null, "minutes": number or null, "kcal": number or null (active/total calories burned), "note": short English text or null}. Use null when not clearly visible. Never guess.',
  inbody: 'This is a body composition result sheet (e.g. InBody). Read only what is printed. Reply JSON: {"date": "YYYY-MM-DD" or null, "weight": kg, "smm": skeletal muscle mass kg, "fatKg": body fat mass kg, "fatPct": percent body fat, "bmr": kcal, "visceral": visceral fat level, "water": total body water kg}. Every value is a number or null. Never guess.'
};
async function aiRead(kind, dataUrl) {
  if (S.config.aiOn === false) throw new Error('เจ้าของระบบปิดการใช้ AI ไว้');
  if (!fb.aiMod) {
    if (!fb.appCheck && RECAPTCHA_SITE_KEY) {
      const ac = await import(FBV + 'firebase-app-check.js');
      fb.appCheck = ac.initializeAppCheck(app, { provider: new ac.ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
    }
    const m = await import(FBV + 'firebase-ai.js'); fb.aiMod = m; fb.ai = m.getAI(app, { backend: new m.GoogleAIBackend() }); }
  const parts = [AI_PROMPT[kind], { inlineData: { data: dataUrl.split(',')[1], mimeType: 'image/jpeg' } }];
  const models = [S.config.aiModel || 'gemini-3.5-flash', 'gemini-3.5-flash-lite'].filter((m, i, a) => a.indexOf(m) === i);
  let r, lastErr;
  for (const name of models) {
    try {
      r = await fb.aiMod.getGenerativeModel(fb.ai, { model: name, generationConfig: { responseMimeType: 'application/json' } }).generateContent(parts);
      break;
    } catch (e) { lastErr = e; if (!/\[(429|500|503)|high demand|overloaded/i.test(e.message)) throw e; }
  }
  if (!r) throw new Error('AI ไม่ว่างชั่วคราว ลองใหม่อีกครั้ง หรือกรอกเองได้เลย');
  const txt = r.response.text().replace(/^```json|```$/g, '').trim();
  return JSON.parse(txt);
}

/* ============ วาดหน้า ============ */
async function render() {
  if (!S.me) return;
  renderTabs();
  const t = ui.tab; const pid = S.view;
  try {
    if (S.me.role === 'member' || viewingClient()) {
      if (t === 'today') return await renderToday(pid);
      if (t === 'exercise') return await renderExercise(pid);
      if (t === 'workouts') return await renderWorkouts(pid);
      if (t === 'body') return await renderBody(pid);
      if (t === 'coach') return await renderCoach(pid);
      return await renderMore();
    }
    if (t === 'clients') return await renderClients();
    if (t === 'schedule') return await renderSchedule();
    if (t === 'log') return await renderLog();
    if (t === 'summary') return await renderSummary();
    if (t === 'overview') return await renderOverview();
    if (t === 'trainers') return await renderTrainers();
    if (t === 'team' && isHead()) return await renderTeam();
    if (t === 'system') return await renderSystem();
    return await renderMore();
  } catch (e) {
    console.error(e);
    setMain(`<section class="card"><h2>เปิดหน้านี้ไม่สำเร็จ</h2><p class="small muted">${esc(e.message || e)}</p><button class="btn" data-act="reload">ลองใหม่</button></section>`);
  }
}
function dateNav(ds, act) {
  const isToday = ds === todayStr();
  return `<div class="between" style="align-items:center"><button class="iconbtn" data-act="${act}" data-d="-1" aria-label="วันก่อนหน้า" style="font-size:22px">‹</button>
    <div class="center"><b>${thDate(ds, true)}</b>${isToday ? '' : `<br><button class="btn sm ghost" data-act="${act}" data-d="0">กลับไปวันนี้</button>`}</div>
    <button class="iconbtn" data-act="${act}" data-d="1" aria-label="วันถัดไป" style="font-size:22px">›</button></div>`;
}

/* ---------- ลูกค้า: วันนี้ ---------- */
async function renderToday(pid) {
  const [p, day, acts] = await Promise.all([person(pid, true), dayDoc(pid, ui.date), actsRange(pid, ui.date, ui.date)]);
  const t = p?.targets || {}; const tot = dayTotals(day); const burn = burnOf(acts);
  const addBurn = t.addBurn !== false; const goal = num(t.kcal);
  const remain = goal != null ? goal - tot.k + (addBurn ? burn : 0) : null;
  const pct = goal ? Math.min(100, Math.round(tot.k / (goal + (addBurn ? burn : 0)) * 100)) : 0;
  const macro = (label, v, tg, color) => `<div class="stat"><span>${label}</span><b style="font-size:16px">${r1(v)}<span class="xs muted" style="font-weight:400"> ${tg ? '/ ' + tg + ' g' : 'g'}</span></b><div class="bar"><i style="width:${tg ? Math.min(100, Math.round(v / tg * 100)) : 0}%;background:${color}"></i></div></div>`;
  const water = +day.water || 0; const wGoal = num(t.water) || 2500;
  const mealRows = MEALS.map(m => {
    const items = day.meals?.[m] || []; const mk = items.reduce((a, x) => a + (+x.k || 0), 0);
    return `<div class="li" style="align-items:flex-start;flex-direction:column;gap:6px">
      <div class="between" style="width:100%"><b class="goldt small">${m}</b><span class="small"><b>${items.length ? n0(mk) + ' kcal' : ''}</b></span></div>
      ${items.map((it, i) => `<div class="between" style="width:100%;align-items:center"><span class="small grow">${esc(it.n)}${it.q ? ` <span class="muted">· ${esc(it.qs || it.q)}</span>` : ''}</span><span class="small">${n0(it.k)}</span><button class="iconbtn" style="width:36px;height:36px" data-act="rmFood" data-m="${m}" data-i="${i}" aria-label="ลบ ${esc(it.n)}">×</button></div>${it.ph?.length ? `<div class="thumbs mini">${thumbsHtml(it.ph)}</div>` : ''}`).join('')}
      <button class="btn sm ghost" data-act="addFood" data-m="${m}">+ เพิ่ม${m}</button></div>`;
  }).join('');
  setMain(`
    ${dateNav(ui.date, 'dayNav')}
    <section class="card dark" aria-label="สรุปพลังงาน">
      ${goal != null ? `<div class="between"><div><div class="small muted">เหลือกินได้อีก</div><span class="big ${remain < 0 ? '' : 'gold'}" style="${remain < 0 ? 'color:#F59E6B' : ''}">${n0(remain)}</span> <span class="muted">kcal</span></div><div class="xs muted" style="text-align:right">กินไปแล้ว ${pct}%<br>ของงบวันนี้</div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="grid3"><div><div class="xs muted">เป้าหมาย</div><b>${n0(goal)}</b></div><div><div class="xs muted">− กินไป</div><b style="color:#F0D48E">${n0(tot.k)}</b></div><div><div class="xs muted">${addBurn ? '+ เผาผลาญ' : 'เผาผลาญ (ไม่นับคืน)'}</div><b style="color:#A9CBEE">${n0(burn)}</b></div></div>`
      : `<div><div class="small muted">กินไปแล้ว</div><span class="big gold">${n0(tot.k)}</span> <span class="muted">kcal</span></div><div class="small muted">เผาผลาญ ${n0(burn)} kcal · โค้ชยังไม่ได้ตั้งเป้าหมาย</div>`}
      ${isStaff() ? `<button class="btn sm gold" data-act="editTargets">ตั้งเป้าหมาย</button>` : ''}
    </section>
    <section class="grid3" aria-label="สารอาหาร">${macro('โปรตีน', tot.p, num(t.p), '#1D3A5C')}${macro('คาร์บ', tot.c, num(t.c), '#B8862B')}${macro('ไขมัน', tot.f, num(t.f), '#7A6A58')}</section>
    <section class="card" aria-label="น้ำ"><div class="row"><div class="grow" style="flex:1"><b>น้ำ ${r1(water / 1000)}</b> <span class="muted">/ ${r1(wGoal / 1000)} ลิตร</span><div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, Math.round(water / wGoal * 100))}%"></i></div></div><button class="btn sm ghost" data-act="water" data-v="-250" aria-label="ลดน้ำ 250 มล.">−</button><button class="btn sm" data-act="water" data-v="250">+250 มล.</button></div></section>
    <section aria-label="มื้ออาหาร" style="display:flex;flex-direction:column;gap:8px"><h2>มื้ออาหาร</h2><div class="list">${mealRows}</div></section>
    ${day.coachNote ? `<section class="card sand"><b class="xs" style="color:#5E440D">โน้ตจากโค้ช ${esc(p?.trainerName || '')}</b><span>${esc(day.coachNote)}</span></section>` : ''}
    ${isStaff() ? `<section class="card"><label class="f">โน้ตถึงลูกค้าสำหรับวันนี้<textarea class="in" id="coachNote">${esc(day.coachNote || '')}</textarea></label><button class="btn sm pri" data-act="saveCoachNote">บันทึกโน้ต</button></section>` : ''}
  `);
  fillThumbs();
}
async function mutateDay(pid, ds, fn) {
  const ref = D('people', pid, 'days', ds);
  await fb.runTransaction(db, async tx => {
    const s = await tx.get(ref); const d = s.exists() ? s.data() : { meals: {}, water: 0 };
    d.meals = d.meals || {}; fn(d); d.updatedAt = fb.serverTimestamp(); d.date = ds;
    tx.set(ref, d);
  });
}

/* ---------- เพิ่มอาหาร ---------- */
function foodSheetBody() {
  const s = sheet;
  if (s.mode === 'manual') return `
    ${foodModeChips()}
    <label class="f">ชื่ออาหาร<input class="in" id="mfName" value="${esc(s.mf.n || '')}"></label>
    <div class="grid2"><label class="f">แคลอรี (kcal)<input class="in" id="mfK" inputmode="decimal" value="${esc(s.mf.k ?? '')}"></label><label class="f">โปรตีน (g)<input class="in" id="mfP" inputmode="decimal" value="${esc(s.mf.p ?? '')}"></label>
    <label class="f">คาร์บ (g)<input class="in" id="mfC" inputmode="decimal" value="${esc(s.mf.c ?? '')}"></label><label class="f">ไขมัน (g)<input class="in" id="mfF" inputmode="decimal" value="${esc(s.mf.f ?? '')}"></label></div>
    <p class="xs muted" style="margin:0">ดูค่าจากฉลากโภชนาการ ถ้าฉลากบอกต่อหน่วยบริโภค ให้คูณจำนวนที่กินจริง</p>
    ${mealSel()}${photoPicker('รูปจาน/ฉลาก')}
    <button class="btn pri block" data-act="saveFood">บันทึก</button>`;
  if (s.mode === 'quick') return quickSheetBody();
  if (s.mode === 'noodle') return noodleSheetBody();
  if (s.mode === 'cafe') return cafeSheetBody();
  const q = (s.q || '').trim().toLowerCase(), qn = normTh(q);
  const res = q ? FOODS.filter(f => f.n.toLowerCase().includes(q) || (f.cat || '').includes(q) || (f.al || '').toLowerCase().includes(q) || (qn && (normTh(f.n).includes(qn) || normTh(f.al).includes(qn)))).slice(0, 40) : [];
  const hintCafe = qn && /กาแฟ|ลาเต|อเมิกา|มอคคา|คาปู|เอสเย็น|ชาเย็น|ชานม|โกโก|มทฉ|มจฉ|มัท|ชาเขียว|สมูท|คาเฟ|เบเกอ|ควซอง|คซอง|เคก|บาวนี|มฟฟิน|คุกกี|โอเลียง|นมชมพู|ขนม|latte|mocha|coffee|americano|matcha|cafe/.test(qn);
  const hintQ = qn && /กเพา|ขาว|ผด|บอกโคล|ไขดาว|ตามสง|ราด|กวยเตยว|เสน|บหม|เยนตาโฟ|เกาเหลา|มามา|กวยจบ|วนเสน/.test(qn);
  const f = s.pick ? FOOD[s.pick] : null;
  let pickHtml = '';
  if (f) {
    const qty = num(s.qty) ?? f.d; const v = foodCalc(f, qty);
    pickHtml = `<section class="card gold-edge"><b>${esc(f.n)}</b>
      <label class="f">${f.u === 'g' ? 'น้ำหนัก (กรัม)' : 'จำนวน (' + esc(f.un || 'หน่วย') + ')'}<input class="in" id="fQty" inputmode="decimal" value="${esc(s.qty ?? f.d)}"></label>
      <div class="small">≈ <b>${n0(v.k)} kcal</b> · P ${v.p} · C ${v.c} · F ${v.f} g</div>${f.qk ? `<button class="btn sm ghost" style="margin-top:8px" data-act="qkFrom" data-id="${f.id}">ปรับข้าว ไข่ น้ำมัน หรือสั่งพิเศษ ›</button>` : ''}${f.cf || f.bk ? `<button class="btn sm ghost" style="margin-top:8px" data-act="cfFrom" data-id="${f.id}">${f.cf ? 'ปรับขนาด นม ความหวาน ท็อปปิ้ง หรือเพิ่มขนม ›' : 'เพิ่มเครื่องดื่มคู่กัน ›'}</button>` : ''}</section>`;
  }
  return `${foodModeChips()}
    <label class="f">ค้นหาอาหาร<input class="in" id="fSearch" value="${esc(s.q || '')}" placeholder="เช่น ไข่ ปลา ข้าว อกไก่" autocomplete="off"></label>
    ${hintCafe ? `<div class="chips"><button class="chip" data-act="foodMode" data-v="cafe">ประกอบแก้วเครื่องดื่ม + ขนม (คาเฟ่) ›</button></div>` : ''}
    ${hintQ ? `<div class="chips"><button class="chip" data-act="foodMode" data-v="quick">ประกอบจานด่วน/ข้าวราด ›</button><button class="chip" data-act="foodMode" data-v="noodle">ประกอบชามก๋วยเตี๋ยว ›</button></div>` : ''}
    ${res.length ? `<div class="foodres">${res.map(x => `<button type="button" data-act="pickFood" data-id="${x.id}">${esc(x.n)} <span class="xs muted">· ${x.d} ${x.u === 'g' ? 'g' : esc(x.un || '')} · ${n0(foodCalc(x, x.d).k)} kcal</span></button>`).join('')}</div>` : (q ? '<p class="small muted" style="margin:0">ไม่พบในคลัง ลองคำอื่น หรือกด “กรอกเอง”</p>' : '')}
    ${pickHtml}${mealSel()}${photoPicker('รูปจาน')}
    <button class="btn pri block" data-act="saveFood" ${f ? '' : 'disabled'}>บันทึก</button>`;
}
function foodModeChips() {
  const m = sheet.mode || 'db';
  return `<div class="chips">${[['db', 'ค้นจากคลัง'], ['quick', 'จานด่วน/ข้าวราด'], ['noodle', 'ก๋วยเตี๋ยว'], ['cafe', 'คาเฟ่/กาแฟ'], ['manual', 'กรอกเอง']].map(([k, l]) => `<button class="chip" data-act="foodMode" data-v="${k}" aria-pressed="${m === k}">${l}</button>`).join('')}</div>`;
}
/* ---------- จานด่วน / ก๋วยเตี๋ยว: เลือกเหมือนสั่งที่ร้าน แอปคำนวณ kcal ให้ ---------- */
const QK_DEF = { style: 'krapao', protein: 'porkmince', size: 1, oil: 1, rice: 'white', riceG: 200, ate: 100, egg: 'fried', eggN: 1, prikpla: 0 };
const ND_DEF = { type: 'lek', soup: 'clear', tops: ['pork', 'ball'], size: 1, sip: 1, sugar: 0, peanut: 0, kakmoo: 0, garlic: 0 };
function lsGet(k, d) { try { return { ...d, ...(JSON.parse(localStorage.getItem(k) || 'null') || {}) }; } catch (e) { return { ...d }; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ไม่มี storage ก็ใช้ต่อได้ */ } }
function qkState() { if (!sheet.qk) sheet.qk = lsGet('oc_quick', QK_DEF); return sheet.qk; }
function ndState() { if (!sheet.nd) sheet.nd = lsGet('oc_noodle', ND_DEF); return sheet.nd; }
function optChips(list, cur, act, key, sub) {
  return `<div class="chips">${list.map(x => `<button class="chip" data-act="${act}" data-k="${key}" data-v="${x.k}" aria-pressed="${String(cur) === String(x.k)}">${esc(x.n)}${sub && x.k2 != null ? ` <span class="xs" style="opacity:.7">${n0(x.k2)}</span>` : ''}</button>`).join('')}</div>`;
}
function totalBox(r) {
  return `<section class="card gold-edge"><b>${esc(r.name)}</b><div class="xs muted">${esc(r.desc)}</div>
    <div style="margin-top:6px"><span class="big">${n0(r.k)}</span> <span class="muted">kcal</span></div>
    <div class="small">โปรตีน ${r.p} g · คาร์บ ${r.c} g · ไขมัน ${r.f} g</div></section>`;
}
function quickSheetBody() {
  const st = qkState(), r = quickCalc(st), lb = t => `<div class="small"><b>${t}</b></div>`;
  return `${foodModeChips()}
    <p class="xs muted" style="margin:0">เลือกเหมือนสั่งร้านตามสั่ง แอปรวม kcal ให้ · ตัวเลขเล็กบนปุ่มคือ kcal ของส่วนนั้น</p>
    ${lb('1. เมนูผัด')}${optChips(QUICK.styles, st.style, 'qkSet', 'style')}
    ${lb('2. เนื้อสัตว์ (หรือไม่ใส่ = ผักล้วน)')}${optChips(QUICK.proteins, st.protein, 'qkSet', 'protein', 1)}
    ${optChips(QUICK.size, st.size, 'qkSet', 'size')}
    ${lb('3. ข้าว')}${optChips(QUICK.riceG, st.riceG, 'qkSet', 'riceG')}
    ${+st.riceG ? `${optChips(QUICK.riceType, st.rice, 'qkSet', 'rice')}<div class="xs muted">กินข้าวไป</div>${optChips(QUICK.ate, st.ate, 'qkSet', 'ate')}` : ''}
    ${lb('4. ไข่')}${optChips(QUICK.eggs, st.egg, 'qkSet', 'egg', 1)}
    ${st.egg !== 'none' ? optChips([{ k: 1, n: '1 ฟอง' }, { k: 2, n: '2 ฟอง' }], st.eggN, 'qkSet', 'eggN') : ''}
    ${lb('5. สั่งเพิ่ม')}${optChips(QUICK.oilLv, st.oil, 'qkSet', 'oil')}
    <div class="chips"><button class="chip" data-act="qkSet" data-k="prikpla" data-v="${+st.prikpla ? 0 : 1}" aria-pressed="${!!+st.prikpla}">พริกน้ำปลา</button></div>
    ${totalBox(r)}${mealSel()}${photoPicker('รูปจาน')}
    <button class="btn pri block" data-act="saveBuilt" data-v="quick">บันทึกจานนี้</button>`;
}
function noodleSheetBody() {
  const st = ndState(), r = noodleCalc(st), sp = NOODLE.soups.find(x => x.k === st.soup) || NOODLE.soups[0], lb = t => `<div class="small"><b>${t}</b></div>`;
  return `${foodModeChips()}
    <p class="xs muted" style="margin:0">เลือกเส้น น้ำ และของใส่เหมือนสั่งที่ร้าน · ของใส่เลือกได้หลายอย่าง · ตัวเลขเล็กคือ kcal</p>
    ${lb('1. เส้น')}${optChips(NOODLE.types, st.type, 'ndSet', 'type', 1)}
    ${lb('2. น้ำ / แบบ')}${optChips(NOODLE.soups, st.soup, 'ndSet', 'soup', 1)}
    ${sp.dry ? '' : `<div class="xs muted">น้ำซุป</div>${optChips(NOODLE.sip, st.sip, 'ndSet', 'sip')}`}
    ${lb('3. ของใส่')}<div class="chips">${NOODLE.tops.map(x => `<button class="chip" data-act="ndTop" data-v="${x.k}" aria-pressed="${(st.tops || []).includes(x.k)}">${esc(x.n)} <span class="xs" style="opacity:.7">${n0(x.k2)}</span></button>`).join('')}</div>
    ${lb('4. ขนาด')}${optChips(NOODLE.size, st.size, 'ndSet', 'size')}
    ${lb('5. ปรุงเพิ่ม')}<div class="xs muted">น้ำตาล (ช้อนชา)</div>${optChips([{ k: 0, n: 'ไม่ใส่' }, { k: 1, n: '1' }, { k: 2, n: '2' }], st.sugar, 'ndSet', 'sugar')}
    <div class="xs muted">ถั่วลิสงป่น (ช้อนชา)</div>${optChips([{ k: 0, n: 'ไม่ใส่' }, { k: 1, n: '1' }, { k: 2, n: '2' }], st.peanut, 'ndSet', 'peanut')}
    <div class="chips"><button class="chip" data-act="ndSet" data-k="kakmoo" data-v="${+st.kakmoo ? 0 : 1}" aria-pressed="${!!+st.kakmoo}">กากหมูเจียว</button><button class="chip" data-act="ndSet" data-k="garlic" data-v="${+st.garlic ? 0 : 1}" aria-pressed="${!!+st.garlic}">กระเทียมเจียวเพิ่ม</button></div>
    ${totalBox(r)}${mealSel()}${photoPicker('รูปชาม')}
    <button class="btn pri block" data-act="saveBuilt" data-v="noodle">บันทึกชามนี้</button>`;
}
/* ---------- คาเฟ่: กาแฟ ชา นม น้ำ + เบเกอรี่ ---------- */
const CF_DEF = { drink: 'americano', temp: 'iced', size: 1, milk: 'whole', sweet: 0, extras: [], drank: 100, noDrink: 0, bk: {}, share: 100 };
function cfState() { if (!sheet.cf) { sheet.cf = lsGet('oc_cafe', CF_DEF); sheet.cf.bk = {}; sheet.cf.share = 100; sheet.cf.noDrink = 0; } return sheet.cf; }
function cfBakery(st) { return Object.entries(st.bk || {}).filter(([, n]) => n > 0).map(([k, n]) => ({ k, ...bakeryCalc(k, n, st.share) })).filter(x => x.name); }
function cafeSheetBody() {
  const st = cfState(), d = CAFE.drinks.find(x => x.k === st.drink) || CAFE.drinks[0], r = cafeCalc(st), bks = cfBakery(st), lb = t => `<div class="small"><b>${t}</b></div>`;
  const on = !+st.noDrink, TL = cafeTemps(d);
  const tot = [...(on ? [r] : []), ...bks].reduce((a, x) => ({ k: a.k + x.k, p: r1(a.p + x.p), c: r1(a.c + x.c), f: r1(a.f + x.f) }), { k: 0, p: 0, c: 0, f: 0 });
  const drinkUi = on ? `
    ${CAFE.groups.map(g => `<div class="xs muted">${g.n}</div><div class="chips">${CAFE.drinks.filter(x => x.g === g.k).map(x => `<button class="chip" data-act="cfSet" data-k="drink" data-v="${x.k}" aria-pressed="${st.drink === x.k}">${esc(x.n)}</button>`).join('')}</div>`).join('')}
    ${d.fix ? '' : `${lb('2. ร้อน / เย็น / ปั่น และขนาดแก้ว')}${optChips(TL, r.temp, 'cfSet', 'temp')}${optChips(CAFE.sizes, st.size, 'cfSet', 'size')}`}
    ${d.milk ? `${lb('3. นม')}${optChips(CAFE.milks, st.milk, 'cfSet', 'milk')}` : ''}
    ${d.nosw ? '' : `${lb('4. ความหวาน')}${optChips(CAFE.sweets, st.sweet ?? d.sw0, 'cfSet', 'sweet')}`}
    ${lb('5. เพิ่มท็อปปิ้ง')}<div class="chips">${CAFE.extras.map(x => `<button class="chip" data-act="cfEx" data-v="${x.k}" aria-pressed="${(st.extras || []).includes(x.k)}">${esc(x.n)} <span class="xs" style="opacity:.7">${n0(x.k2)}</span></button>`).join('')}</div>
    <div class="xs muted">ดื่มไป</div>${optChips(CAFE.drank, st.drank, 'cfSet', 'drank')}` : '';
  return `${foodModeChips()}
    <p class="xs muted" style="margin:0">เลือกเหมือนสั่งที่ร้านคาเฟ่ แอปรวม kcal ให้ · ขนมแตะซ้ำเพื่อเพิ่มจำนวน (สูงสุด 3 แล้ววนกลับเป็น 0)</p>
    ${lb('1. เครื่องดื่ม')}<div class="chips"><button class="chip" data-act="cfSet" data-k="noDrink" data-v="${on ? 1 : 0}" aria-pressed="${!on}">ไม่สั่งเครื่องดื่ม (บันทึกแค่ขนม)</button></div>
    ${drinkUi}
    ${lb('6. เบเกอรี่ / ขนม')}<div class="chips">${CAFE.bakery.map(x => { const n = +(st.bk || {})[x.k] || 0; return `<button class="chip" data-act="cfBk" data-v="${x.k}" aria-pressed="${n > 0}">${n > 1 ? `×${n} ` : ''}${esc(x.n)} <span class="xs" style="opacity:.7">${n0(x.k2)}</span></button>`; }).join('')}</div>
    ${bks.length ? `<div class="xs muted">กินขนมกี่ส่วน</div>${optChips(CAFE.share, st.share, 'cfSet', 'share')}<div class="chips"><button class="chip" data-act="cfBkClr">ล้างขนมที่เลือก</button></div>` : ''}
    <section class="card gold-edge">${on ? `<div><b>${esc(r.name)}</b> <span class="small">${n0(r.k)} kcal</span><div class="xs muted">${esc(r.desc)}</div></div>` : ''}
      ${bks.map(x => `<div style="margin-top:4px"><b>${esc(x.name)}</b> <span class="small">${n0(x.k)} kcal</span>${x.desc !== 'เบเกอรี่/ขนม' ? `<div class="xs muted">${esc(x.desc)}</div>` : ''}</div>`).join('')}
      <div style="margin-top:6px"><span class="big">${n0(tot.k)}</span> <span class="muted">kcal รวม</span></div>
      <div class="small">โปรตีน ${tot.p} g · คาร์บ ${tot.c} g · ไขมัน ${tot.f} g</div></section>
    ${mealSel()}${photoPicker('รูปแก้ว/ขนม')}
    <button class="btn pri block" data-act="saveCafe" ${on || bks.length ? '' : 'disabled'}>บันทึก${on ? 'เครื่องดื่ม' : ''}${on && bks.length ? ' + ' : ''}${bks.length ? 'ขนม' : ''}</button>`;
}
async function saveCafe() {
  const s = sheet, st = cfState(), meal = $('#fMeal').value, on = !+st.noDrink, items = [], now = Date.now();
  if (on) { const r = cafeCalc(st); items.push({ n: r.name, q: 1, qs: r.desc, k: r.k, p: r.p, c: r.c, f: r.f, src: 'cafe', opt: { drink: st.drink, temp: r.temp, size: st.size, milk: st.milk, sweet: st.sweet, extras: [...(st.extras || [])], drank: st.drank } }); }
  cfBakery(st).forEach(x => items.push({ n: x.name, q: 1, qs: x.desc, k: x.k, p: x.p, c: x.c, f: x.f, src: 'bakery' }));
  if (!items.length) return toast('เลือกเครื่องดื่มหรือขนมก่อน');
  items.forEach((it, i) => { it.t = now + i; it.by = S.me.role; });
  if (s.ph?.length) items[0].ph = s.ph;
  const { bk, share, noDrink, ...keep } = st; lsSet('oc_cafe', keep);
  await mutateDay(S.view, ui.date, d => { (d.meals[meal] = d.meals[meal] || []).push(...items); });
  const k = items.reduce((a, x) => a + x.k, 0);
  closeSheet(); toast(`บันทึก ${items.length} รายการ ${n0(k)} kcal`); render();
}
function qkNum(k, v) { return ['size', 'oil', 'riceG', 'ate', 'eggN', 'prikpla', 'sip', 'sugar', 'peanut', 'kakmoo', 'garlic'].includes(k) ? +v : v; }
function redrawFood() { const y = $('#sheetBody')?.parentElement?.scrollTop; refreshSheet(foodSheetBody()); fillThumbs($('#sheetBody')); const sh = $('#sheetBody')?.parentElement; if (sh && y != null) sh.scrollTop = y; }
async function saveBuilt(el) {
  const s = sheet, kind = el.dataset.v, st = kind === 'quick' ? qkState() : ndState(), r = kind === 'quick' ? quickCalc(st) : noodleCalc(st), meal = $('#fMeal').value;
  const item = { n: r.name, q: 1, qs: r.desc, k: r.k, p: r.p, c: r.c, f: r.f, src: kind, opt: { ...st } };
  if (s.ph?.length) item.ph = s.ph;
  item.t = Date.now(); item.by = S.me.role;
  lsSet(kind === 'quick' ? 'oc_quick' : 'oc_noodle', st);
  await mutateDay(S.view, ui.date, d => { (d.meals[meal] = d.meals[meal] || []).push(item); });
  closeSheet(); toast(`บันทึก ${r.name} ${n0(r.k)} kcal`); render();
}
function mealSel() { return `<label class="f">มื้อ<select class="in" id="fMeal">${MEALS.map(m => `<option ${m === sheet.meal ? 'selected' : ''}>${m}</option>`).join('')}</select></label>`; }
async function saveFood() {
  const s = sheet; const meal = $('#fMeal').value; let item;
  if (s.mode === 'manual') {
    const n = $('#mfName').value.trim(); const k = num($('#mfK').value);
    if (!n || k == null) return toast('กรอกชื่ออาหารและแคลอรี');
    item = { n, k: Math.round(k), p: r1(num($('#mfP').value) || 0), c: r1(num($('#mfC').value) || 0), f: r1(num($('#mfF').value) || 0), src: 'manual' };
  } else {
    const f = FOOD[s.pick]; const qty = num($('#fQty').value) ?? f.d; const v = foodCalc(f, qty);
    item = { id: f.id, n: f.n, q: qty, qs: qty + ' ' + (f.u === 'g' ? 'g' : (f.un || '')), ...v };
  }
  if (s.ph?.length) item.ph = s.ph;
  item.t = Date.now(); item.by = S.me.role;
  await mutateDay(S.view, ui.date, d => { (d.meals[meal] = d.meals[meal] || []).push(item); });
  closeSheet(); toast('บันทึกแล้ว'); render();
}

/* ---------- ลูกค้า: ออกกำลังกาย ---------- */
async function renderExercise(pid) {
  const ws = weekStart(ui.exDate); const we = addDays(ws, 6);
  const [acts, sess] = await Promise.all([actsRange(pid, ws, we), sessionsFor(pid)]);
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const planned = sess.filter(s => s.status === 'planned');
  const dayActs = acts.filter(a => a.date === ui.exDate);
  const burn = burnOf(dayActs); const mins = dayActs.reduce((a, x) => a + (+x.min || 0), 0);
  const next = planned.filter(s => (s.date + s.time) >= (todayStr() + nowHM())).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  setMain(`
    <div class="between"><h1>ออกกำลังกาย</h1><div class="row"><button class="iconbtn" data-act="exWeek" data-d="-7" aria-label="สัปดาห์ก่อน">‹</button><button class="iconbtn" data-act="exWeek" data-d="7" aria-label="สัปดาห์ถัดไป">›</button></div></div>
    <nav class="week" aria-label="เลือกวัน">${days.map(d => { const has = acts.some(a => a.date === d); const ap = planned.some(s => s.date === d);
      return `<button class="day ${ap ? 'appt' : ''}" data-act="exDay" data-v="${d}" aria-pressed="${d === ui.exDate}"><small>${TH_D[dowOf(d)]}</small><b>${+d.slice(8)}</b><em>${ap ? 'นัด' : has ? 'ทำแล้ว' : ''}</em></button>`; }).join('')}</nav>
    <section class="card"><div class="small muted">เผาผลาญ${thDate(ui.exDate, true)}</div><div><span class="big blue">${n0(burn)}</span> <span class="muted">kcal</span></div><div class="small muted">${dayActs.length} กิจกรรม · ${n0(mins)} นาที · นำไปคำนวณในหน้าแรกให้อัตโนมัติ</div></section>
    <section style="display:flex;flex-direction:column;gap:8px"><h2>กิจกรรม</h2>
      ${dayActs.length ? `<div class="list">${dayActs.map(a => `<div class="li"><div class="grow"><b>${esc(a.name || ACT[a.type]?.[0] || 'กิจกรรม')}</b><div class="small muted">${n0(a.min)} นาที · ${a.source === 'coach' ? 'บันทึกโดยโค้ช' : 'บันทึกเอง'}${clipTag(a.ph)}</div>
        ${a.ph?.length ? `<div class="thumbs" style="margin-top:6px">${thumbsHtml(a.ph)}</div>` : ''}${a.source === 'coach' ? `<button class="btn sm ghost" style="margin-top:6px" data-act="tab" data-v="workouts">ดูผลการเทรน</button>` : ''}</div>
        <b class="blue">${n0(a.kcal)}</b>${(a.source !== 'coach' || isStaff()) ? `<button class="iconbtn" data-act="rmAct" data-id="${a.id}" aria-label="ลบกิจกรรม">${svg('trash', 18)}</button>` : ''}</div>`).join('')}</div>` : '<p class="small muted" style="margin:0">ยังไม่มีกิจกรรมในวันนี้</p>'}
    </section>
    ${next ? `<section class="card dark"><div class="between"><div><div class="xs muted">นัดเทรนถัดไป</div><b>${thDate(next.date)} · ${esc(next.time)} · ${esc(next.type)}</b></div><span class="tag gold">${esc(next.trainerName || 'โค้ช')}</span></div></section>` : ''}
    <button class="btn gold block" data-act="addAct">+ เพิ่มกิจกรรม</button>
    <button class="btn ghost" data-act="tab" data-v="workouts">ผลการเทรนกับโค้ชทั้งหมด</button>
  `);
  fillThumbs();
}
async function openAddAct() {
  const rows = await bodyRows(S.view); const p = await person(S.view);
  sheet = null;
  openSheet('เพิ่มกิจกรรม', '', { kind: 'act', type: 'swim', date: ui.exDate, min: 30, kcal: '', mode: 'manual', name: '', ph: [], lastImg: null, weight: latestWeight(rows) || num(p?.weight) || 65 });
  refreshSheet(actSheetBody());
}
function actSheetBody() {
  const s = sheet; const met = ACT[s.type][1]; const est = Math.round(met * s.weight * ((num(s.min) || 0) / 60));
  const named = { class: ['ชื่อคลาส', 'เช่น Body Combat, Zumba'], other: ['ชื่อกิจกรรม', 'เช่น แบดมินตัน, ปีนผา'] }[s.type];
  return `<label class="f">วันที่<input class="in" type="date" id="aDate" value="${s.date}"></label>
    <div><div class="small" style="font-weight:600;margin-bottom:8px">ประเภทกิจกรรม</div><div class="chipgrid">${Object.entries(ACT).filter(([k]) => k !== 'coach').map(([k, v]) => `<button type="button" class="chip" data-act="actType" data-v="${k}" aria-pressed="${s.type === k}">${v[0]}</button>`).join('')}</div></div>
    ${named ? `<label class="f">${named[0]}<input class="in" id="aName" value="${esc(s.name)}" placeholder="${named[1]}"></label>` : ''}
    <label class="f">ระยะเวลา (นาที)<input class="in" id="aMin" inputmode="numeric" value="${esc(s.min)}"></label>
    <div><div class="small" style="font-weight:600;margin-bottom:8px">แคลอรีที่เผาผลาญ</div>
      <div class="chips"><button type="button" class="chip" data-act="actMode" data-v="manual" aria-pressed="${s.mode === 'manual'}">กรอกเอง</button><button type="button" class="chip" data-act="actMode" data-v="auto" aria-pressed="${s.mode === 'auto'}">ให้แอปประมาณ</button></div>
      ${s.mode === 'manual' ? `<label class="f" style="margin-top:8px">ดูตัวเลขจากนาฬิกา หรือหน้าจอเครื่องในคลาส<input class="in" id="aKcal" inputmode="numeric" value="${esc(s.kcal)}" placeholder="kcal"></label>`
      : `<div class="card" style="margin-top:8px"><b class="blue" style="font-size:20px">≈ ${n0(est)} kcal</b><span class="xs muted">ประมาณจากประเภทกิจกรรม × เวลา × น้ำหนักตัวล่าสุด (${r1(s.weight)} kg)</span></div>`}</div>
    <div><div class="small" style="font-weight:600;margin-bottom:8px">รูปหลักฐาน <span class="muted" style="font-weight:400">(ไม่บังคับ)</span></div>${photoPicker()}
      <p class="xs muted" style="margin:6px 0 0">รูปหน้าจอนาฬิกา แอปออกกำลังกาย หรือหน้าจอเครื่องในคลาส</p>
      ${s.lastImg ? `<button class="btn gold block" style="margin-top:8px" data-act="aiWatch">${svg('spark', 18)} ${s.aiMsg || 'ให้ AI อ่านเวลาและแคลจากรูป'}</button>` : ''}</div>
    <button class="btn pri block" data-act="saveAct">บันทึกกิจกรรม</button>`;
}
function readActForm() {
  const s = sheet; s.date = $('#aDate')?.value || s.date; s.min = $('#aMin')?.value ?? s.min;
  if ($('#aKcal')) s.kcal = $('#aKcal').value; if ($('#aName')) s.name = $('#aName').value;
}
async function saveAct() {
  readActForm(); const s = sheet;
  const min = num(s.min) || 0; const est = Math.round(ACT[s.type][1] * s.weight * (min / 60));
  const kcal = s.mode === 'manual' ? num(s.kcal) : est;
  if (kcal == null) return toast('กรอกแคลอรี หรือเลือก “ให้แอปประมาณ”');
  const name = (s.type === 'class' || s.type === 'other') && s.name.trim() ? `${ACT[s.type][0]} · ${s.name.trim()}` : ACT[s.type][0];
  await fb.addDoc(C('people', S.view, 'activities'), { date: s.date, type: s.type, name, min, kcal: Math.round(kcal), source: isStaff() ? 'staff' : 'self', ph: s.ph || [], t: Date.now(), byUid: auth.currentUser.uid });
  ui.exDate = s.date; closeSheet(); toast('บันทึกกิจกรรมแล้ว'); render();
}

/* ---------- ลูกค้า: ผลการเทรนกับโค้ช ---------- */
async function renderWorkouts(pid) {
  const logged = (await sessionsFor(pid)).filter(s => s.status === 'logged').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  if (!logged.length) return setMain(`<button class="btn sm ghost" data-act="tab" data-v="exercise">‹ ออกกำลังกาย</button><section class="card"><h1>ผลการเทรนกับโค้ช</h1><p class="small muted">ยังไม่มีครั้งที่โค้ชบันทึกผล ผลจะขึ้นที่นี่เมื่อโค้ชบันทึกแล้ว</p></section>`);
  const sel = logged[Math.min(ui.wkSel, logged.length - 1)];
  const chrono = [...logged].reverse();
  const topKg = (s, name) => Math.max(0, ...((s.moves || []).filter(m => m.name === name).flatMap(m => m.sets.map(x => +x.kg || 0))));
  const moves = (sel.moves || []).map(m => {
    const top = Math.max(0, ...m.sets.map(x => +x.kg || 0));
    const before = chrono.filter(s => (s.date + s.time) < (sel.date + sel.time)).map(s => topKg(s, m.name));
    const pr = top > 0 && before.length && top > Math.max(0, ...before);
    return `<section class="card"><div class="between"><b>${esc(m.name)}</b>${pr ? `<span class="tag gold">สถิติใหม่ ${wText(top, m.u)}</span>` : ''}</div>
      <div class="sets xs muted" style="grid-template-columns:64px 1fr 1.3fr"><span>เซ็ต</span><span>ครั้ง</span><span>น้ำหนัก</span></div>
      ${m.sets.map((x, i) => { const [a, b] = wBoth(x, m.u); return `<div class="sets" style="grid-template-columns:64px 1fr 1.3fr"><span class="muted small">เซ็ต ${i + 1}</span><b>${esc(x.r)} ครั้ง</b><span><b>${a}</b> <span class="small muted" style="white-space:nowrap">· ${b}</span></span></div>`; }).join('')}</section>`;
  }).join('');
  const allMoves = [...new Set(chrono.flatMap(s => (s.moves || []).map(m => m.name)))];
  const mv = allMoves.includes(ui.wkMove) ? ui.wkMove : (sel.moves?.[0]?.name || allMoves[0]);
  const pts = chrono.map(s => ({ d: s.date, v: topKg(s, mv) })).filter(x => x.v > 0).slice(-8);
  setMain(`<button class="btn sm ghost" data-act="tab" data-v="exercise">‹ ออกกำลังกาย</button>
    <h1>ผลการเทรนกับโค้ช</h1><p class="small muted" style="margin:0">แสดงเฉพาะครั้งที่โค้ชบันทึกผลแล้ว</p>
    <nav class="chips">${logged.slice(0, 8).map((s, i) => `<button class="chip" data-act="wkSel" data-v="${i}" aria-pressed="${s.id === sel.id}">${thDate(s.date)} · ${esc(s.type)}</button>`).join('')}</nav>
    <div class="small muted">${n0(sel.min)} นาที · เผาผลาญ ${n0(sel.kcal)} kcal · โค้ช ${esc(sel.trainerName || '')}</div>
    ${moves || '<p class="small muted">ครั้งนี้โค้ชไม่ได้ใส่รายละเอียดท่า</p>'}
    ${sel.note ? `<section class="card sand"><b class="xs" style="color:#5E440D">โน้ตจากโค้ช</b><span>${esc(sel.note)}</span></section>` : ''}
    ${sel.ph?.length ? `<div class="thumbs">${thumbsHtml(sel.ph)}</div>` : ''}
    ${mv ? `<section class="card dark"><div class="between"><b>พัฒนาการ</b><select class="in" style="max-width:60%;min-height:40px" data-act="wkMove" aria-label="เลือกท่า">${allMoves.map(m => `<option ${m === mv ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></div>
      <span class="xs muted">น้ำหนักสูงสุดในแต่ละครั้งที่โค้ชบันทึก (kg${pts.length ? ` · ล่าสุด ${wText(pts[pts.length - 1].v)}` : ''})</span>${lineChart(pts, '#F0C24B', true)}</section>` : ''}`);
  fillThumbs();
}
function lineChart(pts, color, dark) {
  if (!pts.length) return '<p class="small muted" style="margin:0">ยังไม่มีข้อมูลพอทำกราฟ</p>';
  const W = 320, H = 130, pad = 18; const vs = pts.map(p => p.v); const lo = Math.min(...vs), hi = Math.max(...vs); const span = hi - lo || 1;
  const x = i => pts.length === 1 ? W / 2 : pad + i * (W - 2 * pad) / (pts.length - 1); const y = v => H - pad - (v - lo) / span * (H - 2 * pad);
  const grid = dark ? '#33475E' : '#EFEAE0'; const txt = dark ? '#C9D3DF' : '#5E6470';
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="กราฟ ${pts.map(p => thDate(p.d) + ' ' + r1(p.v)).join(', ')}">
    <path d="M0 ${pad}H${W} M0 ${H / 2}H${W} M0 ${H - pad}H${W}" stroke="${grid}"/>
    <polyline points="${pts.map((p, i) => x(i) + ',' + y(p.v)).join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === pts.length - 1 ? 5.5 : 4}" fill="${color}"/><text x="${x(i)}" y="${H + 12}" fill="${txt}" font-size="10" text-anchor="middle">${r1(p.v)}</text>`).join('')}</svg>`;
}

/* ---------- ลูกค้า: ร่างกาย ---------- */
async function renderBody(pid) {
  const rows = await bodyRows(pid);
  const w = rows.filter(r => num(r.weight)).slice(-12).map(r => ({ d: r.date, v: num(r.weight) }));
  const scans = rows.filter(r => num(r.smm) || num(r.fatPct)); const last = scans[scans.length - 1]; const prev = scans[scans.length - 2];
  const delta = (k, unit) => (last && prev && num(last[k]) != null && num(prev[k]) != null) ? `<span class="xs blue">${num(last[k]) - num(prev[k]) >= 0 ? '+' : ''}${r1(num(last[k]) - num(prev[k]))}${unit}</span>` : '';
  const cell = (label, k, unit) => `<div><div class="xs muted">${label}</div><b style="font-size:18px">${last && num(last[k]) != null ? r1(last[k]) + unit : '—'}</b><br>${delta(k, unit)}</div>`;
  setMain(`<h1>ร่างกาย</h1>
    <section class="card"><div class="between"><b>น้ำหนัก</b>${w.length > 1 ? `<span class="small blue"><b>${w[w.length - 1].v - w[0].v >= 0 ? '+' : ''}${r1(w[w.length - 1].v - w[0].v)} kg</b></span>` : ''}</div>${lineChart(w, '#1D3A5C')}</section>
    <section class="card"><div class="between"><b>ผลสแกนล่าสุด</b><span class="xs muted">${last ? thDate(last.date) : ''}</span></div>
      ${last ? `<div class="grid3">${cell('น้ำหนัก', 'weight', ' kg')}${cell('กล้ามเนื้อ SMM', 'smm', ' kg')}${cell('ไขมัน', 'fatPct', '%')}</div>${last.ph?.length ? `<div class="thumbs">${thumbsHtml(last.ph)}</div>` : ''}` : '<p class="small muted" style="margin:0">ยังไม่มีผลสแกน กด “เพิ่มผลสแกน” แล้วแนบใบ InBody ได้เลย</p>'}</section>
    <div class="grid2"><button class="btn pri" data-act="addBody" data-v="weight">บันทึกน้ำหนัก</button><button class="btn" data-act="addBody" data-v="scan">เพิ่มผลสแกน</button></div>
    ${rows.length ? `<section style="display:flex;flex-direction:column;gap:8px"><h2>ประวัติ</h2><div class="list">${[...rows].reverse().slice(0, 20).map(r => `<div class="li"><div class="grow"><b class="small">${thDate(r.date)}</b><div class="xs muted">${[['weight', 'น้ำหนัก', 'kg'], ['smm', 'SMM', 'kg'], ['fatPct', 'ไขมัน', '%'], ['waist', 'เอว', 'cm'], ['hip', 'สะโพก', 'cm'], ['arm', 'แขน', 'cm']].filter(([k]) => num(r[k]) != null).map(([k, l, u]) => `${l} ${r1(r[k])} ${u}`).join(' · ')}${clipTag(r.ph)}</div></div><button class="iconbtn" data-act="rmBody" data-id="${r.id}" aria-label="ลบรายการ">${svg('trash', 18)}</button></div>`).join('')}</div></section>` : ''}`);
  fillThumbs();
}
const BODY_FIELDS = [['weight', 'น้ำหนัก (kg)'], ['smm', 'กล้ามเนื้อ SMM (kg)'], ['fatKg', 'ไขมัน (kg)'], ['fatPct', 'ไขมัน (%)'], ['bmr', 'BMR (kcal)'], ['visceral', 'ไขมันช่องท้อง (ระดับ)'], ['water', 'น้ำในร่างกาย (kg)'], ['waist', 'รอบเอว (cm)'], ['hip', 'รอบสะโพก (cm)'], ['arm', 'รอบแขน (cm)']];
function bodySheetBody() {
  const s = sheet; const fields = s.mode === 'weight' ? BODY_FIELDS.slice(0, 1) : BODY_FIELDS;
  return `<label class="f">วันที่วัด<input class="in" type="date" id="bDate" value="${esc(s.v.date)}"></label>
    ${s.mode === 'scan' ? `<div><div class="small" style="font-weight:600;margin-bottom:8px">ใบผลสแกน <span class="muted" style="font-weight:400">(ไม่บังคับ)</span></div>${photoPicker('แนบใบ InBody')}
      ${s.lastImg ? `<button class="btn gold block" style="margin-top:8px" data-act="aiInbody">${svg('spark', 18)} ${s.aiMsg || 'ให้ AI กรอกให้'}</button>` : ''}</div>` : ''}
    <div class="grid2">${fields.map(([k, l]) => `<label class="f">${l}<input class="in" inputmode="decimal" data-bf="${k}" value="${esc(s.v[k] ?? '')}" style="${s.aiKeys?.includes(k) ? 'border-color:#E0A526;border-width:2px' : ''}"></label>`).join('')}</div>
    ${s.aiKeys?.length ? '<p class="xs goldt" style="margin:0">ช่องกรอบทองคือค่าที่ AI อ่าน ตรวจกับใบผลอีกครั้งก่อนบันทึก</p>' : ''}
    ${s.mode === 'weight' ? photoPicker('รูปตาชั่ง') : ''}
    <button class="btn pri block" data-act="saveBody">บันทึก</button>`;
}
function readBodyForm() { const s = sheet; s.v.date = $('#bDate')?.value || s.v.date; document.querySelectorAll('[data-bf]').forEach(el => { s.v[el.dataset.bf] = el.value; }); }
async function saveBody() {
  readBodyForm(); const s = sheet; const rec = { date: s.v.date, t: Date.now(), ph: s.ph || [] };
  let any = false; for (const [k] of BODY_FIELDS) { const v = num(s.v[k]); if (v != null) { rec[k] = v; any = true; } }
  if (!any) return toast('กรอกอย่างน้อย 1 ค่า');
  await fb.addDoc(C('people', S.view, 'body'), rec); closeSheet(); toast('บันทึกแล้ว'); render();
}

/* ---------- ลูกค้า: โค้ช ---------- */
async function renderCoach(pid) {
  const [p, sess] = await Promise.all([person(pid, true), sessionsFor(pid)]);
  const t = p?.targets || {}; const now = todayStr() + nowHM();
  const upcoming = sess.filter(s => s.status === 'planned' && (s.date + s.time) >= now).slice(0, 6);
  const notes = sess.filter(s => s.status === 'logged' && s.note).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 3);
  setMain(`<h1>โค้ชของฉัน</h1>
    <section class="card dark"><div class="row"><div style="width:52px;height:52px;border-radius:26px;background:#E0A526;color:#14202E;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif Thai',serif;font-size:20px;font-weight:700">${esc((p?.trainerName || 'P').slice(0, 1))}</div>
      <div class="grow" style="flex:1"><b style="font-size:17px">${esc(p?.trainerName || 'ยังไม่มีโค้ช')}</b><div class="small muted">เทรนเนอร์ส่วนตัว · The Olympic Club</div></div></div></section>
    <section class="card"><div class="between"><b>เป้าหมายที่โค้ชตั้ง</b>${isStaff() ? '<button class="btn sm" data-act="editTargets">แก้เป้าหมาย</button>' : ''}</div>
      ${t.kcal ? `<div class="grid4"><div><div class="xs muted">พลังงาน</div><b>${n0(t.kcal)}</b></div><div><div class="xs muted">โปรตีน</div><b>${t.p ? n0(t.p) + ' g' : '—'}</b></div><div><div class="xs muted">คาร์บ</div><b>${t.c ? n0(t.c) + ' g' : '—'}</b></div><div><div class="xs muted">ไขมัน</div><b>${t.f ? n0(t.f) + ' g' : '—'}</b></div></div>
      <div class="small muted">นับแคลที่เผาผลาญคืนให้: ${t.addBurn === false ? 'ปิด' : 'เปิด'}</div>` : '<p class="small muted" style="margin:0">โค้ชยังไม่ได้ตั้งเป้าหมาย</p>'}</section>
    <section style="display:flex;flex-direction:column;gap:8px"><h2>นัดเทรนที่จะถึง</h2>${upcoming.length ? `<div class="list">${upcoming.map(s => `<div class="li"><div class="grow"><b>${thDate(s.date, true)} · ${esc(s.time)}</b><div class="small muted">${esc(s.type)} · กับ ${esc(s.trainerName || 'โค้ช')}</div></div></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">ยังไม่มีนัด</p>'}</section>
    ${notes.length ? `<section style="display:flex;flex-direction:column;gap:8px"><h2>ความเห็นล่าสุดจากโค้ช</h2>${notes.map(s => `<div class="card sand"><b class="xs" style="color:#5E440D">${thDate(s.date)} · หลังเทรน ${esc(s.type)}</b><span>${esc(s.note)}</span></div>`).join('')}</section>` : ''}
    <div class="card" style="border:1px solid var(--line);flex-direction:row;justify-content:space-between"><span class="small muted">แจ้งเตือนทาง LINE</span><b class="small muted">${S.config.lineOn ? 'เปิดอยู่' : 'ยังไม่เปิด'}</b></div>`);
}

/* ---------- เพิ่มเติม ---------- */
async function renderMore() {
  if (S.config.lineUrl && !line.info) lineInfo().then(() => { if (ui.tab === 'more') render(); });
  const me = S.me; const staff = isStaff() && !viewingClient();
  let membersHtml = '';
  if (staff) {
    const ms = await myMembers();
    membersHtml = `<section style="display:flex;flex-direction:column;gap:8px"><div class="between"><h2>บัญชีลูกค้า (${ms.length})</h2><button class="btn sm gold" data-act="newAccount" data-v="member">+ สร้างบัญชีลูกค้า</button></div>
      ${ms.length ? `<div class="list">${ms.map(m => `<div class="li"><div class="grow"><b>${esc(m.name)}</b><div class="xs muted">@${esc(m.username)} ${m.active ? '' : '· <span class="alert">ปิดบัญชี</span>'} ${m.consentAt ? '· ยินยอมแล้ว' : '· ยังไม่ยินยอม'}</div></div><button class="btn sm ghost" data-act="manage" data-id="${m.id}">จัดการ</button></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">ยังไม่มีลูกค้า กด “สร้างบัญชีลูกค้า”</p>'}</section>`;
  }
  setMain(`<h1>เพิ่มเติม</h1>
    <section class="card"><b>${esc(me.name)}</b><span class="small muted">${me.role === 'owner' ? 'เจ้าของระบบ' : me.role === 'trainer' ? (isHead() ? 'หัวหน้าเทรนเนอร์ · ผู้ดูแลฝ่ายงาน' : 'เทรนเนอร์ · ผู้ดูแลฝ่ายงาน') : 'สมาชิก'}${me.person?.username ? ' · @' + esc(me.person.username) : ''}</span></section>
    ${lineCardHtml()}
    ${pwCardHtml()}
    ${membersHtml}
    <a class="btn" href="manual.html">คู่มือการใช้งาน</a>
    <button class="btn danger" data-act="logout">ออกจากระบบ</button>
    <p class="xs muted center">เวอร์ชัน ${VER}</p>`);
}

/* ---------- เทรนเนอร์ / เจ้าของ: ลูกค้า ---------- */
async function clientStats(ms, ds) {
  const out = {};
  await Promise.all(ms.map(async m => {
    const [day, acts] = await Promise.all([dayDoc(m.id, ds), actsRange(m.id, ds, ds)]);
    out[m.id] = { day, acts, tot: dayTotals(day), burn: burnOf(acts) };
  }));
  return out;
}
async function renderClients() {
  const ms = (await myMembers()).filter(m => m.active);
  const ds = todayStr();
  const [st, sess] = await Promise.all([clientStats(ms, ds), S.me.role === 'trainer' ? list(fb.query(C('sessions'), fb.where('trainerPid', '==', S.me.pid), fb.where('date', '==', ds))) : Promise.resolve([])]);
  const rows = ms.map(m => {
    const s = st[m.id]; const goal = num(m.targets?.kcal); const logged = s.tot.k > 0; const over = goal && s.tot.k > goal + (m.targets?.addBurn === false ? 0 : s.burn);
    const appt = sess.filter(x => x.memberPid === m.id && x.status === 'planned').map(x => x.time).sort()[0];
    const badge = appt ? ['gold', 'นัด ' + appt] : over ? ['alert', 'เกินเป้า ' + n0(s.tot.k - goal - (m.targets?.addBurn === false ? 0 : s.burn))] : !logged ? ['grey', 'ยังไม่บันทึกวันนี้'] : ['blue', 'ตามแผน'];
    return { m, s, goal, logged, over, appt, badge };
  });
  const f = ui.filter;
  const shown = rows.filter(r => f === 'all' || (f === 'care' && (!r.logged || r.over)) || (f === 'appt' && r.appt));
  setMain(`<h1>ลูกค้า${S.me.role === 'owner' ? 'ทั้งหมด' : 'ของฉัน'}</h1><div class="small muted">${thDate(ds, true)} · ${ms.length} คน</div>
    <section class="grid3"><div class="stat dark"><b>${rows.filter(r => r.appt).length}</b><span>นัดเทรนวันนี้</span></div><div class="stat"><b>${rows.filter(r => !r.logged).length}</b><span>ยังไม่บันทึกอาหาร</span></div><div class="stat"><b class="alert">${rows.filter(r => r.over).length}</b><span>กินเกินเป้า</span></div></section>
    <div class="chips">${[['all', 'ทั้งหมด'], ['care', 'ต้องดูแล'], ['appt', 'นัดวันนี้']].map(([k, l]) => `<button class="chip" data-act="filter" data-v="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
    ${shown.length ? `<div class="list">${shown.map(r => `<button class="li" style="width:100%;border:none;border-bottom:1px solid var(--soft);background:#fff;text-align:left;cursor:pointer;flex-direction:column;align-items:stretch;gap:6px" data-act="openClient" data-id="${r.m.id}">
      <div class="between"><b>${esc(r.m.name)}</b><span class="tag ${r.badge[0]}">${esc(r.badge[1])}</span></div>
      <div class="bar"><i style="width:${r.goal ? Math.min(100, Math.round(r.s.tot.k / r.goal * 100)) : 0}%;background:${r.over ? '#C2410C' : '#1D3A5C'}"></i></div>
      <span class="xs muted">กิน ${n0(r.s.tot.k)} / ${r.goal ? n0(r.goal) : '—'} kcal · เผาผลาญ ${n0(r.s.burn)}${S.me.role === 'owner' ? ' · โค้ช ' + esc(r.m.trainerName || '—') : ''}</span></button>`).join('')}</div>` : '<p class="small muted">ไม่มีลูกค้าในกลุ่มนี้</p>'}
    ${ms.length ? '' : `<button class="btn gold" data-act="newAccount" data-v="member">+ สร้างบัญชีลูกค้า</button>`}`);
}
async function openClient(pid) { await person(pid, true); S.view = pid; ui.tab = 'today'; ui.date = todayStr(); ui.exDate = todayStr(); ui.wkSel = 0; render(); }

/* ---------- เทรนเนอร์: ตารางงาน ---------- */
async function trainerSessions() { return (await list(fb.query(C('sessions'), fb.where('trainerPid', '==', S.me.pid)))); }
async function renderSchedule() {
  const ws = weekStart(ui.schedDate); const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const all = (await trainerSessions()).filter(s => s.status !== 'cancelled');
  const day = all.filter(s => s.date === ui.schedDate).sort((a, b) => a.time.localeCompare(b.time));
  const now = todayStr() + nowHM();
  const nextId = day.filter(s => s.status === 'planned' && (s.date + s.time) >= now)[0]?.id;
  const logged = day.filter(s => s.status === 'logged').length;
  setMain(`<div class="between"><h1>ตารางงานของฉัน</h1><div class="row"><button class="iconbtn" data-act="schedWeek" data-d="-7" aria-label="สัปดาห์ก่อน">‹</button><button class="iconbtn" data-act="schedWeek" data-d="7" aria-label="สัปดาห์ถัดไป">›</button></div></div>
    <nav class="week" aria-label="เลือกวัน">${days.map(d => { const c = all.filter(s => s.date === d).length; return `<button class="day" data-act="schedDay" data-v="${d}" aria-pressed="${d === ui.schedDate}"><small>${TH_D[dowOf(d)]}</small><b>${+d.slice(8)}</b><em>${c ? c + ' นัด' : ''}</em></button>`; }).join('')}</nav>
    <section class="grid3"><div class="stat dark"><b>${day.length}</b><span>นัด${ui.schedDate === todayStr() ? 'วันนี้' : 'วันนั้น'}</span></div><div class="stat"><b>${logged}</b><span>บันทึกแล้ว</span></div><div class="stat"><b class="alert">${day.length - logged}</b><span>ยังไม่บันทึก</span></div></section>
    ${day.length ? day.map(s => { const nx = s.id === nextId; const done = s.status === 'logged';
      return `<div class="card ${nx ? 'dark' : ''}" style="flex-direction:row;align-items:center;gap:12px"><div style="width:58px"><b style="font-size:18px">${esc(s.time)}</b><br><span class="xs" style="font-weight:700;color:${nx ? '#F0C24B' : done ? '#1D3A5C' : '#5E6470'}">${nx ? 'ถัดไป' : done ? 'เสร็จแล้ว' : 'รอเทรน'}</span></div>
        <div style="flex:1;min-width:0"><b>${esc(s.memberName)}</b><div class="small ${nx ? 'muted' : 'muted'}">${esc(s.type)} · ${done ? 'บันทึกแล้ว' : 'รอเทรน'}${s.repeat ? ' · ทุกสัปดาห์' : ''}</div></div>
        <div style="display:flex;flex-direction:column;gap:6px">${done ? `<button class="btn sm ghost" data-act="logSession" data-id="${s.id}">แก้ผล</button>` : `<button class="btn sm ${nx ? 'gold' : 'pri'}" data-act="logSession" data-id="${s.id}">บันทึกผล</button><button class="btn sm ghost" ${nx ? 'style="color:#fff;border-color:#C9D3DF;background:transparent"' : ''} data-act="cancelSession" data-id="${s.id}">ยกเลิกนัด</button>`}</div></div>`; }).join('') : '<p class="small muted">ไม่มีนัดในวันนี้</p>'}
    <button class="btn gold block" data-act="newSession">+ เพิ่มนัดเทรน</button>`);
}
async function openNewSession() {
  const ms = (await myMembers()).filter(m => m.active);
  if (!ms.length) return toast('สร้างบัญชีลูกค้าก่อน แล้วค่อยเพิ่มนัด');
  openSheet('เพิ่มนัดเทรน', `<label class="f">ลูกค้า<select class="in" id="nsMember">${ms.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></label>
    <div class="grid2"><label class="f">วันที่<input class="in" type="date" id="nsDate" value="${ui.schedDate}"></label><label class="f">เวลา<input class="in" type="time" id="nsTime" value="18:00"></label></div>
    <label class="f">ประเภท<select class="in" id="nsType">${SESSION_TYPES.map(t => `<option>${t}</option>`).join('')}</select></label>
    <label class="row small" style="min-height:44px"><input type="checkbox" id="nsRepeat" style="width:22px;height:22px;accent-color:#14202E"> ทำซ้ำทุกสัปดาห์ วันและเวลาเดิม (8 สัปดาห์)</label>
    <button class="btn pri block" data-act="saveSession">บันทึกนัด</button><p class="xs muted" style="margin:0">ลูกค้าจะเห็นนัดนี้ในแท็บออกกำลังกายและแท็บโค้ช</p>`, { kind: 'session', ms });
}
async function saveSession() {
  const mid = $('#nsMember').value; const m = sheet.ms.find(x => x.id === mid); const date = $('#nsDate').value; const time = $('#nsTime').value || '18:00'; const type = $('#nsType').value; const rep = $('#nsRepeat').checked;
  if (!date) return toast('เลือกวันที่');
  const b = fb.writeBatch(db); const grp = rep ? 'g' + Date.now().toString(36) : null;
  for (let i = 0; i < (rep ? 8 : 1); i++) b.set(fb.doc(C('sessions')), { trainerPid: S.me.pid, trainerName: S.me.name, memberPid: mid, memberName: m.name, date: addDays(date, 7 * i), time, type, status: 'planned', repeat: rep, group: grp, moves: [], createdAt: fb.serverTimestamp() });
  await b.commit(); ui.schedDate = date; closeSheet(); toast(rep ? 'เพิ่มนัด 8 สัปดาห์แล้ว' : 'เพิ่มนัดแล้ว'); render();
}

/* ---------- เทรนเนอร์: บันทึกการเทรน ---------- */
async function renderLog() {
  if (!ui.log) {
    const ds = todayStr(); const all = await trainerSessions();
    const pending = all.filter(s => s.status === 'planned' && s.date <= ds).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 12);
    const ms = (await myMembers()).filter(m => m.active);
    return setMain(`<h1>บันทึกการเทรน</h1><p class="small muted" style="margin:0">เลือกนัดที่เทรนแล้ว หรือบันทึกนอกตาราง ลูกค้าเห็นผลในแอปทันที</p>
      <section style="display:flex;flex-direction:column;gap:8px"><h2>นัดที่ยังไม่บันทึกผล</h2>${pending.length ? `<div class="list">${pending.map(s => `<div class="li"><div class="grow"><b>${esc(s.memberName)}</b><div class="small muted">${thDate(s.date)} · ${esc(s.time)} · ${esc(s.type)}</div></div><button class="btn sm gold" data-act="logSession" data-id="${s.id}">บันทึกผล</button></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">ไม่มีนัดค้าง</p>'}</section>
      ${ms.length ? `<section class="card"><b>บันทึกนอกตาราง</b><label class="f">ลูกค้า<select class="in" id="lgMember">${ms.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></label><div class="grid2"><label class="f">วันที่<input class="in" type="date" id="lgDate" value="${ds}"></label><label class="f">เวลา<input class="in" type="time" id="lgTime" value="${nowHM()}"></label></div><button class="btn pri" data-act="logAdhoc">เริ่มบันทึก</button></section>` : ''}`);
  }
  const L = ui.log; let vol = 0, sets = 0;
  L.moves.forEach(m => m.sets.forEach(x => { vol += (+x.r || 0) * setKg(m.u, x.w); sets++; }));
  setMain(`<div class="between"><h1>บันทึกการเทรน</h1><button class="btn sm ghost" data-act="logCancel">ยกเลิก</button></div>
    <section class="card"><b>${esc(L.memberName)}</b><span class="small muted">${thDate(L.date, true)} · ${esc(L.time)}</span></section>
    <div class="chips">${SESSION_TYPES.map(t => `<button class="chip" data-act="logType" data-v="${t}" aria-pressed="${L.type === t}">${t}</button>`).join('')}</div>
    <div class="between"><h2>ท่าที่เล่น</h2><span class="small muted">${L.moves.length} ท่า · ${sets} เซ็ต · ${n0(vol)} kg</span></div>
    ${L.moves.map((m, mi) => { const top = Math.max(0, ...m.sets.map(x => setKg(m.u, x.w))); const v = m.sets.reduce((a, x) => a + (+x.r || 0) * setKg(m.u, x.w), 0); const ou = m.u === 'lb' ? 'kg' : 'lb';
      return `<section class="card"><div class="between" style="align-items:center"><div><b>${mi + 1}. ${esc(m.name)}</b><div class="xs muted">${m.sets.length} เซ็ต · หนักสุด ${wText(top, m.u)} · Volume ${n0(v)} kg</div></div><button class="iconbtn" data-act="logRmMove" data-i="${mi}" aria-label="ลบท่า ${esc(m.name)}">${svg('trash', 18)}</button></div>
        <div class="row" style="gap:6px;align-items:center"><span class="xs muted">หน่วยน้ำหนัก</span>${['kg', 'lb'].map(u => `<button class="chip" style="min-height:32px;padding:0 14px" data-act="logUnit" data-i="${mi}" data-v="${u}" aria-pressed="${(m.u || 'kg') === u}">${u === 'kg' ? 'kg กิโลกรัม' : 'lb ปอนด์'}</button>`).join('')}</div>
        <div class="sets xs muted"><span>เซ็ต</span><span>ครั้ง</span><span>น้ำหนัก (${m.u === 'lb' ? 'lb' : 'kg'})</span><span></span></div>
        ${m.sets.map((x, si) => { const w = num(x.w); return `<div class="sets" style="align-items:start"><b class="small" style="line-height:44px">เซ็ต ${si + 1}</b><input inputmode="numeric" data-set="r" data-mi="${mi}" data-si="${si}" value="${esc(x.r)}" aria-label="${esc(m.name)} เซ็ต ${si + 1} ครั้ง"><div style="display:flex;flex-direction:column;gap:2px"><input inputmode="decimal" data-set="w" data-mi="${mi}" data-si="${si}" value="${esc(x.w)}" aria-label="${esc(m.name)} เซ็ต ${si + 1} น้ำหนัก (${m.u === 'lb' ? 'ปอนด์' : 'กิโลกรัม'})"><span class="xs muted" data-conv="${mi}-${si}" style="padding-left:4px">${w ? `≈ ${r1(m.u === 'lb' ? w * LB : w / LB)} ${ou}` : '&nbsp;'}</span></div><button class="iconbtn" style="width:36px" data-act="logRmSet" data-mi="${mi}" data-si="${si}" aria-label="ลบเซ็ต ${si + 1}">×</button></div>`; }).join('')}
        <button class="btn sm ghost" style="border-style:dashed" data-act="logAddSet" data-i="${mi}">+ เพิ่มเซ็ต (ก๊อปค่าเซ็ตล่าสุด)</button></section>`; }).join('')}
    ${L.picking ? `<section class="card gold-edge"><b>เลือกท่า</b>
      <input class="in" id="logCustom" placeholder="ค้นหา หรือพิมพ์ชื่อท่าใหม่" value="${esc(L.q || '')}" autocomplete="off" autocapitalize="words" enterkeyhint="done">
      <div id="movePick" style="display:flex;flex-direction:column;gap:8px">${movePickHtml()}</div></section>` : ''}
    <button class="btn" data-act="logPicking">${L.picking ? 'ปิดรายการท่า' : '+ เพิ่มท่า'}</button>
    <div class="grid2"><label class="f">ระยะเวลา (นาที)<input class="in" id="lgMin" inputmode="numeric" value="${esc(L.min)}"></label><label class="f">เผาผลาญ kcal<input class="in" id="lgKcal" inputmode="numeric" value="${esc(L.kcal)}" placeholder="${n0(L.est)}"></label></div>
    <div><div class="small" style="font-weight:600;margin-bottom:8px">รูป / วิดีโอท่า <span class="muted" style="font-weight:400">(ไม่บังคับ · รูปเท่านั้นในรอบนี้)</span></div><div class="thumbs" id="logThumbs">${thumbsHtml(L.ph, true)}<label class="addthumb">${svg('cam', 22)}แนบรูป<input type="file" accept="image/*" multiple hidden data-act="pickLogPhoto"></label></div></div>
    <label class="f">โน้ตถึงลูกค้า<textarea class="in" id="lgNote">${esc(L.note)}</textarea></label>
    <button class="btn gold block" data-act="logSave">บันทึกผลการเทรน</button>
    <p class="xs muted center" style="margin:0">ลูกค้าเห็นในแอปทันที ส่วน LINE จะส่งหลังบันทึก ${S.config.workoutDelayMin || 60} นาที (เมื่อเปิดใช้ LINE แล้ว)</p>`);
  fillThumbs();
}
function logForm() { const L = ui.log; if (!L) return; L.min = $('#lgMin')?.value ?? L.min; L.kcal = $('#lgKcal')?.value ?? L.kcal; L.note = $('#lgNote')?.value ?? L.note; }
async function startLog(s) {
  loadMoveLib().catch(() => {});
  const m = await person(s.memberPid); const rows = await bodyRows(s.memberPid).catch(() => []);
  const w = latestWeight(rows) || 65;
  ui.log = { sid: s.id || null, memberPid: s.memberPid, memberName: s.memberName || m?.name || '', date: s.date, time: s.time, type: s.type || 'Full body', moves: (s.moves || []).map(x => { const u = x.u === 'lb' ? 'lb' : 'kg'; return { name: x.name, u, sets: x.sets.map(y => ({ r: y.r, w: u === 'lb' ? (y.lb ?? r1((+y.kg || 0) / LB)) : y.kg })) }; }), min: s.min ?? 60, kcal: s.kcal ?? '', note: s.note || '', ph: [...(s.ph || [])], picking: false, weight: w, est: Math.round(5 * w) };
  ui.tab = 'log'; render();
}
/* ---------- คลังท่าของเทรนเนอร์: ชื่อท่าที่พิมพ์เองถูกจำไว้ เลือกใช้ซ้ำกับลูกค้าทุกคนได้ทันที ---------- */
// เก็บที่ people/{เทรนเนอร์}/days/_moves (อยู่ในข้อมูลของตัวเองตาม Rules เดิม) + รวมชื่อท่าจากผลเทรนที่เคยบันทึก
const moveKey = x => String(x || '').trim().replace(/\s+/g, ' ').toLowerCase();
const moveClean = x => String(x || '').trim().replace(/\s+/g, ' ').slice(0, 60);
const moveLibRef = () => D('people', S.me.pid || '_owner', 'days', '_moves');
async function loadMoveLib() {
  if (S.moveLib) return S.moveLib;
  let doc = null, hist = [];
  try { doc = await get(moveLibRef()); } catch (e) { console.warn('moveLib', e); }
  try { if (S.me.pid) hist = await trainerSessions(); } catch (e) { console.warn('moveHist', e); }
  const std = new Set(MOVES.map(moveKey)), hidden = new Set((doc?.hidden || []).map(moveKey));
  const all = [...(doc?.names || [])];
  hist.filter(x => x.status === 'logged').sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || ''))).forEach(x => (x.moves || []).forEach(m => all.push(m.name)));
  const seen = new Set(), names = [];
  all.forEach(n => { const k = moveKey(n); if (!k || seen.has(k) || std.has(k) || hidden.has(k)) return; seen.add(k); names.push(moveClean(n)); });
  return (S.moveLib = { names, hidden: [...hidden] });
}
async function saveMoveLib() {
  try { await fb.setDoc(moveLibRef(), { names: S.moveLib.names.slice(0, 300), hidden: S.moveLib.hidden.slice(-300), at: Date.now() }); }
  catch (e) { console.error(e); toast('จำชื่อท่าไม่สำเร็จ ลองใหม่อีกครั้ง'); }
}
// คืนชื่อที่ใช้จริง (สะกดตามคลังถ้าตรงกัน) และย้ายท่าที่พิมพ์เองขึ้นบนสุดของ "ท่าที่จำไว้"
function rememberMove(raw) {
  const name = moveClean(raw), k = moveKey(name); if (!k) return '';
  const std = MOVES.find(m => moveKey(m) === k); if (std) return std;
  const lib = S.moveLib || (S.moveLib = { names: [], hidden: [] });
  const cur = lib.names.find(n => moveKey(n) === k) || name;
  lib.names = [cur, ...lib.names.filter(n => moveKey(n) !== k)];
  lib.hidden = lib.hidden.filter(h => h !== k);
  saveMoveLib(); return cur;
}
function movePickHtml() {
  const L = ui.log, q = moveKey(L.q), lib = S.moveLib?.names || [];
  const has = n => !q || moveKey(n).includes(q);
  const mine = lib.filter(has), std = MOVES.filter(has);
  const exact = q && [...lib, ...MOVES].some(n => moveKey(n) === q);
  const add = q && !exact ? `<button class="btn ${mine.length || std.length ? '' : 'pri'} block" data-act="logCustom">+ เพิ่มท่าใหม่ “${esc(moveClean(L.q))}” และจำไว้ใช้ครั้งหน้า</button>` : '';
  return `${mine.length || std.length ? '' : add}
    ${lib.length ? `<div class="between" style="margin-top:4px"><b class="small">ท่าที่จำไว้ของฉัน</b><span class="xs muted">${lib.length} ท่า · กด × เพื่อลืมชื่อที่พิมพ์ผิด</span></div>
      <div class="chips">${mine.map(n => `<span class="chip" style="display:inline-flex;align-items:center;gap:2px;padding:0 4px 0 14px"><button data-act="logPick" data-v="${esc(n)}" style="all:unset;cursor:pointer;line-height:40px">${esc(n)}</button><button data-act="moveForget" data-v="${esc(n)}" aria-label="ลืมท่า ${esc(n)}" style="all:unset;cursor:pointer;width:28px;text-align:center;font-size:18px;color:#8A94A3">×</button></span>`).join('') || '<span class="xs muted">ไม่มีท่าที่ตรงกับคำค้น</span>'}</div>` : ''}
    <b class="small" style="margin-top:4px">คลังท่ามาตรฐาน</b>
    <div class="chips">${std.map(m => `<button class="chip" data-act="logPick" data-v="${esc(m)}">${esc(m)}</button>`).join('') || '<span class="xs muted">ไม่มีท่าที่ตรงกับคำค้น</span>'}</div>
    ${mine.length || std.length ? add : ''}`;
}
function refreshMovePick() { const b = $('#movePick'); if (b) b.innerHTML = movePickHtml(); }
function addMove(raw) {
  logForm(); const name = rememberMove(raw); if (!name) return;
  ui.log.moves.push({ name, u: ui.log.unit || 'kg', sets: [{ r: 10, w: 0 }] }); ui.log.picking = false; ui.log.q = ''; render();
}

async function saveLog() {
  logForm(); const L = ui.log; const min = num(L.min) || 0; const kcal = num(L.kcal) ?? Math.round(5 * L.weight * (min / 60));
  const moves = L.moves.map(m => { const u = m.u === 'lb' ? 'lb' : 'kg'; return { name: m.name, u, sets: m.sets.map(x => { const w = num(x.w) || 0; return u === 'lb' ? { r: num(x.r) || 0, kg: r2(w * LB), lb: w } : { r: num(x.r) || 0, kg: w, lb: r1(w / LB) }; }) }; }).filter(m => m.sets.length);
  const ref = L.sid ? D('sessions', L.sid) : fb.doc(C('sessions'));
  const prev = L.sid ? await get(ref) : null;
  // แก้ผลก่อนถึงเวลาส่ง: ใช้เวลาส่งเดิม (ระบบส่งฉบับล่าสุด) · ส่งไปแล้ว: ไม่ส่งซ้ำ
  const keepNotify = prev && prev.status === 'logged' && prev.notifyAfter;
  const data = { trainerPid: S.me.pid, trainerName: S.me.name, memberPid: L.memberPid, memberName: L.memberName, date: L.date, time: L.time, type: L.type, status: 'logged', moves, min, kcal: Math.round(kcal), note: L.note.trim(), ph: L.ph, loggedAt: fb.serverTimestamp(), notifyAfter: keepNotify ? prev.notifyAfter : Date.now() + (S.config.workoutDelayMin || 60) * 60000, notified: keepNotify ? !!prev.notified : false };
  const b = fb.writeBatch(db);
  b.set(ref, data, { merge: true });
  b.set(D('people', L.memberPid, 'activities', 's_' + ref.id), { date: L.date, type: 'coach', name: `เทรนกับ ${S.me.name} · ${L.type}`, min, kcal: Math.round(kcal), source: 'coach', sid: ref.id, ph: L.ph, t: Date.now(), byUid: auth.currentUser.uid });
  const who = L.memberName; await b.commit(); ui.log = null; toast(`บันทึกผลของ ${who} แล้ว · LINE ส่งถึง ${who} คนเดียว`, 3500); ui.tab = 'schedule'; render();
}

/* ---------- เทรนเนอร์: สรุปวันนี้ ---------- */
function digestText(ms, st, ds) {
  const lines = [`สรุปประจำวัน · ${thDate(ds)}`, `ลูกค้าของคุณ ${ms.length} คน`, ''];
  for (const m of ms) {
    const s = st[m.id]; const goal = num(m.targets?.kcal);
    if (!s.tot.k) lines.push(`${m.name} — ยังไม่บันทึกอาหาร`);
    else {
      const diff = goal ? s.tot.k - goal : 0;
      lines.push(`${m.name} — ${n0(s.tot.k)}${goal ? ' / ' + n0(goal) : ''} kcal${diff > 0 ? ` (+${n0(diff)})` : ''}`);
      lines.push(`P ${n0(s.tot.p)} · C ${n0(s.tot.c)} · F ${n0(s.tot.f)} g`);
      lines.push(MEALS.filter(x => s.tot.byMeal[x] != null || x !== 'ว่าง').map(x => `${x} ${s.tot.byMeal[x] != null ? n0(s.tot.byMeal[x]) : 'ยังไม่บันทึก'}`).join(' · '));
    }
    lines.push(s.acts.length ? `กิจกรรม: ${s.acts.map(a => `${a.name} ${n0(a.kcal)}`).join(' · ')} = เผาผลาญ ${n0(s.burn)} kcal` : 'กิจกรรม: ยังไม่มี');
    lines.push('');
  }
  return lines.join('\n').trim();
}
async function renderSummary() {
  const ms = (await myMembers()).filter(m => m.active); const ds = ui.sumDate; const st = await clientStats(ms, ds);
  const txt = digestText(ms, st, ds); ui.digest = txt;
  setMain(`${dateNav(ds, 'sumNav')}
    <section class="card dark"><b class="xs gold">สรุปประจำวัน · ${thDate(ds)}</b><b style="font-size:16px">ลูกค้าของคุณ ${ms.length} คน</b><span class="xs muted">${lineOn() ? `ระบบส่งข้อความนี้เข้า LINE ของคุณทุกวันเวลา ${esc(S.config.digestTime || '21:00')} แก้ข้อมูลก่อนเวลานั้นได้ (เชื่อม LINE ที่แท็บเพิ่มเติม)` : `หน้านี้คือข้อความที่จะส่งเข้า LINE ตอน ${esc(S.config.digestTime || '21:00')} เมื่อเปิดใช้ LINE แล้ว`}</span></section>
    <div class="list">${ms.map(m => { const s = st[m.id]; const goal = num(m.targets?.kcal); const diff = goal ? s.tot.k - goal : 0;
      return `<div class="li" style="flex-direction:column;align-items:stretch;gap:4px"><div class="between"><b>${esc(m.name)}</b><b class="small ${!s.tot.k ? 'muted' : diff > 0 ? 'alert' : ''}">${s.tot.k ? n0(s.tot.k) + (goal ? ' / ' + n0(goal) : '') + ' kcal' + (diff > 0 ? ' (+' + n0(diff) + ')' : '') : 'ยังไม่บันทึกอาหาร'}</b></div>
        ${s.tot.k ? `<span class="small">P ${n0(s.tot.p)} · C ${n0(s.tot.c)} · F ${n0(s.tot.f)} g</span><span class="small muted">${MEALS.filter(x => s.tot.byMeal[x] != null || x !== 'ว่าง').map(x => `${x} ${s.tot.byMeal[x] != null ? n0(s.tot.byMeal[x]) : 'ยังไม่บันทึก'}`).join(' · ')}</span>` : ''}
        <span class="small blue">${s.acts.length ? 'กิจกรรม: ' + s.acts.map(a => esc(a.name) + ' ' + n0(a.kcal)).join(' · ') + ' = เผาผลาญ ' + n0(s.burn) + ' kcal' : 'กิจกรรม: ยังไม่มี'}</span></div>`; }).join('')}</div>
    <button class="btn gold block" data-act="copyDigest">คัดลอกข้อความสรุป</button><p class="xs muted center" style="margin:0">${lineOn() ? 'ส่งให้คนอื่นเพิ่มได้ด้วยการคัดลอกไปวางใน LINE' : 'ระหว่างที่ยังไม่เปิด LINE อัตโนมัติ คัดลอกไปวางใน LINE เองได้'}</p>`);
}

/* ---------- เจ้าของ ---------- */
async function renderOverview() {
  const [tr, ms] = await Promise.all([trainers(), myMembers()]);
  const act = ms.filter(m => m.active); const st = await clientStats(act, todayStr());
  const loggedToday = act.filter(m => st[m.id].tot.k > 0).length;
  setMain(`<h1>ภาพรวมระบบ</h1><section class="grid3"><div class="stat dark"><b>${tr.filter(t => t.active).length}</b><span>เทรนเนอร์</span></div><div class="stat"><b>${act.length}</b><span>ลูกค้า</span></div><div class="stat"><b>${loggedToday}/${act.length}</b><span>บันทึกวันนี้</span></div></section>
    <section style="display:flex;flex-direction:column;gap:8px"><h2>เทรนเนอร์</h2>${tr.length ? `<div class="list">${tr.map(t => `<div class="li"><div class="grow"><b>${esc(t.name)}</b><div class="xs muted">ลูกค้า ${ms.filter(m => m.trainerPid === t.id).length} คน · ${t.active ? 'ใช้งานอยู่' : 'พักงาน'}${t.canManageTrainers ? ' · หัวหน้าเทรนเนอร์' : ''}</div></div></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">ยังไม่มีเทรนเนอร์ ไปที่แท็บ “เทรนเนอร์” เพื่อสร้างบัญชี PT-Palm</p>'}</section>`);
}
function trainerTags(t, count) {
  const tags = [];
  if (t.canManageTrainers) tags.push('<span class="tag gold">หัวหน้าเทรนเนอร์</span>');
  if (!t.active) tags.push('<span class="tag alert">พักงาน</span>');
  if (!t.active && count) tags.push(`<span class="tag grey">ลูกค้าค้าง ${count} คน</span>`);
  return tags.join(' ');
}
async function teamData() {
  const [tr, ms] = await Promise.all([trainers(), list(fb.query(C('people'), fb.where('role', '==', 'member')))]);
  ms.forEach(m => S.cache.set('p:' + m.id, m)); tr.forEach(t => S.cache.set('p:' + t.id, t));
  return { tr, ms, count: id => ms.filter(m => m.trainerPid === id).length };
}
function teamListHtml(tr, count) {
  return tr.length ? `<div class="list">${tr.map(t => `<div class="li"><div class="grow"><b>${esc(t.name)}</b>${t.id === S.me.pid ? ' <span class="xs muted">(คุณ)</span>' : ''}<div class="xs muted">@${esc(t.username)} · ลูกค้า ${count(t.id)} คน</div><div class="row" style="gap:4px;margin-top:2px">${trainerTags(t, count(t.id))}</div></div>${(canManageTrainer(t) || S.me.role === 'owner') ? `<button class="btn sm ghost" data-act="manage" data-id="${t.id}">จัดการ</button>` : ''}</div>`).join('')}</div>` : '<p class="small muted" style="margin:0">ยังไม่มีเทรนเนอร์</p>';
}
const TEAM_RULE = '<div class="pill-note"><b>พักงาน (Hold)</b> = เทรนเนอร์เข้าแอปไม่ได้ แต่ลูกค้ายังใช้งานได้ตามปกติ · จะ <b>ลบ</b> เทรนเนอร์ได้ต่อเมื่อพักงานแล้ว และย้ายลูกค้าออกจนหมด</div>';
async function renderTeam() {
  const { tr, count } = await teamData();
  setMain(`<div class="between"><h1>ทีมเทรนเนอร์</h1><button class="btn sm gold" data-act="newAccount" data-v="trainer">+ สร้างบัญชีเทรนเนอร์</button></div>
    <p class="small muted" style="margin:0">คุณเป็นหัวหน้าเทรนเนอร์: สร้างบัญชีเทรนเนอร์ พักงาน/เปิดใช้งาน ตั้งรหัสใหม่ ย้ายลูกค้าระหว่างเทรนเนอร์ และลบเทรนเนอร์ที่ไม่มีลูกค้าแล้ว</p>
    ${TEAM_RULE}${teamListHtml(tr, count)}`);
}
async function renderTrainers() {
  const { tr, ms, count } = await teamData();
  setMain(`<div class="between"><h1>เทรนเนอร์</h1><button class="btn sm gold" data-act="newAccount" data-v="trainer">+ สร้างบัญชีเทรนเนอร์</button></div>
    <p class="small muted" style="margin:0">เทรนเนอร์ดูแลลูกค้าของตัวเอง (สร้างบัญชีลูกค้า ตั้งเป้า จัดตาราง บันทึกผลเทรน) · กด “จัดการ” เพื่อให้สิทธิ์ <b>หัวหน้าเทรนเนอร์</b> ได้ 1 คน</p>
    ${TEAM_RULE}${teamListHtml(tr, count)}
    <section style="display:flex;flex-direction:column;gap:8px"><div class="between"><h2>ลูกค้าทั้งหมด (${ms.length})</h2><button class="btn sm" data-act="newAccount" data-v="member">+ ลูกค้า</button></div>
    ${ms.length ? `<div class="list">${ms.sort((a, b) => String(a.name).localeCompare(String(b.name), 'th')).map(m => `<div class="li"><div class="grow"><b>${esc(m.name)}</b><div class="xs muted">@${esc(m.username)} · โค้ช ${esc(m.trainerName || '—')} ${m.active ? '' : '· <span class="alert">ปิดบัญชี</span>'}</div></div><button class="btn sm ghost" data-act="manage" data-id="${m.id}">จัดการ</button></div>`).join('')}</div>` : ''}</section>`);
}
async function renderSystem() {
  if (S.config.lineUrl && !line.info) lineInfo().then(() => { if (ui.tab === 'system') render(); });
  const c = S.config; const [ms, trs] = await Promise.all([myMembers(), trainers()]); trs.forEach(t => S.cache.set('p:' + t.id, t)); const consent = ms.filter(m => m.consentAt).length;
  setMain(`<h1>ระบบ</h1><p class="small muted" style="margin:0">เฉพาะเจ้าของระบบเท่านั้นที่เห็นหน้านี้</p>
    <section class="card"><label class="f">ชื่อแอป<input class="in" id="cfName" value="${esc(c.name || 'The Olympic Club by PT-Palm')}"></label>
      <label class="row small" style="min-height:44px"><input type="checkbox" id="cfAi" ${c.aiOn !== false ? 'checked' : ''} style="width:22px;height:22px;accent-color:#14202E"> เปิดให้ AI อ่านรูป (ใบ InBody, หน้าจอนาฬิกา)</label>
      <label class="f">รุ่น AI<input class="in" id="cfModel" value="${esc(c.aiModel || 'gemini-3.5-flash')}"></label>
      <div class="grid2"><label class="f">เวลาส่งสรุปรายวัน<input class="in" type="time" id="cfTime" value="${esc(c.digestTime || '21:00')}"></label><label class="f">หน่วงส่งผลเทรน (นาที)<input class="in" id="cfDelay" inputmode="numeric" value="${esc(c.workoutDelayMin || 60)}"></label></div>
      <button class="btn pri" data-act="saveConfig">บันทึกการตั้งค่า</button></section>
    ${lineAdminHtml(c)}
    ${whoGetsHtml(ms, trs)}
    ${lineCardHtml()}
    <section class="card"><div class="between"><span class="small muted">ความยินยอม PDPA</span><b>${consent} / ${ms.length} คน</b></div></section>`);
}

function digestLogHtml(g) {
  if (!g || !g.date) return '';
  const sent = Object.values(g.sent || {}), skip = Object.values(g.skip || {});
  return `<div class="xs muted" style="margin-top:4px">สรุปรายวัน ${esc(thDate(g.date))}${g.at ? ' · ' + esc(new Date(g.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })) + ' น.' : ''}${sent.length ? ` · ✅ ส่งถึง ${sent.map(esc).join(', ')}` : ''}${skip.length ? ` · <span class="alert">⚠️ ${skip.map(esc).join(' · ')}</span>` : ''}</div>`;
}
function lineAdminHtml(c) {
  const i = line.info; const on = lineOn();
  const names = {}; S.cache.forEach((v, k) => { if (k.startsWith('p:') && v) names[k.slice(2)] = v.name; }); names.owner = 'เจ้าของระบบ';
  const links = i?.links ? Object.entries(i.links) : [];
  return `<section class="card"><div class="between"><b>แจ้งเตือน LINE</b><span class="tag ${on ? 'gold' : 'grey'}">${on ? 'เปิดอยู่' : c.lineUrl ? 'ปิดอยู่' : 'ยังไม่ตั้งค่า'}</span></div>
    <p class="small muted" style="margin:0">ส่งผ่าน LINE OA ด้วย Apps Script (ไม่ต้องใช้แพ็กเกจ Blaze): <b>สรุปรายวัน ${esc(c.digestTime || '21:00')}</b> ถึงเทรนเนอร์แต่ละคน (เฉพาะลูกค้าของตัวเอง) และ <b>ผลเทรนถึงลูกค้า</b> หลังโค้ชบันทึก ${esc(c.workoutDelayMin || 60)} นาที ไม่บันทึกก็ไม่ส่ง · ทุกคนต้องกด “เชื่อม LINE” ที่แท็บเพิ่มเติมของตัวเอง 1 ครั้ง · เลือกว่าใครได้รับอะไรที่การ์ดถัดไป</p>
    <label class="f">ลิงก์ระบบ LINE (Apps Script Web App)<input class="in" id="lnUrl" value="${esc(c.lineUrl || '')}" placeholder="https://script.google.com/macros/s/…/exec" autocapitalize="none" spellcheck="false"></label>
    <label class="row small" style="min-height:44px"><input type="checkbox" id="lnOn" ${c.lineOn !== false ? 'checked' : ''} style="width:22px;height:22px;accent-color:#14202E"> เปิดการส่งอัตโนมัติ</label>
    <div class="row"><button class="btn pri" data-act="saveLine">บันทึก</button>${c.lineUrl ? '<button class="btn" data-act="lineRefresh">ตรวจสถานะ</button>' : ''}</div>
    ${c.lineUrl ? (!i ? '<span class="small muted">กำลังตรวจ…</span>' : !i.ok ? `<div class="warn">${esc(i.error || 'เชื่อมต่อไม่ได้')}</div>` : `<div class="small">LINE OA ${i.hasToken ? '✅' : '❌'} · LINE Login ${i.hasLogin ? '✅' : '❌'} · ตัวตั้งเวลา ${i.ticking ? '✅ ทำงานทุก 10 นาที' : '❌ ยังไม่ได้ Run ocSetup'}${i.lastDigest ? ` · ส่งสรุปล่าสุด ${thDate(i.lastDigest)}` : ''}${digestLogHtml(i.digestLog)}</div>
      <b class="small">เชื่อม LINE แล้ว ${links.length} คน</b>${links.length ? `<div class="list">${links.map(([k, L]) => `<div class="li"><div class="grow"><b>${esc(names[k] || L.appName || k)}</b><div class="xs muted">LINE: ${esc(L.name || '')}${L.friend === false ? ' · <span class="alert">ยังไม่เพิ่มเพื่อน OA</span>' : ''}</div></div><button class="btn sm ghost" data-act="lineUnlink" data-k="${esc(k)}">ยกเลิก</button></div>`).join('')}</div>` : ''}`) : ''}
  </section>`;
}

function whoGetsHtml(ms, trs) {
  if (!S.config.lineUrl) return '';
  const i = line.info, links = i?.links || {};
  const coach = {}; trs.forEach(t => { coach[t.id] = t.name; });
  const names = { owner: 'เจ้าของระบบ' }; trs.forEach(t => { names[t.id] = t.name; }); ms.forEach(m => { names[m.id] = m.name; });
  const people = [['owner', 'เจ้าของระบบ', 'owner', 'เจ้าของ'],
    ...trs.filter(t => t.active).map(t => [t.id, t.name, 'trainer', t.canManageTrainers ? 'หัวหน้าเทรนเนอร์' : 'เทรนเนอร์']),
    ...ms.filter(m => m.active).sort((a, b) => String(a.name).localeCompare(String(b.name), 'th')).map(m => [m.id, m.name, 'member', 'ลูกค้า' + (m.trainerName || coach[m.trainerPid] ? ' · โค้ช ' + (m.trainerName || coach[m.trainerPid]) : '')])];
  const row = ([k, name, role, label]) => {
    const a = alertOf(k, role), L = links[k];
    return `<div class="card" style="gap:10px;box-shadow:none;border:1px solid var(--line)">
      <div class="between" style="align-items:flex-start;gap:8px"><div><b>${esc(name)}</b> <span class="xs muted">(${esc(label)})</span></div>
        ${!i ? '' : L ? `<span class="tag blue">LINE: ${esc(L.name || '')}</span>` : '<span class="tag grey">ยังไม่เชื่อม LINE</span>'}</div>
      ${L && L.friend === false ? '<div class="xs alert">ยังไม่เพิ่มเพื่อน LINE OA จะไม่ได้รับข้อความ</div>' : ''}
      <label class="row small" style="min-height:44px"><input type="checkbox" data-alert-on="${esc(k)}" data-role="${role}" ${a.on ? 'checked' : ''} style="width:22px;height:22px;accent-color:#14202E"> อนุญาต/รับแจ้งเตือน</label>
      ${L && L.dup && L.dup.length ? `<div class="xs alert">⚠️ LINE นี้ผูกกับบัญชีอื่นด้วย (${esc(L.dup.map(x => names[x] || links[x]?.appName || x).join(', '))}) ข้อความของทุกบัญชีจะเด้งเข้าเครื่องเดียวกัน ให้แต่ละคนเชื่อม LINE ของตัวเอง แล้วกด “ยกเลิกการเชื่อม” บัญชีที่ผูกผิด</div>` : ''}
      <div class="chips">${alertTypesFor(role).map(([t, l]) => `<button class="chip" aria-pressed="${a.on && a.types.includes(t)}" data-act="alertType" data-k="${esc(k)}" data-role="${role}" data-t="${t}" ${a.on ? '' : 'disabled style="opacity:.45"'}>${l}</button>`).join('')}</div>
      <div class="xs muted">${ALERT_HINT[role]}</div>
      ${L ? `<div class="row"><button class="btn sm" data-act="lineTestTo" data-k="${esc(k)}">ส่งทดสอบ</button><button class="btn sm ghost danger" data-act="lineUnlink" data-k="${esc(k)}">ยกเลิกการเชื่อม</button></div>` : ''}
    </div>`;
  };
  return `<section class="card"><div class="between"><b>ใครได้รับอะไร</b><span class="xs muted">กดหัวข้อเพื่อเปิด/ปิด · บันทึกทันที</span></div>
    <p class="small muted" style="margin:0">ติ๊ก <b>อนุญาต/รับแจ้งเตือน</b> แล้วเลือกหัวข้อ (ปุ่มสีเข้ม = รับ) สรุปรายวันส่งเวลา ${esc(S.config.digestTime || '21:00')} ผลการเทรนส่งหลังโค้ชบันทึก ${esc(S.config.workoutDelayMin || 60)} นาที · ทุกข้อความใช้โควตา LINE OA เปิดเท่าที่จำเป็น</p>
    ${people.map(row).join('')}
    <p class="xs muted" style="margin:0">เทรนเนอร์และลูกค้าเปิดแอป → แท็บ <b>เพิ่มเติม</b> → <b>เชื่อม LINE</b> · ของคุณเองกดที่การ์ด LINE ของฉันด้านล่าง</p>
  </section>`;
}

/* ---------- บัญชีผู้ใช้ ---------- */
function genPw() { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
async function openNewAccount(role) {
  const tr = S.me.role === 'owner' && role === 'member' ? (await trainers()).filter(t => t.active) : [];
  if (role === 'member' && S.me.role === 'owner' && !tr.length) return toast('สร้างบัญชีเทรนเนอร์ก่อน แล้วค่อยสร้างลูกค้า');
  openSheet(role === 'trainer' ? 'สร้างบัญชีเทรนเนอร์' : 'สร้างบัญชีลูกค้า', `
    <label class="f">ชื่อที่แสดง<input class="in" id="naName" placeholder="${role === 'trainer' ? 'เช่น PT-Palm' : 'เช่น คุณเอ'}"></label>
    <label class="f">ชื่อผู้ใช้ (ภาษาอังกฤษ ตัวเลข . _ -)<input class="in" id="naUser" autocapitalize="none" spellcheck="false" placeholder="เช่น ${role === 'trainer' ? 'ptpalm' : 'member.a'}"></label>
    <label class="f">รหัสผ่าน<div class="row"><input class="in" id="naPw" value="${genPw()}" style="flex:1"><button class="btn sm" data-act="regenPw">สุ่มใหม่</button></div></label>
    ${role === 'member' && tr.length ? `<label class="f">โค้ชที่ดูแล<select class="in" id="naTrainer">${tr.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>` : ''}
    ${role === 'member' ? `<div class="grid2"><label class="f">เป้าพลังงาน (kcal)<input class="in" id="naKcal" inputmode="numeric"></label><label class="f">น้ำหนักตั้งต้น (kg)<input class="in" id="naW" inputmode="decimal"></label></div>` : ''}
    <button class="btn pri block" data-act="createAccount" data-v="${role}">สร้างบัญชี</button>`, { kind: 'newacc', role, tr });
}
async function createAuthUser(username, pw, suffix) {
  const a2 = secondaryAuth(); let email = `${username}${suffix ? '.' + suffix : ''}@${LOGIN_DOMAIN}`;
  try { const c = await fb.createUserWithEmailAndPassword(a2, email, pw); return { uid: c.user.uid, email }; }
  catch (e) {
    if (String(e.code).includes('email-already-in-use')) { email = `${username}.${Date.now().toString(36)}@${LOGIN_DOMAIN}`; const c = await fb.createUserWithEmailAndPassword(a2, email, pw); return { uid: c.user.uid, email }; }
    throw e;
  } finally { try { await fb.signOut(a2); } catch (e) { } }
}
async function createAccount(role) {
  const name = $('#naName').value.trim(); const username = $('#naUser').value.trim().toLowerCase(); const pw = $('#naPw').value.trim();
  if (!name) return toast('ใส่ชื่อที่แสดง');
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return toast('ชื่อผู้ใช้ใช้ a-z 0-9 . _ - ยาว 3–30 ตัว');
  if (pw.length < 6) return toast('รหัสผ่านอย่างน้อย 6 ตัว');
  if (await get(D('logins', username))) return toast('ชื่อผู้ใช้นี้มีคนใช้แล้ว');
  const btn = document.querySelector('[data-act=createAccount]'); if (btn) { btn.disabled = true; btn.textContent = 'กำลังสร้าง…'; }
  try {
    let trainerPid = null, trainerName = null;
    if (role === 'member') {
      if (S.me.role === 'trainer') { trainerPid = S.me.pid; trainerName = S.me.name; }
      else { trainerPid = $('#naTrainer').value; trainerName = sheet.tr.find(t => t.id === trainerPid)?.name || ''; }
    }
    const pref = fb.doc(C('people'));
    const pdata = { role, name, username, active: true, trainerPid, trainerName, createdAt: fb.serverTimestamp(), createdBy: S.me.role, createdByPid: S.me.pid || null };
    if (role === 'member') { const k = num($('#naKcal').value); const w = num($('#naW').value); pdata.targets = k ? { kcal: k, addBurn: true } : {}; if (w) pdata.weight = w; }
    await fb.setDoc(pref, pdata);
    const { uid, email } = await createAuthUser(username, pw);
    await fb.setDoc(D('accounts', uid), { pid: pref.id, role, username, at: fb.serverTimestamp() });
    await fb.setDoc(D('logins', username), { email, pid: pref.id, role });
    await fb.updateDoc(pref, { authUid: uid });
    if (role === 'member' && pdata.weight) await fb.addDoc(C('people', pref.id, 'body'), { date: todayStr(), weight: pdata.weight, t: Date.now(), ph: [] });
    showCredentials(name, username, pw, true);
  } catch (e) { console.error(e); toast('สร้างบัญชีไม่สำเร็จ: ' + (e.code || e.message)); if (btn) { btn.disabled = false; btn.textContent = 'สร้างบัญชี'; } }
}
function appUrl() { return location.origin + location.pathname.replace(/[^/]*$/, ''); }
function showCredentials(name, username, pw, isNew) {
  const txt = `${S.config.name || 'The Olympic Club by PT-Palm'}\nเข้าใช้ที่: ${appUrl()}\nชื่อผู้ใช้: ${username}\nรหัสผ่าน: ${pw}`;
  sheet = { ...(sheet || {}), cred: txt };
  openSheet(isNew ? 'สร้างบัญชีแล้ว' : 'ตั้งรหัสใหม่แล้ว', `<p class="small" style="margin:0">ส่งข้อความนี้ให้ <b>${esc(name)}</b> ทาง LINE รหัสผ่านจะแสดงครั้งเดียว</p>
    <textarea class="in" readonly style="min-height:120px">${esc(txt)}</textarea><button class="btn gold block" data-act="copyCred">คัดลอกข้อความ</button>`, { cred: txt });
  render();
}
async function openManage(pid) {
  const p = await person(pid, true);
  if (p.role === 'trainer') return openManageTrainer(p);
  const mine = S.me.role === 'owner' || p.trainerPid === S.me.pid;
  const tr = canManageTeam() ? (await trainers()).filter(t => t.active) : [];
  openSheet('จัดการบัญชี', `<section class="card"><b>${esc(p.name)}</b><span class="small muted">@${esc(p.username)} · ลูกค้า · โค้ช ${esc(p.trainerName || '—')} · ${p.active ? 'ใช้งานอยู่' : 'ปิดบัญชี'}</span></section>
    ${mine ? `<button class="btn" data-act="openClient" data-id="${pid}">เปิดดูข้อมูลของลูกค้า</button>` : ''}
    ${tr.length ? `<label class="f">ย้ายโค้ชที่ดูแล<select class="in" id="mgTrainer">${tr.map(t => `<option value="${t.id}" ${t.id === p.trainerPid ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label><button class="btn" data-act="moveTrainer" data-id="${pid}">บันทึกการย้าย</button>` : ''}
    ${mine ? `<button class="btn" data-act="resetPw" data-id="${pid}">ตั้งรหัสผ่านใหม่</button>
    <button class="btn ${p.active ? 'danger' : 'pri'}" data-act="toggleActive" data-id="${pid}">${p.active ? 'ปิดบัญชี (เข้าใช้ไม่ได้)' : 'เปิดบัญชีอีกครั้ง'}</button>` : ''}
    <p class="xs muted" style="margin:0">การลบข้อมูลลูกค้าถาวรทำได้เฉพาะเจ้าของระบบ</p>`, { kind: 'manage', pid });
}
async function openManageTrainer(t) {
  const pid = t.id; const owner = S.me.role === 'owner'; const can = canManageTrainer(t);
  const [ms, all] = await Promise.all([list(fb.query(C('people'), fb.where('trainerPid', '==', pid))), trainers()]);
  const dest = all.filter(x => x.active && x.id !== pid);
  const opts = dest.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('');
  const canDelete = can && !t.active && ms.length === 0;
  openSheet('จัดการเทรนเนอร์', `<section class="card"><div class="between"><b>${esc(t.name)}</b><span>${trainerTags(t, ms.length)}</span></div><span class="small muted">@${esc(t.username)} · ${t.active ? 'ใช้งานอยู่' : 'พักงาน (เข้าแอปไม่ได้)'} · ลูกค้า ${ms.length} คน</span></section>
    ${owner ? `<section class="card sand"><b>สิทธิ์หัวหน้าเทรนเนอร์</b><span class="small">สร้างบัญชีเทรนเนอร์ พักงาน/เปิดใช้งาน ตั้งรหัสใหม่ ย้ายลูกค้า และลบเทรนเนอร์ที่ไม่มีลูกค้าแล้ว (แก้ตั้งค่าแอปไม่ได้) ให้ได้ครั้งละ 1 คน</span>
      <button class="btn ${t.canManageTrainers ? 'danger' : 'gold'}" data-act="toggleHead" data-id="${pid}">${t.canManageTrainers ? 'ถอนสิทธิ์หัวหน้าเทรนเนอร์' : 'ให้สิทธิ์หัวหน้าเทรนเนอร์'}</button></section>` : ''}
    ${can ? `<button class="btn ${t.active ? 'danger' : 'pri'}" data-act="toggleActive" data-id="${pid}">${t.active ? 'พักงาน (Hold) — เข้าแอปไม่ได้' : 'เปิดใช้งานอีกครั้ง'}</button>
    <button class="btn" data-act="resetPw" data-id="${pid}">ตั้งรหัสผ่านใหม่</button>` : '<p class="small muted" style="margin:0">บัญชีนี้จัดการได้เฉพาะเจ้าของระบบ</p>'}
    ${ms.length ? `<section class="card"><b>ลูกค้าในความดูแล (${ms.length})</b>
      ${dest.length ? `${ms.map(m => `<div class="row"><span style="flex:1;min-width:0">${esc(m.name)}</span><select class="in" id="mv_${m.id}" style="width:auto;flex:1">${opts}</select><button class="btn sm" data-act="moveOne" data-id="${m.id}">ย้าย</button></div>`).join('')}
      <div class="hr"></div><label class="f">ย้ายทั้งหมดไปที่<select class="in" id="mvAll">${opts}</select></label><button class="btn pri" data-act="moveAll" data-id="${pid}">ย้ายลูกค้าทั้งหมด ${ms.length} คน</button>`
      : '<p class="small muted" style="margin:0">ยังไม่มีเทรนเนอร์คนอื่นที่เปิดใช้งาน สร้างหรือเปิดใช้งานเทรนเนอร์ก่อน แล้วค่อยย้ายลูกค้า</p>'}</section>` : ''}
    ${can ? `<section class="card"><b>ลบเทรนเนอร์</b><span class="small muted">${canDelete ? 'พักงานแล้ว และไม่มีลูกค้าค้าง ลบได้' : !t.active ? `ยังลบไม่ได้: ย้ายลูกค้าออกอีก ${ms.length} คน` : 'ยังลบไม่ได้: ต้องพักงานก่อน และย้ายลูกค้าออกให้หมด'}</span>
      <button class="btn danger" data-act="deleteTrainer" data-id="${pid}" ${canDelete ? '' : 'disabled'}>ลบบัญชีเทรนเนอร์</button></section>` : ''}`, { kind: 'manageTrainer', pid, ms });
}
async function moveMembers(ids, tid) {
  const tr = await person(tid, true);
  if (!tr || tr.role !== 'trainer' || !tr.active) throw new Error('เลือกเทรนเนอร์ที่เปิดใช้งานอยู่');
  for (let i = 0; i < ids.length; i += 10) { // ทีละ 10 คน ให้อยู่ในเพดานการตรวจสิทธิ์ของ Firestore
    const b = fb.writeBatch(db);
    for (const id of ids.slice(i, i + 10)) b.update(D('people', id), { trainerPid: tid, trainerName: tr.name });
    await b.commit();
  }
  ids.forEach(id => S.cache.delete('p:' + id));
  return tr;
}
async function deleteTrainer(pid) {
  const t = await person(pid, true);
  const left = await list(fb.query(C('people'), fb.where('trainerPid', '==', pid)));
  if (t.active) return toast('ต้องพักงานเทรนเนอร์ก่อน');
  if (left.length) return toast(`ยังมีลูกค้าค้างอยู่ ${left.length} คน ย้ายออกให้หมดก่อน`);
  if (!confirm(`ลบบัญชีเทรนเนอร์ ${t.name} ถาวร? ประวัติการเทรนที่บันทึกไว้ของลูกค้ายังอยู่ครบ`)) return;
  const lg = await get(D('logins', t.username));
  if (lg && lg.pid === pid) await fb.deleteDoc(D('logins', t.username));
  if (t.authUid) { try { await fb.deleteDoc(D('accounts', t.authUid)); } catch (e) { console.warn(e); } }
  await fb.deleteDoc(D('people', pid));
  S.cache.delete('p:' + pid); closeSheet(); toast('ลบเทรนเนอร์แล้ว'); render();
}
async function resetPw(pid) {
  const p = await person(pid, true); const pw = genPw();
  if (!confirm(`ตั้งรหัสผ่านใหม่ให้ ${p.name}? รหัสเดิมจะใช้ไม่ได้ทันที`)) return;
  const { uid, email } = await createAuthUser(p.username, pw, Date.now().toString(36));
  await fb.setDoc(D('accounts', uid), { pid, role: p.role, username: p.username, at: fb.serverTimestamp() });
  await fb.setDoc(D('logins', p.username), { email, pid, role: p.role });
  if (p.authUid) { try { await fb.deleteDoc(D('accounts', p.authUid)); } catch (e) { console.warn(e); } }
  await fb.updateDoc(D('people', pid), { authUid: uid });
  S.cache.delete('p:' + pid); showCredentials(p.name, p.username, pw, false);
}

/* ============ การตอบสนองปุ่ม ============ */
async function onClick(e) {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act;
  if (a === 'sheetBg') { if (e.target === el) closeSheet(); return; }
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  e.preventDefault();
  try { await (ACTS[a] ? ACTS[a](el) : null); } catch (err) { console.error(err); toast('ทำรายการไม่สำเร็จ: ' + (err.code || err.message)); }
}
const ACTS = {
  login: doLogin, ownerLogin, logout, reload: () => render(), closeSheet,
  changePw: openChangePw, savePw, pwShow: () => { sheet.show = !sheet.show; pwRedraw(); },
  consent: async () => { await fb.updateDoc(D('people', S.me.pid), { consentAt: fb.serverTimestamp() }); S.me.person.consentAt = true; startApp(); },
  tab: el => { if (el.dataset.v === 'log' && S.me.role === 'trainer' && !viewingClient()) ui.log = ui.log; ui.tab = el.dataset.v; window.scrollTo(0, 0); render(); },
  exitClient: () => { S.view = null; ui.tab = 'clients'; render(); },
  dayNav: el => { const d = +el.dataset.d; ui.date = d === 0 ? todayStr() : addDays(ui.date, d); render(); },
  sumNav: el => { const d = +el.dataset.d; ui.sumDate = d === 0 ? todayStr() : addDays(ui.sumDate, d); render(); },
  exWeek: el => { ui.exDate = addDays(ui.exDate, +el.dataset.d); render(); },
  exDay: el => { ui.exDate = el.dataset.v; render(); },
  schedWeek: el => { ui.schedDate = addDays(ui.schedDate, +el.dataset.d); render(); },
  schedDay: el => { ui.schedDate = el.dataset.v; render(); },
  filter: el => { ui.filter = el.dataset.v; render(); },
  openClient: el => { closeSheet(); return openClient(el.dataset.id); },
  water: async el => { const v = +el.dataset.v; await mutateDay(S.view, ui.date, d => { d.water = Math.max(0, (+d.water || 0) + v); }); render(); },
  rmFood: async el => { if (!confirm('ลบรายการนี้?')) return; const m = el.dataset.m, i = +el.dataset.i; await mutateDay(S.view, ui.date, d => { (d.meals[m] || []).splice(i, 1); }); render(); },
  addFood: el => { openSheet('เพิ่มอาหาร', '', { kind: 'food', meal: el.dataset.m, mode: 'db', q: '', pick: null, qty: null, mf: {}, ph: [] }); refreshSheet(foodSheetBody()); },
  foodMode: el => { sheet.mode = el.dataset.v; refreshSheet(foodSheetBody()); fillThumbs($('#sheetBody')); },
  qkSet: el => { const st = qkState(); st[el.dataset.k] = qkNum(el.dataset.k, el.dataset.v); if (el.dataset.k === 'riceG' && +st.riceG && !+st.ate) st.ate = 100; redrawFood(); },
  ndSet: el => { const st = ndState(); st[el.dataset.k] = qkNum(el.dataset.k, el.dataset.v); redrawFood(); },
  ndTop: el => { const st = ndState(), k = el.dataset.v; st.tops = (st.tops || []).includes(k) ? st.tops.filter(x => x !== k) : [...(st.tops || []), k]; redrawFood(); },
  cfSet: el => { const st = cfState(), k = el.dataset.k, v = el.dataset.v; st[k] = ['size', 'sweet', 'drank', 'share', 'noDrink'].includes(k) ? +v : v; if (k === 'drink') { const d = CAFE.drinks.find(x => x.k === v); if (d) st.sweet = d.sw0; } redrawFood(); },
  cfEx: el => { const st = cfState(), k = el.dataset.v; st.extras = (st.extras || []).includes(k) ? st.extras.filter(x => x !== k) : [...(st.extras || []), k]; redrawFood(); },
  cfBk: el => { const st = cfState(), k = el.dataset.v; st.bk = { ...(st.bk || {}), [k]: ((+(st.bk || {})[k] || 0) + 1) % 4 }; redrawFood(); },
  cfBkClr: () => { cfState().bk = {}; redrawFood(); },
  cfFrom: el => { const f = FOOD[el.dataset.id]; if (!f) return; const st = cfState(); if (f.cf) { Object.assign(st, { ...f.cf, noDrink: 0 }); } else if (f.bk) { st.bk = { ...(st.bk || {}), [f.bk]: Math.max(1, +(st.bk || {})[f.bk] || 0) }; } sheet.mode = 'cafe'; redrawFood(); },
  saveCafe: () => saveCafe(),
  qkFrom: el => { const f = FOOD[el.dataset.id]; if (!f?.qk) return; sheet.qk = { ...qkState(), ...f.qk, size: 1, riceG: 200, rice: 'white', ate: 100, eggN: 1 }; sheet.mode = 'quick'; redrawFood(); },
  saveBuilt,
  pickFood: el => { sheet.pick = el.dataset.id; sheet.qty = null; refreshSheet(foodSheetBody()); fillThumbs($('#sheetBody')); $('#fQty')?.focus(); },
  saveFood,
  saveCoachNote: async () => { const v = $('#coachNote').value.trim(); await mutateDay(S.view, ui.date, d => { d.coachNote = v; }); toast('บันทึกโน้ตแล้ว'); render(); },
  editTargets: async () => {
    const p = await person(S.view, true); const t = p.targets || {};
    openSheet('เป้าหมายของ ' + p.name, `<div class="grid2"><label class="f">พลังงาน (kcal)<input class="in" id="tK" inputmode="numeric" value="${esc(t.kcal ?? '')}"></label><label class="f">น้ำ (มล.)<input class="in" id="tW" inputmode="numeric" value="${esc(t.water ?? 2500)}"></label>
      <label class="f">โปรตีน (g)<input class="in" id="tP" inputmode="numeric" value="${esc(t.p ?? '')}"></label><label class="f">คาร์บ (g)<input class="in" id="tC" inputmode="numeric" value="${esc(t.c ?? '')}"></label><label class="f">ไขมัน (g)<input class="in" id="tF" inputmode="numeric" value="${esc(t.f ?? '')}"></label></div>
      <label class="row small" style="min-height:44px"><input type="checkbox" id="tB" ${t.addBurn !== false ? 'checked' : ''} style="width:22px;height:22px;accent-color:#14202E"> นับแคลที่เผาผลาญคืนให้ลูกค้า</label>
      <button class="btn pri block" data-act="saveTargets">บันทึกเป้าหมาย</button>`, { kind: 'targets' });
  },
  saveTargets: async () => {
    const t = { kcal: num($('#tK').value), water: num($('#tW').value), p: num($('#tP').value), c: num($('#tC').value), f: num($('#tF').value), addBurn: $('#tB').checked };
    Object.keys(t).forEach(k => t[k] == null && delete t[k]);
    await fb.updateDoc(D('people', S.view), { targets: t }); S.cache.delete('p:' + S.view); closeSheet(); toast('บันทึกเป้าหมายแล้ว'); render();
  },
  addAct: openAddAct,
  actType: el => { readActForm(); sheet.type = el.dataset.v; refreshSheet(actSheetBody()); fillThumbs($('#sheetBody')); },
  actMode: el => { readActForm(); sheet.mode = el.dataset.v; refreshSheet(actSheetBody()); fillThumbs($('#sheetBody')); },
  saveAct,
  aiWatch: async el => {
    readActForm(); el.disabled = true; el.textContent = 'AI กำลังอ่านรูป…';
    try {
      const r = await aiRead('watch', sheet.lastImg);
      if (r.activity && ACT[r.activity]) sheet.type = r.activity;
      if (num(r.minutes)) sheet.min = Math.round(num(r.minutes));
      if (num(r.kcal)) { sheet.kcal = Math.round(num(r.kcal)); sheet.mode = 'manual'; }
      sheet.aiMsg = (num(r.minutes) || num(r.kcal)) ? `AI กรอกให้แล้ว ${num(r.minutes) ? Math.round(num(r.minutes)) + ' นาที' : ''} ${num(r.kcal) ? '· ' + Math.round(num(r.kcal)) + ' kcal' : ''} ตรวจก่อนบันทึก` : 'AI อ่านตัวเลขจากรูปนี้ไม่ได้ กรอกเองได้เลย';
    } catch (err) { console.error(err); sheet.aiMsg = 'AI อ่านไม่สำเร็จ (' + (err.message || err).toString().slice(0, 60) + ')'; }
    refreshSheet(actSheetBody()); fillThumbs($('#sheetBody'));
  },
  rmAct: async el => { if (!confirm('ลบกิจกรรมนี้?')) return; await fb.deleteDoc(D('people', S.view, 'activities', el.dataset.id)); render(); },
  wkSel: el => { ui.wkSel = +el.dataset.v; render(); },
  addBody: el => { openSheet(el.dataset.v === 'scan' ? 'เพิ่มผลสแกน' : 'บันทึกน้ำหนัก', '', { kind: 'body', mode: el.dataset.v, v: { date: todayStr() }, ph: [], lastImg: null }); refreshSheet(bodySheetBody()); },
  aiInbody: async el => {
    readBodyForm(); el.disabled = true; el.textContent = 'AI กำลังอ่านใบผล…';
    try {
      const r = await aiRead('inbody', sheet.lastImg); const keys = [];
      for (const [k] of BODY_FIELDS) if (num(r[k]) != null) { sheet.v[k] = num(r[k]); keys.push(k); }
      if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) sheet.v.date = r.date;
      sheet.aiKeys = keys; sheet.aiMsg = keys.length ? `AI กรอกให้แล้ว ${keys.length} ช่อง` : 'AI อ่านตัวเลขจากรูปนี้ไม่ได้ กรอกเองได้เลย';
    } catch (err) { console.error(err); sheet.aiMsg = 'AI อ่านไม่สำเร็จ (' + (err.message || err).toString().slice(0, 60) + ')'; }
    refreshSheet(bodySheetBody()); fillThumbs($('#sheetBody'));
  },
  saveBody,
  rmBody: async el => { if (!confirm('ลบรายการนี้?')) return; await fb.deleteDoc(D('people', S.view, 'body', el.dataset.id)); render(); },
  rmPhoto: el => { const i = +el.dataset.i; if (sheet?.ph) { sheet.ph.splice(i, 1); $('#thumbs').outerHTML = photoPickerKeep(); fillThumbs($('#sheetBody')); } else if (ui.log) { logForm(); ui.log.ph.splice(i, 1); render(); } },
  viewPhoto: el => openViewer((el.dataset.set || el.dataset.id).split(',').filter(Boolean), +el.dataset.i || 0),
  lbBg: () => {},
  lbClose: () => closeViewer(),
  lbNav: el => navViewer(+el.dataset.d),
  lbZoom: el => el.classList.toggle('zoom'),
  newSession: openNewSession, saveSession,
  cancelSession: async el => { if (!confirm('ยกเลิกนัดนี้?')) return; await fb.updateDoc(D('sessions', el.dataset.id), { status: 'cancelled', trainerPid: S.me.pid }); render(); },
  logSession: async el => { const s = await get(D('sessions', el.dataset.id)); await startLog(s); },
  logAdhoc: async () => { const mid = $('#lgMember').value; const m = await person(mid); await startLog({ memberPid: mid, memberName: m.name, date: $('#lgDate').value, time: $('#lgTime').value || nowHM(), type: 'Full body' }); },
  logCancel: () => { if (confirm('ยกเลิกการบันทึกนี้?')) { ui.log = null; render(); } },
  logType: el => { logForm(); ui.log.type = el.dataset.v; render(); },
  logPicking: async () => { logForm(); ui.log.picking = !ui.log.picking; ui.log.q = ''; if (ui.log.picking) await loadMoveLib(); render(); if (ui.log?.picking) $('#logCustom')?.focus(); },
  logUnit: el => { logForm(); const m = ui.log.moves[+el.dataset.i]; const to = el.dataset.v; if ((m.u || 'kg') === to) return; m.sets.forEach(x => { const w = num(x.w); if (w) x.w = r1(to === 'lb' ? w / LB : w * LB); }); m.u = to; ui.log.unit = to; render(); },
  logPick: el => addMove(el.dataset.v),
  logCustom: () => addMove($('#logCustom')?.value || ui.log.q),
  moveForget: el => {
    const k = moveKey(el.dataset.v); if (!S.moveLib || !confirm(`ลืมชื่อท่า “${el.dataset.v}”? (ผลเทรนเก่าที่ใช้ชื่อนี้ยังอยู่ครบ)`)) return;
    S.moveLib.names = S.moveLib.names.filter(n => moveKey(n) !== k); if (!S.moveLib.hidden.includes(k)) S.moveLib.hidden.push(k);
    saveMoveLib(); refreshMovePick();
  },
  logAddSet: el => { logForm(); const m = ui.log.moves[+el.dataset.i]; const l = m.sets[m.sets.length - 1] || { r: 10, w: 0 }; m.sets.push({ ...l }); render(); },
  logRmSet: el => { logForm(); ui.log.moves[+el.dataset.mi].sets.splice(+el.dataset.si, 1); render(); },
  logRmMove: el => { logForm(); if (confirm('ลบท่านี้?')) { ui.log.moves.splice(+el.dataset.i, 1); render(); } },
  logSave: saveLog,
  copyDigest: async () => { try { await navigator.clipboard.writeText(ui.digest || ''); toast('คัดลอกแล้ว ไปวางใน LINE ได้เลย'); } catch (e) { toast('คัดลอกไม่ได้ ลองกดค้างที่ข้อความแทน'); } },
  newAccount: el => openNewAccount(el.dataset.v),
  regenPw: () => { $('#naPw').value = genPw(); },
  createAccount: el => createAccount(el.dataset.v),
  copyCred: async () => { try { await navigator.clipboard.writeText(sheet.cred); toast('คัดลอกแล้ว'); } catch (e) { toast('คัดลอกไม่ได้ กดค้างที่ข้อความแทน'); } },
  manage: el => openManage(el.dataset.id),
  resetPw: el => resetPw(el.dataset.id),
  toggleActive: async el => { const p = await person(el.dataset.id, true); const tr = p.role === 'trainer'; if (!confirm(p.active ? (tr ? `พักงาน ${p.name}? เข้าแอปไม่ได้จนกว่าจะเปิดอีกครั้ง ลูกค้าของ ${p.name} ยังใช้งานได้ตามปกติ` : `ปิดบัญชี ${p.name}? เข้าใช้งานไม่ได้จนกว่าจะเปิดอีกครั้ง`) : `เปิดใช้งาน ${p.name} อีกครั้ง?`)) return; await fb.updateDoc(D('people', el.dataset.id), { active: !p.active }); S.cache.delete('p:' + el.dataset.id); closeSheet(); toast('บันทึกแล้ว'); render(); },
  moveTrainer: async el => { const tr = await moveMembers([el.dataset.id], $('#mgTrainer').value); closeSheet(); toast('ย้ายไปดูแลโดย ' + tr.name + ' แล้ว'); render(); },
  moveOne: async el => { const tr = await moveMembers([el.dataset.id], $('#mv_' + el.dataset.id).value); toast('ย้ายไป ' + tr.name + ' แล้ว'); await openManageTrainer(await person(sheet.pid, true)); render(); },
  moveAll: async el => { const ids = sheet.ms.map(m => m.id); const tid = $('#mvAll').value; if (!confirm(`ย้ายลูกค้าทั้งหมด ${ids.length} คน ไปอยู่กับ ${S.cache.get('p:' + tid)?.name || 'เทรนเนอร์ที่เลือก'}?`)) return; const tr = await moveMembers(ids, tid); toast(`ย้าย ${ids.length} คนไป ${tr.name} แล้ว`); await openManageTrainer(await person(el.dataset.id, true)); render(); },
  deleteTrainer: el => deleteTrainer(el.dataset.id),
  toggleHead: async el => {
    const t = await person(el.dataset.id, true); const on = !t.canManageTrainers;
    if (!confirm(on ? `ให้ ${t.name} เป็นหัวหน้าเทรนเนอร์? (ถ้ามีคนอื่นมีสิทธิ์อยู่ จะถูกถอนออก)` : `ถอนสิทธิ์หัวหน้าเทรนเนอร์ของ ${t.name}?`)) return;
    const b = fb.writeBatch(db);
    if (on) (await trainers()).filter(x => x.canManageTrainers && x.id !== t.id).forEach(x => b.update(D('people', x.id), { canManageTrainers: false }));
    b.update(D('people', t.id), { canManageTrainers: on });
    await b.commit(); S.cache.clear(); closeSheet(); toast(on ? t.name + ' เป็นหัวหน้าเทรนเนอร์แล้ว' : 'ถอนสิทธิ์แล้ว'); render();
  },
  lineLink: () => lineLink(),
  lineTest: async () => { const r = await relay('test'); toast(r.ok ? 'ส่งแล้ว เปิด LINE ดูได้เลย' : (r.error || 'ส่งไม่สำเร็จ')); },
  lineDigestTest: async () => { toast('กำลังส่ง…', 8000); const r = await relay('digestTest'); toast(r.ok ? `ส่งสรุป ${r.n} คนเข้า LINE แล้ว` : (r.error || 'ส่งไม่สำเร็จ')); },
  lineUnlink: async el => { if (!confirm('ยกเลิกการเชื่อม LINE? จะไม่ได้รับแจ้งเตือนอีก')) return; const r = await relay('unlink', el.dataset.k ? { k: el.dataset.k } : {}); toast(r.ok ? 'ยกเลิกแล้ว' : (r.error || 'ไม่สำเร็จ')); await refreshLineCard(); },
  lineRefresh: async () => { await refreshLineCard(); toast('ตรวจแล้ว'); },
  alertType: async el => {
    if (S.me.role !== 'owner') return;
    const k = el.dataset.k, t = el.dataset.t, a = alertOf(k, el.dataset.role);
    const types = a.types.includes(t) ? a.types.filter(x => x !== t) : [...a.types, t];
    await saveAlert(k, { on: true, types }); el.setAttribute('aria-pressed', String(types.includes(t))); toast('บันทึกแล้ว', 1200);
  },
  lineTestTo: async el => { const r = await relay('test', { k: el.dataset.k }); toast(r.ok ? 'ส่งแล้ว' : (r.error || 'ส่งไม่สำเร็จ')); },
  saveLine: async () => {
    const c = { lineUrl: $('#lnUrl').value.trim(), lineOn: $('#lnOn').checked };
    if (c.lineUrl && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(c.lineUrl)) return toast('ลิงก์ต้องเป็น https://script.google.com/macros/s/…/exec');
    await fb.setDoc(D('config', 'app'), c, { merge: true }); Object.assign(S.config, c); line.info = null; toast('บันทึกแล้ว'); await refreshLineCard();
  },
  saveConfig: async () => {
    const c = { name: $('#cfName').value.trim() || 'The Olympic Club by PT-Palm', aiOn: $('#cfAi').checked, aiModel: $('#cfModel').value.trim() || 'gemini-3.5-flash', digestTime: $('#cfTime').value || '21:00', workoutDelayMin: num($('#cfDelay').value) || 60 };
    await fb.setDoc(D('config', 'app'), c, { merge: true }); Object.assign(S.config, c); toast('บันทึกการตั้งค่าแล้ว');
  }
};
function photoPickerKeep() { return `<div class="thumbs" id="thumbs">${thumbsHtml(sheet?.ph, true)}<label class="addthumb">${svg('cam', 22)}แนบรูป<input type="file" accept="image/*" multiple hidden data-act="pickPhoto"></label></div>`; }
async function onChange(e) {
  const el = e.target;
  if (el.dataset?.alertOn && S.me.role === 'owner') {
    const k = el.dataset.alertOn, a = alertOf(k, el.dataset.role);
    try { await saveAlert(k, { on: el.checked, types: a.types }); toast(el.checked ? 'เปิดรับแจ้งเตือนแล้ว' : 'ปิดแจ้งเตือนแล้ว', 1500); render(); } catch (err) { console.error(err); toast('บันทึกไม่สำเร็จ'); el.checked = !el.checked; }
    return;
  }
  if (el.id === 'fMeal' && sheet) { sheet.meal = el.value; return; }
  if (el.dataset?.act === 'pickPhoto' && el.files?.length) {
    const pid = S.view; const files = [...el.files]; toast('กำลังแนบรูป…', 8000);
    for (const f of files) { try { const d = await compress(f); const id = await savePhoto(pid, d); sheet.ph.push(id); sheet.lastImg = d; } catch (err) { console.error(err); toast('แนบรูปไม่สำเร็จ'); } }
    toast('แนบรูปแล้ว');
    if (sheet.kind === 'act') { readActForm(); refreshSheet(actSheetBody()); }
    else if (sheet.kind === 'body') { readBodyForm(); refreshSheet(bodySheetBody()); }
    else if (sheet.kind === 'food') { $('#thumbs').outerHTML = photoPickerKeep(); }
    fillThumbs($('#sheetBody')); return;
  }
  if (el.dataset?.act === 'pickLogPhoto' && el.files?.length) {
    logForm(); toast('กำลังแนบรูป…', 8000);
    for (const f of [...el.files]) { try { const d = await compress(f); ui.log.ph.push(await savePhoto(ui.log.memberPid, d)); } catch (err) { console.error(err); toast('แนบรูปไม่สำเร็จ'); } }
    toast('แนบรูปแล้ว'); render(); return;
  }
  if (el.dataset?.act === 'wkMove') { ui.wkMove = el.value; render(); return; }
  if (el.dataset?.set && ui.log) { const m = ui.log.moves[+el.dataset.mi]; m.sets[+el.dataset.si][el.dataset.set] = el.value;
    if (el.dataset.set === 'w') convHint(el, m);
    return; }
  if (el.id === 'fQty' && sheet) { sheet.qty = el.value; refreshSheet(foodSheetBody()); fillThumbs($('#sheetBody')); return; }
  if ((el.id === 'aMin') && sheet?.kind === 'act' && sheet.mode === 'auto') { readActForm(); refreshSheet(actSheetBody()); fillThumbs($('#sheetBody')); }
}
function onInput(e) {
  const el = e.target;
  if (el.id === 'logCustom' && ui.log) { ui.log.q = el.value; refreshMovePick(); return; }
  if (el.id === 'fSearch' && sheet) { sheet.q = el.value; sheet.pick = null; const pos = el.selectionStart; refreshSheet(foodSheetBody()); fillThumbs($('#sheetBody')); const n = $('#fSearch'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { } }
  if (el.dataset?.set && ui.log) { const m = ui.log.moves[+el.dataset.mi]; m.sets[+el.dataset.si][el.dataset.set] = el.value; if (el.dataset.set === 'w') convHint(el, m); }
}
function onKey(e) {
  if (document.getElementById('viewer')) { if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowLeft') navViewer(-1); else if (e.key === 'ArrowRight') navViewer(1); return; }
  if (e.key === 'Enter' && (e.target.id === 'lgPass' || e.target.id === 'lgUser')) doLogin();
  if (e.key === 'Enter' && e.target.id === 'logCustom' && ui.log && !e.isComposing) { e.preventDefault(); const q = moveKey(e.target.value); if (!q) return; const hit = [...(S.moveLib?.names || []), ...MOVES].find(n => moveKey(n) === q); addMove(hit || e.target.value); }
  if (e.key === 'Enter' && ['cpOld', 'cpNew', 'cpNew2'].includes(e.target.id)) { e.preventDefault(); if (e.target.id === 'cpNew2') savePw(); else $(e.target.id === 'cpOld' ? '#cpNew' : '#cpNew2')?.focus(); } if (e.key === 'Escape' && sheet) closeSheet(); }

export const __test = { S, ui, dayTotals, foodCalc, digestText, addDays, weekStart, thDate, lineChart, render, ACTS, onInput, onChange, setFb: (f, d, a) => { fb = f; db = d; auth = a; } };
if (typeof window !== 'undefined' && !window.__NO_BOOT__) {
  document.addEventListener('click', onClick); document.addEventListener('change', onChange); document.addEventListener('input', onInput); document.addEventListener('keydown', onKey);
  boot();
  // แจ้งเมื่อมีเวอร์ชันใหม่ (หน้าเก่าที่เปิดค้างไว้ หรือเบราว์เซอร์จำไฟล์เก่า)
  const MYV = (import.meta.url.match(/[?&]v=([\w-]+)/) || [])[1];
  const checkUpdate = async () => {
    if (!MYV || document.getElementById('updBar')) return;
    try {
      const h = await (await fetch('index.html?_=' + Date.now(), { cache: 'no-store' })).text();
      const v = (h.match(/app\.js\?v=([\w-]+)/) || [])[1];
      if (v && v !== MYV) {
        const b = document.createElement('button'); b.id = 'updBar'; b.type = 'button';
        b.textContent = 'มีเวอร์ชันใหม่ · แตะเพื่ออัปเดต';
        b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top));z-index:9999;border:none;border-radius:22px;padding:12px 20px;background:#E0A526;color:#14202E;font:inherit;font-weight:700;box-shadow:0 6px 20px #0003;cursor:pointer';
        b.onclick = () => { if (ui.log && !confirm('ยังมีผลเทรนที่กรอกค้างอยู่ อัปเดตตอนนี้ข้อมูลที่ยังไม่บันทึกจะหาย ต้องการอัปเดตเลยไหม?')) return; const q = new URLSearchParams(location.search); q.set('u', v); location.replace(location.pathname + '?' + q + location.hash); };
        document.body.appendChild(b);
      }
    } catch { /* ออฟไลน์ ข้ามไป */ }
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
  setInterval(checkUpdate, 5 * 60000); setTimeout(checkUpdate, 15000);
}
