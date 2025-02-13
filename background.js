const rotationAlarmName = "rotateTabs";
let isPaused = false;

function updateIcon(isActive) {
  chrome.action.setIcon({
    path: {
      16: "icons/logo.png",
      32: "icons/logo.png",
      48: "icons/logo.png",
      128: "icons/logo.png"
    }
  });
}

function rotateTab(direction = "next") {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs.length === 0) return;
      let activeTab = activeTabs[0];
      let currentIndex = activeTab.index;
      let nextIndex = direction === "next" 
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
      let nextTab = tabs.find(tab => tab.index === nextIndex);
      if (nextTab) {
        chrome.tabs.update(nextTab.id, { active: true });
      }
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === rotationAlarmName && !isPaused) {
    rotateTab("next");
  }
});

// Add keyboard shortcut listeners
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "rotate-next":
      rotateTab("next");
      break;
    case "rotate-prev":
      rotateTab("prev");
      break;
    case "toggle-pause":
      isPaused = !isPaused;
      updateIcon(!isPaused);
      break;
  }
});

function startRotation(intervalSec) {
  isPaused = false;
  chrome.alarms.create(rotationAlarmName, { periodInMinutes: intervalSec / 60 });
  updateIcon(true);
  return `Rotating every ${intervalSec.toFixed(1)} seconds`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.command) {
    case "startRotation":
      isPaused = false;
      const intervalSec = parseFloat(message.interval);
      sendResponse({ status: startRotation(intervalSec) });
      break;
    case "stopRotation":
      chrome.alarms.clear(rotationAlarmName);
      isPaused = false;
      updateIcon(false);
      sendResponse({ status: "Rotation stopped" });
      break;
    case "pauseRotation":
      isPaused = true;
      updateIcon(false);
      sendResponse({ status: "Rotation paused" });
      break;
    case "resumeRotation":
      chrome.storage.local.get(['rotationInterval'], (result) => {
        const interval = result.rotationInterval || 5; // default to 5 seconds
        sendResponse({ status: startRotation(interval) });
      });
      break;
    case "rotateManual":
      rotateTab(message.direction);
      sendResponse({ status: "Manual rotation" });
      break;
    case "updateKeybinds":
      chrome.storage.local.set({ keybinds: message.keybinds });
      sendResponse({ status: "Keybinds updated" });
      break;
  }
  return true;
});

// Initialize state and restore rotation if it was active
chrome.storage.local.get(['wasRotating', 'rotationInterval'], (result) => {
  if (result.wasRotating) {
    startRotation(result.rotationInterval || 5);
  }
  updateIcon(!isPaused);
});

// Store rotation state when extension is suspended/closed
chrome.runtime.onSuspend.addListener(() => {
  chrome.alarms.get(rotationAlarmName, (alarm) => {
    chrome.storage.local.set({ wasRotating: alarm !== null && !isPaused });
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['keybinds'], (result) => {
    if (!result.keybinds) {
      chrome.storage.local.set({
        keybinds: {
          'rotate-next': 'Alt+N',
          'rotate-prev': 'Alt+P',
          'toggle-pause': 'Alt+Space'
        }
      });
    }
  });
});
