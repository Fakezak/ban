import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ADMIN_KEY = "Xk9vP2mQ8zL5wR7tY4nB6cD1fG3hJ0aS"; 

export default async function handler(req, res) {
  // ==========================================
  // 1. GAME CHECKS IF A SPECIFIC USER IS BANNED
  // ==========================================
  if (req.method === 'GET') {
    // Get the user ID from the URL (e.g., ?id=ZakaCheatv18)
    const userId = req.query.id; 
    
    if (!userId) {
      return res.status(400).json({ error: "Please provide a user ID" });
    }

    try {
      const bannedUsers = await redis.get('banned_users') || [];
      const banDurationDays = 3;
      const now = Date.now();
      
      // Look for THIS specific user
      const userBan = bannedUsers.find(ban => ban.id === userId);

      if (!userBan) {
        // Not banned at all
        return res.status(200).json({ isBanned: false });
      }

      // Check if their time is up
      const expireTime = userBan.bannedAt + (banDurationDays * 24 * 60 * 60 * 1000);
      if (now > expireTime) {
        // Time is up, they are free
        return res.status(200).json({ isBanned: false });
      }

      // They are banned! Send back the ban details.
      return res.status(200).json({ 
        isBanned: true, 
        reason: userBan.reason,
        bannedAt: userBan.bannedAt
      });

    } catch (error) {
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // ==========================================
  // 2. ADMIN BANS A USER (SAME AS BEFORE)
  // ==========================================
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
      return res.status(500).json({ error: "Failed to save ban" });
    }
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.status(405).json({ error: "Method not allowed" });
}
