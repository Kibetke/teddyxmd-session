const zlib = require('zlib');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    Browsers, 
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

// Media content arrays
const mediaContent = {
    audioUrls: [
        "https://files.catbox.moe/hpwsi2.mp3",
        "https://files.catbox.moe/xci982.mp3",
        "https://files.catbox.moe/utbujd.mp3",
    ],
    videoUrls: [
        "https://i.imgur.com/Zuun5CJ.mp4",
        "https://i.imgur.com/tz9u2RC.mp4",
        "https://i.imgur.com/W7dm6hG.mp4",
    ],
    factsAndQuotes: [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    ]
};

// Helper functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const removeFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
    }
};

router.get('/', async (req, res) => {
    const sessionId = Date.now().toString();
    const sessionDir = path.join(__dirname, 'temp', sessionId);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.macOS("Desktop")
        });

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                try {
                    const qrImage = await QRCode.toDataURL(qr);
                    res.send(`<img src="${qrImage}" alt="QR Code" />`);
                } catch (error) {
                    console.error("QR generation error:", error);
                    res.status(500).send("Error generating QR code");
                }
                return;
            }

            if (connection === "open") {
                try {
                    await delay(5000); // Reduced delay for better UX

                    // Read and prepare session data
                    const credsPath = path.join(sessionDir, 'creds.json');
                    if (!fs.existsSync(credsPath)) {
                        throw new Error("Credentials file not found");
                    }

                    const data = fs.readFileSync(credsPath);
                    const compressedData = zlib.gzipSync(data);
                    const b64data = compressedData.toString('base64');
                    const sessionData = `KEITH;;;${b64data}`;

                    // Send session data to user
                    await sock.sendMessage(sock.user.id, { text: sessionData });

                    // Send media content
                    await sock.sendMessage(sock.user.id, { 
                        video: { url: getRandomItem(mediaContent.videoUrls) },
                        caption: getRandomItem(mediaContent.factsAndQuotes)
                    });

                    await sock.sendMessage(sock.user.id, {
                        audio: { url: getRandomItem(mediaContent.audioUrls) },
                        mimetype: 'audio/mp4',
                        ptt: true,
                        contextInfo: {
                            mentionedJid: [sock.user.id],
                            externalAdReply: {
                                title: 'Thanks for choosing 𝗞𝗲𝗶𝘁𝗵 𝗦𝘂𝗽𝗽𝗼𝗿𝘁',
                                body: 'Regards Keithkeizzah',
                                thumbnailUrl: 'https://i.imgur.com/vTs9acV.jpeg',
                                sourceUrl: 'https://whatsapp.com/channel/0029Vaan9TF9Bb62l8wpoD47',
                                mediaType: 1,
                                renderLargerThumbnail: true,
                            },
                        },
                    });

                    // Clean up
                    await delay(100);
                    await sock.ws.close();
                    removeFile(sessionDir);
                    
                } catch (error) {
                    console.error("Session handling error:", error);
                    removeFile(sessionDir);
                    if (!res.headersSent) {
                        res.status(500).json({ error: "Session processing failed" });
                    }
                }
            } 
            else if (connection === "close") {
                if (lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    removeFile(sessionDir);
                    // Consider whether you want to restart the connection here
                    // Currently removed to prevent infinite loops
                }
            }
        });
    } catch (error) {
        console.error("Initialization error:", error);
        removeFile(sessionDir);
        if (!res.headersSent) {
            res.status(500).json({ error: "Service initialization failed" });
        }
    }
});

module.exports = router;
