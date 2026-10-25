cat << 'EOF' > game.js
const CryptoJS = require("crypto-js");

const AES_KEY = "MySuperSecretKey123"; 
const VERCEL_URL = "https://ban-eta-neon.vercel.app/api/banlist";
const playerId = "ZakaCheatv18"; 

async function checkBan() {
    try {
        console.log(`\nChecking ban status for: ${playerId}...`);
        const encryptedId = CryptoJS.AES.encrypt(playerId, AES_KEY).toString();
        const response = await fetch(`${VERCEL_URL}?payload=${encodeURIComponent(encryptedId)}`);
        const data = await response.json();
        
        if (data.error) {
            console.log("❌ Server Error:", data.error);
            return;
        }

        const decryptedBytes = CryptoJS.AES.decrypt(data.data, AES_KEY);
        const banStatus = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));

        if (banStatus.isBanned) {
            const hours = Math.floor(banStatus.timeLeftMs / (1000 * 60 * 60));
            const minutes = Math.floor((banStatus.timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((banStatus.timeLeftMs % (1000 * 60)) / 1000);
            
            console.log("========================================");
            console.log("❌ BANNED!");
            console.log(`Reason: ${banStatus.reason}`);
            console.log(`Suspension ending in: ${hours}h ${minutes}m ${seconds}s`);
            console.log("========================================\n");
        } else {
            console.log("✅ Player is clean. Starting game...\n");
        }
    } catch (err) {
        console.error("Ban check failed:", err.message);
    }
}

checkBan();
EOF
