/* TwoHearts prototype. Every drawing event is AES-GCM encrypted before it is relayed. */
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  const statusEl = $('status');
  const sharelink = $('sharelink');
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  let roomId = null;      // random public room id (used as channel name and AAD)
  let keyBytes = null;    // 256-bit secret, lives only in memory
  let cryptoKey = null;
  let client = null;
  let channel = null;
  let ready = false;      // true only after the channel reports SUBSCRIBED
  let outbox = Promise.resolve();  // keeps outgoing strokes in order
  let inbox = Promise.resolve();   // keeps incoming strokes in order
  let drawing = false;
  let last = null;
  let eraseMode = false;
  let cssW = 0, cssH = 0;

  const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  };
  const randomBytes = n => crypto.getRandomValues(new Uint8Array(n));

  // Only constant strings are passed to setStatus, never user input.
  const setStatus = html => { statusEl.innerHTML = html; };

  // ---------- canvas ----------
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const snap = document.createElement('canvas');
    snap.width = canvas.width;
    snap.height = canvas.height;
    if (snap.width) snap.getContext('2d').drawImage(canvas, 0, 0);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (snap.width) ctx.drawImage(snap, 0, 0, rect.width, rect.height);
    cssW = rect.width;
    cssH = rect.height;
  }
  new ResizeObserver(resizeCanvas).observe(canvas);

  function drawSegment(a, b, style) {
    ctx.save();
    ctx.globalCompositeOperation = style.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.beginPath();
    ctx.moveTo(a.x * cssW, a.y * cssH);
    ctx.lineTo(b.x * cssW, b.y * cssH);
    ctx.stroke();
    ctx.restore();
  }

  function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // ---------- crypto ----------
  // The room id is bound as additional authenticated data, so a packet
  // from another room cannot be replayed into this one.
  async function encryptObject(obj) {
    const iv = randomBytes(12);
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: enc.encode(roomId) },
      cryptoKey,
      enc.encode(JSON.stringify(obj))
    );
    return { v: 2, iv: b64u(iv), cipher: b64u(cipher) };
  }

  async function decryptObject(packet) {
    if (packet.v !== 2 || typeof packet.iv !== 'string' || typeof packet.cipher !== 'string') {
      throw new Error('bad packet');
    }
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64u(packet.iv), additionalData: enc.encode(roomId) },
      cryptoKey,
      unb64u(packet.cipher)
    );
    return JSON.parse(dec.decode(plain));
  }

  async function importKey(raw) {
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  // ---------- rooms ----------
  function updateLink() {
    if (roomId && keyBytes) {
      sharelink.textContent = location.origin + location.pathname
        + '?room=' + encodeURIComponent(roomId) + '#key=' + b64u(keyBytes);
      $('copyInvite').disabled = false;
    } else {
      sharelink.textContent = 'Create a room to make a link.';
      $('copyInvite').disabled = true;
    }
  }

  async function createRoom() {
    roomId = b64u(randomBytes(18));
    keyBytes = randomBytes(32);
    cryptoKey = await importKey(keyBytes);
    updateLink();
    setStatus('<strong>Private room created.</strong> Copy the invite link and send it privately to your partner.');
  }

  async function loadRoomFromUrl() {
    const room = new URLSearchParams(location.search).get('room');
    const keyParam = new URLSearchParams(location.hash.slice(1)).get('key');
    if (!room || !keyParam) return;
    try {
      const raw = unb64u(keyParam);
      if (raw.length !== 32) throw new Error('bad key');
      roomId = room;
      keyBytes = raw;
      cryptoKey = await importKey(raw);
      updateLink();
      setStatus('<strong>Room loaded.</strong> Connect sync below to exchange drawings.');
    } catch (e) {
      setStatus('<strong>Could not open room.</strong> The invite link may be incomplete.');
    }
    // Remove the key from the address bar so it isn't left in history.
    history.replaceState(null, '', location.pathname + location.search);
  }

  // ---------- sync ----------
  function enqueue(obj) {
    if (!cryptoKey) return;
    outbox = outbox.then(async () => {
      const packet = await encryptObject(obj);
      if (ready && channel) {
        const result = await channel.send({ type: 'broadcast', event: 'encrypted-doodle', payload: packet });
        if (result !== 'ok') setStatus('<strong>Drawing saved locally.</strong> Sync send failed; check the connection.');
      }
    }).catch(() => setStatus('<strong>Drawing saved locally.</strong> Sync send failed.'));
  }

  function sanitizeStyle(s) {
    const color = typeof s.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#000000';
    const width = Math.min(40, Math.max(1, Number(s.width) || 5));
    return { color, width, erase: !!s.erase };
  }
  const validPoint = p => p && typeof p.x === 'number' && typeof p.y === 'number'
    && p.x >= -0.5 && p.x <= 1.5 && p.y >= -0.5 && p.y <= 1.5;

  function receive(packet) {
    inbox = inbox.then(async () => {
      try {
        const obj = await decryptObject(packet);
        if (obj.type === 'line' && validPoint(obj.a) && validPoint(obj.b)) {
          drawSegment(obj.a, obj.b, sanitizeStyle(obj.style || {}));
        } else if (obj.type === 'clear') {
          clearCanvas();
        }
      } catch (e) {
        setStatus('<strong>Ignored a message</strong> that could not be decrypted. Check both of you use the same invite link.');
      }
    });
  }

  async function disconnect(quiet) {
    ready = false;
    if (channel && client) {
      try { await client.removeChannel(channel); } catch (e) { /* ignore */ }
    }
    channel = null;
    client = null;
    if (!quiet) setStatus('<strong>Disconnected.</strong> Drawings stay local until you reconnect.');
  }

  async function connect() {
    if (!cryptoKey) {
      alert('Create a room or open your partner’s invite link first.');
      return;
    }
    const url = $('supabaseUrl').value.trim();
    const key = $('supabaseKey').value.trim();
    let parsed;
    try { parsed = new URL(url); } catch (e) { parsed = null; }
    if (!parsed || parsed.protocol !== 'https:' || !key) {
      alert('Enter your Supabase project URL (https://…) and public anon/publishable key.');
      return;
    }
    if (!window.supabase) {
      alert('Could not load the sync library. Check your internet connection.');
      return;
    }
    await disconnect(true);
    localStorage.setItem('th_url', url);  // the key is never stored
    $('supabaseKey').value = '';
    try {
      client = window.supabase.createClient(url, key, { auth: { persistSession: false } });
      channel = client.channel('twohearts-' + roomId, { config: { broadcast: { self: false } } });
      channel.on('broadcast', { event: 'encrypted-doodle' }, ({ payload }) => receive(payload));
      channel.subscribe(state => {
        if (state === 'SUBSCRIBED') {
          ready = true;
          setStatus('<strong>Connected.</strong> Drawings now sync with your partner’s phone.');
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
          ready = false;
          setStatus('<strong>Sync connection failed.</strong> Check your Supabase settings and the setup guide.');
        } else if (state === 'CLOSED') {
          ready = false;
        }
      });
    } catch (e) {
      setStatus('<strong>Could not connect.</strong> Verify your Supabase project URL and public key.');
    }
  }

  // ---------- drawing input ----------
  const norm = e => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  canvas.addEventListener('pointerdown', e => {
    drawing = true;
    last = norm(e);
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', e => {
    if (!drawing || !last) return;
    const p = norm(e);
    const style = { color: eraseMode ? '#000000' : $('color').value, width: Number($('size').value), erase: eraseMode };
    drawSegment(last, p, style);
    enqueue({ type: 'line', a: last, b: p, style });
    last = p;  // updated synchronously so fast strokes stay continuous
  });

  const endDraw = () => { drawing = false; last = null; };
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);

  // ---------- buttons ----------
  $('newRoom').onclick = createRoom;

  $('copyInvite').onclick = async () => {
    try {
      await navigator.clipboard.writeText(sharelink.textContent);
      setStatus('<strong>Invite link copied.</strong> Send it only to your partner.');
    } catch (e) {
      setStatus('<strong>Copy blocked.</strong> Long-press the invite link text and copy it.');
    }
  };

  $('erase').onclick = () => {
    eraseMode = !eraseMode;
    $('erase').textContent = eraseMode ? 'Eraser on' : 'Eraser';
  };

  $('clear').onclick = () => {
    clearCanvas();
    enqueue({ type: 'clear' });
  };

  $('save').onclick = () => {
    const a = document.createElement('a');
    a.download = 'twohearts-doodle.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  $('sendTest').onclick = async () => {
    if (!cryptoKey) { alert('Create or open a room first.'); return; }
    const p = await encryptObject({ type: 'test', message: 'Encryption test' });
    const q = await decryptObject(p);
    alert(q.message === 'Encryption test'
      ? 'AES-GCM encrypt/decrypt test passed on this device. This does not audit the whole app.'
      : 'Test failed.');
  };

  $('connect').onclick = connect;
  $('disconnect').onclick = () => disconnect(false);

  $('supabaseUrl').value = localStorage.getItem('th_url') || '';

  loadRoomFromUrl();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
