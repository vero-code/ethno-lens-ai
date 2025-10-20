// src/ui/api.js

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

// const API_BASE_URL = "https://ethno-lens-ai.onrender.com";
const API_BASE_URL = "http://localhost:3000";

export async function analyzeDesign(prompt, userId) {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, userId })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.error || `Server error: ${response.status}`, response.status);
    }
    return response.json();
}

export async function analyzeImage(formData, userId) {
    formData.append("userId", userId);
    
    const response = await fetch(`${API_BASE_URL}/analyze-image`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function logPremiumInterest(userId) {
    await fetch(`${API_BASE_URL}/log-premium-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    });
}