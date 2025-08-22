// Firefox Manifest V2 Background Script
console.log('Tab Rotator background script loading...');

const rotationAlarmName = "rotateTabs";
let isPaused = false;
let activeRotationWindows = new Set(); // Track windows with active rotation

// Simple browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function updateIcon(isActive) {
  if (browserAPI.browserAction) {
    browserAPI.browserAction.setIcon({
      path: {
        16: "icons/logo.png",
        32: "icons/logo.png", 
        48: "icons/logo.png",
        128: "icons/logo.png"
      }
    });
  }
}

function rotateTab(direction = "next") {
  // Return if no windows are being rotated
  if (activeRotationWindows.size === 0) return;

  // Rotate tabs in each active window
  activeRotationWindows.forEach(windowId => {
    browserAPI.tabs.query({ windowId }, (tabs) => {
      browserAPI.tabs.query({ active: true, windowId }, (activeTabs) => {
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
  });
}

// Alarm listener
browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === rotationAlarmName && !isPaused) {
    rotateTab("next");
  }
});

// Keyboard shortcut listeners
browserAPI.commands.onCommand.addListener((command) => {
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const currentWindowId = tabs[0].windowId;
    
    switch (command) {
      case "rotate-next":
        // Add current window to rotation if not already active
        activeRotationWindows.add(currentWindowId);
        // Manual rotation for current window
        browserAPI.tabs.query({ windowId: currentWindowId }, (windowTabs) => {
          browserAPI.tabs.query({ active: true, windowId: currentWindowId }, (activeTabs) => {
            if (activeTabs.length === 0) return;
            let activeTab = activeTabs[0];
            let currentIndex = activeTab.index;
            let nextIndex = (currentIndex + 1) % windowTabs.length;
            let nextTab = windowTabs.find(tab => tab.index === nextIndex);
            if (nextTab) {
              browserAPI.tabs.update(nextTab.id, { active: true });
            }
          });
        });
        break;
      case "rotate-prev":
        // Add current window to rotation if not already active
        activeRotationWindows.add(currentWindowId);
        // Manual rotation for current window
        browserAPI.tabs.query({ windowId: currentWindowId }, (windowTabs) => {
          browserAPI.tabs.query({ active: true, windowId: currentWindowId }, (activeTabs) => {
            if (activeTabs.length === 0) return;
            let activeTab = activeTabs[0];
            let currentIndex = activeTab.index;
            let nextIndex = (currentIndex - 1 + windowTabs.length) % windowTabs.length;
            let nextTab = windowTabs.find(tab => tab.index === nextIndex);
            if (nextTab) {
              browserAPI.tabs.update(nextTab.id, { active: true });
            }
          });
        });
        break;
      case "toggle-pause":
        isPaused = !isPaused;
        updateIcon(!isPaused);
        break;
    }
  });
});

function startRotation(intervalSec) {
  // Get the current window ID when starting rotation
  browserAPI.windows.getCurrent((window) => {
    activeRotationWindows.add(window.id);
    isPaused = false;
    
    // Create alarm if it doesn't exist
    browserAPI.alarms.get(rotationAlarmName, (alarm) => {
      if (!alarm) {
        browserAPI.alarms.create(rotationAlarmName, { periodInMinutes: intervalSec / 60 });
      }
    });
    
    updateIcon(true);
    
    // Store the active window IDs
    browserAPI.storage.local.set({
      activeRotationWindows: Array.from(activeRotationWindows),
      rotationInterval: intervalSec
    });
    
    return `Rotating every ${intervalSec.toFixed(1)} seconds in current window`;
  });
}

function stopRotation(windowId = null) {
  if (windowId) {
    // Stop rotation for specific window
    activeRotationWindows.delete(windowId);
    
    // If no windows left, clear alarm
    if (activeRotationWindows.size === 0) {
      browserAPI.alarms.clear(rotationAlarmName);
      isPaused = false;
    }
  } else {
    // Stop all rotation
    browserAPI.alarms.clear(rotationAlarmName);
    activeRotationWindows.clear();
    isPaused = false;
  }
  
  // Update storage
  browserAPI.storage.local.set({
    activeRotationWindows: Array.from(activeRotationWindows)
  });
  
  updateIcon(activeRotationWindows.size > 0);
  return windowId ? "Rotation stopped for window" : "All rotation stopped";
}

// Message listener
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.command) {
    case "startRotation":
      isPaused = false;
      const intervalSec = parseFloat(message.interval);
      if (message.windowId) {
        activeRotationWindows.add(message.windowId);
        browserAPI.storage.local.set({
          activeRotationWindows: Array.from(activeRotationWindows),
          rotationInterval: intervalSec
        });
      }
      const status = startRotation(intervalSec);
      sendResponse({ status });
      break;
    case "stopRotation":
      browserAPI.windows.getCurrent((window) => {
        const stopStatus = stopRotation(window.id);
        sendResponse({ status: stopStatus });
      });
      return true; // Keep the message channel open for async response
    case "pauseRotation":
      isPaused = true;
      updateIcon(false);
      sendResponse({ status: "Rotation paused" });
      break;
    case "resumeRotation":
      browserAPI.storage.local.get(['rotationInterval'], (result) => {
        const interval = result.rotationInterval || 5;
        const status = startRotation(interval);
        sendResponse({ status });
      });
      break;
    case "rotateManual":
      if (message.windowId) {
        // Manual rotation for specific window
        browserAPI.tabs.query({ windowId: message.windowId }, (tabs) => {
          browserAPI.tabs.query({ active: true, windowId: message.windowId }, (activeTabs) => {
            if (activeTabs.length === 0) return;
            let activeTab = activeTabs[0];
            let currentIndex = activeTab.index;
            let nextIndex = message.direction === "next"
              ? (currentIndex + 1) % tabs.length
              : (currentIndex - 1 + tabs.length) % tabs.length;
            let nextTab = tabs.find(tab => tab.index === nextIndex);
            if (nextTab) {
              browserAPI.tabs.update(nextTab.id, { active: true });
            }
          });
        });
      } else {
        rotateTab(message.direction);
      }
      sendResponse({ status: "Manual rotation" });
      break;
    case "updateKeybinds":
      browserAPI.storage.local.set({ keybinds: message.keybinds });
      sendResponse({ status: "Keybinds updated" });
      break;
  }
  return true;
});

// Initialize state and restore rotation for active windows
browserAPI.storage.local.get(['wasRotating', 'rotationInterval', 'activeRotationWindows'], (result) => {
  if (result.wasRotating && Array.isArray(result.activeRotationWindows)) {
    // Verify windows still exist before restoring
    browserAPI.windows.getAll({}, (windows) => {
      const existingWindowIds = new Set(windows.map(w => w.id));
      activeRotationWindows = new Set(
        result.activeRotationWindows.filter(id => existingWindowIds.has(id))
      );
      
      if (activeRotationWindows.size > 0) {
        startRotation(result.rotationInterval || 5);
      }
    });
  }
  updateIcon(activeRotationWindows.size > 0);
});

// Store rotation state when extension is suspended/closed
if (browserAPI.runtime.onSuspend) {
  browserAPI.runtime.onSuspend.addListener(() => {
    browserAPI.alarms.get(rotationAlarmName, (alarm) => {
      browserAPI.storage.local.set({
        wasRotating: alarm !== null && !isPaused,
        activeRotationWindows: Array.from(activeRotationWindows),
        rotationInterval: alarm?.periodInMinutes * 60 || 5
      });
    });
  });
}

// Handle window close
browserAPI.windows.onRemoved.addListener((windowId) => {
  if (activeRotationWindows.has(windowId)) {
    stopRotation(windowId);
  }
});

// Handle extension installation
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

console.log('Tab Rotator background script loaded successfully!');