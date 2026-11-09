# Just Married

Site vitrine et CRM de **Just Married**, atelier de robes de mariée taillées dans des draps de trousseau anciens.
5 rue Duguesclin, 69006 Lyon.

## Le site
- `index.html` : accueil, collection, configurateur sur mesure « Just You », registre, atelier, rendez-vous
- `robe.html` : page de chaque robe (`robe.html?m=mathilde`, `?m=augustine`…), données dans la liste `ROBES`
- `jm.js` / `jm.css` : partagés par toutes les pages — vidéos lancées au clic, animations, transitions, **collecte pour le CRM**
- `404.html` : page introuvable

## Le CRM (`/crm/`)
Espace réservé à l'atelier, protégé par un identifiant admin.
- Tableau de bord : visiteuses, pages vues, conversion, tunnel, robes les plus regardées, activité en direct
- Pipeline par glisser-déposer (nouvelle demande → contactée → essayage → commande → livrée)
- Fiches clientes : coordonnées, rendez-vous, notes, historique, parcours sur le site, e-mail en un clic
- Agenda des essayages, statistiques par robe, journal de l'activité, export CSV

Les données arrivent automatiquement : chaque page, bouton, vidéo et configuration Just You est relevé (visiteuse anonyme), et le formulaire de rendez-vous crée une fiche.

## API (fonctions Vercel, `api/`)
- `POST /api/track` : collecte publique (événements et demandes de rendez-vous)
- `POST /api/login` : connexion admin → jeton signé (12 h)
- `GET|POST|PATCH|DELETE /api/leads`, `GET /api/events` : réservés à l'admin

Stockage : Vercel Blob **privé**. Variables d'environnement à définir sur Vercel :
`BLOB_READ_WRITE_TOKEN` (créée en reliant le store Blob), `ADMIN_ID`, `ADMIN_PASSWORD`, `ADMIN_SECRET`.
Aucun identifiant n'est écrit dans ce dépôt.

Crédits : film d'accueil © Isabella Boutin ; vidéos et musiques [Mixkit](https://mixkit.co), photos [Unsplash](https://unsplash.com).
