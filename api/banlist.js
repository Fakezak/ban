import { Redis } from '@upstash/redis';
import CryptoJS from 'crypto-js';

const redis = Redis.fromEnv();
const ADMIN_KEY = "Xk9vP2mQ8zL5wR7tY4nB6cD1fG3hJ0aS"; 
const AES_KEY = "MySuperSecretKey123"; // MUST MATCH YOUR GAME

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ==========================================
  // GAME CHECKS BAN (Encrypted Request)
  // ==========================================
  if (req.method === 'GET') {
    try {
      // 1. Get the encrypted payload from the URL
      const encryptedPayload = req.query.payload; 
      if (!encryptedPayload) return res.status(400).json({ error: "No payload" });

      // 2. Decrypt the payload
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedPayload, AES_KEY);
      const playerId = decryptedBytes.toString(CryptoJS.enc.Utf8);

      // 3. Check Database
      const bannedUsers = await redis.get('banned_users') || [];
      const banDurationMs = 24 * 60 * 60 * 1000; // 24 Hours
      const now = Date.now();
      
      const userBan = bannedUsers.find(ban => ban.id === playerId);

      let responseData = { isBanned: false };

      if (userBan) {
        const expireTime = userBan.bannedAt + banDurationMs;
        if (now <= expireTime) {
          responseData = { 
            isBanned: true, 
            reason: userBan.reason,
            timeLeftMs: expireTime - now 
          };
        }
      }

      // 4. Encrypt the response before sending it back
      const encryptedResponse = CryptoJS.AES.encrypt(JSON.stringify(responseData), AES_KEY).toString();
      return res.status(200).json({ data: encryptedResponse });

    } catch (error) {
      return res.status(500).json({ error: "Server error or bad decryption" });
    }
  }

  // ==========================================
  // ADMIN BANS USER (Plain JSON for easy Admin use)
  // ==========================================
  if (req.method === 'POST') {
    if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, reason } = req.body;
    try {
      let bannedUsers = await redis.get('banned_users') || [];
      if (!bannedUsers.find(b => b.id === id)) {
        bannedUsers.push({ id, reason: reason || "No reason", bannedAt: Date.now() });
        await redis.set('banned_users', bannedUsers);
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Database error" });
    }
  }
}
