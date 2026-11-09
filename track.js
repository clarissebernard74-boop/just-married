// Collecte publique : événements de navigation et demandes de rendez-vous envoyés par le site
import { send, readBody, clean, uid, saveJSON } from './_lib.js';

const TYPES = ['page', 'clic', 'video', 'robe', 'justyou', 'formulaire', 'lead'];
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {error: 'POST uniquement'});
  const b = await readBody(req);
  if (b.website) return send(res, 200, {ok: true}); // champ piège anti-robots
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const vid = clean(b.vid, 24) || 'anonyme';
  const page = clean(b.page, 80);
  try {
    if (b.kind === 'lead') {
      const email = clean(b.email, 120).toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, {error: 'E-mail invalide'});
      const id = uid();
      const lead = {
        id, createdAt: now.toISOString(), updatedAt: now.toISOString(),
        prenom: clean(b.prenom, 80), nom: clean(b.nom, 80), email, tel: clean(b.tel, 40),
        dateNoce: clean(b.date, 60), modele: clean(b.modele, 80), message: clean(b.message, 2000),
        source: clean(b.source, 40) || 'Site', page, vid, config: clean(b.config, 1000),
        statut: 'nouveau', priorite: 'normale', budget: '', rdv: '', notes: [],
        historique: [{at: now.toISOString(), txt: 'Demande reçue depuis le site'}]
      };
      await saveJSON(`leads/${id}.json`, lead);
      await saveJSON(`ev/${day}/${Date.now()}_${b64({t: 'lead', l: lead.modele || 'Rendez-vous', p: page, v: vid})}`, {});
      return send(res, 200, {ok: true, id});
    }
    const t = TYPES.includes(b.type) ? b.type : 'clic';
    const ev = {t, l: clean(b.label, 70), p: page, v: vid};
    if (b.ref) ev.r = clean(b.ref, 60);
    await saveJSON(`ev/${day}/${Date.now()}_${b64(ev)}`, {});
    return send(res, 200, {ok: true});
  } catch (e) {
    return send(res, 500, {error: 'Stockage indisponible'});
  }
}
