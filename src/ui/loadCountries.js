// src/ui/loadCountries.js

const countrySelect = document.getElementById("countrySelect");
const imageCountrySelect = document.getElementById("imageCountrySelect");

const allCountrySelects = [countrySelect, imageCountrySelect].filter(el => el);

fetch("https://restcountries.com/v3.1/all?fields=name")
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {

        if (!Array.isArray(data)) throw new Error("Invalid response format");

        const countries = data
            .map(c => c.name.common)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        allCountrySelects.forEach(selectElement => {
            selectElement.innerHTML = `<option value="">-- Select a country --</option>`;
            countries.forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                selectElement.appendChild(option);
            });
        });
    })
    .catch(err => {
        console.error("Failed to load countries", err);
        allCountrySelects.forEach(selectElement => {
            selectElement.innerHTML = `<option>Error loading countries</option>`;
            selectElement.disabled = true;
        });
    });
