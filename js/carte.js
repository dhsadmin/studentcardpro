/* =========================================================
   StudentCardPro — moteur de carte scolaire
   - dessine le recto / verso sur un <canvas> (même rendu pour
     l'aperçu à l'écran et pour le PDF)
   - fabrique le PDF lui-même : aucune bibliothèque externe,
     aucun window.print(), fonctionne hors connexion
   Les données arrivent sous forme d'objets « enregistrement » :
   { nom, prenom, classe, filiere, date_naiss, lieu_naiss,
     sexe, telephone, matricule, image_path }
   ========================================================= */
(function (w) {
  'use strict';

  /* ---------- Réglages de l'établissement (un seul endroit) ---------- */
  var CFG = {
    annee: '2025-2026',
    ecole: 'LTP DJAKOTOMEY',
    bp: 'BP: 169 AZOVE',
    tel: 'Tél: 01 57 32 62 37',
    proviseur: 'Prudence HOUNGBO',
    img: { armoirie: 'img/armoirie.png', qr: 'img/qrcode.png' }
  };

  var W = 856, H = 540;            // carte CR80 : 85,6 × 54 mm, à 10 px par mm
  var MM_W = 85.6, MM_H = 54;

  var SANS = 'Poppins, "Segoe UI", Arial, sans-serif';
  var ARIAL = 'Arial, "Liberation Sans", Helvetica, sans-serif';
  var VERT = '#00B050', JAUNE = '#FFFF00', ROUGE = '#FF0000';

  /* ---------- Champs de fusion (mode « Champs », comme dans Word) ---------- */
  var CHAMPS = {
    nom: '«Noms»', prenom: '«Prénoms»', naissance: '«Date de naissance»',
    lieu: '«Lieu»', sexe: '«Sexe»', classe: '«Classe»',
    tel: '«Téléphone»', mat: '«Matricule»'
  };

  /* ---------- Utilitaires de mise en forme ---------- */
  function fmtDate(v) {
    if (!v) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : String(v);
  }

  function fmtPhone(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    if (d.length === 8 || d.length === 10) return d.replace(/(\d{2})(?=\d)/g, '$1 ');
    return String(v == null ? '' : v);
  }

  function titleCase(s) {
    return String(s || '').toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, function (m, a, b) {
      return a + b.toUpperCase();
    });
  }

  function vue(rec, mode) {
    if (mode === 'champs') return CHAMPS;
    rec = rec || {};
    return {
      nom: String(rec.nom || '').toUpperCase(),
      prenom: titleCase(rec.prenom),
      naissance: fmtDate(rec.date_naiss),
      lieu: String(rec.lieu_naiss || '').toUpperCase(),
      sexe: rec.sexe || '',
      classe: [rec.classe, rec.filiere].filter(Boolean).join(' '),
      tel: fmtPhone(rec.telephone),
      mat: rec.matricule || ''
    };
  }

  /* ---------- Chargement des polices et des images ---------- */
  function fontsReady() {
    if (!w.document || !document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 22px Poppins'),
      document.fonts.load('500 22px Poppins'),
      document.fonts.load('700 22px Poppins')
    ]).catch(function () {});
  }

  var imgCache = {};
  function loadImage(url) {
    if (!url) return Promise.resolve(null);
    if (!imgCache[url]) {
      imgCache[url] = new Promise(function (resolve) {
        var i = new Image();
        i.onload = function () { resolve(i); };
        i.onerror = function () { resolve(null); };
        i.src = url;
      });
    }
    return imgCache[url];
  }

  /* ---------- Primitives de dessin ---------- */
  function font(weight, size, family) { return weight + ' ' + size + 'px ' + (family || SANS); }

  function widthOf(ctx, s, f) { ctx.font = f; return ctx.measureText(s).width; }

  // taille de police (≤ max) pour que le texte tienne dans maxW
  function fitSize(ctx, s, weight, max, maxW, family, min) {
    var wd = widthOf(ctx, s, font(weight, max, family));
    if (wd <= maxW) return max;
    return Math.max(min || 9, Math.floor((max * maxW / wd) * 2) / 2);
  }

  function text(ctx, s, x, y, f, color, align) {
    ctx.font = f;
    ctx.fillStyle = color || '#000';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
  }

  function hline(ctx, x, y, wd, th, color) {
    ctx.fillStyle = color || '#000';
    ctx.fillRect(x, y, wd, th);
  }

  function tricolore(ctx, x, y, wd, h) {
    var s = wd / 3;
    ctx.fillStyle = VERT;  ctx.fillRect(x, y, s + 0.5, h);
    ctx.fillStyle = JAUNE; ctx.fillRect(x + s, y, s + 0.5, h);
    ctx.fillStyle = ROUGE; ctx.fillRect(x + 2 * s, y, s, h);
  }

  function roundRect(ctx, x, y, wd, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + wd, y, x + wd, y + h, r);
    ctx.arcTo(x + wd, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + wd, y, r);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, wd, h) {
    var r = Math.max(wd / img.width, h / img.height);
    var sw = wd / r, sh = h / r;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, wd, h);
  }

  // libellé souligné ; renvoie la position x de fin
  function label(ctx, s, x, base, size, weight) {
    var f = font(weight || 400, size);
    var wd = widthOf(ctx, s, f);
    text(ctx, s, x, base, f, '#000');
    hline(ctx, x, base + 5, wd, 1.6);
    return x + wd;
  }

  /* ---------- Recto ---------- */
  function drawRecto(ctx, v, assets, mode) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // armoiries
    if (assets.armoirie) ctx.drawImage(assets.armoirie, 10, 12, 112, 112 * assets.armoirie.height / assets.armoirie.width);

    // ministère : les 3 lignes s'alignent sur la largeur cible de la 2e ligne
    var L1 = 'MINISTERE DES ENSEIGNEMENTS';
    var L2 = 'SECONDAIRE, TECHNIQUE ET DE LA';
    var L3 = 'FORMATION PROFESSIONNELLE';
    var ms = fitSize(ctx, L2, 700, 30, 402, ARIAL);
    var fm = font(700, ms, ARIAL);
    text(ctx, L1, 132, 25, fm);
    text(ctx, L2, 132, 47, fm);
    text(ctx, L3, 132, 68, fm);
    var barW = widthOf(ctx, L3, fm);
    tricolore(ctx, 132, 76, barW, 9);
    text(ctx, 'REPUBLIQUE DU BENIN', 132, 104, fm);

    // bloc établissement (rouge, aligné à droite)
    var lines = [CFG.ecole, CFG.bp, CFG.tel];
    var ws = 0;
    lines.forEach(function (l) { ws = Math.max(ws, widthOf(ctx, l, font(700, 20))); });
    var es = ws > 218 ? Math.floor(20 * 218 / ws * 2) / 2 : 20;
    lines.forEach(function (l, i) { text(ctx, l, 841, 27 + i * 32.5, font(700, es), ROUGE, 'right'); });

    // titre
    var title = 'Carte D’Identité Scolaire ' + CFG.annee;
    var ts = fitSize(ctx, title, 700, 37, 812);
    text(ctx, title, W / 2, 148, font(700, ts), '#000', 'center');
    ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000';
    ctx.strokeText(title, W / 2, 148);            // graisse « extra » du modèle Word

    // cadre photo
    roundRect(ctx, 22, 179, 210, 270, 7);
    if (assets.photo && mode !== 'champs') {
      ctx.save(); ctx.clip(); drawCover(ctx, assets.photo, 22, 179, 210, 270); ctx.restore();
    }
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#000';
    roundRect(ctx, 22, 179, 210, 270, 7); ctx.stroke();

    // champs
    var X = 264, RIGHT = 838;
    var C = [192, 239, 286.5, 334, 381.5, 429];      // milieu de chaque ligne
    var B = function (i) { return C[i] + 9; };       // ligne de base commune label + valeur
    var x;

    x = label(ctx, 'Nom:', X, B(0), 22) + 20;
    var s0 = fitSize(ctx, v.nom, 700, 30, RIGHT - x);
    text(ctx, v.nom, x, B(0) + 1, font(700, s0));

    x = label(ctx, 'Prénom(s):', X, B(1), 22) + 8;
    var s1 = fitSize(ctx, v.prenom, 700, 30, RIGHT - x);
    text(ctx, v.prenom, x, B(1) + 1, font(700, s1));

    x = label(ctx, 'Né(e) le/Vers:', X, B(2), 22) + 12;
    var fd = font(700, 20);
    var wDate = Math.max(widthOf(ctx, v.naissance, fd), 0);
    text(ctx, v.naissance, x, B(2), fd);
    x += wDate + 26;
    x = label(ctx, 'à:', x, B(2), 22) + 10;
    var s2 = fitSize(ctx, v.lieu, 700, 20, RIGHT - x);
    text(ctx, v.lieu, x, B(2), font(700, s2));

    x = label(ctx, 'Sexe:', X, B(3), 22) + 14;
    text(ctx, v.sexe, x, B(3), font(700, 20));

    x = label(ctx, 'Classe:', X, B(4), 22) + 14;
    text(ctx, v.classe, x, B(4), font(700, fitSize(ctx, v.classe, 700, 20, RIGHT - x)));

    x = label(ctx, 'Tél:', X, B(5), 22) + 14;
    text(ctx, v.tel, x, B(5), font(700, fitSize(ctx, v.tel, 700, 20, RIGHT - x)));

    // matricule
    x = label(ctx, 'Mle:', 22, 489, 21) + 10;
    text(ctx, v.mat, x, 489, font(700, fitSize(ctx, v.mat, 700, 20, 230 - x + 22)));

    // signature de l'apprenant
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#000';
    ctx.strokeRect(624, 455, 182, 49);
    var sg = 'Signature de l’apprenant';
    var sgf = font(400, 15);
    var sgw = widthOf(ctx, sg, sgf);
    text(ctx, sg, 715, 522, sgf, '#000', 'center');
    hline(ctx, 715 - sgw / 2, 525, sgw, 1.2);

    // barre tricolore du bas
    tricolore(ctx, 250, 523, 356, 9);
  }

  /* ---------- Verso ---------- */
  function drawVerso(ctx, assets) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    if (assets.armoirie) {
      var aw = 96, ah = aw * assets.armoirie.height / assets.armoirie.width;
      ctx.drawImage(assets.armoirie, W / 2 - aw / 2, 18, aw, ah);
    }

    var sz = fitSize(ctx, CFG.ecole, 700, 46, 760);
    text(ctx, CFG.ecole, W / 2, 158, font(700, sz), '#000', 'center');
    var sub = 'Carte D’Identité Scolaire ' + CFG.annee;
    text(ctx, sub, W / 2, 202, font(500, fitSize(ctx, sub, 500, 26, 760, SANS)), '#000', 'center');

    if (assets.qr) ctx.drawImage(assets.qr, 88, 236, 256, 256);

    var cx = 612;
    var f1 = font(500, 26);
    var t1 = 'Le Proviseur';
    var w1 = widthOf(ctx, t1, f1);
    text(ctx, t1, cx, 296, f1, '#000', 'center');
    hline(ctx, cx - w1 / 2, 302, w1, 1.6);

    var f2 = font(700, fitSize(ctx, CFG.proviseur, 700, 26, 340));
    var w2 = widthOf(ctx, CFG.proviseur, f2);
    text(ctx, CFG.proviseur, cx, 468, f2, '#000', 'center');
    hline(ctx, cx - w2 / 2, 474, w2, 1.6);

    tricolore(ctx, 250, 523, 356, 9);
  }

  /* ---------- Rendu d'une face sur un canvas ---------- */
  function renderFace(face, rec, opts) {
    opts = opts || {};
    var mode = opts.mode || 'resultat';
    var scale = opts.scale || 1;
    return fontsReady().then(function () {
      return Promise.all([
        loadImage(CFG.img.armoirie),
        face === 'verso' ? loadImage(CFG.img.qr) : Promise.resolve(null),
        face === 'recto' && rec && rec.image_path && mode !== 'champs' ? loadImage(rec.image_path) : Promise.resolve(null)
      ]);
    }).then(function (a) {
      var canvas = opts.canvas || document.createElement('canvas');
      canvas.width = Math.round(W * scale);
      canvas.height = Math.round(H * scale);
      var ctx = canvas.getContext('2d');
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      var assets = { armoirie: a[0], qr: a[1], photo: a[2] };
      if (face === 'verso') drawVerso(ctx, assets);
      else drawRecto(ctx, vue(rec, mode), assets, mode);
      return canvas;
    });
  }

  /* ---------- Aperçu à l'écran ---------- */
  function preview(container, face, rec, opts) {
    opts = opts || {};
    var canvas = container.querySelector('canvas.carte-canvas');
    if (!canvas) {
      container.innerHTML = '';
      canvas = document.createElement('canvas');
      canvas.className = 'carte-canvas';
      container.appendChild(canvas);
    }
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', face === 'verso' ? 'Verso de la carte scolaire' : 'Recto de la carte scolaire');
    var token = (container._tok = (container._tok || 0) + 1);
    return renderFace(face, rec, { mode: opts.mode, scale: 1.5, canvas: canvas }).then(function (c) {
      return token === container._tok ? c : null;
    });
  }

  /* =========================================================
     PDF — écriture directe (pages + images JPEG, sans librairie)
     ========================================================= */
  var PT = 72 / 25.4;

  function hexUtf16(s) {
    var h = 'FEFF';
    for (var i = 0; i < s.length; i++) h += ('000' + s.charCodeAt(i).toString(16)).slice(-4).toUpperCase();
    return '<' + h + '>';
  }

  function pdfDate(d) {
    function p(n) { return ('0' + n).slice(-2); }
    return 'D:' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function n2(n) { return (Math.round(n * 100) / 100).toString(); }

  // images : { clé: {data:Uint8Array, w, h} } ; pages : [{w, h, items:[{img,x,y,w,h}], guides:[{x,y,w,h}]}] (mm)
  function buildPDF(images, pages, meta) {
    var enc = new TextEncoder();
    var parts = [], offsets = [], pos = 0;
    function push(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; }
    function begin(n) { offsets[n] = pos; push(n + ' 0 obj\n'); }
    function end() { push('endobj\n'); }

    var keys = Object.keys(images);
    var imgNum = {};
    keys.forEach(function (k, i) { imgNum[k] = 4 + i; });
    var firstPage = 4 + keys.length;
    var total = firstPage + pages.length * 2;

    push('%PDF-1.4\n');
    push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));

    begin(1); push('<< /Type /Catalog /Pages 2 0 R >>\n'); end();

    var kids = pages.map(function (p, i) { return (firstPage + i * 2) + ' 0 R'; }).join(' ');
    begin(2); push('<< /Type /Pages /Kids [' + kids + '] /Count ' + pages.length + ' >>\n'); end();

    begin(3);
    push('<< /Title ' + hexUtf16(meta.title || 'Carte scolaire') + ' /Author ' + hexUtf16('StudentCardPro') +
      ' /Creator ' + hexUtf16('StudentCardPro') + ' /Producer ' + hexUtf16('StudentCardPro') +
      ' /CreationDate (' + pdfDate(new Date()) + ') >>\n');
    end();

    keys.forEach(function (k) {
      var im = images[k];
      begin(imgNum[k]);
      push('<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.data.length + ' >>\nstream\n');
      push(im.data);
      push('\nendstream\n');
      end();
    });

    pages.forEach(function (p, i) {
      var pn = firstPage + i * 2, cn = pn + 1;
      var PW = p.w * PT, PH = p.h * PT;
      var used = {}, c = '';
      (p.guides || []).forEach(function (g) {
        c += '0.78 G 0.25 w ' + n2(g.x * PT) + ' ' + n2((p.h - g.y - g.h) * PT) + ' ' + n2(g.w * PT) + ' ' + n2(g.h * PT) + ' re S\n';
      });
      p.items.forEach(function (it) {
        used[it.img] = true;
        c += 'q ' + n2(it.w * PT) + ' 0 0 ' + n2(it.h * PT) + ' ' + n2(it.x * PT) + ' ' + n2((p.h - it.y - it.h) * PT) + ' cm /' + 'I' + imgNum[it.img] + ' Do Q\n';
      });
      var xo = Object.keys(used).map(function (k) { return '/I' + imgNum[k] + ' ' + imgNum[k] + ' 0 R'; }).join(' ');
      begin(pn);
      push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + n2(PW) + ' ' + n2(PH) + '] /Resources << /XObject << ' + xo + ' >> >> /Contents ' + cn + ' 0 R >>\n');
      end();
      begin(cn);
      push('<< /Length ' + c.length + ' >>\nstream\n' + c + 'endstream\n');
      end();
    });

    var xref = pos;
    push('xref\n0 ' + total + '\n0000000000 65535 f \n');
    for (var n = 1; n < total; n++) push(('0000000000' + offsets[n]).slice(-10) + ' 00000 n \n');
    push('trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');

    return new Blob(parts, { type: 'application/pdf' });
  }

  function toJpeg(canvas, q) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) {
        if (!b) return reject(new Error('Conversion de la carte en image impossible.'));
        b.arrayBuffer().then(function (buf) {
          resolve({ data: new Uint8Array(buf), w: canvas.width, h: canvas.height });
        }, reject);
      }, 'image/jpeg', q || 0.92);
    });
  }

  function pause() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function fileName(rec) {
    var base = ['carte-scolaire', slug(rec.nom), slug(rec.prenom), slug(rec.matricule)].filter(Boolean).join('_');
    return base + '.pdf';
  }

  function download(blob, name) {
    var a = document.createElement('a');
    var url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 5000);
  }

  /* ---------- Export : 'cr80' (1 carte / page) ou 'a4' (planche 2 × 5) ---------- */
  function exportPDF(records, opts) {
    opts = opts || {};
    var mode = opts.mode === 'a4' ? 'a4' : 'cr80';
    var scale = records.length > 30 ? 1.5 : 2;
    var progress = opts.onProgress || function () {};
    var images = {}, pages = [], done = 0;

    function faceItem(img) { return { img: img, x: 0, y: 0, w: MM_W, h: MM_H }; }

    return renderFace('verso', null, { scale: scale }).then(function (cv) {
      return toJpeg(cv, 0.93);
    }).then(function (jv) {
      images.verso = jv;

      // a4 : 2 colonnes × 5 lignes ; verso en miroir pour l'impression recto-verso (bord long)
      var COLS = 2, ROWS = 5, PER = COLS * ROWS;
      var x0 = (210 - COLS * MM_W) / 2, y0 = (297 - ROWS * MM_H) / 2;
      var sheetFront = null, sheetBack = null;

      var chain = Promise.resolve();
      records.forEach(function (rec, i) {
        chain = chain.then(function () {
          return renderFace('recto', rec, { scale: scale }).then(function (cv) {
            return toJpeg(cv, 0.92).then(function (j) { cv.width = 0; return j; });
          }).then(function (j) {
            var key = 'r' + i;
            images[key] = j;

            if (mode === 'cr80') {
              pages.push({ w: MM_W, h: MM_H, items: [faceItem(key)] });
              pages.push({ w: MM_W, h: MM_H, items: [faceItem('verso')] });
            } else {
              var k = i % PER;
              if (k === 0) {
                sheetFront = { w: 210, h: 297, items: [], guides: [] };
                sheetBack = { w: 210, h: 297, items: [], guides: [] };
                pages.push(sheetFront, sheetBack);
              }
              var col = k % COLS, row = Math.floor(k / COLS);
              var fx = x0 + col * MM_W, fy = y0 + row * MM_H;
              var bx = x0 + (COLS - 1 - col) * MM_W;
              sheetFront.items.push({ img: key, x: fx, y: fy, w: MM_W, h: MM_H });
              sheetFront.guides.push({ x: fx, y: fy, w: MM_W, h: MM_H });
              sheetBack.items.push({ img: 'verso', x: bx, y: fy, w: MM_W, h: MM_H });
              sheetBack.guides.push({ x: bx, y: fy, w: MM_W, h: MM_H });
            }
            done++;
            progress(done, records.length);
            return pause();
          });
        });
      });
      return chain;
    }).then(function () {
      var name = opts.filename || (records.length === 1 ? fileName(records[0]) : 'cartes-scolaires.pdf');
      var blob = buildPDF(images, pages, {
        title: records.length === 1
          ? 'Carte scolaire — ' + (records[0].nom || '') + ' ' + (records[0].prenom || '')
          : 'Cartes scolaires ' + CFG.annee + ' (' + records.length + ')'
      });
      if (!opts.noDownload) download(blob, name);
      return blob;
    });
  }

  w.CartePro = {
    config: CFG,
    size: { w: W, h: H },
    renderFace: renderFace,
    preview: preview,
    exportPDF: exportPDF,
    fileName: fileName,
    fontsReady: fontsReady
  };
})(window);
