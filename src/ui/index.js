// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { initializeTabs } from './tabs.js';
import { initializeDesignPanel } from './designPanel.js';
import { initializeImagePanel } from './imagePanel.js';

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    initializeTabs();
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    initializeDesignPanel(sandboxProxy);
    initializeImagePanel();
});
