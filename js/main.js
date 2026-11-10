(function () {
  'use strict';

  // Selector de días: sin JS los tres días quedan apilados.
  var afterDayChange = function () {};

  function initDays() {
    var sections = [].slice.call(document.querySelectorAll('.day'));
    if (!sections.length) return;

    var wrap = document.createElement('section');
    var inner = document.createElement('div');
    var nav = document.createElement('div');
    var panels = document.createElement('div');
    wrap.className = 'days';
    inner.className = 'days__inner';
    nav.className = 'days__nav';
    panels.className = 'days__panels';
    inner.appendChild(nav);
    inner.appendChild(panels);
    wrap.appendChild(inner);
    var line = document.createElement('div');
    line.className = 'days__line';
    line.setAttribute('aria-hidden', 'true');
    line.innerHTML = '<i class="days__line-base"></i><i class="days__line-fill"></i>';
    wrap.appendChild(line);
    sections[0].parentNode.insertBefore(wrap, sections[0]);

    var items = sections.map(function (sec, i) {
      var n = i + 1;
      var head = sec.querySelector('.day__head');
      var label = head.querySelector('.day__label');
      var tick = label.querySelector('.tick');
      var body = document.createElement('div');
      var clip = document.createElement('div');
      var btn = document.createElement('button');
      var panel = document.createElement('div');

      btn.type = 'button';
      btn.className = 'days__btn';
      btn.textContent = label.textContent;
      btn.setAttribute('aria-controls', 'dia-' + n + '-sesiones');
      label.textContent = '';
      label.appendChild(tick);
      label.appendChild(btn);

      body.className = 'days__body';
      clip.className = 'days__clip';
      [].slice.call(head.children).forEach(function (el) {
        if (el !== label) clip.appendChild(el);
      });
      body.appendChild(clip);
      head.appendChild(body);
      head.className = 'days__item days__item--' + n;
      head.id = sec.id;

      panel.id = 'dia-' + n + '-sesiones';
      panel.className = 'days__panel day--' + n;
      panel.appendChild(sec.querySelector('.sessions'));

      nav.appendChild(head);
      panels.appendChild(panel);
      sec.remove();

      var item = { head: head, btn: btn, clip: clip, panel: panel };
      btn.addEventListener('click', function () { select(i, true); });
      return item;
    });

    var current = -1;

    function select(i, fromUser) {
      if (i === current) return;
      items.forEach(function (it, k) {
        var on = k === i;
        it.head.classList.toggle('is-open', on);
        it.btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        it.panel.hidden = !on;
        if (!on && current !== -1) {
          [].forEach.call(it.panel.querySelectorAll('.rv'), function (el) { el.classList.remove('in'); });
          [].forEach.call(it.clip.querySelectorAll('.rv'), function (el) { el.classList.remove('in'); });
        }
      });

      wrap.setAttribute('data-day', i + 1);

      if (current !== -1) {
        var it = items[i];
        var rv = [].slice.call(it.panel.querySelectorAll('.rv')).concat([].slice.call(it.clip.querySelectorAll('.rv')));
        rv.forEach(function (el, k) { el.style.setProperty('--i', Math.min(k, 6)); });
        // Fuerza el layout: el panel recién mostrado parte del estado oculto.
        void wrap.offsetHeight;
        rv.forEach(function (el) { el.classList.add('in'); });
      }
      current = i;

      if (fromUser) {
        var header = document.querySelector('.site-header').offsetHeight;
        var stacked = window.matchMedia('(max-width: 900px)').matches;
        var ref = stacked ? items[i].head : wrap;
        var top = ref.getBoundingClientRect().top;
        if (stacked || top < header) window.scrollTo({ top: top + window.scrollY - header, behavior: 'instant' });
      }
      afterDayChange();
    }

    function fromHash() {
      var m = /^#dia-([123])$/.exec(window.location.hash);
      if (m) select(+m[1] - 1, true);
    }

    select(0, false);
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  initDays();

  // El movimiento es opcional: sin él la página queda completa y estática.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var root = document.documentElement;
  root.classList.add('motion');

  var hero = document.querySelector('.hero');
  var stage = document.querySelector('.stage');
  var sceneBanner = document.querySelector('.scene-banner');
  var brain = document.querySelector('.art__brain');
  var nets = [].slice.call(document.querySelectorAll('.art__net'));
  var anchor = document.querySelector('.logo-anchor');
  var slot = document.querySelector('.site-logo');
  var fly = document.querySelector('.fly');
  var days = document.querySelector('.days');
  var fill = document.querySelector('.days__line-fill');
  var trama = document.querySelector('.trama');
  var red = document.querySelector('.red');
  var ins = [].slice.call(document.querySelectorAll('[data-in]'));
  var lits = [].slice.call(document.querySelectorAll('[data-lit]')).map(function (el) { return { el: el, words: [] }; });

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var out = function (t) { return 1 - Math.pow(1 - t, 3); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  // Lectura guiada: cada párrafo se enciende palabra por palabra.
  lits.forEach(function (lit) {
    var text = lit.el.textContent;
    lit.el.setAttribute('aria-label', text);
    lit.el.textContent = '';
    text.split(' ').forEach(function (w, i, all) {
      var s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      lit.el.appendChild(s);
      if (i < all.length - 1) lit.el.appendChild(document.createTextNode(' '));
      lit.words.push(s);
    });
  });

  var m = {};
  function measure() {
    var st = stage.getBoundingClientRect();
    var a = anchor.getBoundingClientRect();

    m.vh = window.innerHeight;
    m.range = hero.offsetHeight - stage.offsetHeight;
    m.top = hero.getBoundingClientRect().top + window.scrollY;
    m.ax = a.left; m.ay = a.top - st.top; m.aw = a.width;
    m.sx = slot.offsetLeft; m.sy = slot.offsetTop; m.sw = slot.offsetWidth;
    fly.style.width = m.aw + 'px';
    tick();
  }

  var queued = false;
  function tick() {
    queued = false;
    var y = window.scrollY;
    var p = clamp((y - m.top) / m.range);

    // Hero: el cerebro se desvanece y el logotipo sube al header.
    var g = seg(p, 0, .2);
    var s = lerp(1, .55, out(g));
    brain.style.opacity = 1 - g;
    // Escala X negativa: conserva el espejado del cerebro.
    brain.style.transform = 'scale(' + (-s) + ',' + s + ')';
    nets[0].style.opacity = nets[1].style.opacity = 1 - g;
    sceneBanner.style.visibility = p >= .2 ? 'hidden' : 'visible';

    var e = ease(seg(p, 0, .24));
    var sc = lerp(1, m.sw / m.aw, e);
    root.classList.toggle('docked', e >= 1);
    fly.style.transform = 'translate(' + lerp(m.ax, m.sx, e) + 'px,' + lerp(m.ay, m.sy, e) + 'px) scale(' + sc + ')';

    // Entra el bloque de texto, con la trama desde arriba y la red desde abajo.
    for (var i = 0; i < ins.length; i++) {
      var a = parseFloat(ins[i].getAttribute('data-in'));
      var t = out(seg(p, a, a + .11));
      ins[i].style.transform = t >= 1 ? 'none' : 'translateX(' + (-105 * (1 - t)) + '%)';
    }
    var c = out(seg(p, .2, .5));
    trama.style.transform = 'translateY(' + (-100 * (1 - c)) + '%)';
    red.style.transform = 'translateY(' + (100 * (1 - c)) + '%)';

    // Línea de tiempo del programa.
    if (fill) {
      var d = days.getBoundingClientRect();
      fill.style.transform = 'scaleY(' + clamp((m.vh * .5 - d.top) / d.height) + ')';
    }

    // Lectura guiada.
    for (var n = 0; n < lits.length; n++) {
      var r = lits[n].el.getBoundingClientRect();
      var w = lits[n].words;
      var lim = clamp((m.vh * .86 - r.top) / (r.height + m.vh * .34)) * (w.length + 8);
      for (var k = 0; k < w.length; k++) {
        w[k].style.opacity = lerp(.62, 1, clamp(lim - k));
      }
    }
  }

  function request() {
    if (!queued) { queued = true; requestAnimationFrame(tick); }
  }

  afterDayChange = measure;
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();

  // Revelados al entrar en pantalla, una sola vez.
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { (en.target.__rv || en.target).classList.add('in'); seen.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  [].forEach.call(document.querySelectorAll('.rv'), function (el) {
    var box = el.closest('.mask');
    if (box) box.__rv = el;
    seen.observe(box || el);
  });

  // Teclado: si el foco cae en el hero, se lleva el scroll a donde se ve.
  document.querySelector('.copy').addEventListener('focusin', function () {
    var want = m.top + m.range * .8;
    if (window.scrollY < want) window.scrollTo(0, want);
  });
})();
