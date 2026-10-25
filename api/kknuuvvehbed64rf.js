import { kv } from '@vercel/kv';

// 1. YOUR SECRET KEY (Change this to your own random letters)
const ADMIN_KEY = "Xk9vP2mQ8zL5wR7tY4nB6cD1fG3hJ0aS"; 

export default async function handler(req, res) {
  // ==========================================
  // 1. GAME READS THE BAN LIST (GET REQUEST)
  // ==========================================
  if (req.method === 'GET') {
    try {
      // Fetch all bans from the database
      const bannedUsers = await kv.get('banned_users') || [];
      const banDurationDays = 3;
      const now = Date.now();
      
      // Auto-expand: Filter out anyone whose 3 days have passed
      const activeBans = bannedUsers.filter(ban => {
        const expireTime = ban.bannedAt + (banDurationDays * 24 * 60 * 60 * 1000);
        return now < expireTime;
      });

      // If expired bans were removed, update the database to keep it clean
      if (activeBans.length !== bannedUsers.length) {
        await kv.set('banned_users', activeBans);
      }

      // Send the clean list to the game
      return res.status(200).json({
        version: now,
        banDurationDays: banDurationDays,
        banned: activeBans
      });
    } catch (error) {
      console.error("Database GET Error:", error);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // ==========================================
  // 2. ADMIN ADDS A BAN (POST REQUEST)
  // ==========================================
  if (req.method === 'POST') {
    // Security Check: Verify the Admin Key
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${ADMIN_KEY}`) {
      return res.status(401).json({ error: "Unauthorized: Wrong Admin Key" });
    }

    const { id, reason } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    try {
      // Get current bans
      let bannedUsers = await kv.get('banned_users') || [];
      
      // Check if they are already banned
      if (!bannedUsers.find(b => b.id === id)) {
        bannedUsers.push({
          id: id,
          reason: reason || "No reason provided",
          bannedAt: Date.now()
        });
        await kv.set('banned_users', bannedUsers);
      }

      return res.status(200).json({ success: true, message: `Banned ${id} for 3 days` });
    } catch (error) {
      console.error("Database POST Error:", error);
      return res.status(500).json({ error: "Failed to save ban to database" });
    }
  }

  // ==========================================
  // 3. CORS OPTIONS (Required for game engines)
  // ==========================================
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
