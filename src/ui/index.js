// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { initializeDesignPanel } from './panel/designPanel.js';
import { initializeImagePanel } from './panel/imagePanel.js';
import { updateUsageDisplay } from './usageLimit.js';

const IS_DEV_MODE = true;

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const mockDataToggle = document.getElementById("mockDataToggle");
    if (!IS_DEV_MODE) {
        mockDataToggle.style.display = 'none';
    }
    
    const isMockMode = () => IS_DEV_MODE && mockDataToggle?.checked === true;

    initializeDesignPanel(sandboxProxy, isMockMode);
    initializeImagePanel(isMockMode);

    updateUsageDisplay();
});
