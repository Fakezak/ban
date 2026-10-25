const CryptoJS = require("crypto-js");

const AES_KEY = "MySuperSecretKey123"; // MUST MATCH VERCEL
const VERCEL_URL = "https://ban-eta-neon.vercel.app/api/banlist";
const playerId = "ZakaCheatv18";

async function checkBan() {
    try {
        // 1. Encrypt the Player ID
        const encryptedId = CryptoJS.AES.encrypt(playerId, AES_KEY).toString();
        
        // 2. Send HTTPS Request to Vercel
        const response = await fetch(`${VERCEL_URL}?payload=${encodeURIComponent(encryptedId)}`);
        const data = await response.json();
        
        // 3. Decrypt the Server's Response
        const decryptedBytes = CryptoJS.AES.decrypt(data.data, AES_KEY);
        const banStatus = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));

        if (banStatus.isBanned) {
            // Calculate 24hr Timer
            const hours = Math.floor(banStatus.timeLeftMs / (1000 * 60 * 60));
            const minutes = Math.floor((banStatus.timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log("========================================");
            console.log("❌ BANNED!");
            console.log(`Reason: ${banStatus.reason}`);
            console.log(`Suspension ending in: ${hours}h ${minutes}m`);
            console.log("========================================");
            // Trigger your game ban screen here
        } else {
            console.log("✅ Player is clean. Starting game...");
        }
    } catch (err) {
        console.error("Ban check failed:", err);
    }
}

checkBan();
