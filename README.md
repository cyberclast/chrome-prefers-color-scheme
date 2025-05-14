# Prefers Color Scheme Toggle (Chrome Extension)

Switches the current tab between **light** and **dark** modes by temporarily overriding its `prefers-color-scheme` media feature.

-   **Who it’s for:** front-end developers who need to test both schemes without wiring a Tailwind “`class`” toggle or changing the OS setting to check colors.
-   **How it works:** the extension attaches Chrome’s DevTools **`debugger` API** and sends `Emulation.setEmulatedMedia`, just like the “Rendering → Emulate CSS media” in the dev panel.
-   **Open source:** <https://github.com/cyberclast/chrome-prefers-color-scheme>

| State                               | Toolbar icon | Click action                                      |
| ----------------------------------- | ------------ | ------------------------------------------------- |
| System = dark · no override         | 🌞 sun       | Force **light** (override)                        |
| System = light · no override        | 🌙 moon      | Force **dark** (override)                         |
| Override active (forced dark/light) | System icon  | Detach debugger → revert to **system** preference |

## Installation (local dev)

1. Clone or download the repo.
2. `chrome://extensions` → **Developer Mode** → **Load unpacked** → select the folder.
3. Click the new icon to toggle.

> **Note:** Chrome shows a “_…is debugging this browser_” banner once the override is used.
