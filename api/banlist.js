const protobuf = require("protobufjs");
const crypto = require("crypto");

// The JSON Data you want to send
const jsonData = {
    playerId: "null",
    action: "login",
    timestamp: Date.now()
};

async function sendSecureRequest() {
    try {
        // 1. PROTOBUF SERIALIZATION
        // We define the schema in code for this example
        const root = protobuf.Root.fromJSON({
            nested: {
                GameRequest: {
                    fields: {
                        playerId: { type: "string", id: 1 },
                        action: { type: "string", id: 2 },
                        timestamp: { type: "double", id: 3 }
                    }
                }
            }
        });
        
        const GameRequest = root.lookupType("GameRequest");
        
        // Validate and Serialize JSON to Protobuf Buffer
        const errMsg = GameRequest.verify(jsonData);
        if (errMsg) throw Error(errMsg);
        
        const message = GameRequest.create(jsonData);
        const protoBuffer = GameRequest.encode(message).finish();
        console.log("1. Serialized to Protobuf:", protoBuffer.toString('hex'));

        // 2. AES ENCRYPTION
        // You MUST have the original game's key and IV here
        const aesKey = Buffer.from("0123456789abcdef0123456789abcdef", "hex"); // 32 bytes for AES-256
        const iv = Buffer.from("0123456789abcdef", "hex"); // 16 bytes
        
        const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
        let encrypted = cipher.update(protoBuffer);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        console.log("2. Encrypted Payload:", encrypted.toString('hex'));

        // 3. HTTPS REQUEST
        const targetUrl = "https://freefiremobile.com/api/login"; // Example URL
        
        console.log(`3. Sending HTTPS Request to ${targetUrl}...`);
        
        // We send the encrypted buffer as the body
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'User-Agent': 'GameClient/1.0'
            },
            body: encrypted
        });

        // 4. DESERIALIZATION (Server Response)
        const responseBuffer = Buffer.from(await response.arrayBuffer());
        
        // Decrypt the response
        const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
        let decrypted = decipher.update(responseBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        // Decode Protobuf back to JSON
        const decodedResponse = GameRequest.decode(decrypted);
        const finalJson = GameRequest.toObject(decodedResponse);
        
        console.log("4. Server Response (Decrypted JSON):", finalJson);

    } catch (error) {
        console.error("Pipeline failed:", error.message);
    }
}

sendSecureRequest();
