/* Supabase REST client for the static WASHFLOW PWA. Configure window.WASHFLOW_SUPABASE before this file. */
(function () {
  'use strict';
  const config = window.WASHFLOW_SUPABASE || {};
  const url = String(config.url || '').replace(/\/$/, '');
  const key = String(config.anonKey || '');
  const siteSlug = String(config.siteSlug || 'washflow');
  const api = {
    enabled: !!(url && key),
    siteId: null,
    async request(path, options) {
      if (!this.enabled) throw new Error('Configure a URL e a chave pública do Supabase para habilitar a sincronização.');
      const response = await fetch(url + '/rest/v1/' + path, Object.assign({
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
      }, options || {}));
      if (!response.ok) {
        const body = await response.text();
        throw new Error('Supabase (' + response.status + '): ' + body.slice(0, 240));
      }
      return response.status === 204 ? null : response.json();
    },
    async initialize() {
      if (!this.enabled) return { enabled: false };
      const rows = await this.request('sites?slug=eq.' + encodeURIComponent(siteSlug) + '&select=id,name&limit=1');
      if (!rows.length) throw new Error('Site WASHFLOW não encontrado. Aplique as migrações no projeto Supabase.');
      this.siteId = rows[0].id;
      return { enabled: true, site: rows[0] };
    },
    async getServices() {
      return this.request('service_catalog?site_id=eq.' + this.siteId + '&is_active=eq.true&select=id,name,price,duration_minutes&order=name');
    },
    async createWash(input) {
      const r = await fetch(url + '/rest/v1/rpc/washflow_create_wash', {
        method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_site_id: this.siteId, p_vehicle_id: input.vehicleId, p_service_ids: input.serviceIds,
          p_notes: input.notes || '', p_priority: !!input.priority, p_status: input.status || 'fila', p_washer_id: input.washerId || null })
      });
      const payload = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error('Supabase (' + r.status + '): ' + (payload.message || 'Falha ao criar lavagem'));
      return payload;
    }
  };
  window.WashflowSupabase = api;
})();
