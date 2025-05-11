const KEY = 'override'; // map { tabId: 'light' | 'dark' }  (forced scheme)

function detectScheme() {
    return matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSystemScheme(tabId, cb) {
    chrome.scripting.executeScript({ target: { tabId }, func: detectScheme }, res =>
        cb(res?.[0]?.result ? 'dark' : 'light')
    );
}

function applyScheme(tabId, scheme, done) {
    const params = scheme
        ? { media: 'screen', features: [{ name: 'prefers-color-scheme', value: scheme }] }
        : { media: '', features: [] };
    chrome.debugger.sendCommand({ tabId }, 'Emulation.setEmulatedMedia', params, done);
}

/* ---------- ICON HELPERS ---------- */

const ICONS = {
    light: { 16: 'icons/yellow-sun-16.png', 32: 'icons/yellow-sun-32.png' },
    dark: { 16: 'icons/blue-moon-16.png', 32: 'icons/blue-moon-32.png' },
};

function setIcon(tabId, scheme /* 'light' | 'dark' */) {
    chrome.action.setIcon({ tabId, path: ICONS[scheme] });
}

function showOppositeOfSystem(tabId) {
    getSystemScheme(tabId, sys => setIcon(tabId, sys === 'dark' ? 'light' : 'dark'));
}

function showSystemSchemeFromForced(tabId, forced /* 'light'|'dark' */) {
    const system = forced === 'light' ? 'dark' : 'light';
    setIcon(tabId, system);
}

/* ---------- TOGGLE ---------- */

function toggle(tab) {
    chrome.storage.local.get(KEY, data => {
        const overrides = data[KEY] || {};
        const forced = overrides[tab.id]; // undefined, 'light', or 'dark'

        if (forced) {
            /** ------- REMOVE OVERRIDE ------- **/
            chrome.debugger.attach({ tabId: tab.id }, '1.3', () => {
                applyScheme(tab.id, null, () => {
                    chrome.debugger.detach({ tabId: tab.id });
                    delete overrides[tab.id];
                    chrome.storage.local.set({ [KEY]: overrides });
                    showOppositeOfSystem(tab.id); // next click will force
                });
            });
        } else {
            /** ------- ADD OVERRIDE (opposite of system) ------- **/
            getSystemScheme(tab.id, sys => {
                const opposite = sys === 'dark' ? 'light' : 'dark';
                chrome.debugger.attach({ tabId: tab.id }, '1.3', () => {
                    applyScheme(tab.id, opposite, () => {
                        overrides[tab.id] = opposite;
                        chrome.storage.local.set({ [KEY]: overrides });
                        setIcon(tab.id, sys); // show system scheme (will revert on next click)
                    });
                });
            });
        }
    });
}

chrome.action.onClicked.addListener(toggle);

/* ---------- TAB EVENTS ---------- */

chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status !== 'loading') return;

    chrome.storage.local.get(KEY, data => {
        const overrides = data[KEY] || {};
        const forced = overrides[tabId];

        if (forced) {
            // restore override after reload / nav
            chrome.debugger.getTargets(tgts => {
                const attached = tgts.some(t => t.tabId === tabId && t.attached);
                const afterAttach = () => {
                    applyScheme(tabId, forced, () => showSystemSchemeFromForced(tabId, forced));
                };
                attached ? afterAttach() : chrome.debugger.attach({ tabId }, '1.3', afterAttach);
            });
        } else {
            showOppositeOfSystem(tabId);
        }
    });
});

/* cleanup */
chrome.tabs.onRemoved.addListener(tabId => {
    chrome.storage.local.get(KEY, data => {
        const overrides = data[KEY] || {};
        if (overrides[tabId]) {
            delete overrides[tabId];
            chrome.storage.local.set({ [KEY]: overrides });
        }
    });
});
