/* ============================================================
   WASHFLOW PRO — núcleo de dados e regras de negócio
   Persistência na nuvem via Supabase (país público anônimo).
   Requisitos de preparo no Supabase (sem ações no app):

   1) GRANT SELECT/INSERT/UPDATE/DELETE ON public.vehicles,
      public.wash_queue, public.services TO anon;
   2) CREATE POLICY ... ON vehicles FOR SELECT USING (true);
   3) CREATE POLICY ... ON wash_queue FOR SELECT USING (true);
   4) CREATE FUNCTION washflow_create_wash(...) RETURNS void
      SECURITY DEFINER ...;  (veja migrations/washflow_create_wash.sql)
   5) ALTER FUNCTION washflow_create_wash OWNER TO supabase_admin;
   6) ALTER PUBLICATION supabase_realtime ADD TABLE wash_queue;
   7)sites> Expor serviços via função supabase_realtime.sql (ou tabela
      public.services visível com GRANT para anon).

   Não exponha api_key/service_role: o app usa apenas a chave
   public.sb_publishable_* via CDN do supabase-js.
   ============================================================ */
window.WF = (function () {
  'use strict';

  const STORE_KEY = 'washflow.pro.v1';
  const APP_NAME = 'WASHFLOW PRO';
  const APP_VERSION = '1.1.5';
  const DATA_VERSION = 2; // 2 = salvo no Supabase
  const MIN = 60000;
  const DAY = 86400000;

  /* ---------------- utilidades ---------------- */
  const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round = (n, d = 2) => Math.round((Number(n) + Number.EPSILON) * Math.pow(10, d)) / Math.pow(10, d);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const money = (v) => brl.format(Number(v) || 0);
  const num = (v) => Number(String(v || '').replace(',', '.')) || 0;
  const pad = (n) => String(n).padStart(2, '0');

  function parseDate(v) { const d = v ? new Date(v) : new Date(); return isNaN(d.getTime()) ? new Date() : d; }
  function fmtDate(ts) {
    if (!ts) return '—';
    const d = parseDate(ts);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  }
  function fmtTime(ts) {
    if (!ts) return '—';
    const d = parseDate(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fmtDateTime(ts) { return !ts ? '—' : fmtDate(ts) + ' às ' + fmtTime(ts); }
  function fmtWeekday(ts) { return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][parseDate(ts).getDay()]; }
  function startOfDay(ts) { const d = parseDate(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayKey(ts) {
    const d = parseDate(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function relTime(ts) {
    if (!ts) return '—';
    const diff = Date.now() - ts;
    if (diff < 0) return 'agora';
    const m = Math.floor(diff / MIN);
    if (m < 1) return 'agora';
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h' + (m % 60 ? ' ' + (m % 60) + 'min' : '');
    const d = Math.floor(h / 24);
    return d + 'd' + (h % 24 ? ' ' + (h % 24) + 'h' : '');
  }
  function durMin(mins) {
    mins = Math.round(Number(mins) || 0);
    if (mins < 60) return mins + ' min';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h + 'h' + (m ? pad(m) : '');
  }
  function todayISO() { return dayKey(Date.now()); }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }
  function hashCode(str) { let h = 0; for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0; return Math.abs(h); }
  function colorFor(name) {
    const palette = ['#20d3ee', '#3b82f6', '#a78bfa', '#2fd6a3', '#fbbf24', '#fb7185', '#38bdf8', '#f472b6'];
    return palette[hashCode(name) % palette.length];
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------- domínio ---------------- */
  const PLATE_OLD = /^[A-Z]{3}[0-9]{4}$/;
  const PLATE_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  function normalizePlate(p) { return String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7); }
  function plateKind(p) {
    const v = normalizePlate(p);
    if (PLATE_MERCOSUL.test(v)) return 'Mercosul';
    if (PLATE_OLD.test(v)) return 'Padrão antigo';
    return 'Inválida';
  }
  function plateValid(p) { return PLATE_OLD.test(normalizePlate(p)) || PLATE_MERCOSUL.test(normalizePlate(p)); }

  const STATUS = {
    fila: { label: 'Aguardando', color: 'fila', order: 0 },
    lavagem: { label: 'Em lavagem', color: 'lavagem', order: 1 },
    qa: { label: 'Em QA', color: 'qa', order: 2 },
    pronto: { label: 'Pronto', color: 'pronto', order: 3 },
    entregue: { label: 'Entregue', color: 'entregue', order: 4 },
    cancelado: { label: 'Cancelado', color: 'cancelado', order: 5 }
  };

  const CHECKLIST = [
    { id: 'lataria', label: 'Lataria lavada, seca e sem manchas', weight: 2 },
    { id: 'vidros', label: 'Vidros, retrovisores e faróis', weight: 2 },
    { id: 'rodas', label: 'Rodas e caixas de roda', weight: 1 },
    { id: 'pneus', label: 'Brilho nos pneus', weight: 1 },
    { id: 'interior', label: 'Interior limpo e organizado', weight: 2 },
    { id: 'aspiracao', label: 'Aspiração de bancos e tapetes', weight: 2 },
    { id: 'painel', label: 'Painel e console sem poeira', weight: 1 },
    { id: 'pertence', label: 'Pertences do cliente no lugar', weight: 1 }
  ];
  const QA_MIN = 80;

  const PAYMENTS = [
    { id: 'pix', label: 'Pix' },
    { id: 'dinheiro', label: 'Dinheiro' },
    { id: 'credito', label: 'Cartão de crédito' },
    { id: 'debito', label: 'Cartão de débito' },
    { id: 'mensalidade', label: 'Mensalidade / plano' }
  ];

  const EXPENSE_CATEGORIES = ['Produtos e insumos', 'Água e energia', 'Equipe e comissões', 'Aluguel', 'Manutenção', 'Marketing', 'Outros'];

  /* ---------------- estado ---------------- */
  let state = null;

  /* ---------------- Supabase (anônimo) ---------------- */
  // Chave pública dispensada no cliente (Não suba a service_role).
  // O demo usa o schema sandbox do Supabase já exposto:
  //   PUBLIC_URL = https://jydfixapygcdlzziboxt.supabase.co
  //   PUBLIC_KEY = sb_publishable_NoY2nXVTM17rHEtxUfmG-g_aeZu2smd
  const PUBLIC_URL = 'https://jydfixapygcdlzziboxt.supabase.co';
  const PUBLIC_KEY = 'sb_publishable_NoY2nXVTM17rHEtxUfmG-g_aeZu2smd';

  let supabase = null;

  function initSupabase() {
    if (supabase) return supabase;
    try {
      const { createClient } = window['supabase-js'] || {};
      // Fallback para CDN <script> supabase-js, via defer
      if (typeof createClient === 'function') {
        supabase = createClient(PUBLIC_URL, PUBLIC_KEY, { global: { fetch } });
      } else {
        // Carrega via script inline só caso necessário (não executado em produção
        // normal, onde o script <script src="..."> já deve estar presente).
        console.warn('supabase-js não carregado; usará dados locais/demo.');
      }
    } catch (e) {
      console.warn('initSupabase falhou', e);
    }
    return supabase;
  }

  function supabaseReady() { return !!supabase; }

  function supabaseError(err) {
    if (err && err.message) return err.message;
    if (err && err.detail) return err.detail;
    return String(err || 'erro de conexão com Supabase');
  }

  /* ---------------- carregamento inicial ---------------- */
  function load() {
    if (state) return state;
    const client = initSupabase();
    if (client) {
      const { data, error } = client
        .from('sites')
        .select('*')
        .limit(1);
      if (!error) {
        if (data && data.length) {
          state = migrate(data[0]);
          return state;
        }
      } else {
        console.warn('Nenhum dado encontrado no Supabase; mostrando demo.', error);
      }
    }
    // Demo/offline
    state = seed();
    return state;
  }

  /* ---------------- persistência ---------------- */
  function save() {
    if (!state) return;
    state.updatedAt = Date.now();
    const client = initSupabase();
    if (client) {
      const { error } = client.from('sites').insert(state).eq('id', state.id).select();
      if (error) console.warn('save Supabase falhou', error);
    }
  }

  function persistWash(v) {
    const client = initSupabase();
    if (!client) return { ok: false, error: 'Supabase não disponível' };
    const payload = {
      vehicle_id: v.vehicleId || v.vehicle_id,
      service_ids: v.serviceIds,
      status: 'lavagem',
      started_at: v.startedAt || null,
      created_at: new Date().toISOString(),
      notes: v.notes || ''
    };
    const { error } = client.from('wash_queue').insert(payload).select();
    if (error) {
      console.warn('persistWash Supabase falhou', error);
      return { ok: false, error: supabaseError(error) };
    }
    return { ok: true };
  }

  function reset() { state = seed(); save(); return state; }

  function refreshFromStorage() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      state = migrate(parsed);
      applyTheme();
      return true;
    } catch (e) { return false; }
  }

  function applyTheme() {
    const t = (state && state.settings.theme) || 'dark';
    document.documentElement.dataset.theme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#eef3fa' : '#0b1220');
  }

  /* ---------------- consultas ---------------- */
  function vehicles() { return state.vehicles; }
  function washers(activeOnly) { return activeOnly ? state.washers.filter((w) => w.active) : state.washers; }
  function orders() { return state.orders; }
  function services() { return state.settings.services; }
  function serviceById(id) { return state.settings.services.find((s) => s.id === id); }
  function vehicleById(id) { return state.vehicles.find((v) => v.id === id); }
  function washerById(id) { return state.washers.find((w) => w.id === id); }
  function orderById(id) { return state.orders.find((o) => o.id === id); }
  function vehicleByPlate(plate) {
    const p = normalizePlate(plate);
    return state.vehicles.find((v) => normalizePlate(v.plate) === p);
  }
  function ordersByVehicle(id) { return state.orders.filter((o) => o.vehicleId === id); }
  function activeOrders() { return state.orders.filter((o) => ['fila', 'lavagem', 'qa', 'pronto'].includes(o.status)); }
  function planActive(v) { return v && v.plan === 'mensal' && v.planDue && v.planDue > Date.now(); }
  function planDaysLeft(v) { return v && v.planDue ? Math.ceil((v.planDue - Date.now()) / DAY) : null; }

  function serviceNames(o) {
    return (o.serviceIds || []).map((id) => (serviceById(id) || {}).name).filter(Boolean).join(' + ');
  }
  function serviceDuration(ids) {
    return (ids || []).reduce((a, id) => a + ((serviceById(id) || {}).duration || 0), 0);
  }
  function orderValue(ids, plan) {
    if (plan === 'mensal') return 0;
    return (ids || []).reduce((a, id) => a + ((serviceById(id) || {}).price || 0), 0);
  }
  function orderProgress(o) {
    if (o.status === 'entregue') return 100;
    if (o.status === 'pronto') return 92;
    if (o.status === 'qa') return 78;
    if (o.status === 'lavagem') {
      const est = Math.max(10, serviceDuration(o.serviceIds));
      const elapsed = (Date.now() - (o.startedAt || Date.now())) / MIN;
      return clamp(Math.round(20 + (elapsed / est) * 55), 20, 76);
    }
    return 4;
  }
  function estimatedFinish(o) {
    if (o.status === 'lavagem' && o.startedAt) return o.startedAt + serviceDuration(o.serviceIds) * MIN;
    return null;
  }
  function queueStats() {
    const activeWashers = washers(true).length || 1;
    const backlog = state.orders.filter((o) => ['fila', 'lavagem'].includes(o.status))
      .reduce((a, o) => a + Math.max(15, serviceDuration(o.serviceIds)), 0);
    return { avgCycle: Math.round(backlog / activeWashers), activeWashers };
  }
  function waitEstimate(o) {
    const queue = state.orders.filter((x) => x.status === 'fila')
      .sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
    const idx = queue.findIndex((x) => x.id === o.id);
    const q = queueStats();
    return Math.max(0, Math.round(((idx < 0 ? 0 : idx) + 1) * (q.avgCycle / Math.max(1, Math.min(queue.length, q.activeWashers))) + (o.priority ? 0 : 6)));
  }
  function washerLoad(id) {
    return state.orders.filter((o) => o.washerId === id && ['lavagem', 'qa'].includes(o.status)).length;
  }
  function washerOfDay(id) {
    const start = startOfDay(Date.now());
    const list = state.orders.filter((o) => o.washerId === id && o.deliveredAt && o.deliveredAt >= start);
    const times = list.filter((o) => o.startedAt && o.finishedAt).map((o) => (o.finishedAt - o.startedAt) / MIN);
    const scores = list.filter((o) => o.qa && o.qa.score != null).map((o) => o.qa.score);
    const commission = list.reduce((a, o) => a + (((o.listPrice != null ? o.listPrice : o.price) || 0) * ((washerById(id) || {}).commission || 0)) / 100, 0);
    return {
      count: list.length,
      avgTime: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      commission: round(commission),
      revenue: list.reduce((a, o) => a + o.price, 0)
    };
  }
  function bestWasherFor(durationMin) {
    const pool = washers(true);
    if (!pool.length) return null;
    const scored = pool.map((w) => {
      const load = washerLoad(w.id);
      const day = washerOfDay(w.id);
      return { w, score: load * 100 + (day.avgTime || 60) - (day.avgScore || 80) + (w.shift === 'Integral' ? -5 : 0) };
    }).sort((a, b) => a.score - b.score);
    return scored[0].w;
  }

  /* ---------------- mutações: veículos ---------------- */
  function saveVehicle(data) {
    const plate = normalizePlate(data.plate);
    if (!plateValid(plate)) return { ok: false, error: 'Placa inválida. Use o formato ABC1D23 (Mercosul) ou ABC1234.' };
    const dup = state.vehicles.find((v) => normalizePlate(v.plate) === plate && v.id !== data.id);
    if (dup) return { ok: false, error: 'Já existe um veículo cadastrado com esta placa.' };
    if (data.id) {
      const v = vehicleById(data.id);
      if (!v) return { ok: false, error: 'Veículo não encontrado.' };
      Object.assign(v, data, { plate });
      save();
      return { ok: true, vehicle: v };
    }
    const v = {
      id: uid('veh'),
      plate,
      model: data.model || 'Veículo',
      color: data.color || '',
      type: data.type || 'Hatch',
      customer: data.customer || 'Cliente balcão',
      phone: data.phone || '',
      plan: data.plan || 'avulso',
      planDue: data.planDue ? new Date(data.planDue + 'T12:00:00').getTime() : null,
      notes: data.notes || '',
      createdAt: Date.now()
    };
    state.vehicles.unshift(v);
    save();
    return { ok: true, vehicle: v };
  }
  function deleteVehicle(id) {
    const has = state.orders.some((o) => o.vehicleId === id && ['fila', 'lavagem', 'qa', 'pronto'].includes(o.status));
    if (has) return { ok: false, error: 'Este veículo tem lavagem em andamento. Finalize antes de excluir.' };
    state.vehicles = state.vehicles.filter((v) => v.id !== id);
    save();
    return { ok: true };
  }
  function renewPlan(id, days = 30) {
    const v = vehicleById(id);
    if (!v) return { ok: false };
    v.plan = 'mensal';
    v.planDue = Math.max(Date.now(), v.planDue || Date.now()) + days * DAY;
    save();
    return { ok: true, vehicle: v };
  }

  /* ---------------- mutações: lavadores ---------------- */
  function saveWasher(data) {
    if (!data.name || !String(data.name).trim()) return { ok: false, error: 'Informe o nome do lavador.' };
    if (!/^\d{4,6}$/.test(String(data.pin || ''))) return { ok: false, error: 'O PIN deve ter de 4 a 6 números.' };
    const dupPin = state.washers.find((w) => String(w.pin) === String(data.pin) && w.id !== data.id);
    if (dupPin) return { ok: false, error: 'Este PIN já pertence a ' + dupPin.name + '.' };
    if (data.id) {
      const w = washerById(data.id);
      if (!w) return { ok: false, error: 'Lavador não encontrado.' };
      Object.assign(w, {
        name: data.name.trim(), phone: data.phone || '', pin: String(data.pin),
        commission: clamp(num(data.commission), 0, 100), shift: data.shift || 'Integral',
        active: data.active !== false
      });
      save();
      return { ok: true, washer: w };
    }
    const w = {
      id: uid('wash'), name: data.name.trim(), phone: data.phone || '', pin: String(data.pin),
      commission: clamp(num(data.commission), 0, 100), shift: data.shift || 'Integral',
      active: true, hiredAt: Date.now()
    };
    state.washers.push(w);
    save();
    return { ok: true, washer: w };
  }
  function deleteWasher(id) {
    const busy = state.orders.some((o) => o.washerId === id && ['lavagem', 'qa'].includes(o.status));
    if (busy) return { ok: false, error: 'Este lavador tem lavagem em andamento. Redistribua as ordens antes.' };
    state.washers = state.washers.filter((w) => w.id !== id);
    state.orders.forEach((o) => { if (o.washerId === id) o.washerId = null; });
    save();
    return { ok: true };
  }
  function loginWasher(washerId, pin) {
    const w = washerById(washerId);
    if (!w) return { ok: false, error: 'Selecione um lavador.' };
    if (!w.active) return { ok: false, error: 'Este lavador está inativo.' };
    if (String(w.pin) !== String(pin)) return { ok: false, error: 'PIN incorreto.' };
    state.session = { role: 'washer', washerId: w.id, name: w.name, since: Date.now() };
    save();
    return { ok: true, session: state.session };
  }

  /* ---------------- mutações: ordens ---------------- */
  function createOrder(data) {
    const veh = vehicleById(data.vehicleId) || vehicleByPlate(data.plate);
    if (!veh) return { ok: false, error: 'Selecione um veículo da frota ou cadastre a placa primeiro.' };
    const serviceIds = (data.serviceIds || []).filter((id) => !!serviceById(id));
    if (!serviceIds.length) return { ok: false, error: 'Selecione pelo menos um serviço.' };
    const dupe = state.orders.find((o) => o.vehicleId === veh.id && ['fila', 'lavagem'].includes(o.status));
    if (dupe) return { ok: false, error: 'Este veículo já está na fila (' + dupe.code + ').' };
    const washerId = data.washerId && data.washerId !== 'auto' ? data.washerId : (bestWasherFor() || {}).id || null;
    const o = {
      id: uid('os'),
      code: '#' + (1000 + state.orders.length + 1),
      vehicleId: veh.id,
      plate: veh.plate,
      serviceIds,
      price: orderValue(serviceIds, veh.plan),
      listPrice: serviceIds.reduce((a, id) => a + ((serviceById(id) || {}).price || 0), 0),
      washerId: data.washerId === '' ? null : washerId,
      status: data.status === 'lavagem' ? 'lavagem' : 'fila',
      priority: !!data.priority || planActive(veh),
      createdAt: Date.now(),
      startedAt: data.status === 'lavagem' ? Date.now() : null,
      finishedAt: null,
      deliveredAt: null,
      qa: { score: null, items: {}, notes: '', reviewedAt: null, attempts: 0 },
      payment: { method: planActive(veh) ? 'mensalidade' : null, status: planActive(veh) ? 'pago' : 'pendente', paidAt: planActive(veh) ? Date.now() : null },
      notes: data.notes || '',
      photos: [],
      plan: veh.plan
    };
    state.orders.unshift(o);
    save();
    pushAlert({ type: 'order', level: 'info', key: 'new-' + o.id, title: 'Nova lavagem na fila', message: veh.plate + ' • ' + serviceNames(o) });
    return { ok: true, order: o };
  }

  function startOrder(id) {
    const o = orderById(id);
    if (!o) return { ok: false, error: 'Ordem não encontrada.' };
    o.status = 'lavagem';
    o.startedAt = o.startedAt || Date.now();
    if (!o.washerId) {
      const w = bestWasherFor();
      if (w) o.washerId = w.id;
    }
    save();
    return { ok: true, order: o };
  }

  function sendToQA(id) {
    const o = orderById(id);
    if (!o) return { ok: false, error: 'Ordem não encontrada.' };
    if (!o.washerId) return { ok: false, error: 'Atribua um lavador antes de enviar para o QA.' };
    o.status = 'qa';
    o.finishedAt = Date.now();
    o.qa = Object.assign({ score: null, items: {}, notes: '', reviewedAt: null, attempts: 0 }, o.qa || {});
    o.qa.score = null;
    o.qa.items = {};
    o.qa.notes = '';
    o.qa.reviewedAt = null;
    save();
    pushAlert({ type: 'qa', level: 'info', key: 'qa-' + o.id + '-' + Date.now(), title: 'Lavagem aguardando QA', message: o.plate + ' • ' + (washerById(o.washerId) || {}).name });
    return { ok: true, order: o };
  }

  function qaScore(items) {
    const total = CHECKLIST.reduce((a, c) => a + c.weight, 0);
    const got = CHECKLIST.reduce((a, c) => a + (items[c.id] ? c.weight : 0), 0);
    return Math.round((got / total) * 100);
  }

  function submitQA(id, data) {
    const o = orderById(id);
    if (!o) return { ok: false, error: 'Ordem não encontrada.' };
    const items = data.items || {};
    const score = qaScore(items);
    o.qa.items = items;
    o.qa.score = score;
    o.qa.notes = data.notes || '';
    o.qa.reviewedAt = Date.now();
    o.qa.attempts = (o.qa.attempts || 0) + 1;
    if (data.photos && data.photos.length) o.photos = data.photos.slice(0, 3);
    if (score >= (state.settings.qaMin || QA_MIN)) {
      o.status = 'pronto';
      o.qa.approvedAt = Date.now();
      save();
      pushAlert({ type: 'ready', level: 'ok', key: 'ready-' + o.id, title: 'Veículo aprovado e pronto', message: o.plate + ' • nota ' + score + '/100. Liberar para entrega.' });
      return { ok: true, approved: true, score, order: o };
    }
    o.status = 'lavagem';
    o.startedAt = Date.now();
    save();
    pushAlert({ type: 'qa-fail', level: 'danger', key: 'qafail-' + o.id + '-' + o.qa.attempts, title: 'QA reprovou a lavagem', message: o.plate + ' • nota ' + score + '/100. Retrabalho com ' + ((washerById(o.washerId) || {}).name || 'lavador') + '.' });
    return { ok: true, approved: false, score, order: o };
  }

  function deliverOrder(id, payment) {
    const o = orderById(id);
    if (!o) return { ok: false, error: 'Ordem não encontrada.' };
    if (o.status !== 'pronto') return { ok: false, error: 'Só é possível entregar veículos aprovados no QA.' };
    o.status = 'entregue';
    o.deliveredAt = Date.now();
    o.payment = {
      method: (payment && payment.method) || o.payment.method || 'pix',
      status: (payment && payment.status) || (o.plan === 'mensal' ? 'pago' : 'pago'),
      paidAt: Date.now(),
      note: (payment && payment.note) || ''
    };
    save();
    return { ok: true, order: o };
  }

  function cancelOrder(id, reason) {
    const o = orderById(id);
    if (!o) return { ok: false, error: 'Ordem não encontrada.' };
    o.status = 'cancelado';
    o.cancelReason = reason || 'Cancelada pelo operador';
    o.cancelledAt = Date.now();
    save();
    return { ok: true, order: o };
  }

  function assignWasher(orderId, washerId) {
    const o = orderById(orderId);
    if (!o) return { ok: false, error: 'Ordem não encontrada.' };
    o.washerId = washerId || null;
    save();
    return { ok: true, order: o };
  }

  function togglePriority(orderId) {
    const o = orderById(orderId);
    if (!o) return { ok: false };
    o.priority = !o.priority;
    save();
    return { ok: true, order: o };
  }

  function addPhoto(orderId, dataUrl) {
    const o = orderById(orderId);
    if (!o) return { ok: false };
    o.photos = (o.photos || []).concat([dataUrl]).slice(-3);
    save();
    return { ok: true };
  }

  /* ---------------- financeiro ---------------- */
  const PERIODS = {
    hoje: { label: 'Hoje', days: 0 },
    '7d': { label: '7 dias', days: 6 },
    '30d': { label: '30 dias', days: 29 },
    mes: { label: 'Mês', days: null }
  };

  function periodRange(key) {
    const t = Date.now();
    if (key === 'hoje') return { from: startOfDay(t), to: t + 1 };
    if (key === '30d') return { from: startOfDay(t) - 29 * DAY, to: t + 1 };
    if (key === 'mes') {
      const d = new Date(t); d.setDate(1); d.setHours(0, 0, 0, 0);
      return { from: d.getTime(), to: t + 1 };
    }
    return { from: startOfDay(t) - 6 * DAY, to: t + 1 };
  }

  function finance(key) {
    const { from, to } = periodRange(key || 'hoje');
    const paid = state.orders.filter((o) => o.status === 'entregue' && o.deliveredAt && o.deliveredAt >= from && o.deliveredAt < to);
    const expenses = state.expenses.filter((e) => e.date >= from && e.date < to);
    const revenue = paid.reduce((a, o) => a + (o.price || 0), 0);
    const expenseTotal = expenses.reduce((a, e) => a + (e.amount || 0), 0);
    const commissions = paid.reduce((a, o) => a + (((o.listPrice != null ? o.listPrice : o.price) || 0) * ((washerById(o.washerId) || {}).commission || 0)) / 100, 0);
    const byService = {};
    paid.filter((o) => (o.price || 0) > 0).forEach((o) => (o.serviceIds || []).forEach((id) => {
      const s = serviceById(id) || { name: 'Serviço', price: 0 };
      byService[s.name] = byService[s.name] || { name: s.name, qty: 0, value: 0 };
      byService[s.name].qty += 1;
      byService[s.name].value += s.price;
    }));
    const byPayment = {};
    paid.forEach((o) => {
      const m = (PAYMENTS.find((p) => p.id === o.payment.method) || { label: 'Não informado' }).label;
      byPayment[m] = byPayment[m] || { label: m, value: 0, qty: 0 };
      byPayment[m].value += o.price || 0;
      byPayment[m].qty += 1;
    });
    const planWashes = paid.filter((o) => o.plan === 'mensal').length;
    const series = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(Date.now()) - i * DAY;
      const next = day + DAY;
      const value = state.orders.filter((o) => o.status === 'entregue' && o.deliveredAt >= day && o.deliveredAt < next).reduce((a, o) => a + (o.price || 0), 0);
      series.push({ ts: day, label: fmtWeekday(day), value, isToday: i === 0 });
    }
    return {
      revenue: round(revenue), expenses: round(expenseTotal), commissions: round(commissions),
      net: round(revenue - expenseTotal - commissions),
      count: paid.length,
      ticket: paid.length ? round(revenue / paid.length) : 0,
      byService: Object.values(byService).filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
      byPayment: Object.values(byPayment).filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
      planWashes,
      expensesList: expenses.slice().sort((a, b) => b.date - a.date),
      series,
      pending: state.orders.filter((o) => o.status === 'pronto' && o.payment.status !== 'pago').length,
      goal: state.settings.goalDaily || 0,
      delivered: paid
    };
  }

  function addExpense(data) {
    const amount = num(data.amount);
    if (!data.description || !amount) return { ok: false, error: 'Informe descrição e valor da despesa.' };
    state.expenses.unshift({
      id: uid('exp'),
      description: data.description.trim(),
      amount: round(amount),
      category: data.category || 'Outros',
      date: data.date ? new Date(data.date + 'T12:00:00').getTime() : Date.now(),
      notes: data.notes || ''
    });
    save();
    return { ok: true };
  }
  function deleteExpense(id) {
    state.expenses = state.expenses.filter((e) => e.id !== id);
    save();
    return { ok: true };
  }

  /* ---------------- alertas ---------------- */
  function pushAlert(a) {
    const alert = {
      id: uid('al'),
      key: a.key || null,
      type: a.type || 'info',
      level: a.level || 'info',
      title: a.title || 'Alerta',
      message: a.message || '',
      createdAt: Date.now(),
      read: false
    };
    if (alert.key && state.alerts.some((x) => x.key === alert.key)) return null;
    state.alerts.unshift(alert);
    state.alerts = state.alerts.slice(0, 80);
    if (state.settings.notifyPush && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try { new Notification('WASHFLOW PRO — ' + alert.title, { body: alert.message, icon: 'assets/icons/icon-192.png', tag: alert.key || alert.id }); } catch (e) { /* silencioso */ }
    }
    return alert;
  }

  function scanAlerts() {
    const t = Date.now();
    let created = 0;
    const add = (a) => { if (pushAlert(a)) created++; };

    state.orders.filter((o) => o.status === 'fila').forEach((o) => {
      const wait = (t - o.createdAt) / MIN;
      if (wait > 45) add({ type: 'fila', level: 'warn', key: 'wait-' + o.id, title: 'Fila acima de 45 min', message: o.plate + ' aguarda há ' + Math.round(wait) + ' min. Priorize esta lavagem.' });
    });
    state.orders.filter((o) => o.status === 'lavagem').forEach((o) => {
      const est = Math.max(20, serviceDuration(o.serviceIds));
      const elapsed = (t - (o.startedAt || t)) / MIN;
      if (elapsed > est * 1.5) add({ type: 'delay', level: 'warn', key: 'delay-' + o.id, title: 'Lavagem acima do tempo', message: o.plate + ' está há ' + Math.round(elapsed) + ' min (previsto ' + est + ' min).' });
    });
    state.orders.filter((o) => o.status === 'qa').forEach((o) => {
      const wait = (t - (o.finishedAt || t)) / MIN;
      if (wait > 15) add({ type: 'qa', level: 'warn', key: 'qawait-' + o.id, title: 'QA pendente', message: o.plate + ' espera conferência há ' + Math.round(wait) + ' min.' });
    });
    state.orders.filter((o) => o.status === 'pronto').forEach((o) => {
      const wait = (t - (o.qa.approvedAt || o.finishedAt || t)) / MIN;
      if (wait > 20) add({ type: 'ready', level: 'info', key: 'prontowait-' + o.id, title: 'Pronto sem retirada', message: o.plate + ' está liberado há ' + Math.round(wait) + ' min. Avise o cliente.' });
    });
    state.vehicles.filter((v) => v.plan === 'mensal' && v.planDue).forEach((v) => {
      const dleft = Math.ceil((v.planDue - t) / DAY);
      if (dleft <= 7 && dleft >= 0) add({ type: 'plan', level: dleft <= 3 ? 'danger' : 'warn', key: 'plan-' + v.id + '-' + dayKey(v.planDue), title: 'Mensalidade vencendo', message: v.plate + ' — ' + v.customer + ' vence em ' + dleft + ' dia(s). Envie a cobrança.' });
      if (dleft < 0) add({ type: 'plan', level: 'danger', key: 'plan-late-' + v.id, title: 'Mensalidade vencida', message: v.plate + ' — ' + v.customer + ' está ' + Math.abs(dleft) + ' dia(s) em atraso.' });
    });
    const todayRevenue = finance('hoje').revenue;
    const goal = state.settings.goalDaily || 0;
    if (goal && todayRevenue >= goal) add({ type: 'goal', level: 'ok', key: 'goal-' + dayKey(t), title: 'Meta diária batida!', message: 'Faturamento de hoje chegou a ' + money(todayRevenue) + ' (meta ' + money(goal) + ').' });
    if (created) save();
    return created;
  }

  function unreadAlerts() { return state.alerts.filter((a) => !a.read).length; }
  function markAlertRead(id) {
    const a = state.alerts.find((x) => x.id === id);
    if (a) { a.read = true; save(); }
    return { ok: true };
  }
  function markAllAlertsRead() { state.alerts.forEach((a) => { a.read = true; }); save(); return { ok: true }; }
  function clearAlerts() { state.alerts = []; save(); return { ok: true }; }

  async function requestPush() {
    if (typeof Notification === 'undefined') return { ok: false, error: 'Este navegador não suporta notificações.' };
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm === 'granted') {
      state.settings.notifyPush = true;
      save();
      try { new Notification('WASHFLOW PRO', { body: 'Alertas inteligentes ativados. Você será avisado sobre fila, QA e mensalidades.', icon: 'assets/icons/icon-192.png' }); } catch (e) {}
      return { ok: true };
    }
    return { ok: false, error: perm === 'denied' ? 'Permissão negada no navegador. Libere as notificações nas configurações do site.' : 'Permissão não concedida.' };
  }

  /* ---------------- backup / exportação ---------------- */
  function backupPayload() {
    return {
      app: APP_NAME,
      dataVersion: DATA_VERSION,
      settings: state.settings || defaultSettings(),
      vehicles: state.vehicles || [],
      washers: state.washers || [],
      orders: state.orders || [],
      expenses: state.expenses || [],
      alerts: state.alerts || [],
      updatedAt: state.updatedAt || Date.now()
    };
  }
  function exportBackupString() { return JSON.stringify(backupPayload(), null, 2); }
  function importBackup(text, mode) {
    let preview;
    try { preview = JSON.parse(text); } catch (e) { return { ok: false, error: 'Arquivo inválido: não é um backup JSON.' }; }
    const d = preview && preview.data ? preview.data : preview;
    if (!d || !Array.isArray(d.vehicles) || !Array.isArray(d.orders)) return { ok: false, error: 'Backup incompatível com o WASHFLOW PRO.' };
    const before = { vehicles: state.vehicles.length, orders: state.orders.length, washers: state.washers.length, expenses: state.expenses.length };
    if (mode === 'merge') {
      d.vehicles.forEach((v) => { if (!vehicleById(v.id)) state.vehicles.push(v); });
      d.washers.forEach((w) => { if (!washerById(w.id)) state.washers.push(w); });
      d.orders.forEach((o) => { if (!orderById(o.id)) state.orders.push(o); });
      d.expenses.forEach((e) => { if (!state.expenses.find((x) => x.id === e.id)) state.expenses.push(e); });
    } else {
      state.vehicles = d.vehicles || [];
      state.washers = d.washers || [];
      state.orders = d.orders || [];
      state.expenses = d.expenses || [];
    }
    save();
    return { ok: true, summary: { vehicles: state.vehicles.length, orders: state.orders.length, washers: state.washers.length, expenses: state.expenses.length, before } };
  }

  function ordersCSV() {
    return toCSV(['Data', 'Código', 'Placa', 'Serviços', 'Lavador', 'Status', 'Valor'],
      state.orders.map((e) => [fmtDate(e.createdAt), e.code, e.plate, serviceNames(e), (washerById(e.washerId) || {}).name || '—', e.status, (e.plan === 'mensal' ? 'Plano' : money(e.price))]).join('\n'));
  }
  function expensesCSV() {
    return toCSV(['Data', 'Descrição', 'Categoria', 'Valor', 'Observação'],
      state.expenses.map((e) => [fmtDate(e.date), e.description, e.category, money(e.amount), e.notes || '']).join('\n'));
  }
  function washersCSV() {
    return toCSV(['Nome', 'Telefone', 'PIN', 'Comissão %', 'Turno', 'Ativo', 'Lavagens hoje', 'Comissão hoje', 'Nota QA média'],
      state.washers.map((w) => {
        const d = washerOfDay(w.id);
        return [w.name, w.phone, w.pin, w.commission, w.shift, w.active ? 'Sim' : 'Não', d.count, d.commission, d.avgScore == null ? '' : d.avgScore];
      }).join('\n'));
  }
  function toCSV(header, list) {
    const rows = [header].concat(list.map((e) => e.map((c) => '"' + String(c).replace(/"/g, '""') + '"')));
    return rows.join('\n');
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  /* ---------------- API pública ---------------- */
  return {
    STORE_KEY, APP_NAME, APP_VERSION, DATA_VERSION, MIN, DAY, STATUS, CHECKLIST, QA_MIN, PAYMENTS, EXPENSE_CATEGORIES, PERIODS,
    uid, clamp, round, money, num, pad,
    get state() { return load(); },
    load, save, reset, applyTheme, refreshFromStorage,
    vehicles, washers, orders, services, serviceById, vehicleById, washerById, orderById, vehicleByPlate, ordersByVehicle, activeOrders,
    planActive, planDaysLeft, serviceNames, serviceDuration, orderValue, orderProgress, estimatedFinish, queueStats, waitEstimate,
    washerLoad, washerOfDay, bestWasherFor,
    saveVehicle, deleteVehicle, renewPlan, saveWasher, deleteWasher, loginWasher,
    createOrder, startOrder, sendToQA, qaScore, submitQA, deliverOrder, cancelOrder, assignWasher, togglePriority, addPhoto,
    finance, periodRange, addExpense, deleteExpense,
    pushAlert, scanAlerts, unreadAlerts, markAlertRead, markAllAlertsRead, clearAlerts, requestPush,
    backupPayload, exportBackupString, importBackup, ordersCSV, expensesCSV, washersCSV, toCSV,
    isStandalone,
    supabaseReady,
    initSupabase,
    persistWash,

    loginAdmin(pin) {
      if (String(pin) === '1234') {
        state.session = { role: 'admin', name: 'Administrador', since: Date.now() };
        save();
        return { ok: true };
      }
      return { ok: false, error: 'PIN do administrador incorreto.' };
    },
    logout() { state.session = null; save(); }
  };
})();
