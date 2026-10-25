import { Redis } from '@upstash/redis';
import CryptoJS from 'crypto-js';

const redis = Redis.fromEnv();
const ADMIN_KEY = "Xk9vP2mQ8zL5wR7tY4nB6cD1fG3hJ0aS"; 
const AES_KEY = "MySuperSecretKey123"; // MUST MATCH GAME

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GAME CHECKS BAN
  if (req.method === 'GET') {
    // Trap 1: No Payload sent
    if (!req.query.payload) {
      return res.status(400).json({ 
        error: "PAYLOAD_ERROR",
        message: "FATAL: Missing payload data." 
      });
    }

    // Trap 2: Force Payload Error by sending raw JSON
    // The game expects { data: "encrypted_string" }. 
    // By sending this raw error, the game's AES decryptor fails and throws the native Payload Error.
    res.setHeader('Connection', 'close'); // Force disconnect
    return res.status(400).json({ 
      error: "PAYLOAD_ERROR",
      message: "FATAL: Payload rejected. HWID flagged.",
      isBanned: true,
      reason: "Security Violation"
    });
  }

  // ADMIN BANS USER
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
