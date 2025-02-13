let isPaused = false;

// Firefox compatibility: Use browser instead of chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', () => {
  const keybinds = document.getElementById('keybinds');
  keybinds.classList.add('show');
  document.getElementById('status').textContent = 'Press "/" to toggle keybinds';
  
  browserAPI.storage.local.get(['rotationInterval'], (result) => {
    if (result.rotationInterval) {
      document.getElementById('interval').value = result.rotationInterval;
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    e.preventDefault();
    const keybinds = document.getElementById('keybinds');
    keybinds.classList.toggle('show');
  }
});

document.getElementById('prev').addEventListener('click', () => {
  browserAPI.runtime.sendMessage({ command: "rotateManual", direction: "prev" });
});

document.getElementById('next').addEventListener('click', () => {
  browserAPI.runtime.sendMessage({ command: "rotateManual", direction: "next" });
});

document.getElementById('pause').addEventListener('click', () => {
  isPaused = !isPaused;
  const btn = document.getElementById('pause');
  btn.textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
  browserAPI.runtime.sendMessage({ 
    command: isPaused ? "pauseRotation" : "resumeRotation" 
  }, response => {
    document.getElementById('status').textContent = response.status;
  });
});

document.getElementById('start').addEventListener('click', () => {
  let intervalSec = parseFloat(document.getElementById('interval').value);
  if (isNaN(intervalSec) || intervalSec < 0.1) {
    document.getElementById('status').textContent = "Please enter a valid number (min: 0.1)";
    return;
  }
  
  browserAPI.storage.local.set({ rotationInterval: intervalSec });
  
  browserAPI.runtime.sendMessage(
    { command: "startRotation", interval: intervalSec },
    response => {
      document.getElementById('status').textContent = response.status;
    }
  );
});

document.getElementById('stop').addEventListener('click', () => {
  browserAPI.runtime.sendMessage(
    { command: "stopRotation" },
    response => {
      document.getElementById('status').textContent = response.status;
    }
  );
});
  