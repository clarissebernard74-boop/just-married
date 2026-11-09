/* Just Married — partagé par toutes les pages : musique, animations, transitions de page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const local = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
  const session = {get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: k => { try { sessionStorage.removeItem(k); } catch (e) {} }};
  const JM = window.JM = {};

  // ---------- Collecte pour le CRM (visiteur anonyme, aucune donnée personnelle hors formulaire) ----------
  const VID = local.get('jm-vid') || (() => { const v = Math.random().toString(36).slice(2, 12); local.set('jm-vid', v); return v; })();
  const where = () => location.pathname + location.search;
  let tracked = 0;
  JM.track = (type, label, extra = {}) => {
    if (tracked++ > 80 || location.protocol === 'file:') return;
    const body = JSON.stringify({type, label: String(label || '').slice(0, 70), page: where(), vid: VID, ...extra});
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], {type: 'application/json'}))) return;
      fetch('/api/track', {method: 'POST', body, keepalive: true, headers: {'Content-Type': 'application/json'}}).catch(() => {});
    } catch (e) {}
  };
  // Demande de rendez-vous : enregistrée comme fiche cliente dans le CRM
  JM.lead = data => fetch('/api/track', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({kind: 'lead', vid: VID, page: where(), ...data})})
    .then(r => r.json().catch(() => ({})).then(j => { if (!r.ok) throw new Error(j.error || 'Envoi impossible'); return j; }));
  const robeSlug = new URLSearchParams(location.search).get('m');
  JM.track(robeSlug ? 'robe' : 'page', robeSlug || document.title, document.referrer && !document.referrer.startsWith(location.origin) ? {ref: new URL(document.referrer).hostname} : {});
  // Chaque bouton et lien du site est relevé (avec un libellé lisible)
  document.addEventListener('click', e => {
    const t = e.target.closest('a[href], button, [data-track]');
    if (!t || t.closest('.rail.drag') || t.classList.contains('jm-play')) return;
    const card = t.closest('.card');
    const label = t.dataset.track || (card ? 'Carte : ' + (card.querySelector('h3')?.textContent || '') : '') || t.getAttribute('aria-label') || t.textContent.replace(/\s+/g, ' ').trim() || t.getAttribute('href');
    JM.track('clic', label);
  }, true);

  // ---------- Vidéos et musique ----------
  // Aucune vidéo ne démarre seule : un bouton ▶ lance la vidéo et sa musique (data-music), un second clic met en pause.
  // Une seule vidéo joue à la fois ; elle s'arrête quand on la quitte en défilant.
  const SRC = id => `https://assets.mixkit.co/music/${id}/${id}.mp3`;
  const VOL = .5;
  const audio = new Audio();
  audio.loop = true; audio.preload = 'none'; audio.volume = 0;
  let playing = null;

  const fade = (a, to, ms, done) => {
    const from = a.volume, t0 = performance.now(), token = a._fade = {};
    const step = t => {
      if (a._fade !== token) return;
      const k = Math.min(1, (t - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  };

  const stopVideo = v => {
    if (!v) return;
    v.pause();
    v.closest('.jm-vid').classList.remove('is-playing');
    if (playing === v) { playing = null; fade(audio, 0, 500, () => audio.pause()); }
  };
  const startVideo = v => {
    if (playing && playing !== v) stopVideo(playing);
    playing = v;
    v.closest('.jm-vid').classList.add('is-playing');
    v.play().catch(() => stopVideo(v));
    JM.track('video', v.dataset.track || v.closest('section[id], section[aria-label], .card, [id]')?.id || v.closest('section')?.className.split(' ')[0] || 'vidéo');
    const id = v.dataset.music;
    if (!id) return;
    if (audio.dataset.id !== id) { audio.src = SRC(id); audio.dataset.id = id; audio.currentTime = 0; }
    audio.volume = 0;
    audio.play().then(() => fade(audio, VOL, 1200)).catch(() => {});
  };

  const vio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) stopVideo(e.target); }), {threshold: .1});
  JM.video = v => {
    if (v._jm) return;
    v._jm = true;
    v.removeAttribute('autoplay');
    v.autoplay = false;
    v.pause();
    // data-sound : la vidéo garde sa propre bande-son (au lieu d'une musique ajoutée)
    v.muted = !v.dataset.sound; v.loop = true; v.playsInline = true;
    if (!v.preload || v.preload === 'auto') v.preload = 'metadata';
    // Affiche une image de la vidéo plutôt qu'un cadre noir
    if (!v.poster && v.src && !v.src.includes('#t=')) v.src += '#t=0.6';
    const host = v.parentElement;
    host.classList.add('jm-vid');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'jm-play';
    b.innerHTML = '<span class="ico" aria-hidden="true"></span>';
    b.setAttribute('aria-label', 'Lancer la vidéo' + (v.dataset.music ? ' et sa musique' : ''));
    const toggle = e => { e.preventDefault(); e.stopPropagation(); v.paused ? startVideo(v) : stopVideo(v); };
    b.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    host.appendChild(b);
    vio.observe(v);
  };
  document.querySelectorAll('video[data-music], video.jm-click').forEach(JM.video);
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stopVideo(playing); });
  JM.audioState = () => ({track: audio.dataset.id || null, playing: !audio.paused, volume: +audio.volume.toFixed(2)});

  // ---------- Textes découpés en mots ----------
  JM.split = el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          const o = document.createElement('span'), s = document.createElement('span');
          o.className = 'w'; s.textContent = w; s.style.setProperty('--i', i++);
          o.appendChild(s); frag.appendChild(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
  };

  // ---------- Apparitions ----------
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .15, rootMargin: '0px 0px -6% 0px'});
  JM.observe = el => { if (reduce) el.classList.add('in'); else io.observe(el); };
  document.querySelectorAll('[data-split]').forEach(el => { JM.split(el); JM.observe(el); });
  document.querySelectorAll('[data-reveal]').forEach(JM.observe);

  // ---------- Parallaxe, fil de lecture ----------
  const bar = document.createElement('div');
  bar.className = 'jm-progress';
  document.body.appendChild(bar);
  const movers = [...document.querySelectorAll('[data-speed]')];
  let ticking = false;
  const frame = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (reduce) return;
    movers.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.speed);
      el.style.translate = `0 ${(-off).toFixed(1)}px`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive: true});
  addEventListener('resize', frame);
  frame();

  // ---------- Curseur et boutons aimantés (souris uniquement) ----------
  if (fine && !reduce) {
    const dot = document.createElement('div'), cur = document.createElement('div');
    dot.className = 'jm-dot'; cur.className = 'jm-cursor';
    document.body.append(dot, cur);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.translate = `${x}px ${y}px`; }, {passive: true});
    const loop = () => { cx += (x - cx) * .18; cy += (y - cy) * .18; cur.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { cur.textContent = t.dataset.cursor; cur.classList.add('on'); } else cur.classList.remove('on');
    });
    document.querySelectorAll('.btn, .rail-ctrl button, .jy-view button').forEach(b => {
      b.classList.add('magnet');
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .32).toFixed(1)}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  // ---------- Transition entre les pages ----------
  const veil = document.createElement('div');
  veil.className = 'jm-veil';
  veil.innerHTML = '<svg viewBox="0 0 80 100" aria-hidden="true"><path d="M6 97V42a34 34 0 0 1 68 0v55"/><path d="M12 97V42a28 28 0 0 1 56 0v55"/></svg>';
  document.body.appendChild(veil);
  JM.arrived = !!session.get('jm-nav');
  if (JM.arrived && !reduce) {
    veil.classList.add('cover');
    session.del('jm-nav');
    requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add('out')));
  }
  session.del('jm-nav');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || reduce) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
    e.preventDefault();
    session.set('jm-nav', '1');
    if (playing) stopVideo(playing);
    veil.className = 'jm-veil in';
    setTimeout(() => { location.href = u.href; }, 720);
  });
  addEventListener('pageshow', e => { if (e.persisted) veil.className = 'jm-veil'; });
})();
