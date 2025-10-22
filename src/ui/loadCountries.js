// src/ui/loadCountries.js

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

async function loadCountries() {
    await waitForSpectrumComponents();
    
    const countryPicker = document.getElementById("countrySelect");
    const imageCountryPicker = document.getElementById("imageCountrySelect");
    
    const allCountryPickers = [countryPicker, imageCountryPicker].filter(el => el);

    try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
        }

        const countries = data
            .map(c => c.name.common)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        allCountryPickers.forEach(picker => {
            picker.innerHTML = '';
            
            // Add placeholder option
            const placeholderItem = document.createElement('sp-menu-item');
            placeholderItem.textContent = "-- Select a country --";
            placeholderItem.value = "";
            picker.appendChild(placeholderItem);
            
            // Add all countries
            countries.forEach(name => {
                const menuItem = document.createElement('sp-menu-item');
                menuItem.value = name;
                menuItem.textContent = name;
                picker.appendChild(menuItem);
            });
        });
        
        console.log('✅ Countries loaded successfully');
        
    } catch (err) {
        console.error("Failed to load countries", err);
        allCountryPickers.forEach(picker => {
            picker.innerHTML = '';
            const errorItem = document.createElement('sp-menu-item');
            errorItem.textContent = "Error loading countries";
            errorItem.disabled = true;
            picker.appendChild(errorItem);
        });
    }
}

loadCountries();