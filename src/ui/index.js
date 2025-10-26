// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { initializeDesignPanel } from './panel/designPanel.js';
import { initializeImagePanel } from './panel/imagePanel.js';
import { getUserUsage } from './api.js';
import { getUserId } from './user.js';

const IS_DEV_MODE = true;

// Update limit display
async function updateUsageDisplay() {
    try {
        const userId = await getUserId();
        if (!userId) {
            console.warn('Cannot update usage: no user ID');
            return;
        }

        const usage = await getUserUsage(userId);
        console.log('Usage loaded:', usage);
        
        const usageCount = document.getElementById('usageCount');
        const usageLimit = document.getElementById('usageLimit');

        if (usageCount) usageCount.textContent = usage.used;
        if (usageLimit) usageLimit.textContent = usage.limit;
        
    } catch (error) {
        console.error('Error updating usage display:', error);
    }
}

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const mockDataToggle = document.getElementById("mockDataToggle");
    const devControls = document.getElementById("devControls");
    if (!IS_DEV_MODE) {
        devControls.style.display = 'none';
    }
    
    const isMockMode = () => IS_DEV_MODE && mockDataToggle?.checked === true;

    initializeDesignPanel(sandboxProxy, isMockMode);
    initializeImagePanel(isMockMode);

    updateUsageDisplay();
});
