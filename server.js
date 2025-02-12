const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config(); // Load private credentials from .env file

const app = express();
app.use(express.json()); // Enable JSON body parsing

const PRIVATE_AUTH_URL = "https://portal.solaranalytics.com.au/api/v3/token";
const ENERGY_DATA_URL = "https://portal.solaranalytics.com.au/api/v3/live_site_data?site_id=266722&last_six=false&last_hour=false&battery_data=false";

const PRIVATE_USERNAME = process.env.SOLAR_USERNAME; // Your private login
const PRIVATE_PASSWORD = process.env.SOLAR_PASSWORD; // Your private password

// Get Private API Token
async function getPrivateToken() {
    const authHeader = "Basic " + Buffer.from(`${PRIVATE_USERNAME}:${PRIVATE_PASSWORD}`).toString("base64");

    try {
        const response = await fetch(PRIVATE_AUTH_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": authHeader
            }
        });

        if (!response.ok) throw new Error("Failed to fetch private token");

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error("Private token fetch error:", error);
        return null;
    }
}

// Get Energy Data
app.post("/get-energy-data", async (req, res) => {
    const publicToken = req.body.publicToken;
    if (!publicToken) {
        return res.status(400).json({ error: "No public token provided" });
    }

    const privateToken = await getPrivateToken();
    if (!privateToken) {
        return res.status(500).json({ error: "Failed to obtain private token" });
    }

    try {
        const response = await fetch(ENERGY_DATA_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${privateToken}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch energy data");

        const data = await response.json();
        res.json(data); // Send data to frontend

    } catch (error) {
        console.error("Energy data fetch error:", error);
        res.status(500).json({ error: "Failed to fetch energy data" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
