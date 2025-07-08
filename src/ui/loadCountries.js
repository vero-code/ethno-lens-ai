const select = document.getElementById("countrySelect");

fetch("https://restcountries.com/v3.1/all?fields=name")
    .then(res => res.json())
    .then(data => {

        if (!Array.isArray(data)) throw new Error("Invalid response format");

        const countries = data
            .map(c => c.name.common)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        select.innerHTML = `<option value="">-- Select a country --</option>`;
        countries.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    })
    .catch(err => {
        select.innerHTML = `<option>Error loading countries</option>`;
        console.error("Failed to load countries", err);
    });