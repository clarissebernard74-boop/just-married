// Outils partagés par les fonctions de l'API (les fichiers préfixés par _ ne sont pas des routes)
import crypto from 'node:crypto';
import { put, get, list, del } from '@vercel/blob';

export const send = (res, code, data) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
};

export const readBody = async req => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > 20000) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
};

export const clean = (v, max = 500) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
export const uid = () => Date.now().toString(36) + crypto.randomBytes(5).toString('hex');

// ---------- Session admin : jeton signé HMAC, valable 12 h ----------
const SECRET = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
const sign = s => crypto.createHmac('sha256', SECRET()).update(s).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export const checkLogin = (id, pw) => !!process.env.ADMIN_ID && !!process.env.ADMIN_PASSWORD && same(id, process.env.ADMIN_ID) && same(pw, process.env.ADMIN_PASSWORD);
export const makeToken = id => { const p = Buffer.from(JSON.stringify({id, exp: Date.now() + 12 * 3600e3})).toString('base64url'); return p + '.' + sign(p); };
export const isAdmin = req => {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  const [p, s] = t.split('.');
  if (!p || !s || !SECRET() || !same(sign(p), s)) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).exp > Date.now(); } catch { return false; }
};

// ---------- Stockage (Vercel Blob privé) ----------
const OPT = {access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json'};
export const saveJSON = (path, data) => put(path, JSON.stringify(data), OPT);
export const readJSON = async path => {
  const r = await get(path, {access: 'private', useCache: false});
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
};
export const listAll = async prefix => {
  const out = []; let cursor;
  do { const r = await list({prefix, cursor, limit: 1000}); out.push(...r.blobs); cursor = r.hasMore ? r.cursor : null; } while (cursor && out.length < 20000);
  return out;
};
export const remove = path => del(path);
