// Connexion à l'espace admin du CRM
import { send, readBody, checkLogin, makeToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {error: 'POST uniquement'});
  const {id = '', password = ''} = await readBody(req);
  if (!checkLogin(String(id).trim(), String(password))) {
    await new Promise(r => setTimeout(r, 700)); // ralentit les essais au hasard
    return send(res, 401, {error: 'Identifiant ou mot de passe incorrect'});
  }
  return send(res, 200, {token: makeToken(id), id});
}
