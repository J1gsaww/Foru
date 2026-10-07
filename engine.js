/* ============================================================
   engine.js — ตัวเล่นบท (ไม่ต้องแก้ถ้าแค่จะเปลี่ยนคำพูด)
   ============================================================ */
(() => {
  const $ = (s) => document.querySelector(s);
  const app = $('#app');
  const scenesEl = $('#scenes');
  const box = $('#box');
  const nameEl = $('#name');
  const linesEl = $('#lines');
  const tapHint = $('#tapHint');
  const choicesEl = $('#choices');
  const shoesEl = $('#shoes');
  const logEl = $('#log');
  const logBody = $('#logBody');

  const flags = {};
  let sceneEl = null;
  let busyLines = null;      // ฟังก์ชันโชว์ทุกบรรทัดทันที (ถ้ายังค่อย ๆ ขึ้นอยู่)
  let tapResolver = null;
  let lastRender = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const CLICK_DELAY = 700; // ปุ่ม/ตัวเลือกกดได้หลังขึ้นมาแล้ว 0.7 วิ กันกดพลาด
  const tooSoon = (t) => performance.now() - t < CLICK_DELAY;

  /* ---------------- ฉาก ---------------- */
  function showScene(name, instant, slow) {
    const cfg = SCENES[name];
    const el = document.createElement('div');
    el.className = 'scene fit-' + (cfg.fit || 'contain') + (cfg.fx ? ' fx-' + cfg.fx : '');
    el.innerHTML = `<div class="art"><img src="${cfg.img}" alt=""></div>`;
    app.style.backgroundColor = cfg.bg;
    if (instant) el.style.transition = 'none';
    else if (slow) el.style.transitionDuration = '3.5s';
    scenesEl.appendChild(el);
    const old = sceneEl;
    sceneEl = el;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add('on');
      if (old) {
        old.classList.remove('on');
        setTimeout(() => old.remove(), instant ? 0 : slow ? 3700 : 1800);
      }
    }));
  }

  function prop(id, on) {
    if (!sceneEl) return;
    if (id === 'p-pink') { sceneEl.classList.toggle('pink', on); return; }
    const el = sceneEl.querySelector('#' + id);
    if (el) el.classList.toggle('on', on);
  }

  /* ---------------- ข้อความ ---------------- */
  function addLog(who, text, type) {
    const d = document.createElement('div');
    d.className = 'entry ' + (type || '');
    if (who) {
      const b = document.createElement('b');
      b.textContent = who;
      d.appendChild(b);
    }
    d.appendChild(document.createTextNode(text));
    logBody.appendChild(d);
  }

  function renderText(step) {
    box.classList.remove('hidden', 'narr', 'speech', 'cat');
    // เล่นแอนิเมชันกล่องใหม่เฉพาะตอนเพิ่งโผล่
    const sp = step.s ? SPEAKERS[step.s] : null;
    nameEl.className = sp ? sp.cls : '';
    nameEl.textContent = sp ? sp.name : '';
    box.classList.add(sp ? 'speech' : step.cat ? 'cat' : 'narr');
    if (step.s === 'hydrangea') nod();

    const lines = step.t || step.n || step.cat;
    linesEl.innerHTML = '';
    tapHint.classList.remove('on');
    const ps = lines.map((t) => {
      const p = document.createElement('p');
      p.textContent = (step.cat ? '🐈 ' : '') + t;
      linesEl.appendChild(p);
      return p;
    });
    addLog(sp ? sp.name : '', lines.join('\n'), sp ? '' : 'narr');

    lastRender = performance.now();
    return new Promise((resolve) => {
      let i = 0;
      let timer;
      const finish = () => {
        clearTimeout(timer);
        ps.forEach((p) => p.classList.add('show'));
        busyLines = null;
        resolve();
      };
      const nextLine = () => {
        if (i >= ps.length) return finish();
        ps[i++].classList.add('show');
        timer = setTimeout(nextLine, 900);
      };
      busyLines = finish;
      timer = setTimeout(nextLine, 120);
    });
  }

  function waitTap() {
    tapHint.classList.add('on');
    return new Promise((r) => { tapResolver = r; });
  }

  app.addEventListener('click', (e) => {
    if (e.target.closest('button, #log, #shoes, #title, #ending')) return;
    if (performance.now() - lastRender < 250) return;
    if (busyLines) { busyLines(); return; }
    if (tapResolver) {
      const r = tapResolver;
      tapResolver = null;
      tapHint.classList.remove('on');
      r();
    }
  });

  async function say(step) {
    await renderText(step);
    if (!step.keep) await waitTap();
  }

  /* ---------------- ปุ่ม / ตัวเลือก ---------------- */
  function single(label) {
    box.classList.add('hidden');
    choicesEl.innerHTML = '';
    return new Promise((resolve) => {
      const b = document.createElement('button');
      b.className = 'pill';
      b.textContent = label;
      const shownAt = performance.now();
      b.onclick = () => {
        if (tooSoon(shownAt)) return;
        sound.click();
        choicesEl.innerHTML = '';
        addLog('', '[' + label + ']', 'you');
        resolve();
      };
      choicesEl.appendChild(b);
    });
  }

  function choose(step) {
    choicesEl.innerHTML = '';
    tapHint.classList.remove('on');
    const shownAt = performance.now();
    return new Promise((resolve) => {
      step.opts.forEach((o, idx) => {
        const b = document.createElement('button');
        b.className = 'choice' + (o.action ? ' action' : '');
        b.textContent = o.action ? o.t : '“' + o.t + '”';
        b.onclick = () => {
          if (choicesEl.dataset.lock || tooSoon(shownAt)) return;
          choicesEl.dataset.lock = '1';
          sound.click();
          b.classList.add('picked');
          flags[step.choice] = idx;
          addLog('คุณบีม', o.t, 'you');
          setTimeout(() => {
            choicesEl.innerHTML = '';
            delete choicesEl.dataset.lock;
            resolve(o.then || []);
          }, 350);
        };
        choicesEl.appendChild(b);
      });
    });
  }

  function pickShoes() {
    const grid = shoesEl.querySelector('.shoes-grid');
    const ok = $('#shoeOk');
    grid.innerHTML = '';
    ok.disabled = true;
    box.classList.add('hidden');
    let sel = -1;
    const shownAt = performance.now();
    SHOES.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'shoe';
      b.innerHTML = `<img src="${s.img}" alt="${s.label}"><span>${s.label}</span>`;
      b.onclick = () => {
        if (tooSoon(shownAt)) return;
        sound.tick();
        sel = i;
        grid.querySelectorAll('.shoe').forEach((x, k) => x.classList.toggle('sel', k === i));
        ok.disabled = false;
      };
      grid.appendChild(b);
    });
    shoesEl.classList.remove('hidden');
    return new Promise((resolve) => {
      ok.onclick = () => {
        if (sel < 0) return;
        sound.click();
        flags.shoe = sel;
        addLog('คุณบีม', 'เลือก: ' + SHOES[sel].label, 'you');
        shoesEl.classList.add('hidden');
        resolve();
      };
    });
  }

  /* ---------------- เอฟเฟกต์ ---------------- */
  function nod() {
    if (!sceneEl || !sceneEl.classList.contains('fx-flower')) return;
    const img = sceneEl.querySelector('.art img');
    img.classList.remove('nod');
    void img.offsetWidth;
    img.classList.add('nod');
  }

  let petalTimer = null;
  function petals(on) {
    clearInterval(petalTimer);
    if (!on) return;
    const layer = $('#petals');
    const cols = ['#f8cdd7', '#fde4ea', '#ffffff', '#f4b9c6'];
    const spawn = () => {
      const p = document.createElement('div');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = cols[Math.floor(Math.random() * cols.length)];
      p.style.setProperty('--dx', (Math.random() * 120 - 30) + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      p.style.animationDuration = 9 + Math.random() * 7 + 's';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 17000);
    };
    spawn();
    petalTimer = setInterval(spawn, 1400);
  }

  let moteTimer = null;
  function motes(mode) {
    clearInterval(moteTimer);
    const layer = $('#motes');
    if (!mode) { layer.innerHTML = ''; return; }
    const spawn = () => {
      for (let k = 0; k < 3; k++) {
        const m = document.createElement('div');
        if (mode === 'in') {
          // แสงลอยเข้ามารวมกันที่อก (กลางภาพ)
          const a = Math.random() * Math.PI * 2, r = 160 + Math.random() * 120;
          m.className = 'mote in';
          m.style.left = '50%';
          m.style.top = '40%';
          m.style.setProperty('--dx', Math.cos(a) * r + 'px');
          m.style.setProperty('--dy', Math.sin(a) * r + 'px');
          m.style.animationDuration = 2.2 + Math.random() * 1.6 + 's';
        } else {
          m.className = 'mote';
          m.style.left = 30 + Math.random() * 40 + '%';
          m.style.top = 45 + Math.random() * 25 + '%';
          m.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
          m.style.setProperty('--dy', -(80 + Math.random() * 220) + 'px');
          m.style.animationDuration = 3 + Math.random() * 3 + 's';
        }
        layer.appendChild(m);
        setTimeout(() => m.remove(), 6500);
      }
    };
    spawn();
    moteTimer = setInterval(spawn, mode === 'in' ? 380 : 500);
  }

  /* ---------------- ตัวเล่นบท ---------------- */
  async function run(steps) {
    for (const st of steps) {
      if (st.bg) { showScene(st.bg, st.instant, st.slow); if (!st.instant) await sleep(st.slow ? 2600 : 1300); }
      else if ('amb' in st) sound.amb(st.amb);
      else if (st.sfx) sound[st.sfx]();
      else if (st.wait) await sleep(st.wait);
      else if (st.on) { prop(st.on, true); await sleep(500); }
      else if (st.off) prop(st.off, false);
      else if (st.eyes) {
        app.classList.toggle('eyes-closed', st.eyes === 'close');
        if (st.eyes === 'close') box.classList.add('hidden');
        await sleep(2400);
      }
      else if (st.swing) { const s = sceneEl && sceneEl.querySelector('#swing'); if (s) s.classList.toggle('high', st.swing === 'high'); }
      else if (st.talk) nod();
      else if ('petals' in st) petals(st.petals);
      else if ('motes' in st) motes(st.motes);
      else if (st.n || st.s || st.cat) {
        app.classList.toggle('dark-ui', !!st.dark);
        await say(st);
      }
      else if (st.choice) { const then = await choose(st); await run(then); }
      else if (st.btn) await single(st.btn);
      else if (st.shoes) await pickShoes();
      else if (st.recap) await run(st.by[flags[st.recap]] || st.by[0]);
      else if ('white' in st) { if (st.white) box.classList.add('hidden'); $('#whiteout').classList.toggle('on', st.white); }
      else if (st.end) { $('#ending').classList.remove('hidden'); $('#hud').classList.remove('on'); }
    }
  }

  /* ---------------- เสียง (สังเคราะห์เอง ไม่ต้องมีไฟล์) ---------------- */
  const sound = (() => {
    let ctx = null, master = null, noiseBuf = null, muted = false;
    let ambNodes = [], ambTimers = [], pianoLoop = null;

    function init() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { // brown-ish noise นุ่ม ๆ
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }

    const now = () => ctx.currentTime;

    function noise(gainVal, filterType, freq, q = 0.7) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = filterType; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master);
      src.start();
      g.gain.linearRampToValueAtTime(gainVal, now() + 2.5);
      return { src, g };
    }

    function lfo(target, rate, depth) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = rate; g.gain.value = depth;
      o.connect(g); g.connect(target);
      o.start();
      return o;
    }

    function tone(freq, t0, dur, vol, type = 'sine') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.05);
    }

    function piano(freq, t0, vol = 0.12, dur = 2.2) {
      tone(freq, t0, dur, vol);
      tone(freq * 2, t0, dur * 0.6, vol * 0.35);
      tone(freq * 3, t0, dur * 0.35, vol * 0.12);
      tone(freq * 0.5, t0, dur * 0.8, vol * 0.15, 'triangle');
    }

    const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
    const LOW = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

    function musicBox(vol) {
      let alive = true;
      const play = () => {
        if (!alive || !ctx) return;
        const f = PENTA[Math.floor(Math.random() * PENTA.length)];
        piano(f, now() + 0.02, vol, 2.6);
        if (Math.random() < 0.35) piano(f / 2, now() + 0.02, vol * 0.6, 3);
        ambTimers.push(setTimeout(play, 1500 + Math.random() * 2200));
      };
      ambTimers.push(setTimeout(play, 1800));
      return () => { alive = false; };
    }

    function stopAmb() {
      ambTimers.forEach(clearTimeout); ambTimers = [];
      ambNodes.forEach((n) => {
        try {
          if (n.stop) n.stop();
          if (n.g) {
            n.g.gain.cancelScheduledValues(now());
            n.g.gain.setValueAtTime(n.g.gain.value, now());
            n.g.gain.linearRampToValueAtTime(0, now() + 1.5);
            n.src.stop(now() + 1.6);
          } else if (n.stopOsc) n.stopOsc.stop(now() + 1.6);
        } catch (e) {}
      });
      ambNodes = [];
    }

    function bird() {
      const t = now();
      for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        const t0 = t + k * 0.13;
        const base = 2600 + Math.random() * 900;
        o.frequency.setValueAtTime(base, t0);
        o.frequency.exponentialRampToValueAtTime(base * 1.35, t0 + 0.07);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.012, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
        o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.12);
      }
    }

    function amb(name) {
      if (!ctx) return;
      stopAmb();
      if (!name) return;
      if (name === 'lake') {
        const w = noise(0.05, 'lowpass', 420);
        ambNodes.push(w, { stopOsc: lfo(w.g.gain, 0.11, 0.025) });
        const air = noise(0.012, 'bandpass', 1200, 0.5);
        ambNodes.push(air);
      }
      if (name === 'garden') {
        const w = noise(0.02, 'bandpass', 700, 0.5);
        ambNodes.push(w, { stopOsc: lfo(w.g.gain, 0.07, 0.012) });
        ambNodes.push({ stop: musicBox(0.045) });
        const chirp = () => { bird(); ambTimers.push(setTimeout(chirp, 4000 + Math.random() * 6000)); };
        ambTimers.push(setTimeout(chirp, 2500));
      }
      if (name === 'room' || name === 'shop') {
        ambNodes.push(noise(0.008, 'lowpass', 300));
        ambNodes.push({ stop: musicBox(name === 'room' ? 0.04 : 0.035) });
      }
    }

    function thud(t, vol = 0.35, freq = 220) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t, Math.random() * 2); src.stop(t + 0.15);
    }

    function creak(t, dur = 0.5, vol = 0.025) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(190, t);
      o.frequency.linearRampToValueAtTime(140, t + dur);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 4;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.05);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    }

    const api = {
      init,
      amb,
      toggleMute() {
        muted = !muted;
        if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.1);
        return muted;
      },
      click() { if (ctx) piano(1046.5, now(), 0.05, 0.8); },
      tick() { if (ctx) piano(1318.5, now(), 0.04, 0.5); },
      steps() { if (!ctx) return; for (let i = 0; i < 4; i++) thud(now() + 0.1 + i * 0.45, 0.3, 200); },
      run() { if (!ctx) return; for (let i = 0; i < 8; i++) thud(now() + 0.05 + i * 0.22, 0.22, 380); },
      door() { if (!ctx) return; creak(now() + 0.05, 0.8, 0.03); },
      creak() { if (!ctx) return; creak(now() + 0.1, 0.35, 0.018); creak(now() + 1.3, 0.35, 0.015); },
      giggle() {
        if (!ctx) return;
        const seq = [1318.5, 1567.98, 1318.5, 1760, 1567.98];
        seq.forEach((f, i) => tone(f, now() + 0.05 + i * 0.09, 0.35, 0.03));
      },
      bell() {
        if (!ctx) return;
        [0, 0.16].forEach((d) => {
          tone(2637, now() + d, 1.4, 0.05);
          tone(3951, now() + d, 0.9, 0.025);
          tone(5274, now() + d, 0.5, 0.012);
        });
      },
      catPiano() {
        if (!ctx) return;
        clearTimeout(pianoLoop);
        const step = () => {
          piano(LOW[Math.floor(Math.random() * LOW.length)] * (Math.random() < 0.3 ? 2 : 1), now() + 0.02, 0.09, 2);
          pianoLoop = setTimeout(step, 380 + Math.random() * 520);
        };
        step();
      },
      pianoStop() { clearTimeout(pianoLoop); pianoLoop = null; },
      lastNote() { if (!ctx) return; this.pianoStop(); piano(523.25, now() + 0.1, 0.14, 4.5); piano(783.99, now() + 0.1, 0.05, 4); },
    };
    return api;
  })();

  /* ---------------- ปุ่มต่าง ๆ ---------------- */
  $('#muteBtn').onclick = () => {
    const m = sound.toggleMute();
    $('#muteBtn').textContent = m ? '🔈' : '🔊';
  };
  $('#logBtn').onclick = () => {
    logEl.classList.remove('hidden');
    logBody.scrollTop = logBody.scrollHeight;
  };
  $('#logClose').onclick = () => logEl.classList.add('hidden');
  $('#againBtn').onclick = () => location.reload();

  $('#startBtn').onclick = () => {
    sound.init();
    $('#title').classList.add('gone');
    setTimeout(() => $('#title').remove(), 1500);
    $('#hud').classList.add('on');
    Object.values(SCENES).forEach((c) => { const i = new Image(); i.src = c.img; });
    run(STORY);
  };

  // โหมดทดสอบ: เปิด index.html?jump=ฉาก เพื่อข้ามไปฉากนั้น (garden / shop / lake / end)
  const jump = new URLSearchParams(location.search).get('jump');
  if (jump) {
    const marks = { garden: { bg: 'garden' }, shop: { bg: 'store' }, lake: { btn: 'ไปที่ทะเลสาบ' }, end: { btn: 'เดินไปหาทั้งสองคน' } };
    const m = marks[jump];
    const idx = m ? STORY.findIndex((s) => Object.keys(m).every((k) => s[k] === m[k])) : -1;
    if (idx > 0) {
      flags.intro = 0; flags.swing = 0; flags.grow = 0; flags.smile = 0; flags.ask = 0; flags.shoe = 0; flags.lake = 0;
      STORY.splice(0, idx);
      if (jump === 'lake' || jump === 'end') STORY.unshift({ bg: 'storein', instant: true });
      if (jump === 'end') {
        const k = STORY.findIndex((s) => s.btn === 'เดินไปหาทั้งสองคน');
        STORY.splice(1, k - 1, { bg: 'piano' });
      }
    }
  }
})();
