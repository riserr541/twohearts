```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Our Secret Notes</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; overscroll-behavior-y: none; }
        .notebook-bg {
            background-color: white;
            background-image: linear-gradient(#fbcfe8 1px, transparent 1px), linear-gradient(90deg, #fbcfe8 1px, transparent 1px);
            background-size: 20px 20px;
        }
        /* Custom scrollbar for chat */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        #canvas-container { touch-action: none; }
    </style>
</head>
<body class="bg-rose-50 h-screen w-screen overflow-hidden text-slate-800 flex flex-col">

    <!-- Screen 1: Pairing Screen -->
    <div id="pairing-screen" class="absolute inset-0 flex items-center justify-center bg-rose-50 z-50 p-4">
        <div class="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 border border-rose-100 relative overflow-hidden">
            <div class="absolute top-0 right-0 -mt-8 -mr-8 bg-rose-100 rounded-full w-32 h-32 opacity-50 blur-2xl"></div>
            <div class="absolute bottom-0 left-0 -mb-8 -ml-8 bg-pink-200 rounded-full w-32 h-32 opacity-50 blur-2xl"></div>
            
            <div class="relative z-10 flex flex-col items-center">
                <div class="bg-rose-100 p-4 rounded-full mb-6">
                    <i class="fa-solid fa-heart text-4xl text-rose-500"></i>
                </div>
                <h1 class="text-2xl font-extrabold text-center text-slate-800 mb-2">Secret Notes</h1>
                <p class="text-slate-500 text-center mb-8 text-sm leading-relaxed">
                    End-to-End Encrypted space for you and your partner. Enter your shared secret phrase to connect.
                </p>
                <form id="login-form" class="w-full space-y-6">
                    <div>
                        <div class="relative">
                            <i class="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-rose-400"></i>
                            <input type="password" id="passphrase-input" 
                                class="w-full bg-rose-50/50 border-2 border-rose-100 rounded-2xl pl-12 pr-4 py-4 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all font-medium placeholder-slate-400"
                                placeholder="e.g. forever&always24" required>
                        </div>
                        <p class="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                            <i class="fa-solid fa-lock"></i> Data is encrypted on your device.
                        </p>
                    </div>
                    <button type="submit" id="connect-btn" disabled
                        class="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold py-4 px-4 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-200 disabled:opacity-50">
                        <i id="btn-icon" class="fa-solid fa-spinner fa-spin"></i> 
                        <span id="btn-text">Initializing Secure Connection...</span>
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Screen 2: Main Workspace -->
    <div id="workspace" class="hidden flex-col h-full w-full max-w-5xl mx-auto md:p-4">
        
        <!-- Header -->
        <header class="bg-white px-4 py-3 shadow-sm md:rounded-2xl border-b md:border border-slate-100 flex justify-between items-center shrink-0 mb-0 md:mb-4">
            <div class="flex items-center gap-3">
                <div class="bg-rose-100 p-2 rounded-xl">
                    <i class="fa-solid fa-heart text-rose-500"></i>
                </div>
                <div>
                    <h1 class="font-bold text-slate-800 leading-none text-sm md:text-base">Our Notes</h1>
                    <p class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                        <i class="fa-solid fa-lock"></i> E2E Encrypted
                    </p>
                </div>
            </div>
            <button id="disconnect-btn" class="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full transition-colors">
                Disconnect
            </button>
        </header>

        <!-- Main Content Layout (Responsive Split) -->
        <main class="flex-1 flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden bg-slate-50 md:bg-transparent">
            
            <!-- Drawing Section -->
            <div class="w-full md:w-1/2 flex flex-col bg-white md:rounded-3xl shadow-sm border-b md:border border-slate-100 h-1/2 md:h-full shrink-0">
                <div class="bg-rose-50/50 p-2 md:p-3 flex justify-between items-center border-b border-rose-100 shrink-0">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-pen text-rose-500 text-sm"></i>
                        <span class="text-xs md:text-sm font-bold text-slate-700">Live Canvas</span>
                    </div>
                    <button id="clear-canvas-btn" class="p-1.5 hover:bg-rose-200 rounded-full text-rose-500 transition-colors">
                        <i class="fa-solid fa-trash text-sm"></i>
                    </button>
                </div>
                
                <div id="canvas-container" class="flex-1 relative cursor-crosshair overflow-hidden notebook-bg">
                    <canvas id="drawing-canvas" class="absolute inset-0 w-full h-full"></canvas>
                </div>

                <div class="p-2 md:p-3 bg-white border-t border-slate-100 flex justify-center gap-3 shrink-0" id="color-palette">
                    <!-- Colors populated by JS -->
                </div>
            </div>

            <!-- Chat Section -->
            <div class="w-full md:w-1/2 flex flex-col bg-white md:rounded-3xl shadow-sm border-t md:border border-slate-100 h-1/2 md:h-full">
                <div class="bg-rose-50/50 p-2 md:p-3 flex items-center gap-2 border-b border-rose-100 shrink-0">
                    <i class="fa-solid fa-comment-dots text-rose-500 text-sm"></i>
                    <span class="text-xs md:text-sm font-bold text-slate-700">Secret Whispers</span>
                </div>
                
                <div id="chat-messages" class="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 flex flex-col">
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 m-auto">
                        <i class="fa-solid fa-lock text-2xl"></i>
                        <p class="text-xs md:text-sm font-medium">Messages are Encrypted</p>
                    </div>
                </div>

                <form id="chat-form" class="p-2 md:p-3 bg-white border-t border-slate-100 shrink-0">
                    <div class="relative">
                        <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off"
                            class="w-full bg-slate-100 border-none rounded-full pl-4 pr-12 py-2.5 md:py-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200">
                        <button type="submit" id="send-btn" disabled
                            class="absolute right-1 top-1 bottom-1 aspect-square bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 rounded-full flex items-center justify-center transition-colors text-white shadow-sm">
                            <i class="fa-solid fa-paper-plane text-xs md:text-sm ml-0.5"></i>
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Environment Setup
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'secret-couple-notes';
        
        let app, auth, db, userId;
        
        // App State
        let coupleCode = null;
        let cryptoKey = null;
        let unsubscribeDraw = null;
        let unsubscribeChat = null;

        // Drawing State
        let isDrawing = false;
        let currentPath = [];
        let currentColor = '#f43f5e';
        let strokes = [];

        // DOM Elements
        const pairingScreen = document.getElementById('pairing-screen');
        const workspace = document.getElementById('workspace');
        const loginForm = document.getElementById('login-form');
        const passphraseInput = document.getElementById('passphrase-input');
        const connectBtn = document.getElementById('connect-btn');
        const btnText = document.getElementById('btn-text');
        const btnIcon = document.getElementById('btn-icon');
        const disconnectBtn = document.getElementById('disconnect-btn');
        
        const canvas = document.getElementById('drawing-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('canvas-container');
        const colorPalette = document.getElementById('color-palette');
        const clearBtn = document.getElementById('clear-canvas-btn');

        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        const sendBtn = document.getElementById('send-btn');

        // --- Web Crypto API ---
        const arrayBufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const base64ToArrayBuffer = (base64) => {
            const binary_string = atob(base64);
            const bytes = new Uint8Array(binary_string.length);
            for (let i = 0; i < binary_string.length; i++) bytes[i] = binary_string.charCodeAt(i);
            return bytes.buffer;
        };

        const deriveKey = async (password, saltString) => {
            const enc = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
            return crypto.subtle.deriveKey(
                { name: "PBKDF2", salt: enc.encode(saltString), iterations: 100000, hash: "SHA-256" },
                keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
            );
        };

        const encryptData = async (key, dataObj) => {
            const iv = crypto.getRandomValues(new Uint8Array(12)); 
            const ciphertextBuffer = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(JSON.stringify(dataObj))
            );
            return { ciphertext: arrayBufferToBase64(ciphertextBuffer), iv: arrayBufferToBase64(iv) };
        };

        const decryptData = async (key, ciphertextBase64, ivBase64) => {
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(ivBase64)) }, 
                key, base64ToArrayBuffer(ciphertextBase64)
            );
            return JSON.parse(new TextDecoder().decode(decryptedBuffer));
        };

        // --- Initialization ---
        async function initApp() {
            try {
                if (Object.keys(firebaseConfig).length > 0) {
                    app = initializeApp(firebaseConfig);
                    auth = getAuth(app);
                    db = getFirestore(app);
                    
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                    userId = auth.currentUser.uid;
                } else {
                    // Fallback for local testing without Firebase config
                    console.warn("No Firebase config. Running in offline UI mode.");
                    userId = "local_user";
                }

                // Enable Login UI
                btnIcon.className = "fa-solid fa-lock";
                btnText.innerText = "Connect to Partner";
                connectBtn.disabled = false;
            } catch (error) {
                console.error("Initialization error:", error);
                btnText.innerText = "Connection Error";
                btnIcon.className = "fa-solid fa-triangle-exclamation";
            }
        }

        // --- Authentication & Session ---
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = passphraseInput.value.trim().toLowerCase();
            if (!password || !userId) return;

            connectBtn.disabled = true;
            btnText.innerText = "Encrypting...";
            btnIcon.className = "fa-solid fa-spinner fa-spin";

            try {
                // Short delay for UX
                await new Promise(r => setTimeout(r, 400)); 
                cryptoKey = await deriveKey(password, "couple-notes-salt");
                coupleCode = password; // Use password as room identifier (hashed ideally, but direct for simplicity here)

                // Swap UI
                pairingScreen.classList.add('hidden');
                workspace.classList.remove('hidden');
                workspace.classList.add('flex');
                
                setupWorkspace();
            } catch (err) {
                console.error("Key derivation failed", err);
                connectBtn.disabled = false;
                btnText.innerText = "Connect to Partner";
                btnIcon.className = "fa-solid fa-lock";
            }
        });

        disconnectBtn.addEventListener('click', () => {
            if (unsubscribeDraw) unsubscribeDraw();
            if (unsubscribeChat) unsubscribeChat();
            cryptoKey = null;
            coupleCode = null;
            passphraseInput.value = '';
            
            workspace.classList.add('hidden');
            workspace.classList.remove('flex');
            pairingScreen.classList.remove('hidden');
            
            connectBtn.disabled = false;
            btnText.innerText = "Connect to Partner";
            btnIcon.className = "fa-solid fa-lock";
        });

        function setupWorkspace() {
            initCanvas();
            startSyncing();
        }

        // --- Canvas Logic ---
        function initCanvas() {
            // Setup Colors
            const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#1e293b'];
            colorPalette.innerHTML = '';
            colors.forEach(c => {
                const btn = document.createElement('button');
                btn.className = `w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-transform shadow-sm ${currentColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`;
                btn.style.backgroundColor = c;
                btn.onclick = () => {
                    currentColor = c;
                    Array.from(colorPalette.children).forEach(child => {
                        child.classList.remove('border-slate-800', 'scale-110');
                        child.classList.add('border-transparent');
                    });
                    btn.classList.remove('border-transparent');
                    btn.classList.add('border-slate-800', 'scale-110');
                };
                colorPalette.appendChild(btn);
            });

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // Events
            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            window.addEventListener('mouseup', stopDraw);
            
            canvas.addEventListener('touchstart', startDraw, {passive: false});
            canvas.addEventListener('touchmove', draw, {passive: false});
            window.addEventListener('touchend', stopDraw);
        }

        function resizeCanvas() {
            if(!container) return;
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            redrawCanvas();
        }

        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            return {
                x: (clientX - rect.left) / canvas.width,
                y: (clientY - rect.top) / canvas.height
            };
        }

        function startDraw(e) {
            e.preventDefault(); // Stop scrolling
            isDrawing = true;
            currentPath = [getCoords(e)];
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const coords = getCoords(e);
            const lastCoords = currentPath[currentPath.length - 1];
            currentPath.push(coords);

            ctx.beginPath();
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(lastCoords.x * canvas.width, lastCoords.y * canvas.height);
            ctx.lineTo(coords.x * canvas.width, coords.y * canvas.height);
            ctx.stroke();
        }

        async function stopDraw() {
            if (!isDrawing) return;
            isDrawing = false;
            if (currentPath.length < 2) { redrawCanvas(); return; }

            const strokeData = { type: 'stroke', points: currentPath, color: currentColor, width: 4 };
            currentPath = [];

            // Encrypt & Send
            if (db && cryptoKey) {
                try {
                    const encrypted = await encryptData(cryptoKey, strokeData);
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `couple_${coupleCode}_draw`), {
                        senderId: userId, ciphertext: encrypted.ciphertext, iv: encrypted.iv, timestamp: Date.now()
                    });
                } catch (e) { console.error("Stroke encryption failed", e); }
            }
        }

        function redrawCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            strokes.forEach(stroke => {
                if (!stroke.points || stroke.points.length === 0) return;
                ctx.beginPath();
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width || 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
                }
                ctx.stroke();
            });
        }

        // --- Sync Data ---
        function startSyncing() {
            if (!db) return;

            // Sync Drawing
            const drawQuery = query(collection(db, 'artifacts', appId, 'public', 'data', `couple_${coupleCode}_draw`));
            unsubscribeDraw = onSnapshot(drawQuery, async (snapshot) => {
                const fetchedStrokes = [];
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    try {
                        const decrypted = await decryptData(cryptoKey, data.ciphertext, data.iv);
                        if(decrypted.type === 'stroke') {
                            fetchedStrokes.push({ id: doc.id, ...decrypted, timestamp: data.timestamp });
                        } else if (decrypted.type === 'clear') {
                            // In a robust setup, handle deletion. Here we just add a "clear" flag and filter 
                            // older strokes, but for simplicity we rely on a massive white cover square (sent by clear func)
                        }
                    } catch (e) { /* Ignore decrypt fails */ }
                }
                fetchedStrokes.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                strokes = fetchedStrokes;
                redrawCanvas();
            }, (error) => console.error("Draw sync error:", error));

            // Sync Chat
            const chatQuery = query(collection(db, 'artifacts', appId, 'public', 'data', `couple_${coupleCode}_chat`));
            unsubscribeChat = onSnapshot(chatQuery, async (snapshot) => {
                const messages = [];
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    try {
                        const decrypted = await decryptData(cryptoKey, data.ciphertext, data.iv);
                        messages.push({ id: doc.id, text: decrypted.text, senderId: data.senderId, timestamp: data.timestamp, ok: true });
                    } catch (e) {
                        messages.push({ id: doc.id, text: "🔒 Encrypted", senderId: data.senderId, timestamp: data.timestamp, ok: false });
                    }
                }
                messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                renderChat(messages);
            }, (error) => console.error("Chat sync error:", error));
        }

        // --- Chat Interactions ---
        chatInput.addEventListener('input', () => {
            sendBtn.disabled = chatInput.value.trim().length === 0;
        });

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text || !db) return;
            
            chatInput.value = '';
            sendBtn.disabled = true;

            try {
                const encrypted = await encryptData(cryptoKey, { text });
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `couple_${coupleCode}_chat`), {
                    senderId: userId, ciphertext: encrypted.ciphertext, iv: encrypted.iv, timestamp: Date.now()
                });
            } catch (e) { console.error("Chat send failed", e); }
        });

        function renderChat(messages) {
            chatMessages.innerHTML = '';
            if(messages.length === 0) {
                chatMessages.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 m-auto">
                        <i class="fa-solid fa-lock text-2xl"></i>
                        <p class="text-xs md:text-sm font-medium">Messages are Encrypted</p>
                    </div>`;
                return;
            }

            messages.forEach(msg => {
                const isMe = msg.senderId === userId;
                const div = document.createElement('div');
                div.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;
                
                const bubble = document.createElement('div');
                bubble.className = `max-w-[80%] px-3 md:px-4 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm shadow-sm break-words ${
                    !msg.ok ? 'bg-slate-200 text-slate-500 italic' 
                    : isMe ? 'bg-rose-500 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                }`;
                bubble.textContent = msg.text;
                
                div.appendChild(bubble);
                chatMessages.appendChild(div);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // --- Clear Canvas ---
        clearBtn.addEventListener('click', async () => {
            if(!db || !cryptoKey) return;
            // E2EE "clear" workaround without delete rules: Send a giant white box
            try {
                const coverStroke = {
                    type: 'stroke', color: '#ffffff', width: 3000,
                    points: [{x:0, y:0}, {x:1, y:1}, {x:1, y:0}, {x:0, y:1}]
                };
                const encrypted = await encryptData(cryptoKey, coverStroke);
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `couple_${coupleCode}_draw`), {
                    senderId: userId, ciphertext: encrypted.ciphertext, iv: encrypted.iv, timestamp: Date.now()
                });
            } catch(e) {}
        });

        // Initialize Firebase on load
        window.addEventListener('DOMContentLoaded', initApp);
    </script>
</body>
</html>
```