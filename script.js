// Initialize Clappr Player
const player = new Clappr.Player({
  parentId: '#player',
  source: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // HLS স্ট্রিম লিংক (টেস্টের জন্য)
  // source: 'your-video-link.mp4', // MP4 লিংক (প্রয়োজনে এটি ব্যবহার করুন)
  autoPlay: false,
  height: 360,
  width: '100%',
  plugins: [LevelSelector],
  playback: {
    playInline: true,
  },
  mediaControl: {
    disable: false,
  },
  events: {
    onReady: function () {
      // Custom Seek Buttons
      const mediaControl = document.querySelector('.media-control');
      const skipBackwardBtn = document.createElement('button');
      skipBackwardBtn.innerHTML = '<i class="fas fa-backward"></i> 10s';
      skipBackwardBtn.className = 'media-control-button';
      skipBackwardBtn.onclick = () => player.seek(player.getCurrentTime() - 10);

      const skipForwardBtn = document.createElement('button');
      skipForwardBtn.innerHTML = '<i class="fas fa-forward"></i> 10s';
      skipForwardBtn.className = 'media-control-button';
      skipForwardBtn.onclick = () => player.seek(player.getCurrentTime() + 10);

      mediaControl.appendChild(skipBackwardBtn);
      mediaControl.appendChild(skipForwardBtn);
    },
  },
});

// FontAwesome for Icons (Skip Buttons)
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
document.head.appendChild(fontAwesome);

// Double Tap Gesture
let lastTap = 0;
const videoContainer = document.querySelector('#player');
videoContainer.addEventListener('touchstart', (e) => {
  const now = new Date().getTime();
  const timeSince = now - lastTap;
  if (timeSince < 300 && timeSince > 0) {
    const touchX = e.touches[0].clientX;
    const third = window.innerWidth / 3;
    if (touchX < third) {
      player.seek(player.getCurrentTime() - 10); // Left: Skip backward
    } else if (touchX > 2 * third) {
      player.seek(player.getCurrentTime() + 10); // Right: Skip forward
    }
  }
  lastTap = now;
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case ' ':
      e.preventDefault();
      player.isPlaying() ? player.pause() : player.play();
      break;
    case 'ArrowLeft':
      player.seek(player.getCurrentTime() - 10);
      break;
    case 'ArrowRight':
      player.seek(player.getCurrentTime() + 10);
      break;
    case 'm':
      player.setVolume(player.getVolume() === 0 ? 1 : 0);
      break;
  }
});

// Dark/Light Mode
const themeToggleBtn = document.getElementById('themeToggle');
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
});
