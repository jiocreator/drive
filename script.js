const player = videojs('video', {
  controls: true,
  controlBar: {
    playToggle: true,
    volumePanel: { inline: false },
    currentTimeDisplay: true,
    timeDivider: true,
    durationDisplay: true,
    progressControl: true,
    fullscreenToggle: true,
  },
});

// Quality Selector for HLS
player.qualityLevels();

// Keyboard Shortcuts
player.hotkeys({
  volumeStep: 0.1,
  seekStep: 10,
  enableModifiersForNumbers: false,
  play: ['space'],
  mute: ['m'],
  seekBackward: ['left'],
  seekForward: ['right'],
});

// Double Tap for Mobile
player.mobileUi({
  doubleTap: {
    seekSeconds: 10,
  },
});

// Dark/Light Mode
const themeToggleBtn = document.createElement('button');
themeToggleBtn.textContent = 'Dark/Light';
themeToggleBtn.className = 'vjs-control vjs-button';
themeToggleBtn.onclick = () => {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
};
player.controlBar.el().appendChild(themeToggleBtn);

// Time Format
player.on('timeupdate', () => {
  const currentTime = player.currentTime();
  const duration = player.duration();
  player.controlBar.currentTimeDisplay.el().textContent = formatTime(currentTime);
  player.controlBar.durationDisplay.el().textContent = formatTime(duration);
});

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
