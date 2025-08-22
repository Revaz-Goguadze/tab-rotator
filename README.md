# Tab Rotator Extension

A lightweight and easy-to-use browser extension that **automatically cycles through open tabs in your browser at a configurable interval.** Supports **manual tab switching, keyboard shortcuts, and pause/resume feature**. Compatible with **Chrome** and **Firefox**.

---

## Supported Browsers

- **Google Chrome** (Manifest V3) - Use `manifest.json` and `background.js`
- **Mozilla Firefox** (Manifest V2) - Use `manifest-firefox.json` and `background-firefox.js`

The extension provides separate versions optimized for each browser's extension architecture.

---

## Features

### 🌐 Automatic Tab Rotation

- Automatically switch to the next tab every **N seconds** (default 5s).
- Configurable interval with support for decimal seconds (e.g., 0.5 seconds).
- Rotation occurs only in the current window unless started in other windows as well.
- Multi-window aware; rotations can be started/stopped independently per window.

### 🖱️ Simple Popup Interface

- Set rotation interval via a number input.
- Start or Stop rotation with a button click.
- See real-time status updates.

### 🎛️ Manual Tab Control

- Manually rotate **Next** or **Previous** via keyboard shortcuts or popup buttons.
- Pause or Resume rotation without stopping the cycling completely.

### ⌨️ Keyboard Shortcuts

| Command           | Default Shortcut     | Description                       |
|-------------------|----------------------|---------------------------------|
| Rotate Next       | `Alt + N`            | Switch to next tab              |
| Rotate Previous   | `Alt + P`            | Switch to previous tab          |
| Pause / Resume    | `Alt + Space`        | Pause or resume tab rotation    |

- These shortcuts can be customized in the popup UI
- Shortcuts work globally when the extension is running

### 🔧 Customizable Keybinds

- Customize shortcuts for **Next**, **Previous**, **Pause/Resume**.
- Reset individual keybinds to defaults.
- Temporarily toggle keybind settings panel with "/" key.

### 🛑 Pause / Resume & Stop

- **Pause** temporarily halts rotation without clearing alarms.
- **Resume** continues with previous settings.
- **Stop** fully disables rotation and clears alarms for the window.

### 💾 Persistent State

- Remembers rotation state, interval, active windows, and shortcuts even after browser restarts.
- Restores previous rotation on startup if active before.

---

## Installation

### Chrome

1. Download or clone this repository.
2. Visit `chrome://extensions/`
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.
5. Ensure `manifest.json` and `background.js` are used (default files).
6. Pin **Tab Rotator** icon for easy access.

### Firefox

1. Download or clone this repository.
2. Rename `manifest-firefox.json` to `manifest.json` and `background-firefox.js` to `background.js`
3. Visit `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on**.
5. Select the `manifest.json` from the project folder.
6. (Optional) Package and sign for full addon install.

---

## Usage

1. Click the **Tab Rotator** icon next to your address bar to open the popup.
2. Enter desired rotation interval (minimum 0.1 seconds).
3. Press **Start Rotation** to begin cycling.
4. Use **Stop Rotation** button or keyboard shortcuts to stop or control rotation.
5. Optionally customize shortcuts for manual tab switching and toggle keybind settings panel.

---

## Permissions

- **tabs**: Switch active tabs.
- **alarms**: Schedule periodic rotation.
- **storage**: Save user settings (interval, keybinds, rotation status).
- **commands**: Provide keyboard shortcuts.
- **background**: Run logic even when popup is closed.

---

## Privacy

This extension **does not collect any personal data** or browsing history. All settings are stored locally in your browser.

---

## License

[MIT License](LICENSE)

---

## Contributing

Contributions welcome! Please fork, improve, and submit pull requests.