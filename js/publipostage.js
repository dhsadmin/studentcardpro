/* StudentCardPro — page « Publipostage » : liste, sélection, aperçu, export PDF */
(function () {
  'use strict';

  var all = (window.PUBLIPOSTAGE || []).map(function (r) { r.id = String(r.id); return r; });
  var selected = new Set();
  var filtered = all.slice();
  var currentId = null;
  var mode = 'resultat';
  var face = 'recto';
  var busy = false;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    q: $('f-q'), classe: $('f-classe'), filiere: $('f-filiere'),
    all: $('chk-all'), count: $('pub-count'), rows: $('pub-rows'), none: $('pub-none'),
    card: $('pv-card'), prev: $('pv-prev'), next: $('pv-next'), pos: $('pv-pos'),
    btn: $('btn-export'), status: $('pub-status'), progress: $('pub-progress')
  };

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function classeLabel(r) { return [r.classe, r.filiere].filter(Boolean).join(' '); }

  /* ---------- Filtres ---------- */
  function fillSelect(select, values) {
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v;
      select.appendChild(o);
    });
  }

  function uniq(key) {
    var seen = {}, out = [];
    all.forEach(function (r) { var v = r[key]; if (v && !seen[v]) { seen[v] = true; out.push(v); } });
    return out;
  }

  function applyFilters() {
    var q = norm(el.q.value).trim();
    var c = el.classe.value, f = el.filiere.value;
    filtered = all.filter(function (r) {
      if (c && r.classe !== c) return false;
      if (f && r.filiere !== f) return false;
      if (q && norm([r.nom, r.prenom, r.matricule].join(' ')).indexOf(q) === -1) return false;
      return true;
    });
    renderRows();
    if (!filtered.some(function (r) { return r.id === currentId; })) {
      currentId = filtered.length ? filtered[0].id : null;
    }
    markCurrent();
    renderPreview();
    updateCount();
  }

  /* ---------- Tableau ---------- */
  function renderRows() {
    el.rows.textContent = '';
    filtered.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.dataset.id = r.id;

      var tdC = document.createElement('td');
      tdC.className = 'c-check';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selected.has(r.id);
      cb.setAttribute('aria-label', 'Sélectionner ' + r.nom + ' ' + r.prenom);
      cb.addEventListener('change', function () {
        if (cb.checked) selected.add(r.id); else selected.delete(r.id);
        updateCount();
      });
      tdC.appendChild(cb);

      var tdP = document.createElement('td');
      tdP.className = 'c-photo';
      if (r.image_path) {
        var im = document.createElement('img');
        im.src = r.image_path; im.alt = ''; im.loading = 'lazy'; im.width = 34; im.height = 42;
        tdP.appendChild(im);
      }

      var tdN = document.createElement('td');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'row-btn';
      var n = document.createElement('b'); n.textContent = String(r.nom || '').toUpperCase();
      b.appendChild(n);
      b.appendChild(document.createTextNode(' ' + (r.prenom || '')));
      b.addEventListener('click', function () { setCurrent(r.id); });
      tdN.appendChild(b);

      var tdK = document.createElement('td'); tdK.textContent = classeLabel(r);
      var tdM = document.createElement('td'); tdM.className = 'c-mat'; tdM.textContent = r.matricule || '';

      [tdC, tdP, tdN, tdK, tdM].forEach(function (t) { tr.appendChild(t); });
      tr.addEventListener('click', function (e) {
        if (e.target === cb || e.target === b) return;
        setCurrent(r.id);
      });
      el.rows.appendChild(tr);
    });
    el.none.hidden = filtered.length > 0;
  }

  function markCurrent() {
    Array.prototype.forEach.call(el.rows.children, function (tr) {
      if (tr.dataset.id === currentId) tr.setAttribute('aria-current', 'true');
      else tr.removeAttribute('aria-current');
    });
  }

  function updateCount() {
    var vis = filtered.filter(function (r) { return selected.has(r.id); }).length;
    el.all.checked = filtered.length > 0 && vis === filtered.length;
    el.all.indeterminate = vis > 0 && vis < filtered.length;
    var n = selected.size;
    el.count.textContent = n + (n > 1 ? ' sélectionnés' : ' sélectionné') + ' sur ' + all.length;
    if (!busy) {
      el.btn.disabled = n === 0;
      el.btn.textContent = n === 0 ? 'Sélectionnez au moins une carte'
        : 'Télécharger le PDF (' + n + (n > 1 ? ' cartes)' : ' carte)');
    }
  }

  /* ---------- Aperçu ---------- */
  function currentRecord() {
    for (var i = 0; i < all.length; i++) if (all[i].id === currentId) return all[i];
    return null;
  }

  function setCurrent(id) {
    currentId = id;
    markCurrent();
    renderPreview();
  }

  function renderPreview() {
    var rec = currentRecord();
    var idx = filtered.findIndex(function (r) { return r.id === currentId; });
    el.prev.disabled = idx <= 0;
    el.next.disabled = idx === -1 || idx >= filtered.length - 1;
    el.pos.textContent = idx === -1 ? 'Aucun enregistrement'
      : 'Enregistrement ' + (idx + 1) + ' sur ' + filtered.length;
    if (!rec) return;
    CartePro.preview(el.card, face, rec, { mode: mode });
  }

  function step(d) {
    var idx = filtered.findIndex(function (r) { return r.id === currentId; });
    var nx = filtered[idx + d];
    if (nx) {
      setCurrent(nx.id);
      var tr = el.rows.querySelector('tr[data-id="' + nx.id + '"]');
      if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ---------- Export ---------- */
  function outputName(records, format) {
    var d = new Date();
    var stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var classes = {};
    records.forEach(function (r) { classes[classeLabel(r)] = true; });
    var keys = Object.keys(classes);
    var part = keys.length === 1 ? keys[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-') : 'selection';
    return 'cartes-scolaires_' + part + '_' + records.length + '-cartes' + (format === 'a4' ? '_planches-A4' : '') + '_' + stamp + '.pdf';
  }

  function exportSelection() {
    var records = all.filter(function (r) { return selected.has(r.id); });
    if (!records.length || busy) return;
    var format = document.querySelector('input[name="format"]:checked').value;

    busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Génération en cours…';
    el.status.className = 'carte-status';
    el.status.textContent = '';
    el.progress.max = records.length;
    el.progress.value = 0;
    el.progress.hidden = false;

    CartePro.exportPDF(records, {
      mode: format,
      filename: outputName(records, format),
      onProgress: function (done, total) {
        el.progress.value = done;
        el.status.textContent = 'Carte ' + done + ' sur ' + total + '…';
      }
    }).then(function () {
      el.status.textContent = records.length + (records.length > 1 ? ' cartes téléchargées.' : ' carte téléchargée.');
    }).catch(function (e) {
      el.status.className = 'carte-status error';
      el.status.textContent = 'Le PDF n’a pas pu être généré : ' + (e && e.message ? e.message : 'erreur inconnue') + '. Réessayez avec une sélection plus petite.';
    }).then(function () {
      busy = false;
      el.progress.hidden = true;
      updateCount();
    });
  }

  /* ---------- Événements ---------- */
  el.q.addEventListener('input', applyFilters);
  el.classe.addEventListener('change', applyFilters);
  el.filiere.addEventListener('change', applyFilters);

  el.all.addEventListener('change', function () {
    filtered.forEach(function (r) { if (el.all.checked) selected.add(r.id); else selected.delete(r.id); });
    Array.prototype.forEach.call(el.rows.querySelectorAll('input[type=checkbox]'), function (cb) { cb.checked = el.all.checked; });
    updateCount();
  });

  el.prev.addEventListener('click', function () { step(-1); });
  el.next.addEventListener('click', function () { step(1); });
  el.btn.addEventListener('click', exportSelection);

  // deux jeux de boutons : face (recto / verso) et type d'aperçu (résultat / champs de fusion)
  Array.prototype.forEach.call(document.querySelectorAll('.pub-seg'), function (group) {
    var buttons = group.querySelectorAll('button');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        if (group.dataset.group === 'face') face = b.dataset.value; else mode = b.dataset.value;
        Array.prototype.forEach.call(buttons, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        renderPreview();
      });
    });
  });

  fillSelect(el.classe, uniq('classe'));
  fillSelect(el.filiere, uniq('filiere'));
  currentId = all.length ? all[0].id : null;
  applyFilters();
})();
