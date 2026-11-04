/* Senior Year Build app. Saves to the phone first, then syncs so both phones see the same data. */
(function () {
  const P = window.PROGRAM;
  const CFG = window.SYB_CONFIG;
  const END = '2027-08-01';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
  const fmt = (n) => Number(n).toLocaleString('en-US');

  const LS = {
    get(k, d) { try { const v = localStorage.getItem('syb.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('syb.' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
    del(k) { try { localStorage.removeItem('syb.' + k); } catch (e) { /* blocked */ } },
  };

  /* dates */
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
  const dayDiff = (a, b) => Math.round((toDate(a) - toDate(b)) / 864e5);
  const today = () => iso(new Date());
  const weekOf = (s) => Math.floor(dayDiff(s, P.START) / 7) + 1;
  const dayOf = (s) => P.DAYS[((dayDiff(s, P.START) % 7) + 7) % 7];
  const dateOf = (w, d) => addDays(P.START, (w - 1) * 7 + P.DAYS.indexOf(d));
  const short = (s) => toDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const long = (s) => toDate(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const clampWeek = (w) => Math.min(P.WEEKS, Math.max(1, w));

  const S = {
    code: null, role: null,
    rows: LS.get('rows', {}), outbox: LS.get('outbox', {}), since: LS.get('since', null),
    lastSync: LS.get('lastSync', null), syncing: false, offline: false,
    tab: 'today', open: null, day: null, sheet: false, lift: 'squat',
    phaseOpen: null, weekOpen: null, offers: [],
  };

  /* data access */
  const live = (prefix) => Object.values(S.rows).filter(r => !r.deleted && r.id.startsWith(prefix)).map(r => r.data);
  const get = (id) => { const r = S.rows[id]; return r && !r.deleted ? r.data : null; };
  const profile = () => get('profile') || { start: { squat: 0, bench: 0, deadlift: 0, clean: 0 }, goals: { squat: 0, bench: 0, deadlift: 0, clean: 0 }, est: {} };

  let persistTimer = null;
  const persist = () => { clearTimeout(persistTimer); persistTimer = setTimeout(() => { LS.set('rows', S.rows); LS.set('outbox', S.outbox); }, 250); };
  let pushTimer = null;
  function put(id, kind, data) {
    S.rows[id] = { id, kind, data, deleted: false, by: S.role, updated_at: new Date().toISOString() };
    S.outbox[id] = { id, kind, data, deleted: false };
    persist(); paintSync();
    clearTimeout(pushTimer); pushTimer = setTimeout(sync, 1200);
  }

  function maxes() {
    const m = { ...profile().start };
    const rows = live('m:').sort((a, b) => a.date < b.date ? -1 : 1);
    for (const r of rows) m[r.lift] = r.value;
    if (m.press == null) m.press = P.round5(m.bench * .62);
    return m;
  }
  const maxIsEst = (lift) => !!(profile().est || {})[lift] && !live('m:').some(r => r.lift === lift);
  const sessKey = (w, d) => `s:${w}:${d}`;
  const sessLog = (w, d) => get(sessKey(w, d));

  function latestBW() {
    const c = live('c:').filter(r => r.bw).sort((a, b) => a.date < b.date ? 1 : -1);
    return c.length ? c[0].bw : (profile().bw0 || null);
  }

  function dayState(w, d) {
    const s = P.session(w, d, maxes());
    if (s.kind === 'rest') return 'rest';
    const log = sessLog(w, d);
    if (log && log.status === 'done') return 'done';
    const date = dateOf(w, d), t = today();
    if (log && log.ex && Object.values(log.ex).some(e => (e.sets || []).some(x => x && x.done))) return 'partial';
    if (date < t) return 'missed';
    return date === t ? 'today' : 'future';
  }
  const MARK = { done: '✓', partial: '•', missed: '✕' };

  /* network */
  async function rpc(fn, body) {
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: CFG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('sync ' + r.status);
    return r.json();
  }

  async function sync() {
    if (S.syncing || !S.code) return;
    S.syncing = true;
    try {
      const out = Object.values(S.outbox);
      if (out.length) {
        const res = await rpc('sy_push', { p_code: S.code, p_rows: out });
        if (!res || !res.ok) throw new Error('push refused');
        for (const o of out) if (S.outbox[o.id] === o) delete S.outbox[o.id];
      }
      const r = await rpc('sy_pull', { p_code: S.code, p_since: S.since });
      if (!r || !r.role) { signOut('That link is no longer valid. Ask for a new one.'); return; }
      S.role = r.role; LS.set('role', r.role);
      let changed = false;
      for (const row of r.rows) {
        if (S.outbox[row.id]) continue;
        const cur = S.rows[row.id];
        if (!cur || cur.updated_at !== row.updated_at) { S.rows[row.id] = row; changed = true; }
      }
      S.since = r.now; S.lastSync = Date.now(); S.offline = false;
      LS.set('since', S.since); LS.set('lastSync', S.lastSync); LS.set('rows', S.rows); LS.set('outbox', S.outbox);
      if (changed) softRender();
    } catch (e) {
      S.offline = true;
    }
    S.syncing = false;
    paintSync();
  }

  function paintSync() {
    const el = $('#sync');
    if (!el) return;
    const pending = Object.keys(S.outbox).length;
    el.className = 'sync' + (S.offline ? ' off' : pending ? ' pending' : '');
    el.lastElementChild.textContent = S.offline ? (pending ? 'Saved on phone' : 'Offline') : pending ? 'Saving' : 'Synced';
  }

  /* shared pieces */
  const ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l5 5L19 7"/></svg>',
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h2M19 12h2M6 7v10M18 7v10M9 5v14M15 5v14M9 12h6"/></svg>',
    plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v8a3 3 0 0 0 3 3v7M4 3v5a3 3 0 0 0 3 3M10 3v5M17 3c-2 1.5-3 4-3 7 0 2 1 3 3 3v8"/></svg>',
  };

  function athlete() {
    const p = profile();
    return p.name ? { name: p.name, num: p.number } : null;
  }

  function topBar() {
    const coach = S.role === 'coach';
    const a = athlete();
    return `<header class="top">
      <div class="brand">${a ? `${esc(a.name)} <b>#${esc(a.num)}</b>` : 'Senior Year <b>Build</b>'}</div>
      <div class="top-right">
        ${coach ? '<span class="chip">Coach</span>' : ''}
        <span class="sync" id="sync"><i></i><span>Synced</span></span>
        <button class="iconbtn" data-act="sheet" aria-label="Settings">${ICON.gear}</button>
      </div>
    </header>`;
  }

  function fieldStrip(w) {
    const t = today();
    const started = t >= P.START;
    const week = started ? clampWeek(w) : 0;
    const yard = started ? ((week - 1) / (P.WEEKS - 1)) * 100 : 0;
    const X = (y) => 34 + y * 2.92;
    let lines = '';
    for (let y = 0; y <= 100; y += 5) {
      const major = y % 10 === 0;
      lines += `<line x1="${X(y)}" x2="${X(y)}" y1="${major ? 0 : 6}" y2="${major ? 58 : 12}" stroke="#fff" stroke-opacity="${major ? .75 : .4}" stroke-width="1"/>`;
      if (!major) lines += `<line x1="${X(y)}" x2="${X(y)}" y1="46" y2="52" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>`;
      if (major && y > 0 && y < 100) lines += `<text x="${X(y)}" y="34" fill="#fff" fill-opacity=".8" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="800" font-size="13">${y <= 50 ? y : 100 - y}</text>`;
    }
    const seg = P.PHASES.map(p => {
      const a = X(((p.from - 1) / (P.WEEKS - 1)) * 100), b = X((Math.min(p.to, P.WEEKS - 1) / (P.WEEKS - 1)) * 100);
      return `<rect x="${a}" y="58" width="${Math.max(b - a - 1, 2)}" height="6" style="fill:var(--plate-${p.color})"/>`;
    }).join('');
    const bx = X(yard);
    return `<svg viewBox="0 0 360 64" role="img" aria-label="Progress toward fall camp: week ${week} of ${P.WEEKS}">
      <rect width="360" height="58" fill="#1F6E3F"/>
      <rect x="34" width="292" height="58" fill="#1A6036"/>
      <rect width="34" height="58" fill="#14324F"/>
      <rect x="326" width="34" height="58" style="fill:var(--plate-orange)"/>
      <text transform="translate(21 29) rotate(-90)" fill="#fff" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="900" font-size="13" letter-spacing="1">NOV 9</text>
      <text transform="translate(347 29) rotate(90)" fill="#fff" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="900" font-size="13" letter-spacing="1">CAMP</text>
      ${lines}${seg}
      <line x1="${bx}" x2="${bx}" y1="0" y2="58" stroke="#FFD24A" stroke-width="2"/>
      <ellipse cx="${bx}" cy="29" rx="10" ry="6" fill="#7A3E12" stroke="#fff" stroke-width="1"/>
      <line x1="${bx - 4}" x2="${bx + 4}" y1="29" y2="29" stroke="#fff" stroke-width="1"/>
    </svg>`;
  }

  function fieldBlock(w) {
    const t = today();
    if (t < P.START) {
      const n = dayDiff(P.START, t);
      return `<div class="field">${fieldStrip(1)}<div class="field-cap"><span><strong>Kickoff in ${n} day${n === 1 ? '' : 's'}</strong></span><span>38 weeks to camp</span></div></div>`;
    }
    const wk = clampWeek(w);
    const yard = Math.max(1, Math.round(((wk - 1) / (P.WEEKS - 1)) * 100));
    const spot = yard === 50 ? 'Ball at midfield' : yard < 50 ? `Ball on own ${yard}` : `Ball on opp ${100 - yard}`;
    const left = P.WEEKS - wk;
    return `<div class="field">${fieldStrip(wk)}<div class="field-cap"><span><strong>Week ${wk} of ${P.WEEKS}</strong> &middot; ${spot}</span><span>${left ? left + ' to camp' : 'Camp week'}</span></div></div>`;
  }

  const phaseChip = (p) => `<span class="chip"><span class="dot c-${p.color}"></span>${esc(p.name)}</span>`;

  /* today */
  function currentWeek() { return clampWeek(weekOf(today())); }

  function renderToday() {
    const t = today();
    const pre = t < P.START;
    const over = t > END;
    const w = pre ? 1 : currentWeek();
    if (!S.day) S.day = pre || over ? 'mon' : dayOf(t);
    const days = P.DAYS.map(d => {
      const st = dayState(w, d);
      const date = dateOf(w, d);
      return `<button class="day ${d === S.day ? 'sel' : ''}" data-act="day" data-d="${d}" aria-label="${P.DAY_NAME[d]} ${short(date)}">
        ${P.DAY_NAME[d]}<b>${toDate(date).getDate()}</b><span class="mk ${st}">${MARK[st] || ''}</span></button>`;
    }).join('');
    return `${topBar()}${fieldBlock(w)}
      ${coachNoteBanner()}
      ${pre ? preGame() : ''}
      ${over ? '<div class="section"><div class="notice"><b>Done</b>All 38 weeks are in the books. Fall camp is here.</div></div>' : ''}
      <div class="days">${days}</div>
      ${sessionBody(w, S.day)}`;
  }

  function coachNoteBanner() {
    const other = S.role === 'coach' ? 'athlete' : 'coach';
    const notes = live('n:').filter(n => n.from === other).sort((a, b) => a.at < b.at ? 1 : -1);
    if (!notes.length) return '';
    const seen = LS.get('noteSeen', '');
    if (notes[0].at <= seen) return '';
    return `<div class="section"><div class="notice coach"><b>${other === 'coach' ? 'From Coach' : 'From your athlete'}</b>${esc(notes[0].text)}
      <div><button class="back" data-act="noteSeen" data-at="${esc(notes[0].at)}">Got it</button></div></div></div>`;
  }

  function preGame() {
    const hasBW = !!latestBW();
    const items = [
      [true, 'Check the maxes', 'Settings, gear icon up top', 'sheet'],
      [hasBW, 'Enter bodyweight', 'Sets the calorie target on the Fuel tab', 'fuel'],
      [false, 'Read the rules', 'Bottom of the Fuel tab', 'fuel'],
      [false, 'Add this to the home screen', 'Share button, then Add to Home Screen', 'sheet'],
    ];
    return `<div class="section"><h2>Starts Monday, Nov 9</h2>
      <p class="muted">Take the rest of this week easy after the season. Before Monday, knock these out:</p>
      <div class="card">${items.map(i => `<button class="check ${hasBW && i[1].includes('bodyweight') ? 'on' : ''}" data-act="${i[3] === 'sheet' ? 'sheet' : 'tab'}" data-tab="${i[3]}">
        <span class="bx">${ICON.check}</span><span><b>${i[1]}</b><br><span class="muted small">${i[2]}</span></span></button>`).join('')}</div></div>`;
  }

  /* session */
  function presc(it) {
    const [g1, g2] = it.groups;
    if (it.groups.length === 2 && g2.amrap && g1.pct === g2.pct && g1.reps === g2.reps) {
      const l = P.round5(maxes()[it.base] * g1.pct / 100);
      return `${g1.sets + g2.sets} \u00D7 ${g1.reps} @ ${l} lb, last set max reps`;
    }
    const parts = it.groups.map(g => {
      const load = it.base && g.pct != null ? P.round5(maxes()[it.base] * g.pct / 100) : null;
      const unit = g.unit ? (g.unit[0] === '/' ? g.unit : ' ' + g.unit) : '';
      const body = g.sets === 1 && it.mode === 'tick' && unit ? `${g.reps}${unit}` : `${g.sets} × ${g.reps}${g.amrap ? '+' : ''}${unit}`;
      return load ? `${body} @ ${load} lb` : body;
    });
    return parts.join(', then ');
  }

  function platesFor(w) {
    let side = (w - 45) / 2;
    const out = [];
    for (const p of [45, 35, 25, 10, 5, 2.5]) while (side >= p - 1e-6) { out.push(p); side -= p; }
    return out;
  }
  const plateRow = (w) => {
    if (!w || w < 45) return '';
    const ps = platesFor(w);
    if (!ps.length) return '<div class="plates">Empty bar</div>';
    return `<div class="plates">Per side ${ps.map(p => `<span class="plate p${p === 2.5 ? 2 : p}">${p}</span>`).join('')}</div>`;
  };
  const ramp = (w) => {
    if (!w || w < 135) return '';
    const s = [.4, .6, .8].map((f, i) => `${P.round5(w * f)} × ${[5, 3, 2][i]}`);
    return `Warm-up sets: bar × 10, ${s.join(', ')}`;
  };

  function lastFor(key, w, d) {
    const logs = live('s:').filter(s => s.ex && s.ex[key] && !(s.w === w && s.d === d)).sort((a, b) => a.date < b.date ? 1 : -1);
    for (const l of logs) {
      const done = (l.ex[key].sets || []).filter(x => x && x.done && x.w);
      if (done.length) return done[done.length - 1];
    }
    return null;
  }

  function exBlock(it, w, d, log) {
    const lg = (log && log.ex && log.ex[it.key]) || { sets: [] };
    const mainW = it.sets[0] && it.sets[0].load;
    const topW = it.sets.reduce((m, s) => Math.max(m, s.load || 0), 0);
    const doneCount = lg.sets.filter(x => x && x.done).length;
    const complete = it.sets.length && doneCount >= it.sets.length;
    if (it.mode === 'metric') {
      const m = P.METRICS[it.metric];
      const date = dateOf(w, d);
      const cur = get(`t:${date}:${it.metric}`);
      return `<article class="ex ${cur ? 'complete' : ''}"><h3>${esc(it.n)}</h3><p class="cue">${esc(it.cue)} Goal: ${m.goal} ${m.unit}.</p>
        <div class="metric"><input id="m-${it.metric}" inputmode="decimal" aria-label="${esc(it.n)} result in ${m.unit}" placeholder="Result (${m.unit})" value="${cur ? cur.value : ''}" data-ch="metric" data-m="${it.metric}" data-date="${date}"></div></article>`;
    }
    let rows;
    if (it.mode === 'tick') {
      rows = `<div class="pills">${it.sets.map((s, i) => {
        const on = lg.sets[i] && lg.sets[i].done;
        return `<button class="pill ${it.sets.length === 1 ? 'wide' : ''} ${on ? 'done' : ''}" data-act="pill" data-k="${it.key}" data-i="${i}" data-rest="${it.rest}" aria-pressed="${!!on}" aria-label="Set ${i + 1}">${it.sets.length === 1 ? (on ? 'Done' : 'Mark done') : i + 1}</button>`;
      }).join('')}</div>`;
    } else {
      const last = !it.base ? lastFor(it.key, w, d) : null;
      rows = `<div class="setrows">${it.sets.map((s, i) => {
        const l = lg.sets[i] || {};
        const wv = l.w != null ? l.w : (s.load != null ? s.load : (last ? last.w : ''));
        const rv = l.r != null ? l.r : s.reps;
        const tag = s.amrap ? `<span class="tag">Last set: max reps, stop 1 short of failure</span>` : (it.test ? `<span class="tag">${s.pct}%${s.pct > 100 ? ', only if the last single moved fast' : ''}</span>` : '');
        return `<div class="setrow ${l.done ? 'done' : ''}" data-k="${it.key}" data-i="${i}">
          <span class="n">${i + 1}</span>
          <input id="w-${it.key}-${i}" inputmode="decimal" aria-label="Set ${i + 1} weight" placeholder="lb" value="${esc(wv)}" data-ch="set">
          <span class="x">×</span>
          <input id="r-${it.key}-${i}" inputmode="numeric" aria-label="Set ${i + 1} reps" value="${esc(rv)}" data-ch="set">
          <button class="tick" data-act="tick" data-rest="${it.rest}" aria-label="Mark set ${i + 1} done" aria-pressed="${!!l.done}">${ICON.check}</button>
          ${tag}</div>`;
      }).join('')}</div>${last ? `<p class="lastlog">Last time: ${last.w} lb × ${last.r}</p>` : ''}`;
    }
    const heading = it.main && !it.test
      ? `<div class="ex-top"><div><h3>${esc(it.n)}</h3><p class="presc">${esc(presc(it))}</p></div><div class="big">${topW}<small>lb</small></div></div>`
      : `<div><h3>${esc(it.n)}</h3><p class="presc">${esc(it.test ? 'Work up to a new max' : presc(it))}${it.effort ? ` <span class="muted">&middot; ${esc(it.effort)}</span>` : ''}</p></div>`;
    return `<article class="ex ${complete ? 'complete' : ''}" data-ex="${it.key}">
      ${heading}
      ${it.note ? `<p class="small"><b>${esc(it.note)}</b></p>` : ''}
      ${it.base && !it.test && !it.noPlates && mainW ? plateRow(topW) : ''}
      <p class="cue">${esc(it.cue)}${it.main && !it.test && ramp(mainW) ? ' ' + esc(ramp(mainW)) + '.' : ''}</p>
      ${rows}
    </article>`;
  }

  function sessionBody(w, d) {
    const s = P.session(w, d, maxes());
    const date = dateOf(w, d);
    if (s.kind === 'rest') {
      return `<div class="sess-head"><div class="meta"><span>${long(date)}</span></div><h1>Rest Day</h1><p class="muted">${esc(s.note)}</p></div>`;
    }
    const log = sessLog(w, d);
    const wn = P.WEEK_NOTES[w];
    const showNote = wn && (d === 'mon' || s.kind === 'test');
    const finished = log && log.status === 'done';
    return `<div class="sess-head">
        <div class="meta"><span>${long(date)}</span>${phaseChip(s.phase)}${P.isTest(w) ? '<span class="chip test">Test week</span>' : ''}${s.deload ? '<span class="chip deload">Deload</span>' : ''}</div>
        <h1>${esc(s.title)}</h1>
        <div class="meta"><span>About ${s.min} min</span><span>${s.items.length} exercise${s.items.length === 1 ? '' : 's'}</span></div>
      </div>
      <div class="section" style="margin-top:14px">
        ${showNote ? `<div class="notice"><b>This week</b>${esc(wn)}</div>` : ''}
        ${s.note ? `<div class="notice"><b>Today</b>${esc(s.note)}</div>` : ''}
        ${s.deload && !s.note ? '<div class="notice"><b>Deload</b>Lighter on purpose. Leave the gym feeling fresh, not tired.</div>' : ''}
        ${s.warm.length ? `<details class="warm card"><summary>Warm-up, 8 minutes</summary><ul>${s.warm.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
        ${s.items.map(it => exBlock(it, w, d, log)).join('')}
        ${finishCard(w, d, s, log, finished)}
      </div>`;
  }

  function tonnage(log) {
    let t = 0;
    for (const e of Object.values((log && log.ex) || {})) for (const x of e.sets || []) if (x && x.done && x.w && x.r) t += x.w * x.r;
    return Math.round(t);
  }

  function finishCard(w, d, s, log, finished) {
    if (finished) {
      const offers = S.offers.filter(o => o.w === w && o.d === d);
      return `<div class="card"><h3>Finished</h3>
        <div class="stats">
          <div class="stat"><span class="v">${log.rpe || '-'}</span><span class="l">Effort (RPE)</span></div>
          <div class="stat"><span class="v">${fmt(tonnage(log))}</span><span class="l">Pounds moved</span></div>
          <div class="stat"><span class="v">${short(log.date)}</span><span class="l">Logged</span></div>
        </div>
        ${log.note ? `<p>${esc(log.note)}</p>` : ''}
        ${offers.map(o => `<div class="notice"><b>New ${esc(P.LIFTS[o.lift])} max</b>${o.est ? `That max-rep set points to about ${o.value} lb` : `${o.value} lb`}, up from ${o.from}. Save it to raise every weight in the plan.
          <div class="row" style="margin-top:8px"><button class="btn slim" data-act="acceptMax" data-lift="${o.lift}" data-v="${o.value}" data-date="${log.date}" data-est="${o.est ? '1' : ''}">Save ${o.value}</button></div></div>`).join('')}
        <button class="btn ghost block" data-act="reopen" data-w="${w}" data-d="${d}">Edit this workout</button></div>`;
    }
    const rpe = (log && log.rpe) || 0;
    return `<div class="card">
      <h3>How hard was it?</h3>
      <div class="rpes" role="group" aria-label="Effort from 5 to 10">${[5, 6, 7, 8, 9, 10].map(n => `<button class="rpe ${n === rpe ? 'on' : ''}" data-act="rpe" data-v="${n}" data-w="${w}" data-d="${d}">${n}</button>`).join('')}</div>
      <p class="small muted">5 is easy. 8 means 2 reps left. 10 means nothing left.</p>
      <label class="lbl" for="note-${w}-${d}">Notes for Coach (optional)</label>
      <textarea id="note-${w}-${d}" placeholder="Anything hurt? Anything feel great?">${esc((log && log.note) || '')}</textarea>
      <button class="btn block" data-act="finish" data-w="${w}" data-d="${d}">Finish workout</button>
    </div>`;
  }

  function ensureLog(w, d) {
    const cur = sessLog(w, d);
    return cur ? JSON.parse(JSON.stringify(cur)) : { w, d, date: dateOf(w, d), status: 'open', ex: {} };
  }
  function ctx() {
    if (S.open) return S.open;
    const t = today();
    return { w: t < P.START ? 1 : currentWeek(), d: S.day };
  }
  function writeSet(k, i, fields) {
    const { w, d } = ctx();
    const log = ensureLog(w, d);
    log.ex[k] = log.ex[k] || { sets: [] };
    while (log.ex[k].sets.length <= i) log.ex[k].sets.push(null);
    log.ex[k].sets[i] = { ...(log.ex[k].sets[i] || {}), ...fields };
    put(sessKey(w, d), 'session', log);
    return log;
  }
  function refreshExDone(k, log) {
    const { w, d } = ctx();
    const it = P.session(w, d, maxes()).items.find(x => x.key === k);
    const card = document.querySelector(`[data-ex="${k}"]`);
    if (!it || !card) return;
    const n = ((log.ex[k] || {}).sets || []).filter(x => x && x.done).length;
    card.classList.toggle('complete', n >= it.sets.length);
  }

  /* rest timer */
  let restEnd = 0, restTick = null;
  function startRest(sec) {
    if (!sec) return;
    restEnd = Date.now() + sec * 1000;
    clearInterval(restTick);
    restTick = setInterval(paintRest, 500);
    paintRest();
  }
  function stopRest() { clearInterval(restTick); restEnd = 0; const el = $('#rest'); el.hidden = true; document.body.classList.remove('resting'); }
  function paintRest() {
    const el = $('#rest');
    const left = Math.ceil((restEnd - Date.now()) / 1000);
    if (left <= 0) { stopRest(); toast('Rest is up. Next set.'); if (navigator.vibrate) navigator.vibrate(200); return; }
    document.body.classList.add('resting');
    el.hidden = false;
    const label = `${Math.floor(left / 60)}:${pad(left % 60)}`;
    if (!el.firstChild) el.innerHTML = '<div><div class="small">Rest</div><div class="t"></div></div><div class="row"><button data-act="restAdd">+30</button><button data-act="restSkip">Skip</button></div>';
    $('.t', el).textContent = label;
  }

  /* plan */
  function renderPlan() {
    const w = today() < P.START ? 1 : currentWeek();
    const open = S.phaseOpen == null ? P.phaseOf(w).id : S.phaseOpen;
    const phases = P.PHASES.map(p => {
      const isOpen = open === p.id;
      let body = '';
      if (isOpen) {
        const wks = [];
        for (let k = p.from; k <= p.to; k++) {
          const st = P.DAYS.slice(0, 6).map(d => `<i class="${dayState(k, d)}"></i>`).join('');
          const tag = P.isTest(k) ? '<span class="chip test">Test</span>' : P.isDeload(k) ? '<span class="chip deload">Deload</span>' : '';
          const wkOpen = S.weekOpen === k;
          const rows = wkOpen ? P.DAYS.slice(0, 6).map(d => {
            const s = P.session(k, d, maxes());
            const ds = dayState(k, d);
            return `<button class="dayrow" data-act="open" data-w="${k}" data-d="${d}"><span>${P.DAY_NAME[d]} ${short(dateOf(k, d))} &middot; <b>${esc(s.kind === 'rest' ? 'Rest' : s.title)}</b></span><span class="mk ${ds}">${MARK[ds] || ''}</span></button>`;
          }).join('') : '';
          wks.push(`<div class="wk"><button class="wk-head ${k === w ? 'wk-now' : ''}" data-act="week" data-w="${k}" aria-expanded="${wkOpen}"><span>Week ${k} <span class="muted small">${short(dateOf(k, 'mon'))}</span> ${tag}</span><span class="dts">${st}</span></button>${rows}</div>`);
        }
        body = `<div class="phase-body"><p class="small muted" style="padding-bottom:8px">${esc(p.why)}</p>${wks.join('')}</div>`;
      }
      return `<section class="phase"><button class="phase-head" data-act="phase" data-p="${p.id}" aria-expanded="${isOpen}">
        <span class="row"><h3><span class="dot c-${p.color}"></span>${esc(p.name)}</h3><span class="muted small">Wk ${p.from}-${p.to}</span></span>
        <span class="muted small">${short(dateOf(p.from, 'mon'))} to ${short(dateOf(p.to, 'sun'))}. ${esc(p.goal)}</span>
      </button>${body}</section>`;
    }).join('');
    return `${topBar()}${fieldBlock(w)}
      <div class="section"><h2>The 38-Week Plan</h2>
      <p class="muted">Four lifts a week, a speed day with an arm pump, and a Saturday yoke and sled day. Six max-out weeks keep the weights climbing.</p>
      ${phases}</div>`;
  }

  /* charts */
  const X0 = P.START, X1 = END;
  function lineChart({ pts, guide, yPad, unit, id }) {
    const W = 340, H = 170, L = 34, R = 12, T = 12, B = 22;
    const ys = pts.map(p => p.y).concat((guide || []).map(g => g.y));
    if (!ys.length) return '';
    let lo = Math.min(...ys), hi = Math.max(...ys);
    const padY = Math.max(yPad || 5, (hi - lo) * .12);
    lo -= padY; hi += padY;
    const step = niceStep((hi - lo) / 3);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const x = (d) => L + (dayDiff(d, X0) / dayDiff(X1, X0)) * (W - L - R);
    const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    let grid = '';
    for (let v = lo; v <= hi + 1e-6; v += step) grid += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 5}" y="${y(v) + 4}" text-anchor="end">${Math.round(v * 10) / 10}</text>`;
    const months = [['2026-12-01', 'Dec'], ['2027-02-01', 'Feb'], ['2027-04-01', 'Apr'], ['2027-06-01', 'Jun'], ['2027-08-01', 'Aug']];
    const xt = months.map(([d, l]) => `<text class="axis" x="${x(d)}" y="${H - 6}" text-anchor="${d === X1 ? 'end' : 'middle'}">${l}</text>`).join('');
    const sorted = pts.slice().sort((a, b) => a.d < b.d ? -1 : 1);
    const path = sorted.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ');
    const dots = sorted.map((p, i) => `<circle class="pt ${p.est ? 'est' : ''}" cx="${x(p.d)}" cy="${y(p.y)}" r="4.5" data-i="${i}"/>`).join('');
    const g = guide ? `<path class="guide" d="${guide.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ')}"/>
      <text class="lab" x="${W - R}" y="${y(guide[guide.length - 1].y) - 6}" text-anchor="end">${esc(guide[guide.length - 1].label || '')}</text>` : '';
    const lastP = sorted[sorted.length - 1];
    const lastLab = lastP ? `<text class="lab" x="${Math.min(x(lastP.d) + 8, W - R - 30)}" y="${y(lastP.y) + 16}">${Math.round(lastP.y * 10) / 10}</text>` : '';
    chartData[id] = { pts: sorted, x, unit };
    return `<div class="chart" data-chart="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(id)} chart">${grid}${xt}${g}${sorted.length > 1 ? `<path class="ln" d="${path}"/>` : ''}${dots}${lastLab}</svg></div>
      <p class="chart-tip" id="tip-${id}">Tap the chart to see a point.</p>`;
  }
  const chartData = {};
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  function liftPoints(lift) {
    const pr = profile();
    const pts = [{ d: P.START, y: pr.start[lift], est: !!(pr.est || {})[lift], label: 'Starting max' }];
    for (const m of live('m:')) if (m.lift === lift) pts.push({ d: m.date, y: m.value, est: m.source === 'estimate', label: m.source === 'test' ? 'Tested max' : 'Updated max' });
    for (const s of live('s:')) {
      const e = s.ex && s.ex[lift];
      if (!e) continue;
      const sess = P.session(s.w, s.d, maxes());
      const it = sess.items.find(i => i.key === lift);
      if (!it) continue;
      (e.sets || []).forEach((x, i) => {
        const st = it.sets[i];
        if (x && x.done && st && st.amrap && x.w && x.r) pts.push({ d: s.date, y: Math.round(x.w * (1 + x.r / 30)), est: true, label: `Estimated from ${x.w} × ${x.r}` });
      });
    }
    return pts;
  }

  /* progress */
  function weekSummary(w) {
    const ds = P.DAYS.slice(0, 6).filter(d => P.session(w, d, maxes()).kind !== 'rest');
    const done = ds.filter(d => dayState(w, d) === 'done').length;
    let lbs = 0;
    for (const d of ds) lbs += tonnage(sessLog(w, d));
    return { done, total: ds.length, lbs };
  }

  function renderProgress() {
    const t = today();
    const w = t < P.START ? 1 : currentWeek();
    const pr = profile();
    const mx = maxes();
    const big = ['squat', 'bench', 'deadlift'];
    const tot = big.reduce((a, l) => a + (mx[l] || 0), 0);
    const totStart = big.reduce((a, l) => a + (pr.start[l] || 0), 0);
    const totGoal = big.reduce((a, l) => a + (pr.goals[l] || 0), 0);
    const wk = weekSummary(w);
    const check = live('c:').sort((a, b) => a.date < b.date ? 1 : -1);
    const sleeps = check.slice(0, 7).filter(c => c.sleep).map(c => c.sleep);
    const sleep = sleeps.length ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : '-';
    const logs = live('s:').filter(s => s.status === 'done').sort((a, b) => a.date < b.date ? 1 : -1);
    const bw = latestBW();

    const lifts = Object.keys(P.LIFTS).map(l => {
      const pct = pr.goals[l] > pr.start[l] ? Math.max(0, Math.min(100, ((mx[l] - pr.start[l]) / (pr.goals[l] - pr.start[l])) * 100)) : 0;
      return `<div class="lift"><div class="row"><span>${esc(P.LIFTS[l])}${maxIsEst(l) ? ' <span class="muted small">(estimate)</span>' : ''}</span><span class="cur">${mx[l]}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="row small muted"><span>Started ${pr.start[l]}</span><span>Goal ${pr.goals[l]}</span></div></div>`;
    }).join('');

    const seg = Object.keys(P.LIFTS).map(l => `<button class="${S.lift === l ? 'on' : ''}" data-act="lift" data-l="${l}">${esc({ squat: 'Squat', bench: 'Bench', deadlift: 'Dead', clean: 'Clean', press: 'Press' }[l])}</button>`).join('');
    const strength = lineChart({
      id: 'strength', unit: 'lb', yPad: 10, pts: liftPoints(S.lift),
      guide: [{ d: X0, y: pr.goals[S.lift] }, { d: X1, y: pr.goals[S.lift], label: `Goal ${pr.goals[S.lift]}` }],
    });

    const bwPts = live('c:').filter(c => c.bw).map(c => ({ d: c.date, y: c.bw, label: 'Bodyweight' }));
    if (!bwPts.length && pr.bw0) bwPts.push({ d: P.START, y: pr.bw0, label: 'Starting weight' });
    let bwChart = '<p class="muted">Enter bodyweight on the Fuel tab to start this chart.</p>';
    if (bwPts.length) {
      const first = bwPts.slice().sort((a, b) => a.d < b.d ? -1 : 1)[0];
      const goalBW = pr.bwGoal || Math.round(first.y + (dayDiff(X1, first.d) / 7) * 0.7);
      bwChart = lineChart({ id: 'bodyweight', unit: 'lb', yPad: 4, pts: bwPts, guide: [{ d: first.d, y: first.y }, { d: X1, y: goalBW, label: `Goal ${goalBW}` }] });
    }

    const first = Math.max(1, Math.min(w - 4, P.WEEKS - 5));
    let grid = `<span></span>${['M', 'T', 'W', 'T', 'F', 'S'].map(h => `<span class="h">${h}</span>`).join('')}`;
    for (let k = first; k < first + 6; k++) {
      grid += `<span class="wl">Wk ${k}</span>`;
      for (const d of P.DAYS.slice(0, 6)) {
        const st = dayState(k, d);
        grid += `<span class="cell ${st === 'rest' ? 'off' : st}" title="Week ${k} ${P.DAY_NAME[d]}: ${st}">${MARK[st] || ''}</span>`;
      }
    }

    const mrows = Object.entries(P.METRICS).map(([k, m]) => {
      const all = live('t:').filter(x => x.metric === k).sort((a, b) => a.date < b.date ? -1 : 1);
      const a = all[0], b = all[all.length - 1];
      return `<tr><td>${esc(m.n)}</td><td>${a ? a.value : '-'}</td><td>${b ? b.value : '-'}</td><td>${m.goal}</td></tr>`;
    }).join('');

    const notes = live('n:').sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 6);
    const recruit = get('r:list') || {};

    return `${topBar()}
      <h1 style="margin-top:6px">Progress</h1>

      <div class="section"><div class="row"><h2>${t < P.START ? 'Week 1' : 'This Week'}</h2><span class="muted small">Week ${w} of ${P.WEEKS}</span></div>
      <div class="card"><div class="stats">
        <div class="stat"><span class="v">${wk.done}/${wk.total}</span><span class="l">Sessions done</span></div>
        <div class="stat"><span class="v">${fmt(wk.lbs)}</span><span class="l">Pounds moved</span></div>
        <div class="stat"><span class="v">${sleep}</span><span class="l">Sleep, hrs/night</span></div>
      </div>
      ${logs[0] ? `<p class="small muted">Last workout: ${short(logs[0].date)}, ${esc(P.session(logs[0].w, logs[0].d, mx).title)}, effort ${logs[0].rpe || '-'}${logs[0].note ? `: "${esc(logs[0].note)}"` : ''}</p>` : '<p class="small muted">The first workout will show up here as soon as it is logged.</p>'}
      </div></div>

      <div class="section"><h2>Notes</h2><div class="card">
        ${notes.length ? `<div>${notes.map(n => `<div class="note"><span class="who">${n.from === 'coach' ? 'Coach' : 'Athlete'} &middot; ${short(n.at.slice(0, 10))}</span><p>${esc(n.text)}</p></div>`).join('')}</div>` : ''}
        <label class="lbl" for="noteBox">${S.role === 'coach' ? 'Send him a note' : 'Send Coach a note'}</label>
        <textarea id="noteBox" placeholder="${S.role === 'coach' ? 'Shows up on his Today screen' : 'Shows up on Coach\'s Today screen'}"></textarea>
        <button class="btn slim block" data-act="sendNote">Send note</button>
      </div></div>

      <div class="section"><div class="row"><h2>Strength</h2><span class="muted small">Total ${fmt(tot)} of ${fmt(totGoal)}</span></div>
      <div class="card">${lifts}</div>
      <p class="small muted">Total is squat + bench + deadlift. Started at ${fmt(totStart)}. Goals are targets, not promises.</p>
      <div class="card"><div class="seg" role="group" aria-label="Pick a lift">${seg}</div>
        ${strength}
        <p class="small muted">Solid dots are tested maxes. Hollow dots are estimates from max-rep sets.</p></div></div>

      <div class="section"><div class="row"><h2>Bodyweight</h2><span class="muted small">${bw ? bw + ' lb now' : ''}</span></div>
      <div class="card">${bwChart}<p class="small muted">The dashed line is a steady pace to the camp goal, about 0.7 lb a week.</p></div></div>

      <div class="section"><h2>Showing Up</h2><div class="card"><div class="grid6">${grid}</div>
        <div class="legend"><span>✓ Done</span><span>• Started</span><span>✕ Missed</span></div></div></div>

      <div class="section"><h2>Measurables</h2><div class="card">
        <div style="overflow-x:auto"><table class="mtable"><thead><tr><th>Test</th><th>First</th><th>Latest</th><th>Goal</th></tr></thead><tbody>${mrows}</tbody></table></div>
        <div class="addm"><select id="mPick" class="field-in" aria-label="Which test">${Object.entries(P.METRICS).map(([k, m]) => `<option value="${k}">${esc(m.n)}</option>`).join('')}</select>
        <input id="mVal" class="field-in" inputmode="decimal" aria-label="Result" placeholder="Result"><button class="btn slim" data-act="addMetric">Add</button></div>
        <p class="small muted">Goals here are our own rough targets for a high school lineman, not official standards.</p>
      </div></div>

      <div class="section"><h2>Recruiting Checklist</h2>
      <p class="muted small">Strength alone will not earn a D1 offer. Coaches start with film, size and how you move. Start this list now.</p>
      <div class="card">${P.RECRUIT.map(([k, label]) => `<button class="check ${recruit[k] ? 'on' : ''}" data-act="recruit" data-k="${k}" aria-pressed="${!!recruit[k]}"><span class="bx">${ICON.check}</span><span>${esc(label)}</span></button>`).join('')}</div></div>

      <div class="section"><h2>Workout Log</h2><div class="card">${logs.length ? logs.slice(0, 12).map(l => `<button class="log" data-act="open" data-w="${l.w}" data-d="${l.d}"><span><b>${esc(P.session(l.w, l.d, mx).title)}</b><br><span class="muted small">${short(l.date)}, week ${l.w}</span></span><span class="muted small">${fmt(tonnage(l))} lb</span></button>`).join('') : '<p class="muted">Nothing logged yet.</p>'}</div></div>`;
  }

  /* fuel */
  function targets(bw) {
    const cal = Math.round((bw * 15 + 600) / 50) * 50;
    const protein = Math.min(Math.round(bw), 260);
    const fat = Math.round(bw * .4);
    const carbs = Math.round((cal - protein * 4 - fat * 9) / 4);
    return { cal, protein, fat, carbs };
  }
  function bwTrend() {
    const c = live('c:').filter(x => x.bw).sort((a, b) => a.date < b.date ? -1 : 1);
    if (c.length < 2) return null;
    const last = c[c.length - 1];
    const ref = c.filter(x => dayDiff(last.date, x.date) >= 10).pop();
    if (!ref) return null;
    return (last.bw - ref.bw) / (dayDiff(last.date, ref.date) / 7);
  }
  function renderFuel() {
    const t = today();
    const c = get(`c:${t}`) || {};
    const bw = latestBW();
    const tg = bw ? targets(bw) : null;
    const trend = bwTrend();
    let advice = '';
    if (trend != null) {
      advice = trend < .25 ? `Gaining ${trend.toFixed(1)} lb a week, which is too slow. Add about 300 calories a day.`
        : trend > 1 ? `Gaining ${trend.toFixed(1)} lb a week, which is too fast. Drop about 300 calories a day.`
          : `Gaining ${trend.toFixed(1)} lb a week. That is on pace, so keep eating this way.`;
    }
    const sore = c.sore || 0;
    return `${topBar()}
      <h1 style="margin-top:6px">Fuel</h1>
      <p class="muted" style="margin-top:6px">The lifting only works with enough food and sleep. Goal: gain about half a pound to a pound per week.</p>

      <div class="section"><h2>Today's Check-In</h2><div class="card">
        <div class="two">
          <label class="lbl" for="ciBw">Bodyweight (lb)<input id="ciBw" class="field-in" inputmode="decimal" value="${c.bw || ''}" placeholder="${bw || 'lb'}"></label>
          <label class="lbl" for="ciSleep">Sleep (hours)<input id="ciSleep" class="field-in" inputmode="decimal" value="${c.sleep || ''}" placeholder="9"></label>
        </div>
        <div class="lbl">Soreness, 1 is none and 5 is bad
          <div class="scale" role="group" aria-label="Soreness">${[1, 2, 3, 4, 5].map(n => `<button class="rpe ${n === sore ? 'on' : ''}" data-act="sore" data-v="${n}">${n}</button>`).join('')}</div>
        </div>
        <button class="check ${c.food ? 'on' : ''}" data-act="food" aria-pressed="${!!c.food}"><span class="bx">${ICON.check}</span><span>Hit the food target today</span></button>
        <button class="btn slim block" data-act="saveCheck">Save check-in</button>
        <p class="small muted">Weighing once a week, Monday morning, is plenty.</p>
      </div></div>

      <div class="section"><h2>Daily Targets</h2><div class="card">
        ${tg ? `<div class="macro">
          <div class="stat"><span class="v">${fmt(tg.cal)}</span><span class="l">Calories</span></div>
          <div class="stat"><span class="v">${tg.protein}g</span><span class="l">Protein</span></div>
          <div class="stat"><span class="v">${tg.carbs}g</span><span class="l">Carbs</span></div>
          <div class="stat"><span class="v">${tg.fat}g</span><span class="l">Fat</span></div>
        </div><p class="small muted">Starting point based on ${bw} lb. The scale decides from here.</p>${advice ? `<p class="small"><b>${esc(advice)}</b></p>` : ''}` : '<p class="muted">Enter bodyweight above to see calories and protein.</p>'}
      </div></div>

      <div class="section"><h2>Sample Day</h2><div class="card"><div>
        ${[
        ['Breakfast', '4 eggs, big bowl of oatmeal, banana, 16 oz whole milk'],
        ['Mid-morning', 'PB&amp;J on wheat, apple'],
        ['Lunch', '8 oz chicken, 2 cups rice, vegetables'],
        ['Pre-lift', 'Bagel with honey, 1 hour before'],
        ['Post-lift', '16 oz chocolate milk, right after'],
        ['Dinner', '10 oz lean beef, big potato, vegetables'],
        ['Before bed', 'Greek yogurt and granola'],
      ].map(m => `<div class="meal"><b>${m[0]}</b><span>${m[1]}</span></div>`).join('')}
      </div><p class="small muted">About 4,500 calories and 235g protein. Scale portions to the target. Real food comes first. No supplements needed.</p></div></div>

      <div class="section"><h2>Recovery</h2><div class="card">
        <div class="rule"><b>Sleep 8-10 hours</b><span class="muted small">This is when the muscle gets built. Phone down and a set bedtime.</span></div>
        <div class="rule"><b>Water all day</b><span class="muted small">Pale yellow urine is the target. Drink more in summer.</span></div>
        <div class="rule"><b>Sunday is off</b><span class="muted small">No lifting and no running. Walking and stretching are fine.</span></div>
      </div></div>

      <div class="section" id="rules"><h2>The Rules</h2><div class="card">
        ${P.RULES.map(r => `<div class="rule"><b>${esc(r[0])}</b><span class="muted small">${esc(r[1])}</span></div>`).join('')}
      </div></div>`;
  }

  /* settings */
  function renderSheet() {
    const mx = maxes(), pr = profile();
    const lifts = Object.keys(P.LIFTS);
    return `<div class="sheet"><div class="sheet-in">
      <button class="back" data-act="closeSheet">&larr; Back</button>
      <h1>Settings</h1>
      <div class="card"><h3>Current Maxes</h3>
        <p class="small muted">Every weight in the plan comes from these. Change them only after a real test.</p>
        <div class="two">${lifts.map(l => `<label class="lbl" for="mx-${l}">${esc(P.LIFTS[l])}<input id="mx-${l}" class="field-in" inputmode="numeric" value="${mx[l]}"></label>`).join('')}</div>
        ${maxIsEst('clean') ? '<p class="small muted">The clean is an estimate based on the squat. Update it after the first real test.</p>' : ''}
        <button class="btn slim block" data-act="saveMaxes">Save maxes</button></div>
      <div class="card"><h3>Goals for Camp</h3>
        <div class="two">${lifts.map(l => `<label class="lbl" for="gl-${l}">${esc(P.LIFTS[l])}<input id="gl-${l}" class="field-in" inputmode="numeric" value="${pr.goals[l]}"></label>`).join('')}</div>
        <button class="btn slim block" data-act="saveGoals">Save goals</button></div>
      <div class="card"><h3>Add to Home Screen</h3>
        <p><b>iPhone:</b> open this link in Safari, tap the Share button, then Add to Home Screen.</p>
        <p><b>Android:</b> open it in Chrome, tap the three-dot menu, then Add to Home Screen.</p></div>
      <div class="card"><h3>This Phone</h3>
        <p class="muted">Signed in as ${S.role === 'coach' ? 'Coach' : 'Athlete'}. Last synced ${S.lastSync ? new Date(S.lastSync).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'never'}.</p>
        <button class="btn ghost block" data-act="signOut">Sign out of this phone</button></div>
    </div></div>`;
  }

  /* render */
  function tabsBar() {
    const tabs = [['today', 'Today'], ['plan', 'Plan'], ['progress', 'Progress'], ['fuel', 'Fuel']];
    const el = $('#tabs');
    el.hidden = false;
    el.innerHTML = tabs.map(([k, l]) => `<button class="${S.tab === k && !S.open ? 'on' : ''}" data-act="tab" data-tab="${k}" aria-label="${l}">${ICON[k]}${l}</button>`).join('');
  }

  function render(keepScroll) {
    const y = window.scrollY;
    let html;
    if (S.sheet) html = renderSheet();
    else if (S.open) html = `${topBar()}<button class="back" data-act="back">&larr; Back</button>${sessionBody(S.open.w, S.open.d)}`;
    else html = { today: renderToday, plan: renderPlan, progress: renderProgress, fuel: renderFuel }[S.tab]();
    $('#app').innerHTML = html;
    const a = athlete();
    if (a) {
      document.title = `${a.name} #${a.num}`;
      $('meta[name="apple-mobile-web-app-title"]').content = `${a.name.split(' ')[0]} #${a.num}`;
    }
    tabsBar();
    paintSync();
    window.scrollTo(0, keepScroll ? y : 0);
  }
  function softRender() {
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    render(true);
  }

  let toastT = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function renderLock(msg) {
    $('#tabs').hidden = true;
    $('#app').innerHTML = `<div class="lock"><div class="brand" style="font-size:34px">Senior Year <b>Build</b></div>
      <p class="muted">This is a private training log. Open your link, or enter your access code.</p>
      <form id="lockForm" class="stack"><label class="lbl" for="codeIn">Access code<input id="codeIn" class="field-in" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX"></label>
      <button class="btn block" type="submit">Open</button></form>
      ${msg ? `<p class="err">${esc(msg)}</p>` : ''}</div>`;
  }

  function signOut(msg) {
    for (const k of ['code', 'role', 'rows', 'outbox', 'since', 'lastSync']) LS.del(k);
    S.code = null; S.role = null; S.rows = {}; S.outbox = {}; S.since = null; S.sheet = false; S.syncing = false;
    document.title = 'Senior Year Build';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    renderLock(msg);
  }

  const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  async function enter(code, fromLink) {
    const stored = LS.get('code', '');
    if (stored === code && LS.get('role', null)) {
      S.code = code; S.role = LS.get('role', null);
      begin(); sync();
      return;
    }
    try {
      const r = await rpc('sy_pull', { p_code: code, p_since: null });
      if (!r || !r.role) { renderLock(fromLink ? 'That link did not work. Ask for a new one.' : 'That code did not work. Check it and try again.'); return; }
      for (const k of ['rows', 'outbox', 'since']) LS.del(k);
      S.rows = {}; S.outbox = {};
      for (const row of r.rows) S.rows[row.id] = row;
      S.code = code; S.role = r.role; S.since = r.now; S.lastSync = Date.now();
      LS.set('code', code); LS.set('role', r.role); LS.set('rows', S.rows); LS.set('since', S.since); LS.set('lastSync', S.lastSync);
      begin();
    } catch (e) {
      renderLock('Could not connect. Check your signal and try again.');
    }
  }

  let polling = false;
  function begin() {
    if (S.role === 'coach') S.tab = 'progress';
    render();
    if (!polling) { polling = true; setInterval(() => { if (!document.hidden) sync(); }, 45000); }
  }

  /* actions */
  const ACT = {
    tab(t) { S.tab = t.dataset.tab; S.open = null; S.sheet = false; render(); },
    day(t) { S.day = t.dataset.d; render(true); },
    open(t) { S.open = { w: +t.dataset.w, d: t.dataset.d }; render(); keepAwake(); },
    back() { S.open = null; render(true); },
    sheet() { S.sheet = true; render(); },
    closeSheet() { S.sheet = false; render(); },
    phase(t) { const p = t.dataset.p; const cur = S.phaseOpen == null ? P.phaseOf(today() < P.START ? 1 : currentWeek()).id : S.phaseOpen; S.phaseOpen = cur === p ? '' : p; S.weekOpen = null; render(true); },
    week(t) { const k = +t.dataset.w; S.weekOpen = S.weekOpen === k ? null : k; render(true); },
    tick(t) {
      const row = t.closest('.setrow');
      const k = row.dataset.k, i = +row.dataset.i;
      const inputs = row.querySelectorAll('input');
      const was = row.classList.contains('done');
      const log = writeSet(k, i, { w: num(inputs[0].value), r: num(inputs[1].value), done: !was });
      row.classList.toggle('done', !was);
      t.setAttribute('aria-pressed', String(!was));
      refreshExDone(k, log);
      if (!was) { startRest(+t.dataset.rest); keepAwake(); }
    },
    pill(t) {
      const k = t.dataset.k, i = +t.dataset.i;
      const was = t.classList.contains('done');
      const log = writeSet(k, i, { done: !was });
      t.classList.toggle('done', !was);
      t.setAttribute('aria-pressed', String(!was));
      if (t.classList.contains('wide')) t.textContent = was ? 'Mark done' : 'Done';
      refreshExDone(k, log);
      if (!was) startRest(+t.dataset.rest);
    },
    rpe(t) {
      const w = +t.dataset.w, d = t.dataset.d;
      const log = ensureLog(w, d);
      log.rpe = +t.dataset.v;
      put(sessKey(w, d), 'session', log);
      document.querySelectorAll('.rpes .rpe').forEach(b => b.classList.toggle('on', b === t));
    },
    finish(t) {
      const w = +t.dataset.w, d = t.dataset.d;
      const log = ensureLog(w, d);
      const box = document.getElementById(`note-${w}-${d}`);
      log.note = box ? box.value.trim() : '';
      log.status = 'done';
      log.finishedAt = new Date().toISOString();
      put(sessKey(w, d), 'session', log);
      stopRest();
      const s = P.session(w, d, maxes());
      const mx = maxes();
      S.offers = S.offers.filter(o => !(o.w === w && o.d === d));
      for (const it of s.items.filter(x => P.LIFTS[x.key])) {
        const sets = (log.ex[it.key] || {}).sets || [];
        if (it.test) {
          const best = sets.filter(x => x && x.done && x.w && x.r >= 1).reduce((m, x) => Math.max(m, x.w), 0);
          if (best > mx[it.key]) S.offers.push({ w, d, lift: it.key, value: best, from: mx[it.key] });
          continue;
        }
        /* A max-rep set can show the listed max is out of date before the next test */
        let est = 0;
        sets.forEach((x, i) => {
          const st = it.sets[i];
          if (x && x.done && st && st.amrap && x.w && x.r) est = Math.max(est, x.w * (1 + Math.min(x.r, 10) / 30));
        });
        const value = Math.floor(est / 5) * 5;
        if (value > mx[it.key]) S.offers.push({ w, d, lift: it.key, value, from: mx[it.key], est: true });
      }
      toast('Workout saved');
      render(true);
    },
    reopen(t) {
      const w = +t.dataset.w, d = t.dataset.d;
      const log = ensureLog(w, d);
      log.status = 'open';
      put(sessKey(w, d), 'session', log);
      render(true);
    },
    acceptMax(t) {
      const lift = t.dataset.lift, value = +t.dataset.v, date = t.dataset.date;
      put(`m:${date}:${lift}`, 'max', { date, lift, value, source: t.dataset.est ? 'estimate' : 'test' });
      S.offers = S.offers.filter(o => o.lift !== lift);
      toast(`${P.LIFTS[lift]} max is now ${value}`);
      render(true);
    },
    restSkip() { stopRest(); },
    restAdd() { restEnd += 30000; paintRest(); },
    lift(t) { S.lift = t.dataset.l; render(true); },
    sendNote() {
      const box = $('#noteBox');
      const text = box.value.trim();
      if (!text) { toast('Write a note first'); return; }
      const at = new Date().toISOString();
      put(`n:${at}`, 'note', { text: text.slice(0, 1000), at, from: S.role });
      toast('Note sent');
      render(true);
    },
    noteSeen(t) { LS.set('noteSeen', t.dataset.at); render(true); },
    recruit(t) {
      const cur = { ...(get('r:list') || {}) };
      cur[t.dataset.k] = !cur[t.dataset.k];
      put('r:list', 'recruit', cur);
      t.classList.toggle('on', !!cur[t.dataset.k]);
      t.setAttribute('aria-pressed', String(!!cur[t.dataset.k]));
    },
    addMetric() {
      const k = $('#mPick').value, v = num($('#mVal').value);
      if (v == null) { toast('Enter a number first'); return; }
      const date = today();
      put(`t:${date}:${k}`, 'test', { date, metric: k, value: v });
      toast(`${P.METRICS[k].n} saved`);
      render(true);
    },
    sore(t) {
      S.sore = +t.dataset.v;
      document.querySelectorAll('.scale .rpe').forEach(b => b.classList.toggle('on', b === t));
    },
    food(t) {
      S.food = !t.classList.contains('on');
      t.classList.toggle('on', S.food);
      t.setAttribute('aria-pressed', String(S.food));
    },
    saveCheck() {
      const date = today();
      const cur = get(`c:${date}`) || {};
      const bw = num($('#ciBw').value), sleep = num($('#ciSleep').value);
      const row = { ...cur, date };
      if (bw != null) row.bw = bw;
      if (sleep != null) row.sleep = sleep;
      if (S.sore) row.sore = S.sore;
      if (S.food != null) row.food = S.food;
      put(`c:${date}`, 'checkin', row);
      S.sore = null; S.food = null;
      toast('Check-in saved');
      render(true);
    },
    saveMaxes() {
      const mx = maxes();
      const date = today();
      let n = 0;
      for (const l of Object.keys(P.LIFTS)) {
        const v = num($(`#mx-${l}`).value);
        if (v && v !== mx[l]) { put(`m:${date}:${l}`, 'max', { date, lift: l, value: v, source: 'manual' }); n++; }
      }
      toast(n ? 'Maxes saved. Weights updated.' : 'No changes to save');
      if (n) render(true);
    },
    saveGoals() {
      const pr = JSON.parse(JSON.stringify(profile()));
      for (const l of Object.keys(P.LIFTS)) { const v = num($(`#gl-${l}`).value); if (v) pr.goals[l] = v; }
      put('profile', 'profile', pr);
      toast('Goals saved');
    },
    signOut() { signOut(); },
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (t && ACT[t.dataset.act]) { e.preventDefault(); ACT[t.dataset.act](t, e); return; }
    const c = e.target.closest('[data-chart]');
    if (c) chartTap(c, e);
  });

  function chartTap(el, e) {
    const id = el.dataset.chart;
    const data = chartData[id];
    if (!data || !data.pts.length) return;
    const svg = el.querySelector('svg');
    const box = svg.getBoundingClientRect();
    const vx = ((e.clientX - box.left) / box.width) * 340;
    let best = data.pts[0], bd = 1e9;
    for (const p of data.pts) { const dd = Math.abs(data.x(p.d) - vx); if (dd < bd) { bd = dd; best = p; } }
    const tip = document.getElementById('tip-' + id);
    if (tip) tip.textContent = `${short(best.d)}: ${Math.round(best.y * 10) / 10} ${data.unit}${best.label ? ' (' + best.label + ')' : ''}`;
  }

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.ch === 'set') {
      const row = t.closest('.setrow');
      const inputs = row.querySelectorAll('input');
      writeSet(row.dataset.k, +row.dataset.i, { w: num(inputs[0].value), r: num(inputs[1].value) });
    }
    if (t.dataset.ch === 'metric') {
      const v = num(t.value);
      const { m, date } = t.dataset;
      if (v == null) return;
      put(`t:${date}:${m}`, 'test', { date, metric: m, value: v });
      toast(`${P.METRICS[m].n} saved`);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'lockForm') return;
    e.preventDefault();
    const code = cleanCode($('#codeIn').value);
    if (code) enter(code, false);
  });

  let wake = null;
  async function keepAwake() {
    try { if (!wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* not allowed here */ }
  }

  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  window.addEventListener('hashchange', () => location.reload());

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* app still works online */ });
  }

  const link = cleanCode(new URLSearchParams(location.hash.slice(1)).get('k'));
  const code = link || LS.get('code', '');
  if (code) enter(code, !!link); else renderLock();
})();
