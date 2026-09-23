/* Коммерческое предложение «Деликат» — интерактив страницы */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ────────────── форматирование ────────────── */
  var NB = ' ';

  function money(n) {
    return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽';
  }
  function signed(n) {
    var s = n < 0 ? '−' : '+';
    return s + Math.abs(Math.round(n)).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽';
  }
  function dec1(n) { return n.toFixed(1).replace('.', ','); }

  /* ────────────── прогресс чтения ────────────── */
  var bar = $('#progressBar');
  if (bar) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = doc.body.scrollHeight - window.innerHeight;
        var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
        bar.style.width = (p * 100).toFixed(2) + '%';
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ────────────── появление блоков ────────────── */
  var revealed = [];
  var io = null;

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        revealed.forEach(function (fn) { fn(e.target); });
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    $$('.r').forEach(function (el) { io.observe(el); });
  } else {
    $$('.r').forEach(function (el) { el.classList.add('is-in'); });
  }

  function onReveal(fn) { revealed.push(fn); }

  /* ────────────── логотип: 17 граней ────────────── */
  (function bull() {
    var svg = $('.bull');
    if (!svg) return;
    var paths = $$('path', svg);

    if (reduced) { svg.classList.add('is-on'); return; }

    paths.forEach(function (p, i) {
      // устойчивый «псевдослучайный» разлёт граней
      var a = (i * 137.508) * Math.PI / 180;
      var r = 26 + ((i * 7919) % 34);
      p.style.setProperty('--dx', (Math.cos(a) * r).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * r - 10).toFixed(1) + 'px');
      p.style.setProperty('--dl', (0.15 + i * 0.045).toFixed(3) + 's');
    });

    var show = function () { svg.classList.add('is-on'); };
    requestAnimationFrame(function () { requestAnimationFrame(show); });
    setTimeout(show, 150); // страховка: во вкладке в фоне rAF не вызывается
  })();

  /* ────────────── шкала дня ────────────── */
  var DAY = {
    food: {
      rows: [
        { lab: 'Будни', cap: 'основной объём 16:00–20:00, пик 18:00–21:00',
          zones: [{ f: 16, t: 20, k: 'main' }, { f: 18, t: 21, k: 'peak' }] },
        { lab: 'Выходные', cap: 'весь день с 13:00',
          zones: [{ f: 13, t: 23, k: 'main' }] }
      ],
      big: '½',
      text: 'Пик готовой еды в будни' + NB + '— 18:00–21:00. Половина его приходится на время после 19:30, когда остаётся только сайт.',
      src: 'Источник: Т-Банк Бизнес, 2024; Чиббис, 2025: самый загруженный час' + NB + '— 18:00–19:00, 12,1% заказов за день'
    },
    groc: {
      rows: [
        { lab: 'Будни', cap: 'весь день ровно, без выраженного пика',
          zones: [{ f: 8, t: 23, k: 'main' }] },
        { lab: 'Выходные', cap: 'пик 11:00–15:00',
          zones: [{ f: 11, t: 15, k: 'peak' }] }
      ],
      big: '17%',
      text: 'опрошенных делают поздние заказы продуктов, после 21:00. В будни продукты заказывают ровно весь день, без выраженного пика, в выходные' + NB + '— днём.',
      src: 'Источник: Т-Банк Бизнес, 2024; Купер и Rambler&Co, 2026'
    },
    shop: {
      rows: [
        { lab: 'Все дни', cap: 'пик 17:00–21:00',
          zones: [{ f: 17, t: 21, k: 'peak' }] }
      ],
      big: '17–21',
      text: 'Вечером люди сами приходят в магазин. Лучшее время, чтобы кассир предложил поставить приложение.',
      src: 'Источник: Т-Банк Бизнес, 2024. Пиковые дни' + NB + '— среда, пятница и суббота'
    }
  };

  var H0 = 8, H1 = 23;
  function pos(h) { return ((h - H0) / (H1 - H0)) * 100; }

  (function dayScale() {
    var host = $('#dayRows');
    if (!host) return;

    var scale = $('.day__scale');
    var marks = doc.createElement('div');
    marks.className = 'day__marks';
    marks.setAttribute('aria-hidden', 'true');
    marks.innerHTML =
      '<span class="mk" style="left:' + pos(19.5).toFixed(3) + '%">19:30</span>' +
      '<span class="mk" style="left:' + pos(22).toFixed(3) + '%">22:00</span>';
    scale.insertBefore(marks, host);

    var noteBig = $('.day__big'), noteTxt = $('.day__text'), srcEl = $('#daySrc');

    function build(mode) {
      var d = DAY[mode];
      host.innerHTML = '';

      d.rows.forEach(function (r) {
        var row = doc.createElement('div');
        row.className = 'drow';

        var zones = r.zones.map(function (z) {
          return '<span class="drow__zone drow__zone--' + z.k + '" style="left:' + pos(z.f).toFixed(3) +
            '%;width:' + (pos(z.t) - pos(z.f)).toFixed(3) + '%"></span>';
        }).join('');

        row.innerHTML =
          '<span class="drow__lab">' + r.lab + '</span>' +
          '<div class="drow__track">' + zones +
          '<span class="drow__gap" style="left:' + pos(19.5).toFixed(3) + '%;width:' +
          (pos(22) - pos(19.5)).toFixed(3) + '%"></span>' +
          '<span class="drow__close" style="left:' + pos(22).toFixed(3) + '%"></span>' +
          '</div>' +
          '<span class="drow__cap">' + r.cap + '</span>';

        host.appendChild(row);
      });

      noteBig.textContent = d.big;
      noteTxt.textContent = d.text;
      srcEl.textContent = d.src;

      $$('.drow__zone', host).forEach(function (z, i) {
        setTimeout(function () { z.classList.add('is-on'); }, reduced ? 0 : 60 + i * 110);
      });
    }

    var tabs = $$('.day__tab');
    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-pressed', 'false'); });
        tab.classList.add('is-on');
        tab.setAttribute('aria-pressed', 'true');
        build(tab.getAttribute('data-mode'));
      });
      tab.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!n) return;
        e.preventDefault();
        var next = tabs[(idx + n + tabs.length) % tabs.length];
        next.focus(); next.click();
      });
    });

    build('food');
  })();

  /* ────────────── дни недели ────────────── */
  (function week() {
    var chart = $('#weekChart');
    if (!chart) return;
    var bars = $$('.week__bar', chart);
    var max = 22;

    function draw() {
      bars.forEach(function (b, i) {
        var hi = parseFloat(b.getAttribute('data-hi'));
        b.style.setProperty('--h', (hi / max * 100).toFixed(2) + '%');
        b.style.setProperty('--d', reduced ? '0s' : (0.05 + i * 0.07).toFixed(2) + 's');
      });
    }
    if (io) onReveal(function (t) { if (t === chart) draw(); });
    else draw();
    if (io) io.observe(chart);
  })();

  /* ────────────── калькулятор ────────────── */
  (function calc() {
    var iOrders = $('#iOrders'), iCheck = $('#iCheck'), iMargin = $('#iMargin'), iBonus = $('#iBonus');
    if (!iOrders) return;

    var vOrders = $('#vOrders'), vCheck = $('#vCheck'), vMargin = $('#vMargin'), vBonus = $('#vBonus');
    var rProfit = $('#rProfit'), rPayback = $('#rPayback');
    var out = {
      check: $('#rCheck'), nw: $('#rNew'), hours: $('#rHours'),
      refuse: $('#rRefuse'), err: $('#rErr'), bonus: $('#rBonus')
    };

    var INVEST = 661300;
    var RAMP = [0.3, 0.55, 0.75, 0.9];

    function model(orders, avg, markup, bonusPct) {
      var N = orders * 30;
      var m = markup / (100 + markup);
      var app = N * 0.5;

      var chk = app * avg * 0.15 * m;
      var nw = N * 0.06 * avg * m;
      var hours = N * (67 / 3000) * avg * m;
      var refuse = N * 0.015 * avg * m;
      var err = N * 0.015 * 500;

      var gross = chk + nw + hours + refuse + err;
      var bonus = app * avg * 1.15 * (bonusPct / 100) * 0.6;

      var monthly = gross - bonus;

      // накопление по месяцам
      var net = gross - bonus;
      var cum = [], acc = 0, payback = null;
      for (var i = 1; i <= 12; i++) {
        var share = i <= 4 ? RAMP[i - 1] : 1;
        var add = net * share;
        var prev = acc;
        acc += add;
        cum.push(acc);
        if (payback === null && acc >= INVEST && add > 0) {
          payback = (i - 1) + (INVEST - prev) / add;
        }
      }

      return {
        chk: chk, nw: nw, hours: hours, refuse: refuse, err: err,
        bonus: bonus, monthly: monthly, cum: cum, payback: payback
      };
    }

    function render() {
      var orders = +iOrders.value, avg = +iCheck.value, markup = +iMargin.value, bonusPct = +iBonus.value;

      vOrders.textContent = String(orders);
      vCheck.textContent = money(avg);
      vMargin.textContent = markup + '%';
      vBonus.textContent = String(bonusPct).replace('.', ',') + '%';

      var r = model(orders, avg, markup, bonusPct);

      rProfit.textContent = money(r.monthly);
      rPayback.textContent = r.payback === null
        ? 'больше 12' + NB + 'мес'
        : dec1(r.payback) + NB + 'мес';

      out.check.textContent = signed(r.chk);
      out.nw.textContent = signed(r.nw);
      out.hours.textContent = signed(r.hours);
      out.refuse.textContent = signed(r.refuse);
      out.err.textContent = signed(r.err);
      out.bonus.textContent = signed(-r.bonus);

      var pr = $('#calcPrint');
      if (pr) {
        pr.innerHTML =
          '<span>Заказов доставки в день&nbsp;— <b>' + orders + '</b></span>' +
          '<span>Средний чек&nbsp;— <b>' + money(avg) + '</b></span>' +
          '<span>Средняя наценка&nbsp;— <b>' + markup + '%</b></span>' +
          '<span>Бонусы покупателям&nbsp;— <b>' + String(bonusPct).replace('.', ',') + '%</b></span>';
      }

      drawChart(r);
    }

    /* график накопленной выгоды */
    var svg = $('#chart');
    var drawn = false;

    function drawChart(r) {
      if (!svg) return;
      svg.removeAttribute('preserveAspectRatio');

      var W = Math.max(260, svg.clientWidth || svg.parentNode.clientWidth || 320);
      var H = window.innerWidth >= 960 ? 220 : 180;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.height = H + 'px';

      var padL = 8, padR = 8, padT = 16, padB = 8;
      var innerW = W - padL - padR, innerH = H - padT - padB;

      var maxV = Math.max(r.cum[r.cum.length - 1], INVEST) * 1.1;
      var minV = Math.min(0, r.cum[0]);
      var span = maxV - minV || 1;

      function X(i) { return padL + (i / 11) * innerW; }
      function Y(v) { return padT + innerH - ((v - minV) / span) * innerH; }

      var line = r.cum.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
      var area = line + ' L' + X(11).toFixed(1) + ',' + Y(minV).toFixed(1) + ' L' + X(0).toFixed(1) + ',' + Y(minV).toFixed(1) + ' Z';
      var yInv = Y(INVEST);

      var payX = r.payback !== null ? X(Math.max(0, Math.min(11, r.payback))) : null;

      var html =
        '<path d="' + area + '" fill="rgba(206,27,35,.16)"></path>' +
        '<line x1="' + padL + '" y1="' + yInv.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + yInv.toFixed(1) +
        '" stroke="rgba(255,255,255,.45)" stroke-width="1" stroke-dasharray="4 4"></line>' +
        '<text x="' + padL + '" y="' + (yInv - 7).toFixed(1) + '" fill="rgba(255,255,255,.62)" font-size="13" font-family="Golos, sans-serif">вложения ' +
        INVEST.toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽</text>' +
        (payX !== null
          ? '<line x1="' + payX.toFixed(1) + '" y1="' + padT + '" x2="' + payX.toFixed(1) + '" y2="' + (H - padB) +
            '" stroke="rgba(255,255,255,.28)" stroke-width="1"></line>' +
            '<circle cx="' + payX.toFixed(1) + '" cy="' + yInv.toFixed(1) + '" r="4.5" fill="#CE1B23" stroke="#fff" stroke-width="2"></circle>'
          : '') +
        '<path class="chart__line" d="' + line + '" fill="none" stroke="#CE1B23" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>';

      svg.innerHTML = html;

      if (!drawn && !reduced) {
        var p = $('.chart__line', svg);
        var len = p.getTotalLength ? p.getTotalLength() : 0;
        if (len) {
          p.style.strokeDasharray = len;
          p.style.strokeDashoffset = len;
          var run = function () {
            p.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.22,.7,.28,1)';
            p.style.strokeDashoffset = '0';
          };
          requestAnimationFrame(run);
          setTimeout(run, 120);
          // страховка: линия обязана стать видимой, даже если анимация не отработала
          setTimeout(function () { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; }, 2000);
        }
      }
      drawn = true;
    }

    [iOrders, iCheck, iMargin, iBonus].forEach(function (i) {
      i.addEventListener('input', render);
      i.addEventListener('change', render);
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { drawn = true; render(); }, 180);
    });

    // первая отрисовка графика — когда блок появился
    var calcBox = $('.calc');
    if (io && calcBox) {
      onReveal(function (t) { if (t === calcBox) { drawn = false; render(); } });
    }
    render();
  })();

  /* ────────────── печать: раскрыть «Как считается» ────────────── */
  var how = $('.how');
  if (how) {
    var wasOpen = false;
    window.addEventListener('beforeprint', function () { wasOpen = how.open; how.open = true; });
    window.addEventListener('afterprint', function () { how.open = wasOpen; });
  }
})();
