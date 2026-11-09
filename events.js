// Journal des événements du site (admin uniquement)
import { send, isAdmin, listAll, readJSON } from './_lib.js';
import { ensureDemo } from './_demo.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, {error: 'Session expirée, reconnectez-vous'});
  try {
    const blobs = await listAll('ev/');
    const events = [];
    for (const b of blobs) {
      const name = b.pathname.split('/').pop(), i = name.indexOf('_');
      try { events.push({at: +name.slice(0, i), ...JSON.parse(Buffer.from(name.slice(i + 1), 'base64url').toString())}); } catch {}
    }
    // Parcours de démonstration (un seul fichier, chargé à la première ouverture du CRM)
    await ensureDemo('events').catch(() => {});
    const demo = await readJSON('demo/events.json').catch(() => null);
    if (Array.isArray(demo)) events.push(...demo);
    events.sort((a, b) => b.at - a.at);
    return send(res, 200, {events});
  } catch (e) {
    return send(res, 500, {error: 'Stockage indisponible'});
  }
}
