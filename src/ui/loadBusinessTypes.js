// src/ui/loadBusinessTypes.js

// Wait for Spectrum components to load
function waitForSpectrumComponents() {
    return new Promise((resolve) => {
        if (customElements.get('sp-picker')) {
            resolve();
        } else {
            customElements.whenDefined('sp-picker').then(resolve);
        }
    });
}

const businessTypes = [
    "Cosmetics",
    "Funeral",
    "Fashion",
    "Technology",
    "Food & Beverage",
    "Finance & Banking",
    "Healthcare",
    "Education",
    "Travel & Tourism",
    "Automotive",
    "Real Estate",
    "Entertainment",
    "Sports & Fitness",
    "Home & Interior",
    "Childcare & Parenting",
    "Non-profit / Charity",
    "Military & Defense",
    "Construction",
    "Agriculture",
    "Legal / Law",
    "Energy / Utilities",
    "Logistics / Delivery",
    "Religious / Spiritual",
    "Luxury / Premium Goods",
    "Environmental / Sustainability",
    "Other..."
];

async function loadBusinessTypes() {
    await waitForSpectrumComponents();
    
    const businessPicker = document.getElementById("businessType");
    const imageBusinessPicker = document.getElementById("imageBusinessType");
    
    const allBusinessPickers = [businessPicker, imageBusinessPicker].filter(el => el);

    allBusinessPickers.forEach(picker => {
        picker.innerHTML = '';
        
        // Add placeholder
        const placeholderItem = document.createElement('sp-menu-item');
        placeholderItem.textContent = "-- Select business type --";
        placeholderItem.value = "";
        picker.appendChild(placeholderItem);

        // Add all types of businesses
        businessTypes.forEach(type => {
            const menuItem = document.createElement('sp-menu-item');
            
            if (type === "Other...") {
                menuItem.value = "Other...";
            } else {
                menuItem.value = type.toLowerCase().replace(/[^a-z0-9]/g, "-");
            }
            
            menuItem.textContent = type;
            picker.appendChild(menuItem);
        });
    });
    
    console.log('✅ Business types loaded successfully');
}

loadBusinessTypes();