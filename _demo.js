// Données de démonstration : chargées une seule fois, à la première ouverture du CRM
import { saveJSON, readJSON } from './_lib.js';

const DAY = 864e5;
const ROBES = [['mathilde', 'Mathilde — N° 014'], ['augustine', 'Augustine — N° 015'], ['jeanne', 'Jeanne — N° 016'], ['eugenie', 'Eugénie — N° 017'], ['louise', 'Louise — N° 018'], ['celeste', 'Céleste — N° 019'], ['hortense', 'Hortense — N° 020'], ['marguerite', 'Marguerite — N° 021'], ['rose', 'Rose — N° 022'], ['adele', 'Adèle — N° 023'], ['blanche', 'Blanche — N° 024']];
const CARTES = {mathilde: 'Mathilde', augustine: 'Augustine', jeanne: 'Jeanne', eugenie: 'Eugénie', louise: 'Louise', celeste: 'Céleste', hortense: 'Hortense', marguerite: 'Marguerite', rose: 'Rose', adele: 'Adèle', blanche: 'Blanche'};
const JY = 'Just You — silhouette princesse, encolure cœur, manches longues, dos lacé, traîne cathédrale, voile cathédrale brodé, taillée dans une dentelle de Calais, initiales C.L. brodées au fil or.';

// [prénom, nom, modèle, statut, jours depuis la demande, source, date de noce, message, rdv (jours, heure), note]
const PEOPLE = [
  ['Camille', 'Martin', 'mathilde', 'nouveau', 0.2, 'Formulaire rendez-vous', 'Juin 2027', "J'ai eu un coup de cœur pour Mathilde, est-ce qu'elle pourrait être raccourcie ?"],
  ['Inès', 'Roux', 'jy', 'nouveau', 0.8, 'Configurateur Just You', 'Septembre 2027', 'Ma grand-mère a gardé son trousseau, pourrait-on utiliser un de ses draps ?'],
  ['Manon', 'Perrin', 'rose', 'nouveau', 1.6, 'Page robe', 'Mai 2027', 'Les poches de Rose, c\'est exactement ce que je cherchais !'],
  ['Clara', 'Mercier', 'celeste', 'nouveau', 2.4, 'Formulaire rendez-vous', 'Juillet 2027', ''],
  ['Léa', 'Bonnet', 'celeste', 'contacte', 4, 'Formulaire rendez-vous', 'Août 2027', 'Mariage à la campagne, dans les Monts du Lyonnais.', null, 'Appelée le ' + 'mardi : très intéressée par la cape, souhaite venir avec sa mère.'],
  ['Sarah', 'Lefèvre', 'augustine', 'contacte', 6, 'Instagram', 'Juin 2027', 'Vue sur Instagram, je rêve de cette jupe.', null, 'Envoyé les photos de dos par e-mail.'],
  ['Juliette', 'Morel', 'marguerite', 'contacte', 8, 'Page robe', 'Avril 2027', "Pour un mariage civil à Lyon, quelque chose de très simple."],
  ['Chloé', 'Garnier', 'jeanne', 'essayage', 9, 'Formulaire rendez-vous', 'Juin 2027', 'Le corsage lacé de Jeanne me fait rêver.', [2, '10:00'], 'Taille 38, essayage avec deux témoins.'],
  ['Alice', 'Fournier', 'jy', 'essayage', 12, 'Configurateur Just You', 'Octobre 2027', JY, [5, '14:30'], 'Premier rendez-vous sur mesure : prévoir les échantillons de dentelle.'],
  ['Emma', 'Girard', 'hortense', 'essayage', 14, 'Recommandation', 'Septembre 2027', 'Recommandée par une amie mariée en Hortense.', [9, '11:00']],
  ['Louise', 'Chevalier', 'blanche', 'commande', 19, 'Formulaire rendez-vous', 'Mai 2027', 'La combinaison pour la mairie, la surjupe pour le soir : parfait.', [-8, '15:00'], 'Acompte reçu. Retouche ourlet de 3 cm.', '4 400 €'],
  ['Margaux', 'Dubois', 'adele', 'commande', 24, 'Salon du mariage', 'Juin 2027', 'Rencontrées au salon du mariage de Lyon.', [-12, '10:30'], 'Ajout des initiales M.D. au fil bleu.', '3 650 €'],
  ['Anaïs', 'Lambert', 'louise', 'livree', 28, 'Formulaire rendez-vous', 'Novembre 2026', 'Mariage en hiver, les manches longues sont idéales.', [-20, '16:00'], 'Robe remise, cliente ravie. Photos promises pour Instagram.'],
  ['Pauline', 'Rousseau', 'eugenie', 'perdu', 21, 'Formulaire rendez-vous', 'Mars 2027', 'Budget serré, je voulais juste un renseignement.', null, 'A choisi une robe de prêt-à-porter.']
];
const REFS = ['instagram.com', 'google.com', 'pinterest.fr', 'mariages.net', 'facebook.com'];

// Générateur pseudo-aléatoire reproductible
const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export function buildDemo(now = Date.now()) {
  const r = rng(20261109), pick = a => a[Math.floor(r() * a.length)];
  const events = [], leads = [];
  const session = (v, t0, steps, ref) => {
    let t = t0;
    events.push({at: Math.round(t), t: 'page', l: 'Just Married — Robes de trousseau', p: '/', v, ...(ref ? {r: ref} : {})});
    steps.forEach(([type, label, page]) => { t += (20 + r() * 140) * 1000; events.push({at: Math.round(t), t: type, l: label, p: page || '/', v}); });
  };
  // Visiteuses anonymes sur 30 jours
  for (let i = 0; i < 70; i++) {
    const v = 'demo' + i.toString(36).padStart(3, '0'), t0 = now - r() * 30 * DAY;
    const steps = [], n = 2 + Math.floor(r() * 6);
    for (let k = 0; k < n; k++) {
      const x = r(), [slug] = pick(ROBES);
      if (x < .3) { steps.push(['clic', 'Carte : ' + CARTES[slug]]); steps.push(['robe', slug, '/robe.html?m=' + slug]); }
      else if (x < .45) steps.push(['video', pick(['top', 'film', 'atelier', 'arches'])]);
      else if (x < .58) steps.push(['clic', pick(['Collection', 'Just You', 'Vestiaire', 'Lyon 6e', 'Instagram'])]);
      else if (x < .68) steps.push(['clic', pick(['Essayer', 'Rendez-vous', 'Venir essayer'])]);
      else if (x < .74) steps.push(['justyou', 'Configuration envoyée au rendez-vous']);
      else steps.push(['clic', pick(['Modèle suivant', 'Modèle précédent', 'Voir toute la collection'])]);
    }
    session(v, t0, steps, r() < .45 ? pick(REFS) : null);
  }
  // Fiches clientes, chacune avec son parcours sur le site
  PEOPLE.forEach(([prenom, nom, slug, statut, ago, source, dateNoce, message, rdv, note, budget], i) => {
    const id = 'demo' + String(i + 1).padStart(2, '0'), v = 'demoL' + i, created = now - ago * DAY;
    const robe = slug === 'jy' ? ['jy', 'Just You — sur mesure'] : ROBES.find(x => x[0] === slug);
    const steps = slug === 'jy'
      ? [['clic', 'Just You'], ['justyou', 'Configuration envoyée au rendez-vous'], ['lead', robe[1]]]
      : [['clic', 'Carte : ' + CARTES[slug]], ['robe', slug, '/robe.html?m=' + slug], ['clic', 'Essayer', '/robe.html?m=' + slug], ['lead', robe[1]]];
    session(v, created - 6 * 60e3, steps, source === 'Instagram' ? 'instagram.com' : null);
    const iso = t => new Date(t).toISOString();
    const hist = [{at: iso(created), txt: 'Demande reçue depuis le site'}];
    const order = ['nouveau', 'contacte', 'essayage', 'commande', 'livree'];
    let prev = 'nouveau';
    const target = statut === 'perdu' ? ['contacte', 'perdu'] : order.slice(1, order.indexOf(statut) + 1);
    target.forEach((s, k) => { hist.push({at: iso(created + (k + 1) * 1.3 * DAY), txt: `Statut : ${prev} → ${s}`}); prev = s; });
    let rdvIso = '';
    if (rdv) { const d = new Date(now + rdv[0] * DAY); const [h, m] = rdv[1].split(':'); d.setUTCHours(+h - 1, +m, 0, 0); rdvIso = d.toISOString(); hist.push({at: iso(created + DAY), txt: `Rendez-vous fixé : ${rdvIso}`}); }
    leads.push({
      id, demo: true, createdAt: iso(created), updatedAt: iso(created + DAY),
      prenom, nom, email: `${prenom}.${nom}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@exemple.fr',
      tel: '06 ' + [0, 0, 0, 0].map(() => String(10 + Math.floor(r() * 89))).join(' '),
      dateNoce, modele: robe[1], message: slug === 'jy' && i !== 1 ? '' : message, source, page: '/', vid: v,
      config: slug === 'jy' ? JY : '', statut, priorite: i === 1 || i === 8 ? 'haute' : 'normale', budget: budget || '', rdv: rdvIso,
      notes: note ? [{at: iso(created + DAY), txt: note}] : [], historique: hist
    });
  });
  events.sort((a, b) => b.at - a.at);
  return {leads, events: events.filter(e => e.at <= now)};
}

// Écrit la démo si elle n'a jamais été chargée (un repère évite de la recharger après suppression)
export async function ensureDemo(part) {
  if (await readJSON('demo/seeded.json').catch(() => null)) return false;
  const {leads, events} = buildDemo();
  if (part === 'events') { await saveJSON('demo/events.json', events); return true; }
  await saveJSON('demo/events.json', events);
  await Promise.all(leads.map(l => saveJSON(`leads/${l.id}.json`, l)));
  await saveJSON('demo/seeded.json', {at: new Date().toISOString()});
  return true;
}
