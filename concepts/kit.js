// Shared helpers for the homepage concepts: menu data, the table (same storage key as menu.html),
// Khabarovsk opening hours, booking sheet, phone action bar.
(function(){
  var M = window.MENU || {dishes: [], sections: []};
  var byId = {}; M.dishes.forEach(function(d){ byId[d.id] = d; });
  var K = window.KIT = {M: M, byId: byId};
  K.rub = function(n){ return n.toLocaleString('ru-RU') + ' ₽'; };
  K.minP = function(d){ return Math.min.apply(null, d.vars.map(function(v){ return v.p; })); };
  K.img = function(id, big){ var d = byId[id]; return d && d.img ? '../img/menu/' + (big ? 'd/' : 't/') + d.img + '.jpg' : ''; };

  // table shared with menu.html
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem('sherali-cart2') || '{}') || {}; } catch (e) {}
  K.cart = cart;
  K.save = function(){ try { localStorage.setItem('sherali-cart2', JSON.stringify(cart)); } catch (e) {} K.paintCart(); };
  K.add = function(id, i, n){ var k = id + '|' + (i || 0); cart[k] = (cart[k] || 0) + (n || 1); K.save(); };
  K.qty = function(id){ var n = 0; for (var k in cart) if (k.split('|')[0] === id) n += cart[k]; return n; };
  K.totals = function(){ var n = 0, s = 0; for (var k in cart){ var p = k.split('|'), d = byId[p[0]]; if (!d) continue; var v = d.vars[+p[1]] || d.vars[0]; n += cart[k]; s += v.p * cart[k]; } return {n: n, sum: s}; };
  K.paintCart = function(){ var t = K.totals(); document.querySelectorAll('[data-cart-n]').forEach(function(el){ el.hidden = !t.n; el.textContent = t.n; }); };

  // Khabarovsk time (UTC+10)
  var now = new Date(Date.now() + (new Date().getTimezoneOffset() + 600) * 60000);
  var day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
  var close = {0: 1440, 1: 1320, 2: 1320, 3: 1320, 4: 1440, 5: 1560, 6: 1560};
  var hhmm = function(x){ x = x % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
  var prev = (day + 6) % 7, open = false, until = 0;
  if (min >= 720 && min < close[day]) { open = true; until = close[day]; }
  else if (min < close[prev] - 1440) { open = true; until = close[prev] - 1440; }
  K.time = {now: now, day: day, min: min, open: open, until: open ? hhmm(until) : '', karaokeDay: [0, 4, 5, 6].indexOf(day) > -1, closeToday: hhmm(close[day]), hhmm: hhmm};
  K.time.karaokeNow = K.time.karaokeDay && open && (min >= 1140 || min < 360);

  var tt;
  K.toast = function(t){ var el = document.getElementById('toast'); if (!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(function(){ el.classList.remove('on'); }, 1700); };

  // booking sheet (prototype: nothing is sent)
  K.book = function(preset){
    var sh = document.getElementById('bookSheet');
    if (!sh) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="shade" id="shade"></div><section class="sheet" id="bookSheet" role="dialog" aria-modal="true" aria-label="Бронь">' +
        '<button class="x" data-close aria-label="Закрыть">×</button><form id="bookF" novalidate><h3>Бронь стола</h3><p class="muted" style="font-size:14px">Администратор подтвердит по телефону или в мессенджере.</p>' +
        '<div class="seg" id="bWhat"><button type="button" class="on">Ужин</button><button type="button">Караоке-вечер</button><button type="button">Праздник</button></div>' +
        '<div class="g2"><label class="fld"><span>Дата</span><input type="date" name="date"></label><label class="fld"><span>Гостей</span><select name="g"><option>2</option><option>3</option><option selected>4</option><option>5–6</option><option>7–10</option><option>Больше 10</option></select></label></div>' +
        '<div class="seg" id="bTime"></div>' +
        '<div class="g2"><label class="fld"><span>Имя</span><input name="name" autocomplete="given-name"></label><label class="fld"><span>Телефон</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7"></label></div>' +
        '<button class="btn btn-gold" style="width:100%;margin-top:6px">Забронировать</button><p class="proto">Прототип: заявка никуда не отправляется.</p></form>' +
        '<div id="bookOk" hidden style="text-align:center;padding:30px 0"><div style="font-size:44px">✅</div><h3>Заявка принята</h3><p class="muted">Администратор свяжется с вами для подтверждения.</p></div></section>');
      sh = document.getElementById('bookSheet');
      var f = document.getElementById('bookF');
      f.date.min = f.date.value = now.toISOString().slice(0, 10);
      document.getElementById('bTime').innerHTML = ['13:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(function(t, i){ return '<button type="button"' + (t === '19:00' ? ' class="on"' : '') + '>' + t + '</button>'; }).join('');
      sh.addEventListener('click', function(e){
        var b = e.target.closest('.seg button'); if (b){ b.parentNode.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); }); }
        if (e.target.closest('[data-close]')) K.unbook();
      });
      document.getElementById('shade').addEventListener('click', K.unbook);
      f.addEventListener('submit', function(e){ e.preventDefault(); if (f.phone.value.replace(/\D/g, '').length < 10){ f.phone.focus(); f.phone.style.borderColor = 'var(--rose)'; return; } f.hidden = true; document.getElementById('bookOk').hidden = false; });
    }
    if (preset){ document.querySelectorAll('#bWhat button').forEach(function(b){ b.classList.toggle('on', b.textContent === preset); }); }
    document.getElementById('bookF').hidden = false; document.getElementById('bookOk').hidden = true;
    sh.classList.add('on'); document.getElementById('shade').classList.add('on'); document.body.classList.add('lock');
  };
  K.unbook = function(){ var sh = document.getElementById('bookSheet'); if (!sh) return; sh.classList.remove('on'); document.getElementById('shade').classList.remove('on'); document.body.classList.remove('lock'); };
  addEventListener('keydown', function(e){ if (e.key === 'Escape') K.unbook(); });

  document.addEventListener('click', function(e){ var b = e.target.closest('[data-book]'); if (b){ e.preventDefault(); K.book(b.dataset.book || ''); } });
  addEventListener('scroll', function(){ var t = document.querySelector('.top'); if (t) t.classList.toggle('solid', scrollY > 30); }, {passive: true});
  document.addEventListener('DOMContentLoaded', function(){ K.paintCart(); var t = document.querySelector('.top'); if (t) t.classList.toggle('solid', scrollY > 30); });
})();
