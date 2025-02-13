const rotationAlarmName = "rotateTabs";
let isPaused = false;

// Firefox compatibility: Use browser instead of chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function updateIcon(isActive) {
  browserAPI.browserAction.setIcon({
    path: {
      16: "icons/logo.png",
      32: "icons/logo.png",
      48: "icons/logo.png",
      128: "icons/logo.png"
    }
  });
}

function rotateTab(direction = "next") {
  browserAPI.tabs.query({ currentWindow: true }, (tabs) => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs.length === 0) return;
      let activeTab = activeTabs[0];
      let currentIndex = activeTab.index;
      let nextIndex = direction === "next" 
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
      let nextTab = tabs.find(tab => tab.index === nextIndex);
      if (nextTab) {
        browserAPI.tabs.update(nextTab.id, { active: true });
      }
    });
  });
}

browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === rotationAlarmName && !isPaused) {
    rotateTab("next");
  }
});

// Add keyboard shortcut listeners
browserAPI.commands.onCommand.addListener((command) => {
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
  browserAPI.alarms.create(rotationAlarmName, { periodInMinutes: intervalSec / 60 });
  updateIcon(true);
  return `Rotating every ${intervalSec.toFixed(1)} seconds`;
}

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.command) {
    case "startRotation":
      isPaused = false;
      const intervalSec = parseFloat(message.interval);
      sendResponse({ status: startRotation(intervalSec) });
      break;
    case "stopRotation":
      browserAPI.alarms.clear(rotationAlarmName);
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
      browserAPI.storage.local.get(['rotationInterval'], (result) => {
        const interval = result.rotationInterval || 5; // default to 5 seconds
        sendResponse({ status: startRotation(interval) });
      });
      break;
    case "rotateManual":
      rotateTab(message.direction);
      sendResponse({ status: "Manual rotation" });
      break;
    case "updateKeybinds":
      browserAPI.storage.local.set({ keybinds: message.keybinds });
      sendResponse({ status: "Keybinds updated" });
      break;
  }
  return true;
});

// Initialize state and restore rotation if it was active
browserAPI.storage.local.get(['wasRotating', 'rotationInterval'], (result) => {
  if (result.wasRotating) {
    startRotation(result.rotationInterval || 5);
  }
  updateIcon(!isPaused);
});

// Store rotation state when extension is suspended/closed
browserAPI.runtime.onSuspend?.addListener(() => {
  browserAPI.alarms.get(rotationAlarmName, (alarm) => {
    browserAPI.storage.local.set({ wasRotating: alarm !== null && !isPaused });
  });
});

browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.storage.local.get(['keybinds'], (result) => {
    if (!result.keybinds) {
      browserAPI.storage.local.set({
        keybinds: {
          'rotate-next': 'Alt+N',
          'rotate-prev': 'Alt+P',
          'toggle-pause': 'Alt+Space'
        }
      });
    }
  });
});
