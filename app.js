/** --- STATE MANAGEMENT --- **/
const State = {
  unlocked: false,
  notificationShown: false,
  scriptPlayed: false
};

/** --- DOM UTILS & UI CONTROLLER --- **/
const UI = {
  els: {
    lockscreen: document.getElementById('lockscreen'),
    main: document.getElementById('main-interface'),
    homescreen: document.getElementById('homescreen'),
    notification: document.getElementById('notification'),
    body: document.body,
    modals: document.getElementById('modal-backdrop'),
    modalImg: document.getElementById('modal-image'),
    modalLetter: document.getElementById('modal-letter'),
    modalWarn: document.getElementById('modal-warning')
  },
  
  init() {
    this.updateClock();
    setInterval(this.updateClock, 1000);
    this.initLockscreen();
    this.initSparkles();
  },

  updateClock() {
    const now = new Date();
    document.getElementById('lock-time').textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('lock-date').textContent = now.toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'});
  },

  initLockscreen() {
    let startY = 0;
    const lock = this.els.lockscreen;
    
    const handleStart = e => startY = e.touches ? e.touches[0].clientY : e.clientY;
    const handleMove = e => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const diff = Math.max(0, startY - y);
      if (diff > 0 && !State.unlocked) lock.style.transform = `translateY(-${diff}px)`;
    };
    const handleEnd = e => {
      if (State.unlocked) return;
      const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      if (startY - y > 50) this.unlock();
      else lock.style.transform = 'translateY(0)';
    };

    lock.addEventListener('touchstart', handleStart);
    lock.addEventListener('touchmove', handleMove);
    lock.addEventListener('touchend', handleEnd);
    lock.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
  },

  unlock() {
    State.unlocked = true;
    this.els.lockscreen.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      this.els.lockscreen.style.display = 'none';
      this.els.main.classList.remove('hidden');
      this.els.main.classList.add('flex');
      
      // Start "Who Knows" as initial background music on unlock
      // Index 4 corresponds to Daniel Caesar - Who Knows
      Music.init();
      Music.loadTrack(4, true);
      
      if (!State.notificationShown) {
        setTimeout(() => {
          this.els.notification.style.top = '20px';
          navigator.vibrate?.([200, 100, 200]);
          State.notificationShown = true;
        }, 1500);
      }
    }, 400);
  },

  initSparkles() {
    document.addEventListener('click', e => {
      const isDark = document.body.getAttribute('data-theme') === 'music';
      for(let i=0; i<6; i++) {
        const p = document.createElement('div');
        p.className = 'sparkle';
        p.style.background = isDark ? 'white' : '#fb7185';
        p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * 60 + 20;
        p.style.setProperty('--dx', `${Math.cos(angle) * vel}px`);
        p.style.setProperty('--dy', `${Math.sin(angle) * vel}px`);
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
      }
    });
  },

  showModal(type) {
    this.els.modals.classList.remove('hidden');
    this.els.modals.classList.add('flex');
    // Hide all first
    this.els.modalImg.classList.add('hidden');
    this.els.modalLetter.classList.add('hidden');
    this.els.modalWarn.classList.add('hidden');
    
    // Show requested
    const target = type === 'img' ? this.els.modalImg : type === 'letter' ? this.els.modalLetter : this.els.modalWarn;
    target.classList.remove('hidden');
    
    // Animate in
    setTimeout(() => {
      this.els.modals.style.opacity = '1';
      target.style.transform = 'scale(1)';
    }, 10);
  },

  closeModals() {
    this.els.modals.style.opacity = '0';
    [this.els.modalImg, this.els.modalLetter, this.els.modalWarn].forEach(el => el.style.transform = 'scale(0.9)');
    setTimeout(() => {
      this.els.modals.classList.add('hidden');
      this.els.modals.classList.remove('flex');
    }, 200);
  }
};

/** --- APP NAVIGATION CONTROLLER --- **/
const App = {
  current: null,
  open(appName) {
    if (this.current) document.getElementById(`app-${this.current}`).classList.remove('active');
    
    this.current = appName;
    UI.els.homescreen.style.opacity = '0';
    UI.els.homescreen.style.pointerEvents = 'none';
    UI.els.notification.style.top = '-100px'; // hide notification
    UI.els.body.setAttribute('data-theme', appName);
    
    document.getElementById(`app-${appName}`).classList.add('active');
    
    if (appName === 'messages') Chat.start();
    if (appName === 'gallery') Gallery.init();
    if (appName === 'music') Music.init();
  },
  
  close() {
    if (this.current) document.getElementById(`app-${this.current}`).classList.remove('active');
    this.current = null;
    UI.els.homescreen.style.opacity = '1';
    UI.els.homescreen.style.pointerEvents = 'auto';
    UI.els.body.setAttribute('data-theme', 'default');
  }
};

/** --- MESSAGES APP LOGIC --- **/
const Chat = {
  els: {
    container: document.getElementById('chat-messages'),
    indicator: document.getElementById('typing-indicator'),
    inputBar: document.getElementById('chat-input-bar'),
    input: document.getElementById('user-input')
  },
  audio: {
    pop: document.getElementById('sfx-pop'),
    tap: document.getElementById('sfx-tap')
  },
  script: [
    "Hi Bea.",
    "Ang dami kong gustong sabihin, pero dito muna ako magsisimula: oo, gusto kita. Matagal na.",
    "Sorry kung hindi ko agad inamin at itinago ko pa sa'yo. Natakot lang talaga ako na baka masira kung anong meron tayo ngayon kapag naging honest ako.",
    "Naging sobrang importante mo kasi sa'kin unexpectedly.",
    "Sadyang inipon ko lang yung lakas ng loob ko para masabi 'to sa'yo nang buo.",
    "You mean so much to me. Sorry ulit kung nabigla kita.",
    "But regardless of your answer… thank you for reading this far."
  ],
  
  async start() {
    if (State.scriptPlayed) return;
    State.scriptPlayed = true;
    
    const delay = ms => new Promise(r => setTimeout(r, ms));
    
    for (let msg of this.script) {
      this.els.indicator.classList.remove('hidden');
      this.scrollToBottom();
      
      const typingTime = 500 + (msg.length * 40);
      await delay(typingTime);
      
      this.els.indicator.classList.add('hidden');
      this.addMessage(msg, 'them');
      
      const readingTime = Math.max(800, msg.length * 20);
      await delay(readingTime);
    }
    
    this.els.inputBar.classList.remove('hidden');
    this.scrollToBottom();
  },

  addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.innerText = text;
    this.els.container.insertBefore(div, this.els.indicator);
    
    // Play sound safely
    const sfx = sender === 'me' ? this.audio.pop : this.audio.tap;
    sfx.currentTime = 0;
    sfx.volume = sender === 'me' ? 1 : 0.4;
    sfx.play().catch(()=>{});
    
    this.scrollToBottom();
  },

  scrollToBottom() {
    setTimeout(() => {
      this.els.container.scrollTop = this.els.container.scrollHeight;
    }, 50);
  },

  triggerWarning() {
    if (!this.els.input.value.trim()) return;
    UI.showModal('warn');
  },

  async confirmSend() {
    UI.closeModals();
    const text = this.els.input.value.trim();
    if(!text) return;

    this.els.inputBar.classList.add('hidden');
    this.addMessage(text, 'me');
    this.els.input.value = "";
    
    // Fake API Post
    fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      body: JSON.stringify({ message: text })
    }).catch(()=>{});

    this.els.indicator.classList.remove('hidden');
    this.scrollToBottom();
    await new Promise(r => setTimeout(r, 2500));
    this.els.indicator.classList.add('hidden');
    
    this.addMessage("Salamat sa pag-reply at sa pagiging honest mo. Naiintindihan ko and I respect whatever you feel or decide. Wala kang kailangan madaliin or pilitin dito. I’ll just give you space, and I’m here if ever you want to talk again.", 'them');
  }
};

/** --- GALLERY APP LOGIC --- **/
const Gallery = {
  initialized: false,
  data: [
    { src: "stuffedToy.jpg", cap: "Di pa tayo close neto eh, pero there was this one time na sumama ka samin mag-Divi..." },
    { src: "walking.jpg", cap: "Close na tayo nito. Si April lang nakakaalam ng feelings ko nun eh..." },
    { src: "saya.jpg", cap: "Naghalungkat na ko sa bahay, nanghiram pa ko sa kapitbahay, pero wala talaga akong mahanap na barong..." },
    { src: "ribbon.jpeg", cap: "Eto medyo nakakahiya 😭 nahuli ni April na tinatalian mo ng ribbon yung kamay ko..." },
    { src: "Bully.jpg", cap: "Di man halata, pero sobrang na-enjoy ko yung mga bardagulan at bickering natin sa room HAHAHA." },
    { src: "EK.jpg", cap: "Nahagip ka ng cam ko nung nag-EK tayo, pero deretso agad sa favorites HAHAHAHAHA." },
    { src: "cats.jpg", cap: "Eto yung couple cat keychains na ibibigay ko sana sayo nung muntik na ko mag-confess." },
    { src: "AIgrad.png", cap: "Eto medyo bittersweet. Nung graduation, nalungkot talaga ako pag-uwi..." }
  ],
  
  init() {
    if(this.initialized) return;
    const grid = document.getElementById('gallery-grid');
    
    this.data.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = "relative rounded-xl overflow-hidden cursor-pointer group shadow-sm bg-orange-100 aspect-square";
      el.innerHTML = `
        <img src="${item.src}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'%23fed7aa\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\'%3E%3C/rect%3E%3C/svg%3E'">
        <button onclick="Gallery.openLetter(event, ${i})" class="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full text-orange-500 shadow-md flex items-center justify-center animate-pulse hover:animate-none">✉️</button>
      `;
      el.onclick = () => {
        UI.els.modalImg.src = item.src;
        UI.showModal('img');
      };
      grid.appendChild(el);
    });
    this.initialized = true;
  },

  openLetter(e, idx) {
    e.stopPropagation();
    e.currentTarget.classList.remove('animate-pulse');
    document.getElementById('letter-content').innerHTML = this.data[idx].cap;
    UI.showModal('letter');
  },

  openSecret() {
    document.getElementById('letter-content').innerHTML = `
      <strong>Dear Bea,</strong><br><br>
      Eight of the most memorable moments ko na kasama ka...<br><br>
      Sobrang into you ko dati to the point na kahit gabi na, di ako mapakali...<br><br>
      And sana talaga hindi nito masira friendship natin...<br><br>
      PS: Nung senior high ko pa talaga to plano gawin 😭...<br><br>
      Love, Tora
    `;
    UI.showModal('letter');
  }
};

/** --- MUSIC APP LOGIC --- **/
const Music = {
  initialized: false,
  currentIndex: 0,
  audio: document.getElementById('music-player'),
  playlist: [
    { title: "Take a chance with me", artist: "NIKI", file: "bgmusic.mp3", color: "#22c55e", img: "GreenCassetteTape.png" },
    { title: "You belong with me", artist: "Taylor Swift", file: "bgmusic2.mp3", color: "#ec4899", img: "PinkCassetteTape.png" },
    { title: "Be With Me", artist: "The Ridleys", file: "bgmusic3.mp3", color: "#22c55e", img: "GreenCassetteTape.png" },
    { title: "About You", artist: "The 1975", file: "bgmusic4.mp3", color: "#eab308", img: "YellowCassetteTape.png" },
    { title: "Who Knows", artist: "Daniel Caesar", file: "bgmusic5.mp3", color: "#ef4444", img: "RedCassetteTape.png" },
    { title: "Glue song", artist: "beabadoobee", file: "bgmusic6.mp3", color: "#a855f7", img: "PurpleCassetteTape.png" }
  ],
  
  init() {
    if(this.initialized) return;
    
    // Populate Library
    const list = document.getElementById('cassette-list');
    this.playlist.forEach((track, i) => {
      const btn = document.createElement('button');
      btn.className = "bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors active:bg-white/20";
      btn.onclick = () => this.loadTrack(i);
      btn.innerHTML = `
        <img src="${track.img}" class="w-16 h-10 mb-2 object-contain mx-auto rounded" style="background-color: ${track.color}" alt="tape">
        <span class="text-[10px] font-bold text-white line-clamp-1 w-full leading-tight">${track.title}</span>
        <span class="text-[9px] text-white/50">${track.artist}</span>
      `;
      list.appendChild(btn);
    });

    // Audio Event Listeners
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.next());
    
    const slider = document.getElementById('progress-bar');
    slider.addEventListener('input', (e) => {
      this.audio.currentTime = (e.target.value / 100) * this.audio.duration;
    });

    this.initialized = true;
  },

  toggleLibrary() {
    const lib = document.getElementById('music-library');
    if (lib.style.transform === 'translateY(0px)') {
      lib.style.transform = 'translateY(100%)';
    } else {
      lib.style.transform = 'translateY(0px)';
    }
  },

  loadTrack(index, isInitial = false) {
    this.currentIndex = index;
    const track = this.playlist[index];
    
    // Update UI
    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-artist').textContent = track.artist;
    
    const cassette = document.getElementById('active-cassette');
    document.getElementById('slot-hint').style.display = 'none';
    cassette.style.opacity = '1';
    cassette.style.transform = 'translateY(0)';
    cassette.style.backgroundColor = track.color;
    cassette.style.backgroundImage = `url('${track.img.replace('Tape', 'Player')}')`;
    cassette.style.backgroundSize = 'contain';
    cassette.style.backgroundRepeat = 'no-repeat';
    cassette.style.backgroundPosition = 'center';
    
    // Close library & Play
    if (!isInitial) this.toggleLibrary();
    this.audio.src = track.file;
    this.audio.play().catch(()=>{});
    this.updatePlayState(true);
  },

  togglePlay() {
    if (!this.audio.src) return this.toggleLibrary(); // Prompt to pick track if empty
    if (this.audio.paused) {
      this.audio.play();
      this.updatePlayState(true);
    } else {
      this.audio.pause();
      this.updatePlayState(false);
    }
  },

  updatePlayState(isPlaying) {
    const icon = isPlaying 
      ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>` 
      : `<path d="M8 5v14l11-7z"/>`;
    document.querySelector('#play-btn svg').innerHTML = icon;
    document.getElementById('music-status').textContent = isPlaying ? 'Playing' : 'Paused';
    
    // Toggle cassette wheel animation
    document.querySelectorAll('.tape-wheel').forEach(w => {
      isPlaying ? w.classList.add('playing') : w.classList.remove('playing');
    });
  },

  next() {
    if(!this.audio.src) return;
    this.loadTrack((this.currentIndex + 1) % this.playlist.length);
  },

  prev() {
    if(!this.audio.src) return;
    this.loadTrack((this.currentIndex - 1 + this.playlist.length) % this.playlist.length);
  },

  updateProgress() {
    const duration = this.audio.duration;
    const current = this.audio.currentTime;
    if (!duration) return;
    
    document.getElementById('progress-bar').value = (current / duration) * 100;
    document.getElementById('time-current').textContent = this.formatTime(current);
    document.getElementById('time-duration').textContent = this.formatTime(duration);
  },

  formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }
};

/** --- BOOTSTRAP --- **/
window.addEventListener('DOMContentLoaded', () => UI.init());

/** --- BACKGROUND PARTICLES ENGINE --- **/
const AmbientBackground = {
  canvas: document.getElementById('particles'),
  ctx: null,
  particles: [],
  maxParticles: 25, // Kept low for perfect fluid mobile optimization

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const types = ['heart', 'balloon', 'confetti'];

    // Create particles
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 10 + 6, // Slightly larger for better visibility
        type: types[i % 3],
        speedY: -(Math.random() * 0.6 + 0.3), // Slightly faster upward drift
        speedX: Math.random() * 0.3 - 0.15,
        opacity: Math.random() * 0.4 + 0.5, // Further increased opacity range (0.5 to 0.9)
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.04 - 0.02,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.01
      });
    }
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fixed silky white color for all particles regardless of theme
    const color = '255, 255, 255';

    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.swing) * 0.3;
      p.swing += p.swingSpeed;
      p.rotation += p.rotationSpeed;

      if (p.y < -50) {
        p.y = this.canvas.height + 50;
        p.x = Math.random() * this.canvas.width;
      }
      if (p.x < -50) p.x = this.canvas.width + 50;
      if (p.x > this.canvas.width + 50) p.x = -50;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
      this.ctx.strokeStyle = `rgba(${color}, ${p.opacity})`;
      
      // Shadow is essential for visibility of white particles on light backgrounds
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 6;
      this.ctx.shadowOffsetY = 3;

      if (p.type === 'heart') {
        this.drawHeart(p.size);
      } else if (p.type === 'balloon') {
        this.drawBalloon(p.size);
      } else {
        this.drawConfetti(p.size, p.rotation);
      }
      this.ctx.restore();
    });

    requestAnimationFrame(() => this.animate());
  },

  drawHeart(size) {
    const s = size / 50;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.bezierCurveTo(0, -3*s, -5*s, -15*s, -25*s, -15*s);
    this.ctx.bezierCurveTo(-55*s, -15*s, -55*s, 22.5*s, -55*s, 22.5*s);
    this.ctx.bezierCurveTo(-55*s, 40*s, -35*s, 62*s, 0, 80*s);
    this.ctx.bezierCurveTo(35*s, 62*s, 55*s, 40*s, 55*s, 22.5*s);
    this.ctx.bezierCurveTo(55*s, 22.5*s, 55*s, -15*s, 25*s, -15*s);
    this.ctx.bezierCurveTo(10*s, -15*s, 0, -3*s, 0, 0);
    this.ctx.fill();
  },

  drawBalloon(size) {
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size * 0.8, size, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(0, size);
    this.ctx.lineTo(0, size * 2);
    this.ctx.stroke();
  },

  drawConfetti(size, rotation) {
    this.ctx.rotate(rotation);
    this.ctx.fillRect(-size/2, -size/4, size, size/2);
  }
};

// Hook into the page bootloader process
window.addEventListener('DOMContentLoaded', () => AmbientBackground.init());