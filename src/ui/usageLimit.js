import { getUserUsage } from './api.js';
import { getUserId } from './user.js';

// Update limit display
export async function updateUsageDisplay() {
    try {
        const userId = await getUserId();
        if (!userId) {
            console.warn('Cannot update usage: no user ID');
            return;
        }

        const usage = await getUserUsage(userId);
        const usageCount = document.getElementById('usageCount');
        const usageLimit = document.getElementById('usageLimit');

        if (usageCount) usageCount.textContent = usage.used;
        if (usageLimit) usageLimit.textContent = usage.limit;
        
    } catch (error) {
        console.error('Error updating usage display:', error);
    }
}