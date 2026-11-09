// Fiches clientes (admin uniquement) : lister, créer, modifier, supprimer
import { send, readBody, clean, uid, isAdmin, saveJSON, readJSON, listAll, remove } from './_lib.js';
import { ensureDemo } from './_demo.js';

const STATUTS = ['nouveau', 'contacte', 'essayage', 'commande', 'livree', 'perdu'];
const FIELDS = {prenom: 80, nom: 80, email: 120, tel: 40, dateNoce: 60, modele: 80, message: 2000, source: 40, budget: 40, rdv: 40, config: 1000};

export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, {error: 'Session expirée, reconnectez-vous'});
  const now = new Date().toISOString();
  try {
    if (req.method === 'GET') {
      await ensureDemo().catch(() => {});
      const blobs = await listAll('leads/');
      const leads = (await Promise.all(blobs.map(b => readJSON(b.pathname).catch(() => null)))).filter(Boolean);
      leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return send(res, 200, {leads});
    }
    const b = await readBody(req);
    if (req.method === 'POST') {
      const id = uid();
      const lead = {id, createdAt: now, updatedAt: now, statut: 'nouveau', priorite: 'normale', notes: [], historique: [{at: now, txt: 'Fiche créée à la main'}], vid: '', page: ''};
      for (const k in FIELDS) lead[k] = clean(b[k], FIELDS[k]);
      lead.source = lead.source || 'Saisie admin';
      if (!lead.prenom && !lead.email) return send(res, 400, {error: 'Prénom ou e-mail requis'});
      await saveJSON(`leads/${id}.json`, lead);
      return send(res, 200, {lead});
    }
    const id = clean(b.id || new URL(req.url, 'http://x').searchParams.get('id'), 40).replace(/[^a-z0-9]/g, '');
    if (!id) return send(res, 400, {error: 'id manquant'});
    const path = `leads/${id}.json`;
    if (req.method === 'DELETE') {
      const [blob] = (await listAll(path)).filter(x => x.pathname === path);
      if (blob) await remove(blob.url);
      return send(res, 200, {ok: true});
    }
    if (req.method === 'PATCH') {
      const lead = await readJSON(path);
      if (!lead) return send(res, 404, {error: 'Fiche introuvable'});
      for (const k in FIELDS) if (k in b) lead[k] = clean(b[k], FIELDS[k]);
      if (b.statut && STATUTS.includes(b.statut) && b.statut !== lead.statut) {
        lead.historique.push({at: now, txt: `Statut : ${lead.statut} → ${b.statut}`});
        lead.statut = b.statut;
      }
      if (['basse', 'normale', 'haute'].includes(b.priorite)) lead.priorite = b.priorite;
      if (b.note) { lead.notes.unshift({at: now, txt: clean(b.note, 2000)}); lead.historique.push({at: now, txt: 'Note ajoutée'}); }
      if ('rdv' in b && b.rdv) lead.historique.push({at: now, txt: `Rendez-vous fixé : ${clean(b.rdv, 40)}`});
      lead.updatedAt = now;
      await saveJSON(path, lead);
      return send(res, 200, {lead});
    }
    return send(res, 405, {error: 'Méthode non prise en charge'});
  } catch (e) {
    return send(res, 500, {error: 'Stockage indisponible'});
  }
}
