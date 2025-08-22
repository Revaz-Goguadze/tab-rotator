const rotationAlarmName = "rotateTabs";
let isPaused = false;
let rotationWindowId = null;

function updateIcon(isActive) {
  chrome.browserAction.setIcon({
    path: {
      "16": isActive ? "icons/logo.png" : "icons/logo1.png",
      "32": isActive ? "icons/logo.png" : "icons/logo1.png",
      "48": isActive ? "icons/logo.png" : "icons/logo1.png",
      "128": isActive ? "icons/logo.png" : "icons/logo1.png"
    }
  });
}

function rotateTab(direction = "next", windowId = null) {
  const targetWindowId = windowId || rotationWindowId;
  if (!targetWindowId) return;
  
  chrome.tabs.query({ windowId: targetWindowId }, (tabs) => {
    chrome.tabs.query({ active: true, windowId: targetWindowId }, (activeTabs) => {
      if (activeTabs.length === 0) return;
      let activeTab = activeTabs[0];
      let currentIndex = activeTab.index;
      let nextIndex;

      if (direction === "next") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else {
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      }

      chrome.tabs.update(tabs[nextIndex].id, { active: true });
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === rotationAlarmName && !isPaused) {
    rotateTab();
  }
});

// Add keyboard shortcut listeners
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const currentWindowId = tabs[0].windowId;
    
    switch (command) {
      case "rotate-next":
        rotateTab("next", currentWindowId);
        break;
      case "rotate-prev":
        rotateTab("prev", currentWindowId);
        break;
      case "toggle-pause":
        isPaused = !isPaused;
        updateIcon(!isPaused);
        break;
    }
  });
});

function startRotation(intervalSec, windowId = null) {
  isPaused = false;
  if (windowId) {
    rotationWindowId = windowId;
  }
  chrome.alarms.create(rotationAlarmName, { periodInMinutes: intervalSec / 60 });
  updateIcon(true);
  return `Rotating every ${intervalSec.toFixed(1)} seconds`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case "startRotation":
      isPaused = false;
      const intervalSec = parseFloat(message.interval);
      rotationWindowId = message.windowId;
      sendResponse({ status: startRotation(intervalSec, message.windowId) });
      break;
    case "stopRotation":
      chrome.alarms.clear(rotationAlarmName);
      isPaused = false;
      rotationWindowId = null;
      updateIcon(false);
      sendResponse({ status: "Rotation stopped" });
      break;
    case "getStatus":
      chrome.alarms.get(rotationAlarmName, (alarm) => {
        sendResponse({
          isActive: alarm !== null && !isPaused,
          isPaused: isPaused
        });
      });
      break;
    case "rotateManual":
      rotateTab(message.direction, message.windowId);
      sendResponse({ status: "Manual rotation" });
      break;
    case "updateKeybinds":
      sendResponse({ status: "Keybinds updated" });
      break;
  }
  return true; // Keep message channel open for async response
});

// Initialize state and restore rotation if it was active
chrome.storage.local.get(['wasRotating', 'rotationInterval', 'rotationWindowId'], (result) => {
  if (result.wasRotating && result.rotationWindowId) {
    rotationWindowId = result.rotationWindowId;
    startRotation(result.rotationInterval || 5);
  }
  updateIcon(!isPaused);
});

// Store rotation state when extension is suspended/closed
chrome.runtime.onSuspend.addListener(() => {
  chrome.alarms.get(rotationAlarmName, (alarm) => {
    chrome.storage.local.set({ 
      wasRotating: alarm !== null && !isPaused,
      rotationWindowId: rotationWindowId
    });
  });
});

// Store state when extension starts
chrome.alarms.get(rotationAlarmName, (alarm) => {
  chrome.storage.local.set({ 
    wasRotating: alarm !== null && !isPaused,
    rotationInterval: 5
  });
});