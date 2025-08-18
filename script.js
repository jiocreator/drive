const video = document.getElementById('video');
const playPauseBtn = document.getElementById('playPause');
const skipBackwardBtn = document.getElementById('skipBackward');
const skipForwardBtn = document.getElementById('skipForward');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeBar = document.getElementById('volumeBar');
const muteBtn = document.getElementById('mute');
const qualitySelector = document.getElementById('qualitySelector');
const fullscreenBtn = document.getElementById('fullscreen');
const themeToggleBtn = document.getElementById('themeToggle');

// Play/Pause
playPauseBtn.addEventListener('click', () => {
  if (video.paused) {
    video.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    video.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
});

// Skip Forward/Backward
skipBackwardBtn.addEventListener('click', () => {
  video.currentTime -= 10;
});
skipForwardBtn.addEventListener('click', () => {
  video.currentTime += 10;
});

// Seek Bar
video.addEventListener('timeupdate', () => {
  const progress = (video.currentTime / video.duration) * 100;
  seekBar.value = progress;
  currentTimeEl.textContent = formatTime(video.currentTime);
  durationEl.textContent = formatTime(video.duration);
});
seekBar.addEventListener('input', () => {
  video.currentTime = (seekBar.value / 100) * video.duration;
});

// Volume & Mute
volumeBar.addEventListener('input', () => {
  video.volume = volumeBar.value;
  muteBtn.innerHTML = video.volume === 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});
muteBtn.addEventListener('click', () => {
  video.volume = video.volume === 0 ? volumeBar.value : 0;
  muteBtn.innerHTML = video.volume === 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});

// Fullscreen
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    video.parentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Double Tap Gesture
let lastTap = 0;
video.addEventListener('touchstart', (e) => {
  const now = new Date().getTime();
  const timeSince = now - lastTap;
  if (timeSince < 300 && timeSince > 0) {
    const touchX = e.touches[0].clientX;
    const third = window.innerWidth / 3;
    if (touchX < third) {
      video.currentTime -= 10; // Left: Skip backward
    } else if (touchX > 2 * third) {
      video.currentTime += 10; // Right: Skip forward
    }
  }
  lastTap = now;
});

// Quality Selector (HLS Example)
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource('path/to/your/hls/playlist.m3u8');
  hls.attachMedia(video);
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    const levels = hls.levels.map((level, index) => ({
      value: index,
      label: `${level.height}p`,
    }));
    qualitySelector.innerHTML = levels.map(level => `<option value="${level.value}">${level.label}</option>`).join('');
  });
  qualitySelector.addEventListener('change', () => {
    hls.currentLevel = parseInt(qualitySelector.value);
  });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case ' ':
      e.preventDefault();
      playPauseBtn.click();
      break;
    case 'ArrowLeft':
      video.currentTime -= 10;
      break;
    case 'ArrowRight':
      video.currentTime += 10;
      break;
    case 'm':
      muteBtn.click();
      break;
  }
});

// Dark/Light Mode
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
});

// Format Time
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
