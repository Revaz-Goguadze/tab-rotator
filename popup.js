let isPaused = false;

// Browser compatibility: Use browser API or chrome API with error handling
const browserAPI = (() => {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  } else if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome;
  } else {
    console.error('No browser API available');
    return null;
  }
})();

// Windows compatibility: Add error handling wrapper
function safeAPICall(apiCall, errorMessage = 'API call failed') {
  try {
    if (!browserAPI) {
      console.error('Browser API not available');
      return;
    }
    return apiCall();
  } catch (error) {
    console.error(errorMessage, error);
    document.getElementById('status').textContent = 'Error: ' + errorMessage;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const keybinds = document.getElementById('keybinds');
  keybinds.classList.add('show');
  document.getElementById('status').textContent = 'Press "/" to toggle keybinds';
  
  safeAPICall(() => {
    browserAPI.storage.local.get(['rotationInterval'], (result) => {
      if (result.rotationInterval) {
        document.getElementById('interval').value = result.rotationInterval;
      }
    });
  }, 'Failed to load settings');
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    e.preventDefault();
    const keybinds = document.getElementById('keybinds');
    keybinds.classList.toggle('show');
  }
});

document.getElementById('prev').addEventListener('click', () => {
  safeAPICall(() => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        browserAPI.runtime.sendMessage({ 
          command: "rotateManual", 
          direction: "prev",
          windowId: tabs[0].windowId
        });
      }
    });
  }, 'Failed to rotate to previous tab');
});

document.getElementById('next').addEventListener('click', () => {
  safeAPICall(() => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        browserAPI.runtime.sendMessage({ 
          command: "rotateManual", 
          direction: "next",
          windowId: tabs[0].windowId
        });
      }
    });
  }, 'Failed to rotate to next tab');
});

document.getElementById('pause').addEventListener('click', () => {
  isPaused = !isPaused;
  const btn = document.getElementById('pause');
  btn.textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
  
  safeAPICall(() => {
    browserAPI.runtime.sendMessage({ 
      command: isPaused ? "pauseRotation" : "resumeRotation" 
    }, response => {
      document.getElementById('status').textContent = response.status;
    });
  }, 'Failed to pause/resume rotation');
});

document.getElementById('start').addEventListener('click', () => {
  let intervalSec = parseFloat(document.getElementById('interval').value);
  if (isNaN(intervalSec) || intervalSec < 0.1) {
    document.getElementById('status').textContent = "Please enter a valid number (min: 0.1)";
    return;
  }
  
  safeAPICall(() => {
    browserAPI.storage.local.set({ rotationInterval: intervalSec });
  }, 'Failed to save interval');
  
  safeAPICall(() => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        browserAPI.runtime.sendMessage(
          { 
            command: "startRotation", 
            interval: intervalSec,
            windowId: tabs[0].windowId
          },
          response => {
            document.getElementById('status').textContent = response.status;
          }
        );
      }
    });
  }, 'Failed to start rotation');
});

document.getElementById('stop').addEventListener('click', () => {
  safeAPICall(() => {
    browserAPI.runtime.sendMessage(
      { command: "stopRotation" },
      response => {
        document.getElementById('status').textContent = response.status;
      }
    );
  }, 'Failed to stop rotation');
});
  