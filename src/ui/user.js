// src/ui/user.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

let userIdHash = null;

/**
 * Gets a unique, anonymous hash for the current user using the correct SDK path.
 * Caches the result after the first call.
 * @returns {Promise<string | null>} The user's unique ID hash, or null if an error occurs.
 */
export async function getUserId() {
    if (userIdHash) {
        return userIdHash;
    }
    try {
        const currentUser = addOnUISdk.app.currentUser;
        userIdHash = await currentUser.userId();
        return userIdHash;
    } catch (error) {
        console.error("Could not get user ID hash:", error);
        return null;
    }
}