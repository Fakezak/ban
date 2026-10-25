import { Redis } from '@upstash/redis';
import CryptoJS from 'crypto-js';

const redis = Redis.fromEnv();
const ADMIN_KEY = "Xk9vP2mQ8zL5wR7tY4nB6cD1fG3hJ0aS"; 
const AES_KEY = "MySuperSecretKey123"; // MUST MATCH GAME

// =========================================================
// 1. MASSIVE ERROR ARRAY (100+ Errors)
// =========================================================
const ERRORS = [
  "CRITICAL ERROR: Auth Server Rejected Connection.",
  "FATAL: HWID Ban Detected. Account Terminated.",
  "SECURITY VIOLATION: Memory injection detected.",
  "ERROR 403: Forbidden. Socket closed by remote host.",
  "WARNING: Unauthorized modification of game files.",
  "DATABASE FAILURE: Failed to fetch user profile.",
  "SYSTEM HALT: Security token is invalid or expired.",
  "BANNED: This device has been permanently blacklisted.",
  "ERROR 500: Internal Server Error - Connection dropped.",
  "FATAL: Encryption key mismatch. Terminating.",
  "ALERT: Anti-cheat triggered. Logging IP and HWID.",
  "ERROR: Session hijacking attempt detected.",
  "WARNING: Multiple login attempts from different devices.",
  "SYSTEM ERROR: Packet loss corrupted the handshake.",
  "BANNED: Account flagged for unauthorized currency.",
  "CRITICAL: Failed to establish secure socket layer.",
  "ERROR 404: Player profile not found in database.",
  "FATAL: Cheat engine signature detected in memory.",
  "SECURITY: VPN/Proxy connection blocked.",
  "ERROR: Malformed packet received from client.",
  "WARNING: Game integrity check failed.",
  "SYSTEM: Server maintenance in progress. Please wait.",
  "ERROR 401: Unauthorized access. Invalid credentials.",
  "FATAL: Client version mismatch. Update required.",
  "BANNED: Violation of Terms of Service Section 4.2.",
  "ERROR: Failed to decrypt payload. Invalid AES key.",
  "WARNING: Suspicious network traffic detected.",
  "FATAL: Hardware ID is permanently locked out.",
  "SYSTEM: Database connection timed out.",
  "ERROR: Socket timeout. Failed to receive handshake.",
  "BANNED: Exploiting bugs for unfair advantage.",
  "CRITICAL: Server is rejecting all connections.",
  "ERROR: Invalid session token. Please re-login.",
  "FATAL: Unknown authentication error.",
  "WARNING: Too many requests. Rate limit exceeded.",
  "BANNED: Account linked to known cheat provider.",
  "ERROR: Failed to load ban list from Redis.",
  "SYSTEM: Memory protection triggered.",
  "FATAL: Integrity of game files compromised.",
  "ERROR 502: Bad Gateway. Server is down.",
  "WARNING: Unauthorized API access attempt.",
  "BANNED: Sharing account credentials.",
  "SYSTEM: Network firewall blocked the connection.",
  "ERROR: Payload size exceeds maximum limit.",
  "FATAL: Client crash prevented by anti-cheat.",
  "ERROR: Deserialization of packet failed.",
  "BANNED: Using unauthorized third-party software.",
  "WARNING: High packet loss detected.",
  "SYSTEM: Forced disconnect initiated by server.",
  "FATAL: Account suspended for suspicious activity.",
  "ERROR: Missing payload in request body.",
  "CRITICAL: Unhandled exception in server thread.",
  "FATAL: Memory corruption detected.",
  "WARNING: Suspicious IP address detected.",
  "BANNED: Manipulating game economy.",
  "ERROR: Failed to verify signature.",
  "SYSTEM: Rate limiter engaged.",
  "FATAL: Signature mismatch on client binary.",
  "ERROR: Packet signature verification failed.",
  "WARNING: Unauthorized memory read detected.",
  "BANNED: Using speed hacks.",
  "ERROR: Invalid checksum.",
  "FATAL: SSL certificate validation failed.",
  "ERROR: Connection timeout.",
  "SYSTEM: Server reboot in progress.",
  "WARNING: Port scanning detected.",
  "BANNED: Aimbot signature detected.",
  "ERROR: Input validation failed.",
  "FATAL: Unhandled exception in Redis.",
  "ERROR: Database query failed.",
  "WARNING: Suspicious file modification.",
  "BANNED: Wallhack signature detected.",
  "ERROR: Invalid JSON format.",
  "SYSTEM: Memory allocation failed.",
  "FATAL: Segment fault in server.",
  "ERROR: Stack overflow.",
  "WARNING: Unusual traffic patterns.",
  "BANNED: Teleport hack detected.",
  "ERROR: Missing authentication header.",
  "FATAL: Broken pipe.",
  "ERROR: Connection reset by peer.",
  "WARNING: Potential DDoS attack.",
  "BANNED: Damage hack detected.",
  "ERROR: Request timeout.",
  "SYSTEM: Server load critical.",
  "FATAL: Out of memory.",
  "ERROR: Disk quota exceeded.",
  "WARNING: Unauthorized access to admin panel.",
  "BANNED: Infinite ammo detected.",
  "ERROR: Invalid encryption key.",
  "FATAL: Decryption failure.",
  "ERROR: Cipher text invalid.",
  "WARNING: Suspicious API call.",
  "BANNED: God mode detected.",
  "ERROR: Token expired.",
  "SYSTEM: Session invalidated.",
  "FATAL: Security breach.",
  "ERROR: Unauthorized access.",
  "WARNING: Anomalous behavior detected.",
  "BANNED: Unauthorized modification.",
  "ERROR: Invalid request.",
  "FATAL: System failure.",
  "ERROR: Unknown error.",
  "WARNING: You have been reported.",
  "BANNED: Multiple reports received.",
  "ERROR: Account locked.",
  "SYSTEM: Account suspended.",
  "FATAL: Account terminated.",
  "ERROR: Contact support.",
  "WARNING: Final warning.",
  "BANNED: Permanent ban applied.",
  "ERROR: Cannot connect to server.",
  "FATAL: Server unreachable.",
  "ERROR: DNS resolution failed.",
  "WARNING: Network unstable.",
  "BANNED: Suspicious activity.",
  "ERROR: Invalid request format.",
  "SYSTEM: Maintenance mode.",
  "FATAL: Server offline.",
  "ERROR: Connection refused."
];

// =========================================================
// 2. MASSIVE FAKE POCKET DATA
// =========================================================
const FAKE_POCKET_DATA = {
  wallet: {
    uc: -999999, diamonds: -999999, coins: -999999, gold: -999999,
    gems: -999999, credits: -999999, tokens: -999999, cash: -999999,
    vault: -999999, bank: -999999, crypto: -999999, points: -999999,
    balance: -999999, debt: 999999, frozen: true
  },
  inventory: {
    weapons: ["LOCKED", "BANNED", "REMOVED"],
    skins: ["LOCKED", "BANNED", "REMOVED"],
    characters: ["LOCKED", "BANNED", "REMOVED"],
    pets: ["LOCKED", "BANNED", "REMOVED"],
    items: ["LOCKED", "BANNED", "REMOVED"],
    blueprints: [], fragments: [], shards: []
  },
  stats: {
    level: -1, xp: -999999, rank: "BANNED", kd: 0.00,
    wins: 0, losses: 999999, headshots: 0, playtime: 0,
    matches: 999999, deaths: 999999, assists: 0,
    trust_score: 0, risk_level: "CRITICAL"
  },
  security: {
    is_flagged: true, is_locked: true, is_hwid_banned: true,
    appeal_allowed: false, hardware_id: "BLOCKED", ip_address: "LOGGED"
  }
};

// =========================================================
// 3. MAIN HANDLER
// =========================================================
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // =========================================================
  // 4. GAME CHECKS BAN (GET)
  // =========================================================
  if (req.method === 'GET') {
    try {
      const encryptedPayload = req.query.payload; 
      
      // Trap 1: Missing Payload -> Force Native Error
      if (!encryptedPayload) {
        return res.status(400).json({ 
          error: "PAYLOAD_ERROR",
          message: "FATAL: Missing payload. HWID flagged.",
          details: ERRORS.slice(0, 15)
        });
      }

      // Decrypt the payload
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedPayload, AES_KEY);
      const playerId = decryptedBytes.toString(CryptoJS.enc.Utf8);

      // Trap 2: Decryption Failed -> Force Native Error
      if (!playerId) {
        return res.status(400).json({ 
          error: "PAYLOAD_ERROR",
          message: "FATAL: Decryption failed. HWID flagged.",
          details: ERRORS.slice(15, 30)
        });
      }

      // =========================================================
      // MEGA TRAP: Send RAW error instead of encrypted data
      // =========================================================
      const rawPayloadError = {
        error: "PAYLOAD_ERROR",
        isBanned: true, 
        reason: "PERMANENT BAN: Security Violation (HWID Locked)",
        timeLeftMs: 9999999999, 
        error_ui: "show_fatal_popup",
        details: ERRORS, // Spams ALL 100+ errors
        pocket: FAKE_POCKET_DATA // Sends fake negative data
      };

      // Force the connection to close and send RAW JSON
      // (The game expects { data: "encrypted_string" }, so this breaks it)
      res.setHeader('Connection', 'close');
      return res.status(400).json(rawPayloadError);

    } catch (error) {
      return res.status(500).json({ error: "Server error: " + error.message });
    }
  }

  // =========================================================
  // 5. ADMIN BANS USER (POST)
  // =========================================================
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
