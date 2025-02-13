let isPaused = false;

document.addEventListener('DOMContentLoaded', () => {
  const keybinds = document.getElementById('keybinds');
  keybinds.classList.add('show');
  document.getElementById('status').textContent = 'Press "/" to toggle keybinds';
  
  // Load saved interval
  chrome.storage.local.get(['rotationInterval'], (result) => {
    if (result.rotationInterval) {
      document.getElementById('interval').value = result.rotationInterval;
    }
th  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    e.preventDefault(); // Prevent "/" from being typed in input
    const keybinds = document.getElementById('keybinds');
    keybinds.classList.toggle('show');
  }
});h

document.getElementById('prev').addEventListener('click', () => {
  chrome.runtime.sendMessage({ command: "rotateManual", direction: "prev" });
});

document.getElementById('next').addEventListener('click', () => {
  chrome.runtime.sendMessage({ command: "rotateManual", direction: "next" });
});

document.getElementById('pause').addEventListener('click', () => {
  isPaused = !isPaused;
  const btn = document.getElementById('pause');
  btn.textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
  chrome.runtime.sendMessage({ 
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
  
  // Save interval to storage
  chrome.storage.local.set({ rotationInterval: intervalSec });
  
  chrome.runtime.sendMessage(
    { command: "startRotation", interval: intervalSec },
    response => {
      document.getElementById('status').textContent = response.status;
    }
  );
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.runtime.sendMessage(
    { command: "stopRotation" },
    response => {
      document.getElementById('status').textContent = response.status;
    }
  );
});
  