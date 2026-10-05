/**
 * LINE relay (Google Apps Script) — ใช้ร่วมกัน 2 แอป
 *   1) Fit Routine by Beer      (แอปส่งข้อความเองผ่าน APP_SECRET)
 *   2) The Olympic Club by PT-Palm (ส่วน "OLYMPIC CLUB" ด้านล่าง: ยืนยันตัวตนด้วย Firebase ID token,
 *      ส่งสรุปรายวันและผลเทรนเองตามเวลา ด้วย trigger ocTick ทุก 10 นาที อ่านข้อมูลจาก Firestore ด้วยสิทธิ์เจ้าของ)
 * ส่งแจ้งเตือนเป็นแชต 1:1 ผ่าน LINE Official Account + ให้แต่ละคนเชื่อม LINE ด้วย LINE Login
 * ติดตั้งส่วน Olympic Club ครั้งแรก: เลือกฟังก์ชัน ocSetup แล้วกด Run (อนุญาตสิทธิ์ 1 ครั้ง)
 *
 * ตั้งค่าใน Project Settings (รูปเฟือง) > Script properties
 *   LINE_TOKEN            = Channel access token (long-lived) ของ Messaging API channel (LINE OA)
 *   APP_SECRET            = รหัสลับที่ตั้งเอง ใส่ค่าเดียวกันในแอป หน้า ตั้งค่า > LINE
 *   LOGIN_CHANNEL_ID      = Channel ID ของ LINE Login channel
 *   LOGIN_CHANNEL_SECRET  = Channel secret ของ LINE Login channel
 *
 * แก้โค้ดแล้วต้อง Deploy > Manage deployments > แก้ (ดินสอ) > Version: New version > Deploy
 * เพื่อให้ URL เดิมใช้โค้ดใหม่
 */
const P = PropertiesService.getScriptProperties();

function links_() { try { return JSON.parse(P.getProperty('LINKS') || '{}'); } catch (e) { return {}; } }
function saveLinks_(l) { P.setProperty('LINKS', JSON.stringify(l)); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function callback_() { return P.getProperty('CALLBACK_URL') || ScriptApp.getService().getUrl(); }
function okSecret_(s) { return s && s === P.getProperty('APP_SECRET'); }

function doGet(e) {
  const p = (e && e.parameter) || {};

  // (1) LINE Login ส่งผู้ใช้กลับมาพร้อม code
  if (p.state && String(p.state).indexOf('oc.') === 0) return ocLoginCallback_(p);
  if (p.code && p.state) return loginCallback_(p);
  if (p.error && p.state) return page_('ยกเลิกการเชื่อม LINE', 'ไม่ได้เชื่อม LINE (' + p.error + ')', stateReturn_(p.state));

  // (2) แอปถามสถานะ
  if (p.action === 'info') {
    if (!okSecret_(p.secret)) return json_({ ok: false, error: 'รหัสลับ (APP_SECRET) ไม่ตรงกับใน Apps Script' });
    const L = links_(), out = {};
    Object.keys(L).forEach(function (k) { out[k] = { name: L[k].name, at: L[k].at, friend: L[k].friend }; });
    return json_({ ok: true, hasToken: !!P.getProperty('LINE_TOKEN'), loginChannelId: P.getProperty('LOGIN_CHANNEL_ID') || '', callback: callback_(), links: out });
  }
  return ContentService.createTextOutput('Fit Routine LINE relay ทำงานอยู่ · เชื่อมแล้ว ' + Object.keys(links_()).length + ' คน');
}

function doPost(e) {
  let b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'bad json' }); }

  // Webhook จาก LINE (เพิ่มเพื่อน ฯลฯ)
  if (Array.isArray(b.events)) {
    b.events.forEach(function (ev) {
      if (ev.type === 'follow' && ev.replyToken) reply_(ev.replyToken, 'ยินดีต้อนรับ 🏊‍♀️\nกลับไปที่แอปแล้วกด "เชื่อม LINE" เพื่อรับแจ้งเตือน\n· Fit Routine: ตั้งค่า → บัญชี\n· The Olympic Club: แท็บเพิ่มเติม');
      if (ev.type === 'follow' || ev.type === 'unfollow') setFriend_(ev.source && ev.source.userId, ev.type === 'follow');
    });
    return json_({ ok: true });
  }

  if (b.oc) return json_(ocApi_(b));
  if (!okSecret_(b.secret)) return json_({ ok: false, error: 'รหัสลับไม่ถูกต้อง' });

  if (b.action === 'unlink') { const L = links_(); delete L[b.k]; saveLinks_(L); return json_({ ok: true }); }

  // ส่งข้อความ: { messages: [{ to: 'owner' | memberId, text }] }
  const L = links_(), sent = [], skipped = [];
  (b.messages || []).slice(0, 10).forEach(function (m) {
    const t = L[m.to];
    if (!t || !t.uid) { skipped.push(m.to); return; }
    const code = push_(t.uid, String(m.text || '').slice(0, 4900));
    (code === 200 ? sent : skipped).push(m.to);
  });
  return json_({ ok: sent.length > 0 || !(b.messages || []).length, sent: sent, skipped: skipped, error: sent.length ? '' : 'ผู้รับยังไม่ได้เชื่อม LINE หรือยังไม่ได้เพิ่มเพื่อน OA' });
}

function loginCallback_(p) {
  const st = parseState_(p.state);
  if (!st || !st.k) return page_('เชื่อม LINE ไม่สำเร็จ', 'ลิงก์ไม่ถูกต้อง ลองกดเชื่อม LINE ในแอปอีกครั้ง', '');
  // แลก code เป็น token (ใช้ Channel secret ฝั่งเซิร์ฟเวอร์เท่านั้น)
  const tok = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'authorization_code', code: p.code, redirect_uri: callback_(), client_id: P.getProperty('LOGIN_CHANNEL_ID'), client_secret: P.getProperty('LOGIN_CHANNEL_SECRET') }
  });
  if (tok.getResponseCode() !== 200) return page_('เชื่อม LINE ไม่สำเร็จ', 'แลกรหัสไม่ผ่าน: ' + tok.getContentText().slice(0, 200), stateReturn_(p.state));
  const t = JSON.parse(tok.getContentText());
  // ยืนยัน ID token กับ LINE
  const ver = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', { method: 'post', muteHttpExceptions: true, payload: { id_token: t.id_token, client_id: P.getProperty('LOGIN_CHANNEL_ID') } });
  if (ver.getResponseCode() !== 200) return page_('เชื่อม LINE ไม่สำเร็จ', 'ยืนยันตัวตนไม่ผ่าน', stateReturn_(p.state));
  const v = JSON.parse(ver.getContentText());
  let friend = null;
  try { const f = UrlFetchApp.fetch('https://api.line.me/friendship/v1/status', { headers: { Authorization: 'Bearer ' + t.access_token }, muteHttpExceptions: true }); if (f.getResponseCode() === 200) friend = JSON.parse(f.getContentText()).friendFlag; } catch (err) { }
  const L = links_();
  Object.keys(L).forEach(function (k) { if (L[k].uid === v.sub && k !== st.k) delete L[k]; }); // LINE เดียวผูกได้คนเดียว
  L[st.k] = { uid: v.sub, name: v.name || '', appName: st.n || '', at: new Date().toISOString(), friend: friend };
  saveLinks_(L);
  if (friend) push_(v.sub, 'เชื่อม LINE กับ Fit Routine แล้ว ✅\nคุณจะได้รับแจ้งเตือนตามที่ตั้งค่าไว้ในแอป');
  return page_('เชื่อม LINE สำเร็จ ✅', (v.name || '') + ' เชื่อมกับ ' + (st.n || 'Fit Routine') + ' แล้ว' + (friend === false ? '\nอย่าลืมเพิ่มเพื่อน Fit Routine ใน LINE เพื่อรับข้อความ' : ''), stateReturn_(p.state));
}

function parseState_(s) {
  try { const b = s.replace(/-/g, '+').replace(/_/g, '/'); const pad = b + '==='.slice((b.length + 3) % 4); return JSON.parse(Utilities.newBlob(Utilities.base64Decode(pad)).getDataAsString()); } catch (e) { return null; }
}
function stateReturn_(s) {
  const st = parseState_(s) || {}; const r = String(st.r || '');
  if (!/^https:\/\//.test(r)) return '';
  const parts = r.split('#'); return parts[0] + '?line=linked' + (parts[1] ? '#' + parts[1] : '');
}
function page_(title, msg, back) {
  const h = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#09111E;color:#EEF2F7;display:flex;align-items:center;justify-content:center;min-height:90vh;margin:0">'
    + '<div style="max-width:420px;padding:24px;border:1px solid #C9A55C66;border-radius:16px;background:#101B2C">'
    + '<h2 style="margin:0 0 8px;color:#F6F1E6">' + title + '</h2><p style="white-space:pre-line;color:#97A5B9">' + msg + '</p>'
    + (back ? '<a href="' + back + '" target="_top" style="display:inline-block;margin-top:8px;padding:10px 16px;border-radius:10px;background:#C9A55C;color:#191206;text-decoration:none;font-weight:600">กลับไปที่ Fit Routine</a>' : '')
    + '</div></body>';
  return HtmlService.createHtmlOutput(h).setTitle('Fit Routine · LINE').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function push_(to, text) {
  const r = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + P.getProperty('LINE_TOKEN') },
    payload: JSON.stringify({ to: to, messages: [{ type: 'text', text: text }] })
  });
  return r.getResponseCode();
}
function reply_(token, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + P.getProperty('LINE_TOKEN') },
    payload: JSON.stringify({ replyToken: token, messages: [{ type: 'text', text: text }] })
  });
}
function setFriend_(uid, on) {
  if (!uid) return;
  const L = links_(); let ch = false; Object.keys(L).forEach(function (k) { if (L[k].uid === uid) { L[k].friend = on; ch = true; } }); if (ch) saveLinks_(L);
  const O = ocLinks_(); let c2 = false; Object.keys(O).forEach(function (k) { if (O[k].uid === uid) { O[k].friend = on; c2 = true; } }); if (c2) ocSaveLinks_(O);
}

// กด Run ฟังก์ชันนี้ครั้งแรกเพื่ออนุญาตสิทธิ์ แล้วดูผลใน Execution log
function checkSetup() {
  ['LINE_TOKEN', 'APP_SECRET', 'LOGIN_CHANNEL_ID', 'LOGIN_CHANNEL_SECRET'].forEach(function (k) { Logger.log(k + ': ' + (P.getProperty(k) ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้ง')); });
  Logger.log('Callback URL (ใส่ใน LINE Login): ' + callback_());
  Logger.log('เชื่อมแล้ว: ' + JSON.stringify(Object.keys(links_())));
}


/* =====================================================================
 * OLYMPIC CLUB by PT-Palm
 * - คนในแอปกด "เชื่อม LINE" → แอปส่ง Firebase ID token มาที่นี่ → ตรวจกับ Firebase ว่าเป็นใคร → ผูก LINE กับคนนั้น
 * - ocTick (ทุก 10 นาที): ส่งผลเทรนถึงลูกค้าหลังโค้ชบันทึกตามเวลาหน่วง และส่งสรุปรายวันถึงเทรนเนอร์ตามเวลาที่ตั้ง
 * - อ่าน/เขียน Firestore ด้วยสิทธิ์ของเจ้าของสคริปต์ (เจ้าของโปรเจกต์ Firebase)
 * ===================================================================== */
const OC = {
  project: 'olympic-club-ptplam',
  apiKey: 'AIzaSyDGYtnT5Ukv9_SvNZT0i-IMwA3e143VkVY',
  ownerEmail: 'piggybabe@gmail.com',
  appUrl: 'https://piggybabe-gmail.github.io/olympic-club/',
  tz: 'Asia/Bangkok',
  meals: ['เช้า', 'กลางวัน', 'ว่าง', 'เย็น'],
  days: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  months: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
};
// ใครได้รับอะไร (ตั้งในแอป แท็บระบบ → config/app.alerts[k] = { on, types }) · ยังไม่ตั้ง = ค่าเริ่มต้นตามบทบาท
function ocWants_(cfg, k, role, t) {
  const a = (cfg.alerts || {})[k];
  if (!a) return role === 'owner' ? (t === 'digest' && !!cfg.digestToOwner) : role === 'trainer' ? t === 'digest' : t === 'workout';
  return a.on !== false && (a.types || []).indexOf(t) >= 0;
}
function ocLinks_() { try { return JSON.parse(P.getProperty('OC_LINKS') || '{}'); } catch (e) { return {}; } }
function ocSaveLinks_(l) { P.setProperty('OC_LINKS', JSON.stringify(l)); }

// ---------- Firestore REST ----------
function fsBase_() { return 'https://firestore.googleapis.com/v1/projects/' + OC.project + '/databases/(default)/documents'; }
function fsOpt_(method, payload) {
  const o = { method: method || 'get', muteHttpExceptions: true, contentType: 'application/json', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': OC.project } };
  if (payload) o.payload = JSON.stringify(payload);
  return o;
}
function fsVal_(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return fsFields_(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal_);
  return null;
}
function fsFields_(f) { const o = {}; Object.keys(f || {}).forEach(function (k) { o[k] = fsVal_(f[k]); }); return o; }
function fsDoc_(d) { const o = fsFields_(d.fields); o._id = d.name.split('/').pop(); o._path = d.name.split('/documents/')[1]; return o; }
function fsGet_(path) {
  const r = UrlFetchApp.fetch(fsBase_() + '/' + path, fsOpt_('get'));
  if (r.getResponseCode() === 404) return null;
  if (r.getResponseCode() !== 200) throw new Error('Firestore ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
  return fsDoc_(JSON.parse(r.getContentText()));
}
// where = [[field, value], ...] (เท่ากับ)
function fsQuery_(parent, coll, where) {
  const filters = (where || []).map(function (w) {
    const v = typeof w[1] === 'boolean' ? { booleanValue: w[1] } : typeof w[1] === 'number' ? { integerValue: String(w[1]) } : { stringValue: String(w[1]) };
    return { fieldFilter: { field: { fieldPath: w[0] }, op: 'EQUAL', value: v } };
  });
  const q = { from: [{ collectionId: coll }] };
  if (filters.length === 1) q.where = filters[0]; else if (filters.length > 1) q.where = { compositeFilter: { op: 'AND', filters: filters } };
  const r = UrlFetchApp.fetch(fsBase_() + (parent ? '/' + parent : '') + ':runQuery', fsOpt_('post', { structuredQuery: q }));
  if (r.getResponseCode() !== 200) throw new Error('Firestore query ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText()).filter(function (x) { return x.document; }).map(function (x) { return fsDoc_(x.document); });
}
function fsPatch_(path, obj) {
  const fields = {}; const mask = [];
  Object.keys(obj).forEach(function (k) {
    const v = obj[k]; mask.push('updateMask.fieldPaths=' + encodeURIComponent(k));
    fields[k] = typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(Math.round(v)) } : v === null ? { nullValue: null } : { stringValue: String(v) };
  });
  const r = UrlFetchApp.fetch(fsBase_() + '/' + path + '?' + mask.join('&'), fsOpt_('patch', { fields: fields }));
  if (r.getResponseCode() !== 200) throw new Error('Firestore patch ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
}

// ---------- ยืนยันตัวตนจาก Firebase ID token ----------
function ocWho_(idToken) {
  if (!idToken) return null;
  const r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + OC.apiKey, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ idToken: idToken }) });
  if (r.getResponseCode() !== 200) return null;
  const u = (JSON.parse(r.getContentText()).users || [])[0]; if (!u) return null;
  if (String(u.email || '').toLowerCase() === OC.ownerEmail && u.emailVerified) return { k: 'owner', role: 'owner', name: 'เจ้าของระบบ' };
  const acc = fsGet_('accounts/' + u.localId); if (!acc) return null;
  const p = fsGet_('people/' + acc.pid); if (!p || p.active !== true) return null;
  return { k: acc.pid, role: acc.role, name: p.name };
}

function ocApi_(b) {
  try {
    const me = ocWho_(b.idToken);
    if (!me) return { ok: false, error: 'ยืนยันตัวตนไม่ผ่าน ลองออกจากระบบแล้วเข้าใหม่' };
    const L = ocLinks_();
    if (b.oc === 'info') {
      const out = { ok: true, me: me.k, link: L[me.k] ? { name: L[me.k].name, friend: L[me.k].friend, at: L[me.k].at } : null, hasToken: !!P.getProperty('LINE_TOKEN'), hasLogin: !!P.getProperty('LOGIN_CHANNEL_ID'), ticking: ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'ocTick'; }), lastDigest: P.getProperty('OC_DIGEST_DATE') || '', digestLog: me.role === 'owner' ? ocDigestLog_() : me.role === 'trainer' ? (function (g) { return { date: g.date, at: g.at, mine: (g.sent || {})[me.k] ? 'ส่งแล้ว' : (g.skip || {})[me.k] || '' }; })(ocDigestLog_()) : null };
      if (me.role === 'owner') { out.links = {}; Object.keys(L).forEach(function (k) { out.links[k] = { name: L[k].name, appName: L[k].appName, friend: L[k].friend, at: L[k].at }; }); }
      return out;
    }
    if (b.oc === 'start') {
      const cid = P.getProperty('LOGIN_CHANNEL_ID'); if (!cid) return { ok: false, error: 'ยังไม่ได้ตั้ง LINE Login ใน Apps Script' };
      const nonce = Utilities.getUuid().replace(/-/g, '');
      const back = /^https:\/\/piggybabe-gmail\.github\.io\//.test(String(b.back || '')) ? String(b.back) : OC.appUrl;
      CacheService.getScriptCache().put('oc_' + nonce, JSON.stringify({ k: me.k, n: me.name, role: me.role, back: back }), 900);
      const q = { response_type: 'code', client_id: cid, redirect_uri: callback_(), state: 'oc.' + nonce, scope: 'profile openid', bot_prompt: 'aggressive' };
      return { ok: true, url: 'https://access.line.me/oauth2/v2.1/authorize?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&') };
    }
    if (b.oc === 'test') {
      const tk = me.role === 'owner' && b.k ? String(b.k) : me.k;
      const t = L[tk]; if (!t) return { ok: false, error: 'ยังไม่ได้เชื่อม LINE' };
      const code = push_(t.uid, 'ทดสอบจาก The Olympic Club ✅\nถึง ' + (tk === me.k ? me.name : (t.appName || t.name || '')) + ' · ระบบแจ้งเตือนทำงานปกติ');
      return code === 200 ? { ok: true } : { ok: false, error: 'ส่งไม่สำเร็จ (' + code + ') ตรวจว่าเพิ่มเพื่อน OA แล้ว' };
    }
    if (b.oc === 'unlink') {
      const k = me.role === 'owner' && b.k ? b.k : me.k; delete L[k]; ocSaveLinks_(L); return { ok: true };
    }
    if (b.oc === 'digestTest') {
      if (me.role !== 'owner' && me.role !== 'trainer') return { ok: false, error: 'เฉพาะเทรนเนอร์และเจ้าของ' };
      const t = L[me.k]; if (!t) return { ok: false, error: 'ยังไม่ได้เชื่อม LINE' };
      const cfg = fsGet_('config/app') || {}; const ds = ocToday_();
      const all = ocMembers_(); const ms = me.role === 'owner' ? all : all.filter(function (m) { return m.trainerPid === me.k; });
      const code = push_(t.uid, ocDigestText_(ms, ds, me.role === 'owner'));
      return code === 200 ? { ok: true, n: ms.length } : { ok: false, error: 'ส่งไม่สำเร็จ (' + code + ')' };
    }
    return { ok: false, error: 'ไม่รู้จักคำสั่ง' };
  } catch (e) { return { ok: false, error: String(e.message || e).slice(0, 300) }; }
}

function ocLoginCallback_(p) {
  const nonce = String(p.state).slice(3);
  const raw = CacheService.getScriptCache().get('oc_' + nonce);
  const st = raw ? JSON.parse(raw) : null;
  if (!st) return ocPage_('เชื่อม LINE ไม่สำเร็จ', 'ลิงก์หมดอายุ กลับไปกด "เชื่อม LINE" ในแอปอีกครั้ง', OC.appUrl);
  const back = st.back + (st.back.indexOf('?') < 0 ? '?' : '&') + 'line=';
  if (p.error || !p.code) return ocPage_('ยกเลิกการเชื่อม LINE', 'ยังไม่ได้เชื่อม LINE', back + 'cancel');
  const tok = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', { method: 'post', muteHttpExceptions: true, payload: { grant_type: 'authorization_code', code: p.code, redirect_uri: callback_(), client_id: P.getProperty('LOGIN_CHANNEL_ID'), client_secret: P.getProperty('LOGIN_CHANNEL_SECRET') } });
  if (tok.getResponseCode() !== 200) return ocPage_('เชื่อม LINE ไม่สำเร็จ', 'แลกรหัสไม่ผ่าน ลองใหม่อีกครั้ง', back + 'fail');
  const t = JSON.parse(tok.getContentText());
  const ver = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', { method: 'post', muteHttpExceptions: true, payload: { id_token: t.id_token, client_id: P.getProperty('LOGIN_CHANNEL_ID') } });
  if (ver.getResponseCode() !== 200) return ocPage_('เชื่อม LINE ไม่สำเร็จ', 'ยืนยันตัวตนไม่ผ่าน', back + 'fail');
  const v = JSON.parse(ver.getContentText());
  let friend = null;
  try { const f = UrlFetchApp.fetch('https://api.line.me/friendship/v1/status', { headers: { Authorization: 'Bearer ' + t.access_token }, muteHttpExceptions: true }); if (f.getResponseCode() === 200) friend = JSON.parse(f.getContentText()).friendFlag; } catch (err) { }
  const L = ocLinks_();
  L[st.k] = { uid: v.sub, name: v.name || '', appName: st.n || '', role: st.role, at: new Date().toISOString(), friend: friend };
  ocSaveLinks_(L); CacheService.getScriptCache().remove('oc_' + nonce);
  if (friend) push_(v.sub, 'เชื่อม LINE กับ The Olympic Club แล้ว ✅\n' + (st.role === 'member' ? 'คุณจะได้รับผลการเทรนหลังโค้ชบันทึก' : st.role === 'trainer' ? 'คุณจะได้รับสรุปลูกค้าทุกวัน' : 'คุณจะได้รับแจ้งเตือนของระบบ'));
  return ocPage_('เชื่อม LINE สำเร็จ ✅', (v.name || '') + ' เชื่อมกับ ' + (st.n || '') + ' แล้ว' + (friend === false ? '\nอย่าลืมเพิ่มเพื่อน OA ใน LINE เพื่อรับข้อความ' : ''), back + 'linked');
}
function ocPage_(title, msg, back) {
  const h = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#14202E;color:#fff;display:flex;align-items:center;justify-content:center;min-height:90vh;margin:0">'
    + '<div style="max-width:420px;padding:24px;border:1px solid #E0A52666;border-radius:16px;background:#1D2B3C">'
    + '<div style="font-size:12px;letter-spacing:2px;color:#F0C24B;margin-bottom:6px">THE OLYMPIC CLUB · by PT-PALM</div>'
    + '<h2 style="margin:0 0 8px">' + title + '</h2><p style="white-space:pre-line;color:#C9D3DF">' + msg + '</p>'
    + (back ? '<a href="' + back + '" target="_top" style="display:inline-block;margin-top:8px;padding:12px 18px;border-radius:22px;background:#E0A526;color:#14202E;text-decoration:none;font-weight:700">กลับเข้าแอป</a>' : '')
    + '</div></body>';
  return HtmlService.createHtmlOutput(h).setTitle('The Olympic Club · LINE').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- ข้อมูลสำหรับสรุป ----------
function ocToday_() { return Utilities.formatDate(new Date(), OC.tz, 'yyyy-MM-dd'); }
function ocThDate_(ds) { const d = new Date(ds + 'T12:00:00+07:00'); return OC.days[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + OC.months[d.getUTCMonth()]; }
function n0_(x) { return Math.round(+x || 0).toLocaleString('en-US'); }
function ocMembers_() {
  return fsQuery_('', 'people', [['role', 'member']]).filter(function (m) { return m.active === true; })
    .sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
}
function ocMemberDay_(pid, ds) {
  const day = fsGet_('people/' + pid + '/days/' + ds) || {};
  const acts = fsQuery_('people/' + pid, 'activities', [['date', ds]]);
  const tot = { k: 0, p: 0, c: 0, f: 0, byMeal: {} };
  OC.meals.forEach(function (m) {
    const items = (day.meals && day.meals[m]) || []; let mk = 0;
    items.forEach(function (it) { tot.k += +it.k || 0; tot.p += +it.p || 0; tot.c += +it.c || 0; tot.f += +it.f || 0; mk += +it.k || 0; });
    if (items.length) tot.byMeal[m] = mk;
  });
  return { tot: tot, acts: acts, burn: acts.reduce(function (a, x) { return a + (+x.kcal || 0); }, 0) };
}
function ocDigestText_(ms, ds, showCoach) {
  const lines = ['🏅 The Olympic Club · สรุปประจำวัน', ocThDate_(ds) + ' · ลูกค้า ' + ms.length + ' คน', ''];
  ms.forEach(function (m) {
    const s = ocMemberDay_(m._id, ds); const base = +(m.targets && m.targets.kcal) || 0;
    const addBurn = !(m.targets && m.targets.addBurn === false) ? s.burn : 0;
    const goal = base ? base + addBurn : 0; // เป้าเดียวกับในแอป: เป้าพื้นฐาน + kcal ที่ออกกำลังกาย
    const head = m.name + (showCoach && m.trainerName ? ' (โค้ช ' + m.trainerName + ')' : '');
    if (!s.tot.k) lines.push(head + ' — ยังไม่บันทึกอาหาร');
    else {
      const diff = goal ? s.tot.k - goal : 0;
      lines.push(head + ' — กิน ' + n0_(s.tot.k) + (goal ? ' / เป้า ' + n0_(goal) : '') + ' kcal' + (diff > 0 ? ' (เกิน ' + n0_(diff) + ')' : goal ? ' (เหลือ ' + n0_(-diff) + ')' : ''));
      if (goal && addBurn) lines.push('เป้า = ' + n0_(base) + ' + ออกกำลังกาย ' + n0_(addBurn));
      lines.push('P ' + n0_(s.tot.p) + ' · C ' + n0_(s.tot.c) + ' · F ' + n0_(s.tot.f) + ' g');
      lines.push(OC.meals.filter(function (x) { return s.tot.byMeal[x] != null || x !== 'ว่าง'; }).map(function (x) { return x + ' ' + (s.tot.byMeal[x] != null ? n0_(s.tot.byMeal[x]) : 'ยังไม่บันทึก'); }).join(' · '));
    }
    lines.push(s.acts.length ? 'กิจกรรม: ' + s.acts.map(function (a) { return a.name + ' ' + n0_(a.kcal); }).join(' · ') + ' = เผาผลาญ ' + n0_(s.burn) + ' kcal' : 'กิจกรรม: ยังไม่มี');
    lines.push('');
  });
  lines.push(OC.appUrl);
  return lines.join('\n').trim().slice(0, 4900);
}
function ocWorkoutText_(s) {
  const L = ['🏋️ ผลการเทรน · ' + ocThDate_(s.date), (s.type || '') + ' กับ ' + (s.trainerName || 'โค้ช') + ' · ' + n0_(s.min) + ' นาที · ' + n0_(s.kcal) + ' kcal', ''];
  (s.moves || []).forEach(function (m) {
    L.push(m.name);
    L.push('  ' + (m.sets || []).map(function (x) { return (+x.kg ? (m.u === 'lb' ? (x.lb + ' lb (' + Math.round(x.kg * 10) / 10 + ' kg)') : (x.kg + ' kg (' + (x.lb != null ? x.lb : Math.round(x.kg / 0.45359237 * 10) / 10) + ' lb)')) + ' × ' : '') + (x.r || 0) + ' ครั้ง'; }).join(' · '));
  });
  if (s.note) { L.push(''); L.push('โน้ตจากโค้ช: ' + s.note); }
  L.push(''); L.push('ดูพัฒนาการในแอป: ' + OC.appUrl);
  return L.join('\n').slice(0, 4900);
}

// ---------- งานตามเวลา ----------
function ocTick() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    const L = ocLinks_(); const now = Date.now();
    const cfg = fsGet_('config/app') || {}; const ds = ocToday_();
    // (1) ผลเทรน: ส่งถึงลูกค้าเมื่อครบเวลาหน่วงหลังโค้ชบันทึก (แก้ก่อนถึงเวลาได้ ระบบส่งฉบับล่าสุด)
    //     ส่งตาม "ใครได้รับอะไร": ลูกค้า (ผลของตัวเอง) · เทรนเนอร์ผู้บันทึกและเจ้าของ (สำเนา) ถ้าเปิดหัวข้อผลการเทรน
    fsQuery_('', 'sessions', [['notified', false]]).forEach(function (s) {
      if (s.status !== 'logged' || !(+s.notifyAfter) || +s.notifyAfter > now) return;
      let sent = false; const text = ocWorkoutText_(s); const t = L[s.memberPid];
      if (t && ocWants_(cfg, s.memberPid, 'member', 'workout')) sent = push_(t.uid, text) === 200;
      const copy = '📋 สำเนา · ผลเทรนของ ' + (s.memberName || 'ลูกค้า') + '\n' + text;
      if (s.trainerPid && L[s.trainerPid] && ocWants_(cfg, s.trainerPid, 'trainer', 'workout')) push_(L[s.trainerPid].uid, copy);
      if (L.owner && ocWants_(cfg, 'owner', 'owner', 'workout')) push_(L.owner.uid, copy);
      fsPatch_(s._path, { notified: true, lineSent: sent, notifiedAt: new Date().toISOString() });
    });
    // (2) สรุปรายวัน: วันละครั้ง เมื่อถึงเวลาที่ตั้งไว้ (ค่าเริ่มต้น 21:00)
    //     จดผลรายคนใน OC_DIGEST_LOG · ถ้าส่งไม่ครบ (เช่น Firestore/LINE ขัดข้อง) รอบถัดไป (10 นาที) ส่งเฉพาะคนที่ยังไม่ได้
    const hm = Utilities.formatDate(new Date(), OC.tz, 'HH:mm');
    if (cfg.lineOn !== false && hm >= (cfg.digestTime || '21:00') && P.getProperty('OC_DIGEST_DATE') !== ds) ocSendDigest_(cfg, ds, L);
  } finally { lock.releaseLock(); }
}

function ocDigestLog_() { try { return JSON.parse(P.getProperty('OC_DIGEST_LOG') || '{}'); } catch (e) { return {}; } }
function ocSendDigest_(cfg, ds, L) {
  let log = ocDigestLog_(); if (log.date !== ds) log = { date: ds, sent: {}, skip: {} };
  log.sent = log.sent || {}; log.skip = {}; let failed = 0;
  const all = ocMembers_();
  fsQuery_('', 'people', [['role', 'trainer']]).forEach(function (tr) {
    if (tr.active !== true || log.sent[tr._id]) return;
    if (!ocWants_(cfg, tr._id, 'trainer', 'digest')) return;
    const ms = all.filter(function (m) { return m.trainerPid === tr._id; });
    if (!ms.length) { log.skip[tr._id] = tr.name + ': ไม่มีลูกค้า'; return; }
    if (!L[tr._id]) { log.skip[tr._id] = tr.name + ': ยังไม่เชื่อม LINE'; return; }
    const code = push_(L[tr._id].uid, ocDigestText_(ms, ds, false));
    if (code === 200) log.sent[tr._id] = tr.name + ' (' + ms.length + ' คน)';
    else { failed++; log.skip[tr._id] = tr.name + ': ส่งไม่สำเร็จ ' + code + (L[tr._id].friend === false ? ' · ยังไม่เพิ่มเพื่อน OA' : ''); }
  });
  // ลูกค้าที่เปิดรับ "สรุปรายวัน" ได้สรุปของตัวเองคนเดียว
  all.forEach(function (m) {
    if (log.sent[m._id] || !ocWants_(cfg, m._id, 'member', 'digest')) return;
    if (!L[m._id]) { log.skip[m._id] = m.name + ': ยังไม่เชื่อม LINE'; return; }
    const code = push_(L[m._id].uid, ocDigestText_([m], ds, false));
    if (code === 200) log.sent[m._id] = m.name + ' (ของตัวเอง)'; else { failed++; log.skip[m._id] = m.name + ': ส่งไม่สำเร็จ ' + code; }
  });
  if (ocWants_(cfg, 'owner', 'owner', 'digest') && all.length && !log.sent.owner) {
    if (!L.owner) log.skip.owner = 'เจ้าของ: ยังไม่เชื่อม LINE';
    else { const code = push_(L.owner.uid, ocDigestText_(all, ds, true)); if (code === 200) log.sent.owner = 'เจ้าของ (' + all.length + ' คน)'; else { failed++; log.skip.owner = 'เจ้าของ: ส่งไม่สำเร็จ ' + code; } }
  }
  log.at = new Date().toISOString();
  P.setProperty('OC_DIGEST_LOG', JSON.stringify(log));
  // ส่งครบ (หรือเหลือแต่คนที่ส่งไม่ได้เพราะยังไม่เชื่อม/ไม่มีลูกค้า) → ปิดรอบของวันนี้ · ถ้า LINE ส่งพลาด ลองใหม่รอบหน้าได้ถึง 23:50
  if (!failed || Utilities.formatDate(new Date(), OC.tz, 'HH:mm') >= '23:50') P.setProperty('OC_DIGEST_DATE', ds);
  return log;
}

// ทดสอบ: กด Run เพื่อดูข้อความสรุปของวันนี้ใน Execution log (ไม่ส่ง LINE)
function ocPreviewDigest() {
  const ds = ocToday_(); const all = ocMembers_();
  fsQuery_('', 'people', [['role', 'trainer']]).forEach(function (tr) {
    const ms = all.filter(function (m) { return m.trainerPid === tr._id; });
    Logger.log('==== ถึง ' + tr.name + (tr.active === true ? '' : ' (ปิดบัญชี)') + ' · LINE ' + (ocLinks_()[tr._id] ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม') + ' ====\n' + (ms.length ? ocDigestText_(ms, ds, false) : 'ไม่มีลูกค้า'));
  });
  Logger.log('ตัวตั้งเวลา: ' + (ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'ocTick'; }) ? 'ทำงานอยู่' : 'ยังไม่ได้ Run ocSetup') + ' · ส่งล่าสุด: ' + (P.getProperty('OC_DIGEST_DATE') || '-') + ' · ' + (P.getProperty('OC_DIGEST_LOG') || ''));
}

// กด Run ครั้งแรก: อนุญาตสิทธิ์ + ตั้งเวลาให้ ocTick ทำงานทุก 10 นาที + ทดสอบอ่าน Firestore
function ocSetup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'ocTick') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('ocTick').timeBased().everyMinutes(10).create();
  const cfg = fsGet_('config/app');
  Logger.log('อ่าน Firestore ได้: ' + (cfg ? cfg.name : 'ไม่พบ config/app'));
  Logger.log('ลูกค้า: ' + ocMembers_().length + ' คน · เชื่อม LINE แล้ว: ' + JSON.stringify(Object.keys(ocLinks_())));
}
