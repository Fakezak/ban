import { Redis } from '@upstash/redis';

// Upstash automatically reads your environment variables
const redis = Redis.fromEnv();
const ADMIN_KEY = "Xk9vP2mQ8zL5wR7tY4nB6cD1fG3hJ0aS";

export default async function handler(req, res) {
  // 1. GAME READS LIST
  if (req.method === 'GET') {
    try {
      const bannedUsers = await redis.get('banned_users') || [];
      const banDurationDays = 3;
      const now = Date.now();
      
      const activeBans = bannedUsers.filter(ban => {
        const expireTime = ban.bannedAt + (banDurationDays * 24 * 60 * 60 * 1000);
        return now < expireTime;
      });

      return res.status(200).json({
        version: now,
        banDurationDays: banDurationDays,
        banned: activeBans
      });
    } catch (error) {
      return res.status(500).json({ error: "Database connection failed", details: error.message });
    }
  }

  // 2. ADMIN BANS USER
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${ADMIN_KEY}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, reason } = req.body;
    if (!id) return res.status(400).json({ error: "Missing user id" });

    try {
      let bannedUsers = await redis.get('banned_users') || [];
      
      if (!bannedUsers.find(b => b.id === id)) {
        bannedUsers.push({
          id: id,
          reason: reason || "No reason provided",
          bannedAt: Date.now()
        });
        await redis.set('banned_users', bannedUsers);
      }
      return res.status(200).json({ success: true, message: `Banned ${id} for 3 days` });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save ban", details: error.message });
    }
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.status(405).json({ error: "Method not allowed" });
}
