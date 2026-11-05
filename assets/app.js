/* ============================================================
   WASHFLOW PRO — interface (PWA, mobile-first)
   ============================================================ */
(function () {
  'use strict';
  const WF = window.WF;
  const esc = WF.escapeHtml;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  const ui = {
    loginTab: 'admin',
    menuOpen: false,
    lastScan: 0,
    deferredPrompt: null,
    scanStream: null,
    qaDraft: null,
    pendingImport: null
  };

  /* ---------------- ícones ---------------- */
  const ICONS = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    car: '<path d="M4.5 16l1.6-5.4A2 2 0 018 9h8a2 2 0 011.9 1.6L19.5 16"/><path d="M3 16h18v3.5H3z"/><circle cx="7" cy="20.5" r="1.4"/><circle cx="17" cy="20.5" r="1.4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    wallet: '<path d="M3 7h15a3 3 0 013 3v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path d="M3 7V6a2 2 0 012-2h11"/><circle cx="16.5" cy="13.5" r="1.2"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M17 5.5a3 3 0 010 5.8M18 20c0-2.4-.8-4.2-2.2-5.3"/>',
    bell: '<path d="M18 15V10a6 6 0 10-12 0v5l-2 3h16l-2-3z"/><path d="M10 21h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2 2 2 0 11-4 0 1.7 1.7 0 00-2.9-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 004 15a2 2 0 110-4 1.7 1.7 0 001.2-2.9L5 8a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0011 4a2 2 0 114 0 1.7 1.7 0 002.9 1.2l.1-.1A2 2 0 1120.8 8l-.1.1A1.7 1.7 0 0020 11a2 2 0 110 4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera: '<path d="M3 8.5A2.5 2.5 0 015.5 6h1.8l1.2-2h7l1.2 2h1.8A2.5 2.5 0 0121 8.5v9A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5v-9z"/><circle cx="12" cy="13" r="3.6"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    download: '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    upload: '<path d="M12 20V9"/><path d="M7 13l5-5 5 5"/><path d="M4 4h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    star: '<path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.3 6.5 20.2l1.1-6.2L3 9.6l6.3-.9L12 3z"/>',
    alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4M12 17.5v.01"/>',
    refresh: '<path d="M20 12a8 8 0 11-2.3-5.7"/><path d="M20 4v4h-4"/>',
    logout: '<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 018.5 3 8.5 8.5 0 1020 14.5z"/>',
    install: '<path d="M12 3v10"/><path d="M8 9l4 4 4-4"/><path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
    phone: '<path d="M6 3h3l2 5-2 1.5a11 11 0 006.5 6.5L17 14l5 2v3a2 2 0 01-2 2A17 17 0 014 6a2 2 0 012-3z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M5 18l5-5 4 4 2-2 3 3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>'
  };
  function icon(name, size) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------------- helpers de tela ---------------- */
  function toast(msg, type) {
    if (!toastRoot) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = '<span class="t-dot"></span><span>' + esc(msg) + '</span>';
    toastRoot.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.25s'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }

  function openModal(title, body, foot, opts) {
    opts = opts || {};
    modalRoot.innerHTML =
      '<div class="modal-backdrop" data-backdrop="1">' +
        '<div class="modal" role="dialog" aria-modal="true">' +
          '<div class="modal-head"><h3>' + esc(title) + '</h3>' +
            '<button class="modal-close" data-act="close-modal" aria-label="Fechar">✕</button></div>' +
          '<div class="modal-body">' + body + '</div>' +
          (foot ? '<div class="modal-foot">' + foot + '</div>' : '') +
        '</div>' +
      '</div>';
    document.body.style.overflow = 'hidden';
    if (opts.onOpen) opts.onOpen();
  }
  function closeModal() {
    stopCamera();
    modalRoot.innerHTML = '';
    document.body.style.overflow = '';
  }
  function confirmModal(title, message, action, actionLabel, mode, danger) {
    openModal(title,
      '<p style="font-size:.88rem;line-height:1.55">' + message + '</p>',
      '<button class="btn ghost" data-act="close-modal">Cancelar</button>' +
      '<button class="btn ' + (danger ? 'danger' : 'primary') + '" data-act="' + action + '"' + (mode ? ' data-mode="' + mode + '"' : '') + '>' + actionLabel + '</button>');
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function pageHead(eyebrow, title, sub, actions) {
    return '<div class="page-head"><div class="titles">' +
      (eyebrow ? '<div class="eyebrow">' + esc(eyebrow) + '</div>' : '') +
      '<h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') +
      '</div>' + (actions ? '<div class="row wrap">' + actions + '</div>' : '') + '</div>';
  }

  function progress(pct, cls) {
    return '<div class="progress ' + (cls || '') + '"><span style="width:' + WF.clamp(Math.round(pct), 0, 100) + '%"></span></div>';
  }

  function statusPill(status) {
    const s = WF.STATUS[status] || { label: status, color: 'fila' };
    return '<span class="pill ' + s.color + '"><i class="dot"></i>' + s.label + '</span>';
  }

  function osMetaTime(o) {
    if (o.status === 'fila') {
      const late = (Date.now() - o.createdAt) / WF.MIN > 45;
      return '<span class="wait-chip ' + (late ? 'late' : '') + '">' + icon('clock', 11) + ' espera ' + WF.relTime(o.createdAt) + '</span>';
    }
    if (o.status === 'lavagem' && o.startedAt) {
      const est = Math.max(15, WF.serviceDuration(o.serviceIds));
      const late = (Date.now() - o.startedAt) / WF.MIN > est;
      return '<span class="wait-chip ' + (late ? 'late' : '') + '">' + icon('clock', 11) + ' ' + WF.relTime(o.startedAt) + ' de ' + WF.durMin(est) + '</span>';
    }
    if (o.status === 'qa') return '<span class="wait-chip">' + icon('shield', 11) + ' enviado ' + WF.relTime(o.finishedAt) + '</span>';
    if (o.status === 'pronto') return '<span class="wait-chip">' + icon('check', 11) + ' liberado ' + WF.relTime(o.qa.approvedAt || o.finishedAt) + '</span>';
    if (o.status === 'entregue') return '<span class="wait-chip">' + icon('check', 11) + ' entregue ' + WF.fmtTime(o.deliveredAt) + '</span>';
    return '';
  }

  function osCard(o, role) {
    const v = WF.vehicleById(o.vehicleId) || {};
    const w = WF.washerById(o.washerId);
    const isWasher = role === 'washer';
    const mine = isWasher && o.washerId === WF.state.session.washerId;
    let actions = '';
    if (o.status === 'fila') {
      actions += '<button class="btn primary sm" data-act="start" data-id="' + o.id + '">' + icon('play', 13) + 'Iniciar</button>';
    } else if (o.status === 'lavagem' && (mine || !isWasher)) {
      actions += '<button class="btn primary sm" data-act="sendqa" data-id="' + o.id + '">' + icon('shield', 13) + 'Enviar QA</button>';
    } else if (o.status === 'qa' && !isWasher) {
      actions += '<button class="btn primary sm" data-act="qa" data-id="' + o.id + '">' + icon('shield', 13) + 'Conferir</button>';
    } else if (o.status === 'pronto' && !isWasher) {
      actions += '<button class="btn ok sm" data-act="deliver" data-id="' + o.id + '">' + icon('check', 13) + 'Entregar</button>';
    } else if (o.status === 'qa' && isWasher) {
      actions += '<span class="pill qa" style="flex:1;justify-content:center">Aguardando QA</span>';
    }
    if (!isWasher) {
      actions += '<button class="btn sm ghost" data-act="assign" data-id="' + o.id + '" title="Trocar lavador">' + icon('users', 13) + '</button>';
      if (o.status !== 'entregue' && o.status !== 'cancelado') {
        actions += '<button class="btn sm ghost" data-act="priority" data-id="' + o.id + '" title="Prioridade" style="' + (o.priority ? 'color:var(--warn)' : '') + '">' + icon('star', 13) + '</button>';
      }
    } else if (!o.washerId && o.status === 'fila') {
      actions += '<button class="btn sm" data-act="claim" data-id="' + o.id + '">Assumir</button>';
    }
    if (isWasher && !mine && o.washerId) actions = osMetaTime(o);
    return '<article class="os-card ' + (o.priority ? 'urgent' : '') + '">' +
      '<div class="os-top"><div style="min-width:0"><span class="plate">' + esc(o.plate) + '</span>' +
        '<div class="os-vehicle">' + esc(v.model || 'Veículo') + (v.customer ? ' • ' + esc(v.customer) : '') + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' + statusPill(o.status) +
        (o.priority ? '<span class="pill" style="color:var(--warn);border-color:rgba(251,191,36,.3);background:var(--warn-soft)">prioridade</span>' : '') +
        '</div></div>' +
      '<div class="os-services">' + esc(WF.serviceNames(o) || 'Sem serviço') + '</div>' +
      '<div class="os-meta"><span>' + (w ? icon('user', 11) + ' ' + esc(w.name.split(' ')[0]) : 'sem lavador') + '</span><span>•</span>' +
        '<span class="strong" style="color:var(--text)">' + (o.plan === 'mensal' ? 'Mensalista' : WF.money(o.price)) + '</span>' +
        osMetaTime(o) + '</div>' +
      (o.status === 'lavagem' ? '<div style="margin-top:8px">' + progress(WF.orderProgress(o), WF.orderProgress(o) > 76 ? 'warn' : '') + '</div>' : '') +
      (actions ? '<div class="os-actions">' + actions + '</div>' : '') +
    '</article>';
  }

  /* ---------------- login ---------------- */
  function loginView() {
    const s = WF.state;
    const tab = ui.loginTab;
    const washers = s.washers.filter((w) => w.active);
    const body = tab === 'admin'
      ? '<form data-form="login-admin" class="col" style="gap:12px">' +
          '<div class="field"><label>PIN do administrador</label>' +
          '<input class="input pin-input" name="pin" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="••••" required></div>' +
          '<button class="btn primary block" type="submit">' + icon('lock', 16) + 'Entrar como administrador</button>' +
        '</form>'
      : '<form data-form="login-washer" class="col" style="gap:12px">' +
          '<div class="field"><label>Lavador</label><select class="input" name="washerId" required>' +
            washers.map((w) => '<option value="' + w.id + '">' + esc(w.name) + ' — ' + esc(w.shift) + '</option>').join('') +
          '</select></div>' +
          '<div class="field"><label>Seu PIN</label>' +
          '<input class="input pin-input" name="pin" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="••••" required></div>' +
          '<button class="btn primary block" type="submit">' + icon('play', 16) + 'Acessar app do lavador</button>' +
        '</form>';

    return '<div class="login-wrap">' +
      '<div class="login-stage">' +
        '<div class="login-card">' +
          '<div class="login-logo">' +
            '<div class="brand-mark">W</div>' +
            '<div><div class="brand-name">WASHFLOW PRO</div>' +
            '<div class="brand-sub" style="margin-top:4px">Gestão inteligente de lavajatos</div></div>' +
            '<p>Frota, fila, conferência de qualidade, financeiro e equipe em um só lugar — funciona até offline.</p>' +
          '</div>' +
          '<div class="seg" style="display:flex;margin-bottom:14px">' +
            '<button data-act="login-tab" data-tab="admin" class="' + (tab === 'admin' ? 'active' : '') + '" style="flex:1">Administração</button>' +
            '<button data-act="login-tab" data-tab="washer" class="' + (tab === 'washer' ? 'active' : '') + '" style="flex:1">Sou lavador</button>' +
          '</div>' +
          body +
          '<div class="login-foot">' +
            '<button class="btn sm ghost" data-act="theme">' + icon(s.settings.theme === 'light' ? 'moon' : 'sun', 14) + 'Tema ' + (s.settings.theme === 'light' ? 'escuro' : 'claro') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="demo-hint">Demonstração: admin <b>1234</b> · lavador Carlos <b>1111</b> (Rafael 2222, Juliana 3333, Diego 4444).<br>Os dados ficam salvos neste aparelho.</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------- shell ---------------- */
  const ADMIN_NAV = [
    { id: 'dashboard', label: 'Painel', icon: 'grid' },
    { id: 'fila', label: 'Fila de lavagem', icon: 'layers' },
    { id: 'frota', label: 'Frota', icon: 'car' },
    { id: 'qa', label: 'Qualidade (QA)', icon: 'shield' },
    { id: 'financeiro', label: 'Financeiro', icon: 'wallet' },
    { id: 'lavadores', label: 'Lavadores', icon: 'users' },
    { id: 'alertas', label: 'Alertas', icon: 'bell' },
    { id: 'config', label: 'Ajustes', icon: 'settings' }
  ];
  const WASHER_NAV = [
    { id: 'minhas', label: 'Minhas ordens', icon: 'layers' },
    { id: 'ganhos', label: 'Meus ganhos', icon: 'wallet' },
    { id: 'perfil', label: 'Meu perfil', icon: 'user' }
  ];

  function badgeCount(id) {
    if (id === 'fila') return WF.state.orders.filter((o) => ['fila', 'lavagem'].includes(o.status)).length;
    if (id === 'qa') return WF.state.orders.filter((o) => o.status === 'qa').length;
    if (id === 'alertas') return WF.unreadAlerts();
    return 0;
  }

  function navItem(item, active, mobile) {
    const n = badgeCount(item.id);
    const badge = n ? '<span class="nav-badge">' + n + '</span>' : '';
    if (mobile) {
      return '<a class="nav-item ' + active + '" href="#/' + item.id + '">' + icon(item.icon) + '<span>' + esc(item.label.split(' ')[0]) + '</span>' + badge + '</a>';
    }
    return '<a class="side-item ' + active + '" href="#/' + item.id + '">' + icon(item.icon) + '<span>' + esc(item.label) + '</span>' + badge + '</a>';
  }

  function shell(view, content) {
    const s = WF.state;
    const session = s.session;
    const isWasher = session.role === 'washer';
    const nav = isWasher ? WASHER_NAV : ADMIN_NAV;
    const active = (id) => (id === view ? 'active' : '');
    const washer = isWasher ? WF.washerById(session.washerId) : null;
    const name = isWasher ? (washer ? washer.name : session.name) : 'Administrador';
    const roleLabel = isWasher ? 'Lavador' : 'Gestão';

    const sidebar =
      '<aside class="sidebar">' +
        '<div class="brand"><div class="brand-mark">W</div><div><div class="brand-name">WASHFLOW</div><div class="brand-sub">PRO</div></div></div>' +
        nav.map((i) => navItem(i, active(i.id), false)).join('') +
        '<div class="sidebar-foot">' +
          '<button class="side-item" data-act="theme">' + icon(s.settings.theme === 'light' ? 'moon' : 'sun') + '<span>Tema ' + (s.settings.theme === 'light' ? 'escuro' : 'claro') + '</span></button>' +
          '<button class="side-item" data-act="install">' + icon('install') + '<span>Instalar app</span></button>' +
          '<button class="side-item" data-act="logout">' + icon('logout') + '<span>Sair</span></button>' +
          '<div class="version">v' + WF.APP_VERSION + ' · dados locais</div>' +
        '</div>' +
      '</aside>';

    const mobileNav = isWasher
      ? '<nav class="bottom-nav">' + WASHER_NAV.map((i) => navItem(i, active(i.id), true)).join('') + '</nav>'
      : '<nav class="bottom-nav">' +
          navItem(ADMIN_NAV[0], active('dashboard'), true) +
          navItem(ADMIN_NAV[1], active('fila'), true) +
          navItem(ADMIN_NAV[3], active('qa'), true) +
          navItem(ADMIN_NAV[4], active('financeiro'), true) +
          '<button class="nav-item" data-act="menu">' + icon('menu') + '<span>Mais</span></button>' +
        '</nav>';

    return '<div class="shell">' + sidebar +
      '<div class="main">' +
        '<header class="topbar">' +
          '<div class="brand" style="display:' + (view === 'dashboard' || isWasher ? 'flex' : 'flex') + '">' +
            '<div class="brand-mark">W</div>' +
            '<div><div class="brand-name">WASHFLOW PRO</div><div class="brand-sub">' + esc(s.settings.shopName) + '</div></div>' +
          '</div>' +
          '<div class="topbar-actions">' +
            '<button class="icon-btn" data-act="scan" title="Ler placa pela câmera">' + icon('camera') + '</button>' +
            '<a class="icon-btn" href="#/alertas" title="Alertas">' + icon('bell') + (WF.unreadAlerts() ? '<span class="badge-dot">' + WF.unreadAlerts() + '</span>' : '') + '</a>' +
            '<button class="user-chip" data-act="account">' +
              '<span class="avatar" style="background:' + WF.colorFor(name) + '">' + esc(WF.initials(name)) + '</span>' +
              '<span class="u-id"><span class="u-name">' + esc(name) + '</span>' +
              '<span class="u-role">' + roleLabel + '</span></span>' +
            '</button>' +
          '</div>' +
        '</header>' +
        '<main class="content" id="view-content">' + content + '</main>' +
      '</div>' + mobileNav +
    '</div>';
  }

  /* ---------------- painel ---------------- */
  function dashboardView() {
    const s = WF.state;
    const fin = WF.finance('hoje');
    const active = WF.activeOrders();
    const queue = s.orders.filter((o) => o.status === 'fila').sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
    const washing = s.orders.filter((o) => o.status === 'lavagem');
    const qaList = s.orders.filter((o) => o.status === 'qa');
    const ready = s.orders.filter((o) => o.status === 'pronto');
    const goalPct = fin.goal ? (fin.revenue / fin.goal) * 100 : 0;
    const q = WF.queueStats();
    const ranking = WF.washers(true).map((w) => ({ w, d: WF.washerOfDay(w.id) })).sort((a, b) => b.d.count - a.d.count);
    const maxSeries = Math.max.apply(null, fin.series.map((x) => x.value).concat([1]));

    const kpis =
      '<div class="kpis">' +
        '<div class="kpi k-ok"><div class="kpi-label">Faturamento hoje</div><div class="kpi-value">' + WF.money(fin.revenue) + '</div>' +
          '<div class="kpi-foot">' + fin.count + ' lavagem(ns) entregue(s)</div></div>' +
        '<div class="kpi"><div class="kpi-label">Ticket médio</div><div class="kpi-value">' + WF.money(fin.ticket) + '</div>' +
          '<div class="kpi-foot">meta ' + WF.money(fin.goal) + '/dia</div></div>' +
        '<div class="kpi k-warn"><div class="kpi-label">Na operação</div><div class="kpi-value">' + active.length + '</div>' +
          '<div class="kpi-foot">' + queue.length + ' na fila · ' + washing.length + ' lavando</div></div>' +
        '<div class="kpi k-purple"><div class="kpi-label">Prontos p/ entrega</div><div class="kpi-value">' + ready.length + '</div>' +
          '<div class="kpi-foot">' + qaList.length + ' em conferência</div></div>' +
      '</div>';

    const goalCard =
      '<div class="card" style="margin-top:12px">' +
        '<div class="card-head"><h3>Meta do dia</h3><span class="pill ' + (goalPct >= 100 ? 'pronto' : '') + '">' + Math.round(goalPct) + '%</span></div>' +
        progress(goalPct, goalPct >= 100 ? 'ok' : '') +
        '<div class="between" style="margin-top:8px"><span class="small muted">' + WF.money(fin.revenue) + ' de ' + WF.money(fin.goal) + '</span>' +
        '<span class="small muted">faltam ' + WF.money(Math.max(0, fin.goal - fin.revenue)) + '</span></div>' +
      '</div>';

    const hero =
      '<div class="hero-strip">' +
        '<div><div class="eyebrow">Fila inteligente</div>' +
          '<h3>' + (queue.length ? queue.length + ' veículo(s) esperando' : 'Fila zerada agora') + '</h3>' +
          '<p>espera média estimada de ' + q.avgCycle + ' min · ' + q.activeWashers + ' lavador(es) ativo(s)</p></div>' +
        '<button class="btn primary sm" data-act="open-order">' + icon('plus', 14) + 'Nova</button>' +
      '</div>';

    const filaPreview = queue.length
      ? queue.slice(0, 4).map((o) => {
          const v = WF.vehicleById(o.vehicleId) || {};
          const w = WF.washerById(o.washerId);
          return '<div class="list-row"><div class="l-main">' +
            '<div class="l-title"><span class="plate" style="font-size:.78rem">' + esc(o.plate) + '</span> ' + esc(WF.serviceNames(o)) + '</div>' +
            '<div class="l-sub">' + esc(v.model || '') + ' · ' + (w ? esc(w.name.split(' ')[0]) : 'sem lavador') + ' · espera ' + WF.relTime(o.createdAt) + '</div></div>' +
            '<button class="btn sm primary" data-act="start" data-id="' + o.id + '">Iniciar</button></div>';
        }).join('')
      : '<div class="empty">Nenhum veículo na fila. Boa hora para captar clientes!</div>';

    const washingPreview = washing.length
      ? washing.slice(0, 4).map((o) => {
          const w = WF.washerById(o.washerId);
          return '<div class="list-row"><div class="l-main">' +
            '<div class="l-title">' + esc(o.plate) + ' <span class="muted small">' + esc(WF.serviceNames(o)) + '</span></div>' +
            '<div class="l-sub">' + (w ? esc(w.name) : 'sem lavador') + ' · ' + WF.durMin((Date.now() - o.startedAt) / WF.MIN) + ' de ' + WF.durMin(WF.serviceDuration(o.serviceIds)) + '</div>' +
            '<div style="margin-top:6px">' + progress(WF.orderProgress(o)) + '</div></div>' +
            '<button class="btn sm" data-act="sendqa" data-id="' + o.id + '">QA</button></div>';
        }).join('')
      : '<div class="empty">Nenhuma lavagem em andamento.</div>';

    const chart =
      '<div class="card" style="margin-top:12px">' +
        '<div class="card-head"><h3>Faturamento · 7 dias</h3><a class="small" href="#/financeiro">ver financeiro</a></div>' +
        '<div class="chart-bars">' + fin.series.map((d) =>
          '<div class="chart-bar ' + (d.isToday ? 'today' : '') + '">' +
            '<span class="bar-value">' + (d.value ? (Math.round(d.value / 100) / 10).toFixed(1).replace('.', ',') + 'k' : '') + '</span>' +
            '<div class="bar" style="height:' + Math.max(4, (d.value / maxSeries) * 88) + 'px"></div>' +
            '<span class="bar-label">' + d.label + '</span>' +
          '</div>').join('') + '</div>' +
      '</div>';

    const rankingCard =
      '<div class="card" style="margin-top:12px">' +
        '<div class="card-head"><h3>Equipe hoje</h3><a class="small" href="#/lavadores">gerenciar</a></div>' +
        (ranking.length ? ranking.slice(0, 4).map((r, i) =>
          '<div class="rank-row"><span class="rank-pos ' + (i === 0 ? 'top' : '') + '">' + (i + 1) + '</span>' +
          '<span class="avatar" style="background:' + WF.colorFor(r.w.name) + ';width:30px;height:30px;border-radius:9px">' + esc(WF.initials(r.w.name)) + '</span>' +
          '<div style="min-width:0;flex:1"><div class="l-title" style="font-size:.82rem">' + esc(r.w.name) + '</div>' +
          '<div class="l-sub">' + r.d.count + ' lavagem(ns) · ' + (r.d.avgScore == null ? 'sem QA' : 'QA ' + r.d.avgScore) + '</div></div>' +
          '<div class="right"><div class="strong" style="font-size:.8rem">' + WF.money(r.d.commission) + '</div><div class="tiny muted">comissão</div></div></div>'
        ).join('') : '<div class="empty">Nenhum lavador ativo.</div>') +
      '</div>';

    const alerts = WF.state.alerts.slice(0, 3);
    const alertsCard =
      '<div class="card" style="margin-top:12px">' +
        '<div class="card-head"><h3>Alertas recentes</h3><a class="small" href="#/alertas">todos</a></div>' +
        (alerts.length ? alerts.map((a) => alertRow(a, true)).join('') : '<div class="empty">Tudo tranquilo por aqui.</div>') +
      '</div>';

    return pageHead('Visão geral', 'Painel do dia',
      new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) + ' · ' + esc(s.settings.shopName),
      '<button class="btn primary" data-act="open-order">' + icon('plus', 15) + 'Nova lavagem</button>' +
      '<button class="btn" data-act="scan">' + icon('camera', 15) + 'Ler placa</button>') +
      hero + kpis + goalCard +
      '<div class="grid dash" style="margin-top:12px">' +
        '<div class="card"><div class="card-head"><h3>Fila agora</h3>' +
          '<span class="muted small">' + queue.length + ' aguardando</span></div>' + filaPreview +
          '<div class="divider"></div>' +
          '<div class="card-head"><h3>Em lavagem</h3><span class="muted small">' + washing.length + ' ativa(s)</span></div>' +
          washingPreview +
        '</div>' +
        '<div class="col">' + rankingCard + alertsCard + '</div>' +
      '</div>' + chart;
  }

  function alertRow(a, compact) {
    const iconName = a.type === 'qa' || a.type === 'qa-fail' ? 'shield' : a.type === 'ready' ? 'check' : a.type === 'plan' ? 'calendar' : a.type === 'goal' ? 'sparkles' : a.type === 'delay' || a.type === 'fila' ? 'clock' : 'bell';
    return '<div class="alert ' + (a.level || 'info') + ' ' + (a.read ? '' : 'unread') + '">' +
      '<span class="a-icon">' + icon(iconName) + '</span>' +
      '<div style="flex:1;min-width:0"><div class="a-title">' + esc(a.title) + '</div>' +
      '<div class="a-msg">' + esc(a.message) + '</div>' +
      '<div class="a-time">' + WF.relTime(a.createdAt) + ' atrás' + (compact ? '' : ' · ' + WF.fmtDateTime(a.createdAt)) + '</div></div>' +
      (a.read ? '' : '<button class="btn sm ghost" data-act="mark-read" data-id="' + a.id + '" title="Marcar como lido">' + icon('check', 14) + '</button>') +
    '</div>';
  }

  /* ---------------- fila ---------------- */
  function filaView() {
    const s = WF.state;
    const cols = [
      { status: 'fila', title: 'Aguardando', hint: 'ordem de chegada' },
      { status: 'lavagem', title: 'Em lavagem', hint: 'em execução' },
      { status: 'qa', title: 'Conferência', hint: 'controle de qualidade' },
      { status: 'pronto', title: 'Pronto', hint: 'aguardando entrega' }
    ];
    const q = WF.queueStats();
    return pageHead('Operação', 'Fila de lavagem',
      'Fluxo em tempo real · ciclo médio estimado de ' + q.avgCycle + ' min',
      '<button class="btn" data-act="scan">' + icon('camera', 15) + 'Ler placa</button>' +
      '<button class="btn primary" data-act="open-order">' + icon('plus', 15) + 'Nova lavagem</button>') +
      '<div class="board">' + cols.map((c) => {
        const list = s.orders.filter((o) => o.status === c.status)
          .sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
        return '<section class="column"><div class="column-head"><div>' +
          '<div class="strong" style="font-size:.85rem">' + c.title + '</div>' +
          '<div class="tiny muted">' + c.hint + '</div></div>' +
          '<span class="count">' + list.length + '</span></div>' +
          (list.length ? list.map((o) => osCard(o, 'admin')).join('') : '<div class="empty">Nada aqui</div>') +
        '</section>';
      }).join('') + '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Entregues hoje</h3>' +
        '<span class="muted small">' + WF.finance('hoje').count + ' concluídas</span></div>' +
        (s.orders.filter((o) => o.status === 'entregue' && o.deliveredAt >= WF.startOfDay(Date.now())).length
          ? '<div class="table-wrap"><table class="data"><thead><tr><th>OS</th><th>Placa</th><th>Serviços</th><th>Lavador</th><th>Hora</th><th class="right">Valor</th></tr></thead><tbody>' +
            s.orders.filter((o) => o.status === 'entregue' && o.deliveredAt >= WF.startOfDay(Date.now()))
              .sort((a, b) => b.deliveredAt - a.deliveredAt)
              .map((o) => '<tr><td class="mono">' + o.code + '</td><td class="plate" style="font-size:.74rem">' + esc(o.plate) + '</td>' +
                '<td>' + esc(WF.serviceNames(o)) + '</td><td>' + esc((WF.washerById(o.washerId) || {}).name || '—') + '</td>' +
                '<td>' + WF.fmtTime(o.deliveredAt) + '</td><td class="right strong">' + (o.plan === 'mensal' ? '<span class="pill mensal">plano</span>' : WF.money(o.price)) + '</td></tr>').join('') +
            '</tbody></table></div>'
          : '<div class="empty">Nenhuma entrega registrada hoje.</div>') +
      '</div>';
  }

  /* ---------------- frota ---------------- */
  function frotaView() {
    const s = WF.state;
    const term = (ui.fleetSearch || '').toLowerCase();
    const filter = ui.fleetFilter || 'todos';
    let list = s.vehicles.slice();
    if (term) list = list.filter((v) => (v.plate + ' ' + v.model + ' ' + v.customer + ' ' + v.color).toLowerCase().includes(term));
    if (filter === 'mensal') list = list.filter((v) => v.plan === 'mensal');
    if (filter === 'avulso') list = list.filter((v) => v.plan !== 'mensal');
    if (filter === 'vencendo') list = list.filter((v) => v.planDue && WF.planDaysLeft(v) <= 7);

    const activeCount = WF.activeOrders().length;
    return pageHead('Frota', 'Veículos cadastrados',
      list.length + ' de ' + s.vehicles.length + ' veículo(s) · ' + s.vehicles.filter((v) => v.plan === 'mensal').length + ' mensalista(s)',
      '<button class="btn" data-act="scan">' + icon('camera', 15) + 'Ler placa</button>' +
      '<button class="btn primary" data-act="new-vehicle">' + icon('plus', 15) + 'Novo veículo</button>') +
      '<div class="card">' +
        '<div class="row wrap" style="margin-bottom:12px">' +
          '<div class="search">' + icon('search') + '<input class="input" id="fleet-search" placeholder="Buscar placa, modelo ou cliente" value="' + esc(ui.fleetSearch || '') + '"></div>' +
          '<div class="seg">' +
            ['todos', 'mensal', 'avulso', 'vencendo'].map((f) =>
              '<button data-act="fleet-filter" data-filter="' + f + '" class="' + (filter === f ? 'active' : '') + '">' +
              (f === 'todos' ? 'Todos' : f === 'mensal' ? 'Mensalistas' : f === 'avulso' ? 'Avulsos' : 'Vencendo') + '</button>').join('') +
          '</div>' +
        '</div>' +
        (list.length ? '<div class="list">' + list.map((v) => {
          const hist = WF.ordersByVehicle(v.id);
          const open = hist.find((o) => ['fila', 'lavagem', 'qa', 'pronto'].includes(o.status));
          const days = WF.planDaysLeft(v);
          return '<div class="list-row" style="align-items:flex-start">' +
            '<div class="plate" style="margin-top:2px">' + esc(v.plate) + '</div>' +
            '<div class="l-main"><div class="l-title">' + esc(v.model) + ' <span class="small muted">' + esc(v.color) + ' · ' + esc(v.type) + '</span></div>' +
            '<div class="l-sub">' + esc(v.customer || 'Cliente balcão') + (v.phone ? ' · ' + esc(v.phone) : '') + '</div>' +
            '<div class="mini-stats" style="margin-top:6px">' +
              (v.plan === 'mensal' ? '<span class="pill mensal">mensal' + (v.planDue ? ' · ' + (days >= 0 ? days + 'd' : Math.abs(days) + 'd atrasado') : '') + '</span>' : '<span class="tag">avulso</span>') +
              (open ? statusPill(open.status) : '<span class="tag">' + hist.length + ' lavagens</span>') +
            '</div></div>' +
            '<div class="row" style="gap:4px;flex-wrap:wrap;justify-content:flex-end">' +
              (open ? '' : '<button class="btn sm primary" data-act="order-for" data-id="' + v.id + '">Nova OS</button>') +
              '<button class="btn sm ghost" data-act="edit-vehicle" data-id="' + v.id + '" title="Editar">' + icon('edit', 14) + '</button>' +
              (v.planDue && days < 7 ? '<button class="btn sm" data-act="renew" data-id="' + v.id + '" title="Renovar plano">' + icon('refresh', 14) + '</button>' : '') +
              '<button class="btn sm ghost" data-act="del-vehicle" data-id="' + v.id + '" title="Excluir">' + icon('trash', 14) + '</button>' +
            '</div></div>';
        }).join('') + '</div>' : '<div class="empty">Nenhum veículo encontrado. Cadastre a primeira placa.</div>') +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Mensalistas a renovar</h3>' +
        '<span class="muted small">' + s.vehicles.filter((v) => v.planDue && WF.planDaysLeft(v) <= 7).length + ' em atenção</span></div>' +
        (s.vehicles.filter((v) => v.planDue && WF.planDaysLeft(v) <= 7).length ? s.vehicles.filter((v) => v.planDue && WF.planDaysLeft(v) <= 7).map((v) => {
          const d = WF.planDaysLeft(v);
          return '<div class="list-row"><div class="l-main"><div class="l-title">' + esc(v.customer) + ' · <span class="mono">' + esc(v.plate) + '</span></div>' +
            '<div class="l-sub">' + (d >= 0 ? 'vence em ' + d + ' dia(s)' : 'vencido há ' + Math.abs(d) + ' dia(s)') + ' · ' + esc(v.phone || 'sem telefone') + '</div></div>' +
            '<button class="btn sm ok" data-act="renew" data-id="' + v.id + '">Renovar 30d</button></div>';
        }).join('') : '<div class="empty">Nenhuma mensalidade vencendo nos próximos 7 dias.</div>') +
      '</div>';
  }

  /* ---------------- QA ---------------- */
  function qaView() {
    const s = WF.state;
    const pending = s.orders.filter((o) => o.status === 'qa').sort((a, b) => a.finishedAt - b.finishedAt);
    const history = s.orders.filter((o) => o.qa && o.qa.score != null && o.qa.reviewedAt).sort((a, b) => b.qa.reviewedAt - a.qa.reviewedAt).slice(0, 12);
    const avg = history.length ? Math.round(history.slice(0, 8).reduce((a, o) => a + o.qa.score, 0) / Math.min(8, history.length)) : 0;
    return pageHead('Controle de qualidade', 'Conferência (QA)',
      'Checklist obrigatório antes da entrega · aprovação a partir de ' + (s.settings.qaMin || 80) + '/100',
      '<button class="btn" data-act="scan">' + icon('camera', 15) + 'Ler placa</button>') +
      '<div class="grid c3" style="margin-bottom:12px">' +
        '<div class="kpi k-purple"><div class="kpi-label">Aguardando</div><div class="kpi-value">' + pending.length + '</div><div class="kpi-foot">veículos em conferência</div></div>' +
        '<div class="kpi k-ok"><div class="kpi-label">Nota média</div><div class="kpi-value">' + (avg || '—') + '<small>/100</small></div><div class="kpi-foot">últimas conferências</div></div>' +
        '<div class="kpi"><div class="kpi-label">Reprovações</div><div class="kpi-value">' + s.orders.filter((o) => o.qa && o.qa.attempts > 1).length + '</div><div class="kpi-foot">retrabalhos registrados</div></div>' +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>Fila de conferência</h3><span class="muted small">' + pending.length + ' pendente(s)</span></div>' +
        (pending.length ? pending.map((o) => {
          const v = WF.vehicleById(o.vehicleId) || {};
          const w = WF.washerById(o.washerId);
          return '<div class="list-row"><div class="l-main">' +
            '<div class="l-title"><span class="plate" style="font-size:.76rem">' + esc(o.plate) + '</span> ' + esc(v.model || '') + '</div>' +
            '<div class="l-sub">' + esc(WF.serviceNames(o)) + ' · ' + esc(w ? w.name : 'sem lavador') + ' · enviado ' + WF.relTime(o.finishedAt) + ' atrás</div></div>' +
            '<button class="btn sm primary" data-act="qa" data-id="' + o.id + '">Conferir</button></div>';
        }).join('') : '<div class="empty">Nenhum veículo aguardando conferência.</div>') +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Histórico de conferências</h3>' +
        '<button class="btn sm ghost" data-act="export-orders">' + icon('download', 13) + 'CSV</button></div>' +
        (history.length ? '<div class="list">' + history.map((o) => {
          const w = WF.washerById(o.washerId);
          const score = o.qa.score;
          return '<div class="list-row"><span class="pill ' + (score >= (s.settings.qaMin || 80) ? 'pronto' : 'cancelado') + '" style="min-width:46px;justify-content:center">' + score + '</span>' +
            '<div class="l-main"><div class="l-title">' + esc(o.plate) + ' <span class="small muted">' + esc(WF.serviceNames(o)) + '</span></div>' +
            '<div class="l-sub">' + (w ? esc(w.name) : '—') + ' · ' + WF.fmtDateTime(o.qa.reviewedAt) + (o.qa.notes ? ' · ' + esc(o.qa.notes) : '') + '</div></div>' +
            (score >= (s.settings.qaMin || 80) ? '<span class="pill pronto">aprovado</span>' : '<span class="pill cancelado">reprovado</span>') + '</div>';
        }).join('') + '</div>' : '<div class="empty">Sem conferências registradas ainda.</div>') +
      '</div>';
  }

  /* ---------------- financeiro ---------------- */
  function financeView() {
    const key = ui.financePeriod || 'hoje';
    const fin = WF.finance(key);
    const maxSeries = Math.max.apply(null, fin.series.map((d) => d.value).concat([1]));
    const goalPct = fin.goal ? (fin.revenue / fin.goal) * 100 : 0;
    const maxService = Math.max.apply(null, fin.byService.map((s) => s.value).concat([1]));

    return pageHead('Financeiro', 'Resultado inteligente',
      'Receitas, comissões e despesas · período: ' + (WF.PERIODS[key] || {}).label,
      '<button class="btn" data-act="export-orders">' + icon('download', 15) + 'CSV OS</button>' +
      '<button class="btn primary" data-act="new-expense">' + icon('plus', 15) + 'Despesa</button>') +
      '<div class="seg" style="margin-bottom:12px">' +
        Object.keys(WF.PERIODS).map((k) => '<button data-act="fin-period" data-key="' + k + '" class="' + (k === key ? 'active' : '') + '">' + WF.PERIODS[k].label + '</button>').join('') +
      '</div>' +
      '<div class="kpis">' +
        '<div class="kpi k-ok hero-kpi"><div class="kpi-label">Receita</div><div class="kpi-value">' + WF.money(fin.revenue) + '</div><div class="kpi-foot">' + fin.count + ' OS pagas</div></div>' +
        '<div class="kpi"><div class="kpi-label">Ticket médio</div><div class="kpi-value">' + WF.money(fin.ticket) + '</div><div class="kpi-foot">por veículo</div></div>' +
        '<div class="kpi k-warn"><div class="kpi-label">Comissões</div><div class="kpi-value">' + WF.money(fin.commissions) + '</div><div class="kpi-foot">equipe</div></div>' +
        '<div class="kpi k-purple"><div class="kpi-label">Despesas</div><div class="kpi-value">' + WF.money(fin.expenses) + '</div><div class="kpi-foot">' + fin.expensesList.length + ' lançamento(s)</div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Lucro do período</h3>' +
        '<span class="pill ' + (fin.net >= 0 ? 'pronto' : 'cancelado') + '">' + (fin.net >= 0 ? 'positivo' : 'negativo') + '</span></div>' +
        '<div class="between"><div><div class="kpi-value">' + WF.money(fin.net) + '</div>' +
        '<div class="small muted">receita ' + WF.money(fin.revenue) + ' − comissões ' + WF.money(fin.commissions) + ' − despesas ' + WF.money(fin.expenses) + '</div></div></div>' +
        '<div class="divider"></div>' +
        '<div class="between small muted" style="margin-bottom:6px"><span>Meta diária ' + WF.money(fin.goal) + '</span><span>' + Math.round(goalPct) + '%</span></div>' +
        progress(goalPct, goalPct >= 100 ? 'ok' : '') +
      '</div>' +
      '<div class="grid c2" style="margin-top:12px">' +
        '<div class="card"><div class="card-head"><h3>Receita por serviço</h3>' + (fin.planWashes ? '<span class="tiny muted">+' + fin.planWashes + ' de mensalistas</span>' : '') + '</div>' +
          (fin.byService.length ? '<div class="hbar">' + fin.byService.slice(0, 6).map((s) =>
            '<div class="hbar-row"><span class="muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.name) + '</span>' +
            '<span class="track"><span class="fill" style="width:' + Math.max(3, (s.value / maxService) * 100) + '%"></span></span>' +
            '<span class="strong">' + WF.money(s.value) + '</span></div>').join('') + '</div>' : '<div class="empty">Sem receitas no período.</div>') +
        '</div>' +
        '<div class="card"><div class="card-head"><h3>Formas de pagamento</h3></div>' +
          (fin.byPayment.length ? '<div class="hbar">' + fin.byPayment.map((p) =>
            '<div class="hbar-row"><span class="muted">' + esc(p.label) + '</span>' +
            '<span class="track"><span class="fill" style="width:' + Math.max(3, (p.value / Math.max(fin.revenue, 1)) * 100) + '%"></span></span>' +
            '<span class="strong">' + WF.money(p.value) + '</span></div>').join('') + '</div>' : '<div class="empty">Nenhum pagamento registrado.</div>') +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Faturamento dos últimos 7 dias</h3></div>' +
        '<div class="chart-bars">' + fin.series.map((d) =>
          '<div class="chart-bar ' + (d.isToday ? 'today' : '') + '"><span class="bar-value">' + (d.value ? 'R$' + Math.round(d.value) : '') + '</span>' +
          '<div class="bar" style="height:' + Math.max(4, (d.value / maxSeries) * 88) + 'px"></div>' +
          '<span class="bar-label">' + d.label + '</span></div>').join('') + '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Despesas</h3>' +
        '<button class="btn sm ghost" data-act="export-expenses">' + icon('download', 13) + 'CSV</button></div>' +
        (fin.expensesList.length ? fin.expensesList.map((e) =>
          '<div class="list-row"><span class="a-icon" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--panel-3)">' + icon('wallet', 15) + '</span>' +
          '<div class="l-main"><div class="l-title">' + esc(e.description) + '</div><div class="l-sub">' + esc(e.category) + ' · ' + WF.fmtDate(e.date) + '</div></div>' +
          '<div class="strong" style="color:var(--danger)">− ' + WF.money(e.amount) + '</div>' +
          '<button class="btn sm ghost" data-act="del-expense" data-id="' + e.id + '">' + icon('trash', 14) + '</button></div>').join('')
          : '<div class="empty">Nenhuma despesa no período.</div>') +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Comissões por lavador</h3>' +
        '<button class="btn sm ghost" data-act="export-washers">' + icon('download', 13) + 'CSV</button></div>' +
        WF.washers(true).map((w) => {
          const d = WF.washerOfDay(w.id);
          return '<div class="list-row"><span class="avatar" style="background:' + WF.colorFor(w.name) + ';width:30px;height:30px;border-radius:9px">' + esc(WF.initials(w.name)) + '</span>' +
            '<div class="l-main"><div class="l-title">' + esc(w.name) + '</div><div class="l-sub">' + w.commission + '% · ' + d.count + ' hoje</div></div>' +
            '<div class="strong">' + WF.money(d.commission) + '</div></div>';
        }).join('') +
      '</div>';
  }

  /* ---------------- lavadores ---------------- */
  function lavadoresView() {
    const s = WF.state;
    return pageHead('Equipe', 'Gerenciar lavadores',
      s.washers.filter((w) => w.active).length + ' ativos de ' + s.washers.length + ' cadastrados',
      '<button class="btn primary" data-act="new-washer">' + icon('plus', 15) + 'Novo lavador</button>') +
      '<div class="grid c2">' + s.washers.map((w) => {
        const d = WF.washerOfDay(w.id);
        const load = WF.washerLoad(w.id);
        return '<div class="card">' +
          '<div class="between" style="align-items:flex-start">' +
            '<div class="row"><span class="avatar" style="background:' + WF.colorFor(w.name) + ';width:42px;height:42px;border-radius:12px;font-size:.9rem">' + esc(WF.initials(w.name)) + '</span>' +
            '<div><h3>' + esc(w.name) + '</h3><div class="small muted">' + esc(w.shift) + ' · ' + w.commission + '% comissão</div></div></div>' +
            '<span class="pill ' + (w.active ? 'pronto' : 'cancelado') + '">' + (w.active ? 'ativo' : 'inativo') + '</span>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="mini-stats">' +
            '<span>' + d.count + ' lavagens hoje</span>' +
            '<span>comissão ' + WF.money(d.commission) + '</span>' +
            '<span>QA ' + (d.avgScore == null ? '—' : d.avgScore) + '</span>' +
            (load ? '<span>' + load + ' em andamento</span>' : '') +
          '</div>' +
          '<div class="small muted" style="margin-top:10px">PIN de acesso: <b class="mono">' + esc(w.pin) + '</b> · ' + esc(w.phone || 'sem telefone') + '</div>' +
          '<div class="btn-group" style="margin-top:12px">' +
            '<button class="btn sm" data-act="edit-washer" data-id="' + w.id + '">' + icon('edit', 13) + 'Editar</button>' +
            '<button class="btn sm ghost" data-act="del-washer" data-id="' + w.id + '">' + icon('trash', 13) + 'Excluir</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Como o lavador acessa</h3></div>' +
        '<p class="small muted">Na tela de entrada, o lavador escolhe o próprio nome e digita o PIN. Ele vê apenas as ordens dele e as disponíveis na fila, inicia a lavagem e envia para o QA — sem acesso ao financeiro.</p>' +
      '</div>';
  }

  /* ---------------- alertas ---------------- */
  function alertasView() {
    const s = WF.state;
    const filter = ui.alertFilter || 'todos';
    let list = s.alerts.slice();
    if (filter === 'nao-lidos') list = list.filter((a) => !a.read);
    if (filter === 'criticos') list = list.filter((a) => a.level === 'danger' || a.level === 'warn');
    return pageHead('Central de alertas', 'Notificações inteligentes',
      WF.unreadAlerts() + ' não lido(s) · monitoramento de fila, QA, mensalidades e metas',
      '<button class="btn" data-act="enable-push">' + icon('bell', 15) + 'Ativar push</button>' +
      '<button class="btn ghost" data-act="mark-all">Marcar lidos</button>') +
      '<div class="seg" style="margin-bottom:12px">' +
        [['todos', 'Todos'], ['nao-lidos', 'Não lidos'], ['criticos', 'Críticos']].map((f) =>
          '<button data-act="alert-filter" data-filter="' + f[0] + '" class="' + (filter === f[0] ? 'active' : '') + '">' + f[1] + '</button>').join('') +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h3>Alertas</h3><button class="btn sm ghost" data-act="clear-alerts">Limpar</button></div>' +
        (list.length ? list.map((a) => alertRow(a)).join('') : '<div class="empty">Nenhum alerta neste filtro.</div>') +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>O que o sistema monitora</h3></div>' +
        '<div class="list">' +
          [['clock', 'Fila acima de 45 minutos'], ['shield', 'QA pendente e reprovações'], ['check', 'Veículo pronto sem retirada'],
           ['calendar', 'Mensalidades vencendo ou atrasadas'], ['sparkles', 'Meta diária de faturamento batida']].map((i) =>
            '<div class="list-row"><span class="a-icon" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand)">' + icon(i[0], 15) + '</span>' +
            '<div class="l-main"><div class="l-title" style="font-weight:600">' + i[1] + '</div></div></div>').join('') +
        '</div>' +
      '</div>';
  }

  /* ---------------- configurações ---------------- */
  function configView() {
    const s = WF.state;
    const settings = s.settings;
    let bytes = 0;
    try { bytes = new Blob([localStorage.getItem(WF.STORE_KEY) || '']).size; } catch (e) {}
    return pageHead('Sistema', 'Ajustes',
      'Dados salvos neste aparelho · backup recomendado toda semana',
      '<button class="btn" data-act="export-backup">' + icon('download', 15) + 'Exportar backup</button>') +
      '<div class="grid c2">' +
        '<form class="card" data-form="settings">' +
          '<div class="card-head"><h3>Dados do lavajato</h3></div>' +
          '<div class="form-grid two">' +
            '<div class="field" style="grid-column:1/-1"><label>Nome</label><input class="input" name="shopName" value="' + esc(settings.shopName) + '" required></div>' +
            '<div class="field"><label>Telefone</label><input class="input" name="phone" value="' + esc(settings.phone) + '"></div>' +
            '<div class="field"><label>Meta diária (R$)</label><input class="input" name="goalDaily" inputmode="decimal" value="' + settings.goalDaily + '"></div>' +
            '<div class="field" style="grid-column:1/-1"><label>Endereço</label><input class="input" name="address" value="' + esc(settings.address) + '"></div>' +
            '<div class="field"><label>Abertura</label><input class="input" name="openTime" type="time" value="' + esc(settings.openTime) + '"></div>' +
            '<div class="field"><label>Fechamento</label><input class="input" name="closeTime" type="time" value="' + esc(settings.closeTime) + '"></div>' +
          '</div>' +
          '<button class="btn primary block" style="margin-top:12px" type="submit">Salvar ajustes</button>' +
        '</form>' +
        '<div class="card">' +
          '<div class="card-head"><h3>Aparência e alertas</h3></div>' +
          '<div class="list">' +
            '<div class="list-row"><div class="l-main"><div class="l-title">Tema ' + (settings.theme === 'light' ? 'claro' : 'escuro') + '</div><div class="l-sub">Ajuste para o seu ambiente</div></div>' +
              '<button class="btn sm" data-act="theme">' + icon(settings.theme === 'light' ? 'moon' : 'sun', 13) + 'Alternar</button></div>' +
            '<div class="list-row"><div class="l-main"><div class="l-title">Notificações push</div><div class="l-sub">' + (settings.notifyPush ? 'ativas neste aparelho' : 'desativadas') + '</div></div>' +
              '<button class="btn sm" data-act="enable-push">' + icon('bell', 13) + (settings.notifyPush ? 'Testar' : 'Ativar') + '</button></div>' +
            '<div class="list-row"><div class="l-main"><div class="l-title">Instalar como app</div><div class="l-sub">' + (WF.isStandalone() ? 'já instalado' : 'atalho na tela inicial') + '</div></div>' +
              '<button class="btn sm" data-act="install">' + icon('install', 13) + 'Instalar</button></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:12px">' +
        '<div class="card-head"><h3>Serviços e preços</h3><span class="muted small">' + settings.services.length + ' serviços</span></div>' +
        '<form data-form="services">' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Serviço</th><th>Duração (min)</th><th>Preço (R$)</th><th></th></tr></thead><tbody>' +
          settings.services.map((sv) => '<tr>' +
            '<td><input class="input" name="name__' + sv.id + '" value="' + esc(sv.name) + '" style="min-width:160px"></td>' +
            '<td><input class="input" name="time__' + sv.id + '" inputmode="numeric" value="' + sv.duration + '" style="width:84px"></td>' +
            '<td><input class="input" name="price__' + sv.id + '" inputmode="decimal" value="' + sv.price + '" style="width:96px"></td>' +
            '<td><button type="button" class="btn sm ghost" data-act="del-service" data-id="' + sv.id + '">' + icon('trash', 13) + '</button></td>' +
          '</tr>').join('') +
          '</tbody></table></div>' +
          '<div class="form-actions"><button class="btn primary" type="submit">Salvar serviços</button>' +
          '<button class="btn" type="button" data-act="add-service">' + icon('plus', 14) + 'Adicionar</button></div>' +
        '</form>' +
      '</div>' +
      '<div class="card" style="margin-top:12px">' +
        '<div class="card-head"><h3>Backup e dados</h3><span class="muted small">' + (bytes ? (bytes / 1024).toFixed(1) + ' KB usados' : '') + '</span></div>' +
        '<div class="list">' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Exportar backup completo</div><div class="l-sub">frota, ordens, QA, financeiro e ajustes em um arquivo</div></div>' +
            '<button class="btn sm primary" data-act="export-backup">' + icon('download', 13) + 'Exportar</button></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Importar backup</div><div class="l-sub">restaurar ou mesclar dados de outro aparelho</div></div>' +
            '<button class="btn sm" data-act="import-backup">' + icon('upload', 13) + 'Importar</button></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Exportar relatórios CSV</div><div class="l-sub">ordens, despesas e equipe</div></div>' +
            '<div class="row" style="gap:4px;flex-wrap:wrap"><button class="btn sm ghost" data-act="export-orders">OS</button>' +
            '<button class="btn sm ghost" data-act="export-expenses">Despesas</button>' +
            '<button class="btn sm ghost" data-act="export-washers">Equipe</button></div></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title" style="color:var(--danger)">Recomeçar demonstração</div><div class="l-sub">apaga os dados atuais e recria o exemplo</div></div>' +
            '<button class="btn sm danger" data-act="reset">Resetar</button></div>' +
        '</div>' +
        '<div class="demo-hint" style="margin-top:12px">WASHFLOW PRO v' + WF.APP_VERSION + ' · dados 100% locais (localStorage). Faça backup antes de trocar de aparelho ou limpar o navegador.</div>' +
      '</div>';
  }

  /* ---------------- app do lavador ---------------- */
  function washerOrderCard(o) {
    const session = WF.state.session;
    const v = WF.vehicleById(o.vehicleId) || {};
    const mine = o.washerId === session.washerId;
    const w = WF.washerById(o.washerId);
    let actions = '';
    if (o.status === 'fila' && !o.washerId) actions = '<button class="btn primary sm" data-act="claim" data-id="' + o.id + '">' + icon('play', 13) + 'Assumir e iniciar</button>';
    else if (o.status === 'fila' && mine) actions = '<button class="btn primary sm" data-act="start" data-id="' + o.id + '">' + icon('play', 13) + 'Iniciar lavagem</button>';
    else if (o.status === 'lavagem' && mine) actions = '<button class="btn primary sm" data-act="sendqa" data-id="' + o.id + '">' + icon('shield', 13) + 'Finalizar e enviar ao QA</button>';
    else if (o.status === 'qa' && mine) actions = '<span class="pill qa" style="flex:1;justify-content:center">Aguardando conferência do supervisor</span>';
    else if (o.status === 'pronto' && mine) actions = '<span class="pill pronto" style="flex:1;justify-content:center">Aprovado — liberar para o cliente</span>';
    if (!actions) return '';
    return '<article class="os-card ' + (o.priority ? 'urgent' : '') + '">' +
      '<div class="os-top"><div style="min-width:0"><span class="plate">' + esc(o.plate) + '</span>' +
        '<div class="os-vehicle">' + esc(v.model || 'Veículo') + ' · ' + esc(v.color || '') + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' + statusPill(o.status) +
        (o.plan === 'mensal' ? '<span class="pill mensal">mensalista</span>' : '') + '</div></div>' +
      '<div class="os-services">' + esc(WF.serviceNames(o)) + '</div>' +
      (v.notes ? '<div class="small" style="margin-top:6px;color:var(--warn)">⚠ ' + esc(v.notes) + '</div>' : '') +
      '<div class="os-meta">' + (w ? '<span>' + esc(w.name === session.name ? 'Você' : w.name) + '</span><span>•</span>' : '') + osMetaTime(o) +
        '<span>•</span><span class="strong" style="color:var(--text)">' + (o.plan === 'mensal' ? 'plano' : WF.money(o.price)) + '</span></div>' +
      (o.status === 'lavagem' ? '<div style="margin-top:8px">' + progress(WF.orderProgress(o)) + '</div>' : '') +
      '<div class="os-actions">' + actions + '</div>' +
    '</article>';
  }

  function minimhasView() {
    const s = WF.state;
    const session = s.session;
    const w = WF.washerById(session.washerId);
    const d = WF.washerOfDay(session.washerId);
    const mine = s.orders.filter((o) => o.washerId === session.washerId && ['fila', 'lavagem', 'qa', 'pronto'].includes(o.status))
      .sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
    const free = s.orders.filter((o) => o.status === 'fila' && !o.washerId).sort((a, b) => a.createdAt - b.createdAt);
    return pageHead('App do lavador', 'Olá, ' + esc((w ? w.name : session.name).split(' ')[0]) + '!',
      'Suas lavagens do dia · ' + (w ? w.shift : '') + ' · ' + d.count + ' concluída(s)',
      '<button class="btn primary" data-act="scan">' + icon('camera', 15) + 'Ler placa</button>') +
      '<div class="kpis" style="margin-bottom:12px">' +
        '<div class="kpi k-ok"><div class="kpi-label">Lavagens hoje</div><div class="kpi-value">' + d.count + '</div><div class="kpi-foot">' + (d.avgTime ? 'tempo médio ' + WF.durMin(d.avgTime) : 'nenhuma ainda') + '</div></div>' +
        '<div class="kpi"><div class="kpi-label">Sua comissão</div><div class="kpi-value">' + WF.money(d.commission) + '</div><div class="kpi-foot">' + (w ? w.commission + '% por lavagem' : '') + '</div></div>' +
        '<div class="kpi k-purple"><div class="kpi-label">Nota QA</div><div class="kpi-value">' + (d.avgScore == null ? '—' : d.avgScore) + '<small>/100</small></div><div class="kpi-foot">aprovação a partir de ' + (s.settings.qaMin || 80) + '</div></div>' +
        '<div class="kpi k-warn"><div class="kpi-label">Em andamento</div><div class="kpi-value">' + mine.filter((o) => o.status === 'lavagem').length + '</div><div class="kpi-foot">' + mine.filter((o) => o.status === 'qa').length + ' no QA</div></div>' +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>Minhas ordens</h3><span class="muted small">' + mine.length + ' ativa(s)</span></div>' +
        (mine.length ? mine.map(washerOrderCard).join('') : '<div class="empty">Nenhuma ordem sua agora. Assuma uma da fila abaixo.</div>') +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Fila disponível</h3><span class="muted small">' + free.length + ' sem lavador</span></div>' +
        (free.length ? free.map(washerOrderCard).join('') : '<div class="empty">Toda a fila já tem responsável.</div>') +
      '</div>';
  }

  function ganhosView() {
    const s = WF.state;
    const session = s.session;
    const w = WF.washerById(session.washerId);
    const commission = w ? w.commission : 0;
    const today = WF.washerOfDay(session.washerId);
    const weekStart = WF.startOfDay(Date.now()) - 6 * WF.DAY;
    const week = s.orders.filter((o) => o.washerId === session.washerId && o.status === 'entregue' && o.deliveredAt >= weekStart);
    const base = (o) => (o.listPrice != null ? o.listPrice : o.price) || 0;
    const weekCommission = week.reduce((a, o) => a + (base(o) * commission) / 100, 0);
    const monthStart = WF.periodRange('mes').from;
    const month = s.orders.filter((o) => o.washerId === session.washerId && o.status === 'entregue' && o.deliveredAt >= monthStart);
    const monthCommission = month.reduce((a, o) => a + (base(o) * commission) / 100, 0);
    return pageHead('Meus ganhos', 'Comissões e produtividade',
      (w ? w.commission + '% de comissão' : '') + ' · cálculo automático por lavagem entregue') +
      '<div class="kpis">' +
        '<div class="kpi k-ok"><div class="kpi-label">Hoje</div><div class="kpi-value">' + WF.money(today.commission) + '</div><div class="kpi-foot">' + today.count + ' lavagem(ns)</div></div>' +
        '<div class="kpi"><div class="kpi-label">Últimos 7 dias</div><div class="kpi-value">' + WF.money(weekCommission) + '</div><div class="kpi-foot">' + week.length + ' lavagem(ns)</div></div>' +
        '<div class="kpi k-purple"><div class="kpi-label">Este mês</div><div class="kpi-value">' + WF.money(monthCommission) + '</div><div class="kpi-foot">' + month.length + ' lavagem(ns)</div></div>' +
        '<div class="kpi k-warn"><div class="kpi-label">Nota QA média</div><div class="kpi-value">' + (today.avgScore == null ? '—' : today.avgScore) + '</div><div class="kpi-foot">qualidade do seu trabalho</div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Lavagens entregues</h3><span class="muted small">7 dias</span></div>' +
        (week.length ? '<div class="list">' + week.sort((a, b) => b.deliveredAt - a.deliveredAt).map((o) => {
          const v = WF.vehicleById(o.vehicleId) || {};
          return '<div class="list-row"><div class="l-main"><div class="l-title"><span class="plate" style="font-size:.74rem">' + esc(o.plate) + '</span> ' + esc(v.model || '') + '</div>' +
            '<div class="l-sub">' + esc(WF.serviceNames(o)) + ' · ' + WF.fmtDateTime(o.deliveredAt) + '</div></div>' +
            '<div class="right"><div class="strong">' + WF.money((base(o) * commission) / 100) + '</div><div class="tiny muted">de ' + WF.money(base(o)) + '</div></div></div>';
        }).join('') + '</div>' : '<div class="empty">Nenhuma lavagem entregue nos últimos 7 dias.</div>') +
      '</div>';
  }

  function perfilView() {
    const s = WF.state;
    const session = s.session;
    const w = WF.washerById(session.washerId);
    if (!w) return pageHead('Perfil', 'Perfil indisponível', '');
    const d = WF.washerOfDay(w.id);
    return pageHead('Perfil', esc(w.name), 'Lavador · ' + esc(w.shift)) +
      '<div class="card">' +
        '<div class="row" style="gap:14px"><span class="avatar" style="background:' + WF.colorFor(w.name) + ';width:58px;height:58px;border-radius:16px;font-size:1.2rem">' + esc(WF.initials(w.name)) + '</span>' +
        '<div><h2>' + esc(w.name) + '</h2><div class="small muted">' + esc(w.phone || 'sem telefone') + '</div></div></div>' +
        '<div class="divider"></div>' +
        '<div class="list">' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Comissão</div><div class="l-sub">por lavagem entregue</div></div><div class="strong">' + w.commission + '%</div></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Lavagens hoje</div><div class="l-sub">nota QA média ' + (d.avgScore == null ? '—' : d.avgScore) + '</div></div><div class="strong">' + d.count + '</div></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title">PIN de acesso</div><div class="l-sub">peça ao administrador para alterar</div></div><div class="strong mono">' + esc(w.pin) + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:12px"><div class="card-head"><h3>Ajustes do app</h3></div>' +
        '<div class="list">' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Tema</div><div class="l-sub">' + (s.settings.theme === 'light' ? 'claro' : 'escuro') + '</div></div>' +
            '<button class="btn sm" data-act="theme">Alternar</button></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Notificações</div><div class="l-sub">' + (s.settings.notifyPush ? 'ativas' : 'desativadas') + '</div></div>' +
            '<button class="btn sm" data-act="enable-push">Ativar</button></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title">Instalar app</div><div class="l-sub">' + (WF.isStandalone() ? 'já instalado' : 'atalho na tela inicial') + '</div></div>' +
            '<button class="btn sm" data-act="install">Instalar</button></div>' +
          '<div class="list-row"><div class="l-main"><div class="l-title" style="color:var(--danger)">Sair</div><div class="l-sub">encerrar sessão neste aparelho</div></div>' +
            '<button class="btn sm danger" data-act="logout">Sair</button></div>' +
        '</div>' +
      '</div>';
  }

  /* ---------------- modais ---------------- */
  function openOrderModal(vehicleId) {
    const s = WF.state;
    if (!s.vehicles.length) {
      toast('Cadastre um veículo antes de abrir uma ordem.', 'err');
      openVehicleModal();
      return;
    }
    const vehicles = s.vehicles.slice().sort((a, b) => (a.customer || '').localeCompare(b.customer || ''));
    const washerOpts = '<option value="auto">Automático (fila inteligente)</option>' +
      '<option value="">Sem lavador agora</option>' +
      WF.washers(true).map((w) => '<option value="' + w.id + '">' + esc(w.name) + ' · ' + WF.washerLoad(w.id) + ' em andamento</option>').join('');
    const body =
      '<form data-form="order" id="order-form">' +
        '<div class="field"><label>Veículo</label><select class="input" name="vehicleId" required>' +
          vehicles.map((v) => '<option value="' + v.id + '"' + (v.id === vehicleId ? ' selected' : '') + '>' + esc(v.plate) + ' — ' + esc(v.model) + ' · ' + esc(v.customer || '') + (v.plan === 'mensal' ? ' (mensalista)' : '') + '</option>').join('') +
        '</select></div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:6px">' +
          '<button type="button" class="btn sm ghost" data-act="scan">' + icon('camera', 13) + 'Ler placa</button>' +
          '<button type="button" class="btn sm ghost" data-act="new-vehicle">' + icon('plus', 13) + 'Novo veículo</button>' +
        '</div>' +
        '<div class="section-title">Serviços</div>' +
        '<div class="form-grid two" style="gap:7px">' + s.settings.services.map((sv) =>
          '<label class="check"><input type="checkbox" name="services" value="' + sv.id + '">' +
          '<span style="flex:1"><b>' + esc(sv.name) + '</b><br><span class="small muted">' + WF.durMin(sv.duration) + ' · ' + WF.money(sv.price) + '</span></span></label>').join('') +
        '</div>' +
        '<div class="form-grid two" style="margin-top:12px">' +
          '<div class="field"><label>Lavador</label><select class="input" name="washerId">' + washerOpts + '</select></div>' +
          '<div class="field"><label>Prioridade</label>' +
            '<label class="switch" style="height:42px;border:1px solid var(--line-strong);border-radius:11px;padding:0 12px;background:var(--bg-soft)">' +
            '<input type="checkbox" name="priority"><span class="track"></span><span>Furar fila</span></label></div>' +
          '<div class="field" style="grid-column:1/-1"><label>Observações</label>' +
            '<textarea class="input" name="notes" placeholder="Ex.: não usar cera, cliente tem pressa..."></textarea></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn ghost" type="button" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" type="submit">' + icon('play', 15) + 'Abrir lavagem</button></div>' +
      '</form>';
    openModal('Nova lavagem', body);
  }

  function openVehicleModal(vehicle, prefillPlate) {
    const v = vehicle || {};
    const body =
      '<form data-form="vehicle">' +
        (v.id ? '<input type="hidden" name="id" value="' + v.id + '">' : '') +
        '<div class="form-grid two">' +
          '<div class="field"><label>Placa</label><input class="input mono" name="plate" id="vehicle-plate" maxlength="7" placeholder="ABC1D23" value="' + esc(v.plate || prefillPlate || '') + '" required></div>' +
          '<div class="field"><label>Tipo</label><select class="input" name="type">' +
            ['Hatch', 'Sedã', 'SUV', 'Picape', 'Moto', 'Van', 'Caminhão'].map((t) => '<option' + (v.type === t ? ' selected' : '') + '>' + t + '</option>').join('') +
          '</select></div>' +
          '<div class="field"><label>Modelo</label><input class="input" name="model" placeholder="Ex.: Corolla" value="' + esc(v.model || '') + '" required></div>' +
          '<div class="field"><label>Cor</label><input class="input" name="color" placeholder="Ex.: Prata" value="' + esc(v.color || '') + '"></div>' +
          '<div class="field"><label>Cliente</label><input class="input" name="customer" placeholder="Nome do cliente" value="' + esc(v.customer || '') + '"></div>' +
          '<div class="field"><label>Telefone</label><input class="input" name="phone" placeholder="(11) 90000-0000" value="' + esc(v.phone || '') + '"></div>' +
          '<div class="field"><label>Plano</label><select class="input" name="plan">' +
            '<option value="avulso"' + (v.plan !== 'mensal' ? ' selected' : '') + '>Avulso</option>' +
            '<option value="mensal"' + (v.plan === 'mensal' ? ' selected' : '') + '>Mensalista</option></select></div>' +
          '<div class="field"><label>Vencimento do plano</label><input class="input" type="date" name="planDue" value="' + (v.planDue ? new Date(v.planDue).toISOString().slice(0, 10) : '') + '"></div>' +
          '<div class="field" style="grid-column:1/-1"><label>Observações</label><textarea class="input" name="notes" placeholder="Cuidados especiais com este veículo">' + esc(v.notes || '') + '</textarea></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn ghost" type="button" data-act="close-modal">Cancelar</button>' +
          '<button class="btn primary" type="submit">' + icon('check', 15) + (v.id ? 'Salvar veículo' : 'Cadastrar veículo') + '</button></div>' +
      '</form>';
    openModal(v.id ? 'Editar veículo' : 'Novo veículo', body);
  }

  function openWasherModal(w) {
    w = w || {};
    const body =
      '<form data-form="washer">' +
        (w.id ? '<input type="hidden" name="id" value="' + w.id + '">' : '') +
        '<div class="form-grid two">' +
          '<div class="field" style="grid-column:1/-1"><label>Nome completo</label><input class="input" name="name" value="' + esc(w.name || '') + '" required></div>' +
          '<div class="field"><label>Telefone</label><input class="input" name="phone" value="' + esc(w.phone || '') + '" placeholder="(11) 90000-0000"></div>' +
          '<div class="field"><label>PIN de acesso (4 a 6 dígitos)</label><input class="input mono" name="pin" inputmode="numeric" maxlength="6" value="' + esc(w.pin || '') + '" required></div>' +
          '<div class="field"><label>Comissão (%)</label><input class="input" name="commission" inputmode="decimal" value="' + (w.commission != null ? w.commission : 25) + '"></div>' +
          '<div class="field"><label>Turno</label><select class="input" name="shift">' +
            ['Manhã', 'Tarde', 'Noite', 'Integral'].map((t) => '<option' + (w.shift === t ? ' selected' : '') + '>' + t + '</option>').join('') +
          '</select></div>' +
          '<div class="field" style="grid-column:1/-1"><label class="switch"><input type="checkbox" name="active"' + (w.active !== false ? ' checked' : '') + '><span class="track"></span><span>Lavador ativo (aparece na fila e no login)</span></label></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn ghost" type="button" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" type="submit">' + icon('check', 15) + 'Salvar lavador</button></div>' +
      '</form>';
    openModal(w.id ? 'Editar lavador' : 'Novo lavador', body);
  }

  function openQA(orderId) {
    const o = WF.orderById(orderId);
    if (!o) return;
    ui.qaDraft = { orderId, items: {}, notes: '', photos: (o.photos || []).slice(0, 3) };
    renderQAModal();
  }
  function renderQAModal() {
    const d = ui.qaDraft;
    if (!d) return;
    const o = WF.orderById(d.orderId);
    if (!o) { closeModal(); return; }
    const v = WF.vehicleById(o.vehicleId) || {};
    const w = WF.washerById(o.washerId);
    const score = WF.qaScore(d.items);
    const min = WF.state.settings.qaMin || 80;
    const body =
      '<div class="row" style="justify-content:space-between;margin-bottom:4px">' +
        '<div><span class="plate">' + esc(o.plate) + '</span> <span class="small muted">' + esc(v.model || '') + '</span></div>' +
        '<div class="right"><div class="strong" id="qa-score" style="font-size:1.3rem;color:' + (score >= min ? 'var(--ok)' : 'var(--danger)') + '">' + score + '<span class="small muted">/100</span></div>' +
        '<div class="tiny muted">mínimo ' + min + '</div></div>' +
      '</div>' +
      '<div class="small muted" style="margin-bottom:12px">' + esc(WF.serviceNames(o)) + ' · lavador ' + esc(w ? w.name : '—') + ' · ' + (o.qa.attempts ? '<b style="color:var(--warn)">retrabalho #' + o.qa.attempts + '</b>' : 'primeira conferência') + '</div>' +
      '<form data-form="qa">' +
        '<div class="qa-checklist">' + WF.CHECKLIST.map((c) =>
          '<label class="qa-item ' + (d.items[c.id] ? 'checked' : '') + '" data-qa-item="' + c.id + '">' +
            '<input type="checkbox" data-act="qa-toggle" data-id="' + c.id + '"' + (d.items[c.id] ? ' checked' : '') + '>' +
            '<span style="flex:1">' + esc(c.label) + '</span>' +
            '<span class="pill" style="font-size:.6rem">peso ' + c.weight + '</span>' +
          '</label>').join('') + '</div>' +
        '<div class="field" style="margin-top:12px"><label>Observações do QA</label>' +
          '<textarea class="input" name="notes" placeholder="Ex.: mancha no banco traseiro, refazer cera...">' + esc(d.notes || '') + '</textarea></div>' +
        '<div class="section-title">Fotos de comprovação (até 3)</div>' +
        '<div class="photo-grid">' + d.photos.map((p, i) =>
          '<div style="position:relative"><img src="' + p + '" alt="Foto de QA"><button type="button" class="btn sm danger" data-act="photo-remove" data-idx="' + i + '" style="position:absolute;top:4px;right:4px;min-height:24px;padding:0 6px">✕</button></div>').join('') +
          (d.photos.length < 3 ? '<button type="button" class="add-photo" data-act="photo-add">' + icon('camera', 18) + '<span>Adicionar foto</span></button>' : '') +
        '</div>' +
        '<div class="form-actions">' +
          '<button class="btn danger" type="button" data-act="qa-reject" data-id="' + o.id + '">Reprovar e retrabalhar</button>' +
          '<button class="btn ok" type="submit">' + icon('check', 15) + 'Aprovar e liberar</button>' +
        '</div>' +
      '</form>';
    openModal('Conferência de qualidade', body, '', {});
  }

  function openDeliver(orderId) {
    const o = WF.orderById(orderId);
    if (!o) return;
    const v = WF.vehicleById(o.vehicleId) || {};
    const body =
      '<form data-form="deliver">' +
        '<input type="hidden" name="orderId" value="' + o.id + '">' +
        '<div class="between" style="padding:12px;border-radius:12px;background:var(--panel-2);border:1px solid var(--line);margin-bottom:12px">' +
          '<div><span class="plate">' + esc(o.plate) + '</span><div class="small muted" style="margin-top:4px">' + esc(v.model || '') + ' · ' + esc(WF.serviceNames(o)) + '</div></div>' +
          '<div class="right"><div class="strong" style="font-size:1.2rem">' + (o.plan === 'mensal' ? 'Plano' : WF.money(o.price)) + '</div>' +
          '<div class="tiny muted">' + (o.plan === 'mensal' ? 'mensalista ativo' : 'a receber') + '</div></div>' +
        '</div>' +
        '<div class="field"><label>Forma de pagamento</label><select class="input" name="method">' +
          WF.PAYMENTS.map((p) => '<option value="' + p.id + '"' + (o.payment.method === p.id ? ' selected' : '') + '>' + p.label + '</option>').join('') +
        '</select></div>' +
        '<div class="field" style="margin-top:10px"><label>Observação (opcional)</label><input class="input" name="note" placeholder="Ex.: pago com desconto de R$ 10"></div>' +
        '<div class="form-actions"><button class="btn ghost" type="button" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" type="submit">' + icon('check', 15) + 'Confirmar entrega</button></div>' +
      '</form>';
    openModal('Entregar veículo', body);
  }

  function openAssign(orderId) {
    const o = WF.orderById(orderId);
    const body = '<p class="small muted" style="margin-bottom:10px">' + esc(o.plate) + ' — escolha o responsável pela lavagem:</p>' +
      '<div class="col" style="gap:7px">' + WF.washers(true).map((w) => {
        const load = WF.washerLoad(w.id);
        return '<button class="btn block ' + (o.washerId === w.id ? 'primary' : '') + '" data-act="set-washer" data-id="' + o.id + '" data-wid="' + w.id + '" style="justify-content:space-between">' +
          '<span>' + esc(w.name) + '</span><span class="small">' + load + ' ativa(s)</span></button>';
      }).join('') +
      '<button class="btn block ghost" data-act="set-washer" data-id="' + o.id + '" data-wid="">Remover atribuição</button></div>';
    openModal('Atribuir lavador', body);
  }

  function openExpenseModal() {
    const body =
      '<form data-form="expense">' +
        '<div class="form-grid two">' +
          '<div class="field" style="grid-column:1/-1"><label>Descrição</label><input class="input" name="description" placeholder="Ex.: shampoo automotivo" required></div>' +
          '<div class="field"><label>Valor (R$)</label><input class="input" name="amount" inputmode="decimal" placeholder="0,00" required></div>' +
          '<div class="field"><label>Data</label><input class="input" type="date" name="date" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
          '<div class="field" style="grid-column:1/-1"><label>Categoria</label><select class="input" name="category">' +
            WF.EXPENSE_CATEGORIES.map((c) => '<option>' + c + '</option>').join('') + '</select></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn ghost" type="button" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" type="submit">Lançar despesa</button></div>' +
      '</form>';
    openModal('Nova despesa', body);
  }

  function openServiceModal() {
    const body =
      '<form data-form="service">' +
        '<div class="field"><label>Nome do serviço</label><input class="input" name="name" placeholder="Ex.: Lavagem de motor" required></div>' +
        '<div class="form-grid two" style="margin-top:10px">' +
          '<div class="field"><label>Duração (min)</label><input class="input" name="duration" inputmode="numeric" value="45" required></div>' +
          '<div class="field"><label>Preço (R$)</label><input class="input" name="price" inputmode="decimal" value="80" required></div>' +
        '</div>' +
        '<div class="form-actions"><button class="btn ghost" type="button" data-act="close-modal">Cancelar</button>' +
        '<button class="btn primary" type="submit">Adicionar serviço</button></div>' +
      '</form>';
    openModal('Novo serviço', body);
  }

  /* ---------------- câmera / leitor de placas ---------------- */
  function stopCamera() {
    if (ui.scanStream) {
      ui.scanStream.getTracks().forEach((t) => t.stop());
      ui.scanStream = null;
    }
  }

  function openScanner() {
    const body =
      '<div class="scan-frame">' +
        '<video id="scan-video" class="scan-video" autoplay playsinline muted></video>' +
        '<img id="scan-shot" class="scan-video hide" alt="Foto da placa">' +
        '<div class="plate-guide" id="plate-guide"></div>' +
      '</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="scan-capture" style="flex:1">' + icon('camera', 15) + 'Capturar placa</button>' +
        '<label class="btn" style="flex:1;justify-content:center;cursor:pointer">' + icon('image', 15) + 'Galeria' +
          '<input type="file" accept="image/*" id="scan-file" hidden></label>' +
      '</div>' +
      '<div class="scan-status" id="scan-status">Aponte a câmera para a placa do veículo.</div>' +
      '<div class="section-title">Ou digite a placa</div>' +
      '<div class="row" style="gap:8px">' +
        '<input class="input mono" id="scan-manual" placeholder="ABC1D23" maxlength="7" style="text-transform:uppercase;flex:1">' +
        '<button class="btn" data-act="scan-apply">Usar</button>' +
      '</div>' +
      '<div class="form-actions"><button class="btn ghost block" data-act="close-modal">Fechar</button></div>';
    openModal('Leitor de placas', body, '', { onOpen: startScanCamera });
    const fileInput = document.getElementById('scan-file');
    if (fileInput) fileInput.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const dataUrl = await compressImage(f, 1100, 0.8);
      if (!dataUrl) return;
      showShot(dataUrl);
      runOCR(dataUrl);
    });
  }

  async function startScanCamera() {
    const video = document.getElementById('scan-video');
    const status = document.getElementById('scan-status');
    if (!video) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = 'Câmera indisponível neste navegador. Digite a placa ou use a galeria.';
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      ui.scanStream = stream;
      video.srcObject = stream;
      video.play().catch(() => {});
      if (status) status.textContent = 'Aponte a câmera para a placa. Toque em "Capturar placa".';
    } catch (e) {
      if (status) status.textContent = 'Não foi possível abrir a câmera (' + (e.name || 'erro') + '). Use a galeria ou digite a placa.';
    }
  }

  function showShot(dataUrl) {
    const video = document.getElementById('scan-video');
    const shot = document.getElementById('scan-shot');
    const guide = document.getElementById('plate-guide');
    stopCamera();
    if (video) video.classList.add('hide');
    if (guide) guide.classList.add('hide');
    if (shot) { shot.src = dataUrl; shot.classList.remove('hide'); }
  }

  function setScanStatus(msg) {
    const el = document.getElementById('scan-status');
    if (el) el.textContent = msg;
  }

  function captureFrame() {
    const video = document.getElementById('scan-video');
    if (!video || !video.videoWidth) { toast('A câmera ainda não está pronta. Aguarde um instante.', 'err'); return null; }
    const canvas = document.createElement('canvas');
    const w = Math.min(video.videoWidth, 1280);
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    // recorte central aproximado da placa para melhorar o OCR
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    showShot(dataUrl);
    return dataUrl;
  }

  function extractPlate(text) {
    const clean = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const mercosul = clean.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}/);
    if (mercosul) return mercosul[0];
    const old = clean.match(/[A-Z]{3}[0-9]{4}/);
    if (old) return old[0];
    return '';
  }

  async function runOCR(dataUrl) {
    setScanStatus('Lendo a placa... isso pode levar alguns segundos.');
    try {
      if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      if (!window.Tesseract) throw new Error('leitor offline');
      setScanStatus('Processando imagem...');
      const worker = await window.Tesseract.createWorker('eng');
      await worker.setParameters({ tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' });
      const res = await worker.recognize(dataUrl);
      await worker.terminate();
      const plate = extractPlate(res && res.data && res.data.text);
      const manual = document.getElementById('scan-manual');
      if (plate) {
        if (manual) manual.value = plate;
        const found = WF.vehicleByPlate(plate);
        setScanStatus('Placa detectada: ' + plate + (found ? ' — veículo ' + found.model + ' (' + found.customer + ')' : ' — não cadastrado ainda') + '. Confirme em "Usar".');
      } else {
        setScanStatus('Não consegui ler com segurança. Ajuste a luz, aproxime a câmera ou digite a placa.');
      }
    } catch (e) {
      setScanStatus('Leitura automática indisponível agora. Digite a placa ou use a galeria.');
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error('falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }

  function applyPlateInput() {
    const input = document.getElementById('scan-manual');
    const plate = WF.normalizePlate((input && input.value) || '');
    if (!WF.plateValid(plate)) { toast('Placa inválida. Use ABC1D23 ou ABC1234.', 'err'); return; }
    const found = WF.vehicleByPlate(plate);
    closeModal();
    if (found) {
      toast('Veículo encontrado: ' + found.model + ' — ' + (found.customer || ''), 'ok');
      openOrderModal(found.id);
    } else {
      toast('Placa ' + plate + ' nova. Cadastre o veículo para abrir a lavagem.', '');
      openVehicleModal(null, plate);
    }
  }

  function openAccountModal() {
    const s = WF.state;
    const session = s.session;
    const isWasher = session.role === 'washer';
    const date = new Date().toLocaleDateString('pt-BR');
    openModal('Sua conta',
      '<div class="between" style="padding:12px;border-radius:12px;background:var(--panel-2);border:1px solid var(--line)">' +
        '<div class="row"><span class="avatar" style="background:' + WF.colorFor(session.name || 'W') + ';width:40px;height:40px;border-radius:12px">' + esc(WF.initials(session.name)) + '</span>' +
        '<div><div class="strong">' + esc(isWasher ? (WF.washerById(session.washerId) || {}).name || session.name : session.name) + '</div>' +
        '<div class="small muted">' + (isWasher ? 'Lavador' : 'Administrador') + ' · ' + date + '</div></div></div>' +
      '</div>' +
      '<div class="list" style="margin-top:10px">' +
        '<div class="list-row"><div class="l-main"><div class="l-title">Ler placa pela câmera</div><div class="l-sub">abrir leitor inteligente</div></div><button class="btn sm" data-act="scan">Abrir</button></div>' +
        '<div class="list-row"><div class="l-main"><div class="l-title">Tema ' + (s.settings.theme === 'light' ? 'claro' : 'escuro') + '</div><div class="l-sub">alternar aparência</div></div><button class="btn sm" data-act="theme">Alternar</button></div>' +
        (isWasher ? '' : '<div class="list-row"><div class="l-main"><div class="l-title">Backup completo</div><div class="l-sub">exportar todos os dados</div></div><button class="btn sm" data-act="export-backup">Exportar</button></div>') +
        '<div class="list-row"><div class="l-main"><div class="l-title" style="color:var(--danger)">Sair da conta</div><div class="l-sub">voltar para a tela de entrada</div></div><button class="btn sm danger" data-act="logout">Sair</button></div>' +
      '</div>');
  }

  function openMobileMenu() {
    const s = WF.state;
    const items = ADMIN_NAV.map((i) => '<a class="btn block" href="#/' + i.id + '" style="justify-content:space-between;margin-bottom:6px">' +
      '<span class="row" style="gap:8px">' + icon(i.icon, 16) + i.label + '</span>' + icon('arrow', 14) + '</a>').join('');
    openModal('Menu',
      items +
      '<div class="divider"></div>' +
      '<div class="row wrap">' +
        '<button class="btn" data-act="install">' + icon('install', 14) + 'Instalar</button>' +
        '<button class="btn" data-act="export-backup">' + icon('download', 14) + 'Backup</button>' +
        '<button class="btn danger" data-act="logout">' + icon('logout', 14) + 'Sair</button>' +
      '</div>');
  }

  /* ---------------- imagens ---------------- */
  function compressImage(file, max, quality) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, (max || 900) / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality || 0.7));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  /* ---------------- ações ---------------- */
  const routeOf = () => (location.hash || '').replace(/^#\/?/, '');

  function render() {
    if (!WF.state) return;
    WF.applyTheme();
    const session = WF.state.session;
    if (!session) {
      app.innerHTML = loginView();
      return;
    }
    const isWasher = session.role === 'washer';
    let view = routeOf();
    const allowed = isWasher ? WASHER_NAV.map((i) => i.id) : ADMIN_NAV.map((i) => i.id);
    if (!allowed.includes(view)) {
      view = isWasher ? 'minhas' : 'dashboard';
      history.replaceState(null, '', '#/' + view);
    }
    if (Date.now() - ui.lastScan > 15000) { ui.lastScan = Date.now(); try { WF.scanAlerts(); } catch (e) {} }
    const views = {
      dashboard: dashboardView, fila: filaView, frota: frotaView, qa: qaView,
      financeiro: financeView, lavadores: lavadoresView, alertas: alertasView, config: configView,
      minhas: minimhasView, ganhos: ganhosView, perfil: perfilView
    };
    const content = (views[view] || dashboardView)();
    app.innerHTML = shell(view, content);
    const search = document.getElementById('fleet-search');
    if (search) {
      search.addEventListener('input', (e) => {
        ui.fleetSearch = e.target.value;
        const pos = e.target.selectionStart;
        render();
        const next = document.getElementById('fleet-search');
        if (next) { next.focus(); try { next.setSelectionRange(pos, pos); } catch (err) {} }
      });
    }
  }

  function handleAction(act, el) {
    const id = el.dataset.id;
    switch (act) {
      case 'close-modal': closeModal(); break;
      case 'login-tab': ui.loginTab = el.dataset.tab; render(); break;
      case 'theme':
        WF.state.settings.theme = WF.state.settings.theme === 'light' ? 'dark' : 'light';
        WF.save(); WF.applyTheme(); render();
        break;
      case 'logout':
        closeModal(); ui.loginTab = 'admin'; WF.logout(); location.hash = ''; render(); toast('Sessão encerrada.'); break;
      case 'account': openAccountModal(); break;
      case 'menu': openMobileMenu(); break;
      case 'open-order': openOrderModal(); break;
      case 'order-for': closeModal(); openOrderModal(id); break;
      case 'new-vehicle': closeModal(); openVehicleModal(); break;
      case 'edit-vehicle': openVehicleModal(WF.vehicleById(id)); break;
      case 'del-vehicle':
        confirmModal('Excluir veículo', 'Remover o veículo e o histórico dele? Esta ação não pode ser desfeita.',
          'confirm-del-vehicle', 'Excluir', id, true);
        break;
      case 'renew': {
        const r = WF.renewPlan(id, 30);
        if (r.ok) { toast('Plano renovado por 30 dias.', 'ok'); render(); }
        break;
      }
      case 'new-washer': openWasherModal(); break;
      case 'edit-washer': openWasherModal(WF.washerById(id)); break;
      case 'del-washer':
        confirmModal('Excluir lavador', 'O histórico de lavagens é mantido, mas as ordens abertas dele ficarão sem responsável.',
          'confirm-del-washer', 'Excluir', id, true);
        break;
      case 'new-expense': openExpenseModal(); break;
      case 'del-expense':
        WF.deleteExpense(id); toast('Despesa removida.', 'ok'); render(); break;
      case 'add-service': openServiceModal(); break;
      case 'del-service': {
        const used = WF.state.orders.some((o) => (o.serviceIds || []).includes(id));
        if (used) { toast('Este serviço já foi usado em ordens. Edite o preço em vez de excluir.', 'err'); break; }
        WF.state.settings.services = WF.state.settings.services.filter((s) => s.id !== id);
        WF.save(); render(); toast('Serviço removido.', 'ok');
        break;
      }
      case 'start': {
        const r = WF.startOrder(id);
        if (r.ok) { toast('Lavagem iniciada' + (r.order.washerId ? ' com ' + (WF.washerById(r.order.washerId) || {}).name.split(' ')[0] : '') + '.', 'ok'); render(); }
        break;
      }
      case 'sendqa': {
        const r = WF.sendToQA(id);
        if (r.ok) { toast('Enviado para conferência de qualidade.', 'ok'); render(); }
        else toast(r.error, 'err');
        break;
      }
      case 'claim': {
        const o = WF.orderById(id);
        WF.assignWasher(id, WF.state.session.washerId);
        const r = WF.startOrder(id);
        if (r.ok) { toast('Você assumiu ' + (o ? o.plate : 'a ordem') + '.', 'ok'); render(); }
        break;
      }
      case 'assign': openAssign(id); break;
      case 'set-washer': {
        WF.assignWasher(id, el.dataset.wid || null);
        closeModal(); render(); toast('Responsável atualizado.', 'ok'); break;
      }
      case 'priority': {
        const r = WF.togglePriority(id);
        if (r.ok) toast(r.order.priority ? 'Ordem marcada como prioridade.' : 'Prioridade removida.', 'ok');
        render();
        break;
      }
      case 'qa': openQA(id); break;
      case 'qa-toggle': {
        if (!ui.qaDraft) break;
        ui.qaDraft.items[id] = el.checked;
        const wrap = el.closest('.qa-item');
        if (wrap) wrap.classList.toggle('checked', el.checked);
        const score = WF.qaScore(ui.qaDraft.items);
        const min = WF.state.settings.qaMin || 80;
        const scoreEl = document.getElementById('qa-score');
        if (scoreEl) { scoreEl.innerHTML = score + '<span class="small muted">/100</span>'; scoreEl.style.color = score >= min ? 'var(--ok)' : 'var(--danger)'; }
        break;
      }
      case 'qa-reject': {
        if (!ui.qaDraft) break;
        const d = ui.qaDraft;
        const notesEl = document.querySelector('form[data-form="qa"] textarea[name="notes"]');
        d.notes = notesEl ? notesEl.value : '';
        if (!notesEl || !notesEl.value.trim()) { toast('Descreva o motivo da reprovação para o lavador.', 'err'); if (notesEl) notesEl.focus(); break; }
        const r = WF.submitQA(d.orderId, { items: d.items, notes: d.notes, photos: d.photos });
        if (r.ok) {
          closeModal(); ui.qaDraft = null; render();
          toast('Lavagem reprovada (nota ' + r.score + '). Voltou para retrabalho.', 'err');
        }
        break;
      }
      case 'photo-add': {
        const input = document.getElementById('file-photo');
        if (!input) break;
        input.value = '';
        input.onchange = async () => {
          const f = input.files && input.files[0];
          if (!f || !ui.qaDraft) return;
          const dataUrl = await compressImage(f, 720, 0.55);
          if (!dataUrl) { toast('Não foi possível usar esta imagem.', 'err'); return; }
          ui.qaDraft.photos = ui.qaDraft.photos.concat([dataUrl]).slice(0, 3);
          renderQAModal();
        };
        input.click();
        break;
      }
      case 'photo-remove': {
        if (!ui.qaDraft) break;
        const idx = Number(el.dataset.idx);
        ui.qaDraft.photos.splice(idx, 1);
        renderQAModal();
        break;
      }
      case 'deliver': openDeliver(id); break;
      case 'scan': closeModal(); openScanner(); break;
      case 'scan-capture': {
        const shot = captureFrame();
        if (shot) runOCR(shot);
        break;
      }
      case 'scan-apply': applyPlateInput(); break;
      case 'mark-read': WF.markAlertRead(id); render(); break;
      case 'mark-all': WF.markAllAlertsRead(); render(); toast('Todos os alertas foram marcados como lidos.', 'ok'); break;
      case 'clear-alerts': WF.clearAlerts(); render(); break;
      case 'enable-push':
        WF.requestPush().then((r) => {
          if (r.ok) { toast('Notificações ativadas neste aparelho.', 'ok'); render(); }
          else toast(r.error, 'err');
        });
        break;
      case 'install': installApp(); break;
      case 'export-backup': {
        const name = 'washflow-backup-' + WF.todayISO() + '.json';
        download(name, WF.exportBackupString(), 'application/json');
        toast('Backup exportado: ' + name, 'ok');
        break;
      }
      case 'import-backup': {
        const input = document.getElementById('file-import');
        if (!input) break;
        input.value = '';
        input.onchange = () => {
          const f = input.files && input.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            const text = String(reader.result || '');
            let preview;
            try { preview = JSON.parse(text); } catch (e) { toast('Arquivo inválido: não é um backup JSON.', 'err'); return; }
            const d = preview && preview.data ? preview.data : preview;
            if (!d || !Array.isArray(d.vehicles) || !Array.isArray(d.orders)) { toast('Backup incompatível com o WASHFLOW PRO.', 'err'); return; }
            ui.pendingImport = text;
            openModal('Importar backup',
              '<p class="small muted" style="margin-bottom:10px">Arquivo de ' + (preview.exportedAt ? WF.fmtDateTime(new Date(preview.exportedAt).getTime()) : 'data desconhecida') + '</p>' +
              '<div class="mini-stats"><span>' + d.vehicles.length + ' veículos</span><span>' + (d.orders || []).length + ' ordens</span>' +
              '<span>' + ((d.washers || []).length) + ' lavadores</span><span>' + ((d.expenses || []).length) + ' despesas</span></div>' +
              '<p class="small" style="margin-top:12px"><b>Substituir tudo:</b> apaga os dados atuais deste aparelho e usa o backup.<br><b>Mesclar:</b> mantém os dados atuais e adiciona apenas o que não existe.</p>' +
              '<div class="form-actions"><button class="btn danger" data-act="confirm-import" data-mode="replace">Substituir tudo</button>' +
              '<button class="btn primary" data-act="confirm-import" data-mode="merge">Mesclar</button></div>');
          };
          reader.readAsText(f);
        };
        input.click();
        break;
      }
      case 'confirm-import': {
        const mode = el.dataset.mode || 'replace';
        const text = ui.pendingImport;
        if (!text) break;
        const r = WF.importBackup(text, mode);
        if (r.ok) {
          ui.pendingImport = null; closeModal(); render();
          toast('Backup importado: ' + r.summary.vehicles + ' veículos, ' + r.summary.orders + ' ordens.', 'ok');
        } else toast(r.error, 'err');
        break;
      }
      case 'confirm-del-vehicle': {
        const r = WF.deleteVehicle(id);
        closeModal();
        if (r.ok) { toast('Veículo excluído.', 'ok'); render(); } else toast(r.error, 'err');
        break;
      }
      case 'confirm-del-washer': {
        const r = WF.deleteWasher(id);
        closeModal();
        if (r.ok) { toast('Lavador excluído.', 'ok'); render(); } else toast(r.error, 'err');
        break;
      }
      case 'reset':
        confirmModal('Recomeçar demonstração', 'Isso apaga <b>todos</b> os dados atuais e recria o exemplo de demonstração. Exporte um backup antes se precisar.',
          'confirm-reset', 'Apagar e recomeçar', null, true);
        break;
      case 'confirm-reset':
        WF.reset(); closeModal(); ui.lastScan = 0; location.hash = '#/dashboard'; render(); toast('Demonstração recriada.', 'ok');
        break;
      case 'export-orders': download('washflow-ordens-' + WF.todayISO() + '.csv', WF.ordersCSV(ui.financePeriod || 'mes'), 'text/csv;charset=utf-8'); toast('CSV de ordens gerado.', 'ok'); break;
      case 'export-expenses': download('washflow-despesas-' + WF.todayISO() + '.csv', WF.expensesCSV(ui.financePeriod || 'mes'), 'text/csv;charset=utf-8'); toast('CSV de despesas gerado.', 'ok'); break;
      case 'export-washers': download('washflow-equipe-' + WF.todayISO() + '.csv', WF.washersCSV(), 'text/csv;charset=utf-8'); toast('CSV da equipe gerado.', 'ok'); break;
      case 'fin-period': ui.financePeriod = el.dataset.key; render(); break;
      case 'fleet-filter': ui.fleetFilter = el.dataset.filter; render(); break;
      case 'alert-filter': ui.alertFilter = el.dataset.filter; render(); break;
      default: break;
    }
  }

  function installApp() {
    if (ui.deferredPrompt) {
      ui.deferredPrompt.prompt();
      ui.deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') toast('App instalado!', 'ok');
        ui.deferredPrompt = null;
        render();
      });
      return;
    }
    if (WF.isStandalone()) { toast('O app já está instalado neste aparelho.', 'ok'); return; }
    openModal('Instalar o WASHFLOW PRO',
      '<p class="small muted">No celular, abra o menu do navegador e escolha <b>“Adicionar à tela inicial”</b> (Chrome/Android) ou <b>Compartilhar → Adicionar à Tela de Início</b> (iPhone/Safari).</p>' +
      '<p class="small muted" style="margin-top:10px">No computador, clique no ícone de instalação na barra de endereço do Chrome ou Edge.</p>' +
      '<p class="small muted" style="margin-top:10px">Depois de instalado, o app abre em tela cheia e funciona offline.</p>',
      '<button class="btn primary block" data-act="close-modal">Entendi</button>');
  }

  /* ---------------- eventos ---------------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el) {
      if (el.tagName === 'INPUT') return; // checkboxes são tratados no evento change
      if (el.tagName === 'BUTTON' && el.type === 'submit' && el.form) return;
      e.preventDefault();
      handleAction(el.dataset.act, el);
      return;
    }
    const backdrop = e.target.closest('[data-backdrop]');
    if (backdrop && e.target === backdrop) closeModal();
  });

  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-act="qa-toggle"]')) {
      handleAction('qa-toggle', e.target);
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    const fd = new FormData(form);
    if (kind === 'login-admin') {
      const r = WF.loginAdmin(fd.get('pin'));
      if (!r.ok) { toast(r.error, 'err'); return; }
      location.hash = '#/dashboard'; render(); toast('Bem-vindo de volta!', 'ok');
      return;
    }
    if (kind === 'login-washer') {
      const r = WF.loginWasher(fd.get('washerId'), fd.get('pin'));
      if (!r.ok) { toast(r.error, 'err'); return; }
      location.hash = '#/minhas'; render(); toast('Bom trabalho hoje!', 'ok');
      return;
    }
    if (kind === 'order') {
      const services = fd.getAll('services');
      const r = WF.createOrder({
        vehicleId: fd.get('vehicleId'),
        serviceIds: services,
        washerId: fd.get('washerId'),
        priority: fd.get('priority') === 'on',
        notes: fd.get('notes')
      });
      if (!r.ok) { toast(r.error, 'err'); return; }
      closeModal(); render();
      toast('Lavagem ' + r.order.code + ' aberta para ' + r.order.plate + '.', 'ok');
      return;
    }
    if (kind === 'vehicle') {
      const r = WF.saveVehicle({
        id: fd.get('id') || undefined,
        plate: fd.get('plate'), model: fd.get('model'), color: fd.get('color'),
        type: fd.get('type'), customer: fd.get('customer'), phone: fd.get('phone'),
        plan: fd.get('plan'), planDue: fd.get('planDue'), notes: fd.get('notes')
      });
      if (!r.ok) { toast(r.error, 'err'); return; }
      closeModal(); render();
      toast('Veículo ' + r.vehicle.plate + ' salvo.', 'ok');
      return;
    }
    if (kind === 'washer') {
      const r = WF.saveWasher({
        id: fd.get('id') || undefined, name: fd.get('name'), phone: fd.get('phone'),
        pin: fd.get('pin'), commission: fd.get('commission'), shift: fd.get('shift'),
        active: fd.get('active') === 'on'
      });
      if (!r.ok) { toast(r.error, 'err'); return; }
      closeModal(); render();
      toast('Lavador salvo. PIN de acesso: ' + r.washer.pin, 'ok');
      return;
    }
    if (kind === 'qa') {
      if (!ui.qaDraft) return;
      const r = WF.submitQA(ui.qaDraft.orderId, {
        items: ui.qaDraft.items,
        notes: fd.get('notes') || '',
        photos: ui.qaDraft.photos
      });
      if (!r.ok) { toast(r.error, 'err'); return; }
      closeModal(); ui.qaDraft = null; render();
      toast(r.approved ? 'Aprovado com nota ' + r.score + '/100. Veículo liberado!' : 'Nota ' + r.score + ': reprovado e enviado para retrabalho.', r.approved ? 'ok' : 'err');
      return;
    }
    if (kind === 'deliver') {
      const r = WF.deliverOrder(fd.get('orderId'), { method: fd.get('method'), note: fd.get('note'), status: 'pago' });
      if (!r.ok) { toast(r.error, 'err'); return; }
      closeModal(); render();
      toast('Entrega confirmada — ' + WF.money(r.order.price) + ' (' + ((WF.PAYMENTS.find((p) => p.id === r.order.payment.method) || {}).label || '') + ').', 'ok');
      return;
    }
    if (kind === 'expense') {
      const r = WF.addExpense({
        description: fd.get('description'), amount: fd.get('amount'),
        category: fd.get('category'), date: fd.get('date')
      });
      if (!r.ok) { toast(r.error, 'err'); return; }
      closeModal(); render(); toast('Despesa lançada.', 'ok');
      return;
    }
    if (kind === 'service') {
      WF.state.settings.services.push({
        id: WF.uid('svc'),
        name: String(fd.get('name')).trim(),
        duration: Math.max(5, WF.num(fd.get('duration'))),
        price: Math.max(0, WF.num(fd.get('price')))
      });
      WF.save(); closeModal(); render(); toast('Serviço adicionado.', 'ok');
      return;
    }
    if (kind === 'services') {
      WF.state.settings.services.forEach((sv) => {
        const n = form.querySelector('[name="name__' + sv.id + '"]');
        const d = form.querySelector('[name="time__' + sv.id + '"]');
        const p = form.querySelector('[name="price__' + sv.id + '"]');
        if (n) sv.name = n.value.trim() || sv.name;
        if (d) sv.duration = Math.max(5, WF.num(d.value));
        if (p) sv.price = Math.max(0, WF.num(p.value));
      });
      WF.save(); render(); toast('Serviços e preços atualizados.', 'ok');
      return;
    }
    if (kind === 'settings') {
      const st = WF.state.settings;
      st.shopName = String(fd.get('shopName') || '').trim() || st.shopName;
      st.phone = String(fd.get('phone') || '');
      st.address = String(fd.get('address') || '');
      st.goalDaily = Math.max(0, WF.num(fd.get('goalDaily')));
      st.openTime = String(fd.get('openTime') || '08:00');
      st.closeTime = String(fd.get('closeTime') || '18:00');
      WF.save(); render(); toast('Ajustes salvos.', 'ok');
      return;
    }
  });

  window.addEventListener('hashchange', () => { closeModal(); render(); });
  window.addEventListener('storage', (e) => {
    if (e.key !== WF.STORE_KEY) return;
    if (WF.refreshFromStorage()) render();
  });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ui.deferredPrompt = e;
  });
  window.addEventListener('appinstalled', () => { ui.deferredPrompt = null; toast('WASHFLOW PRO instalado!', 'ok'); render(); });

  // teclado: ESC fecha modal
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // atualiza tempos relativos periodicamente
  setInterval(() => { if (!document.hidden && !modalRoot.innerHTML) render(); }, 60000);

  // service worker
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then((reg) => reg.update().catch(() => {}))
        .catch(() => {});
    });
  }

  // start
  WF.load();
  WF.applyTheme();
  if (!location.hash && WF.state.session) location.hash = WF.state.session.role === 'washer' ? '#/minhas' : '#/dashboard';
  render();
})();
