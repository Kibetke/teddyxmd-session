const zlib = require('zlib');
const PastebinAPI = require('pastebin-js');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const pino = require("pino");
const {
    default: WhatsAppClient,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Configuration
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const TEMP_DIR = './temp';
const BROWSER_CONFIG = ["Microsoft Edge (Linux)", "", ""]; // Updated to use Microsoft Edge on Ubuntu

// Media content arrays
const MEDIA_CONTENT = {
    audio: [
        "https://files.catbox.moe/hpwsi2.mp3",
        // ... (keep your existing audio URLs)
    ],
    video: [
        "https://i.imgur.com/Zuun5CJ.mp4",
        // ... (keep your existing video URLs)
    ],
    quotes: [
        "The only way to do great work is to love what you do. - Steve Jobs",
        // ... (keep your existing quotes)
    ]
};

// Utility functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const removeFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
    }
};

// Session handler class
class SessionGenerator {
    constructor(id, phoneNumber) {
        this.id = id;
        this.phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        this.sessionDir = path.join(TEMP_DIR, id);
    }

    async initialize() {
        // Ensure temp directory exists
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        this.authState = await useMultiFileAuthState(this.sessionDir);
    }

    async generatePairCode() {
        try {
            this.client = WhatsAppClient({
                auth: {
                    creds: this.authState.state.creds,
                    keys: makeCacheableSignalKeyStore(this.authState.state.keys, 
                        pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: BROWSER_CONFIG
            });

            this.client.ev.on('creds.update', this.authState.saveCreds);
            
            if (!this.client.authState.creds.registered) {
                await delay(1500);
                return await this.client.requestPairingCode(this.phoneNumber);
            }
            
            return null;
        } catch (error) {
            console.error('Pair code generation failed:', error);
            throw error;
        }
    }

    async handleSession() {
        return new Promise((resolve, reject) => {
            this.client.ev.on("connection.update", async (update) => {
                try {
                    const { connection, lastDisconnect } = update;

                    if (connection === "open") {
                        await this.sendSessionData();
                        await this.sendMediaContent();
                        await this.cleanup();
                        resolve();
                    } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                        await delay(10000);
                        await this.retry();
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async sendSessionData() {
        await delay(5000);
        const data = fs.readFileSync(path.join(this.sessionDir, 'creds.json'));
        const compressedData = zlib.gzipSync(data);
        const b64data = compressedData.toString('base64');
        
        await this.client.sendMessage(this.client.user.id, {
            text: 'ALPHA;;;' + b64data
        });
    }

    async sendMediaContent() {
        // Send random video with quote caption
        await this.client.sendMessage(this.client.user.id, { 
            video: { url: getRandomItem(MEDIA_CONTENT.video) },
            caption: getRandomItem(MEDIA_CONTENT.quotes)
        });

        // Send random audio as voice note
        await this.client.sendMessage(this.client.user.id, {
            audio: { url: getRandomItem(MEDIA_CONTENT.audio) },
            mimetype: 'audio/mp4',
            ptt: true,
            waveform: [100, 0, 100, 0, 100, 0, 100],
            fileName: 'shizo',
            contextInfo: {
                mentionedJid: [this.client.user.id],
                externalAdReply: {
                    title: 'Thanks for choosing 𝗞𝗲𝗶𝘁𝗵 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 happy deployment 💜',
                    body: 'Regards Keithkeizzah',
                    thumbnailUrl: 'https://i.imgur.com/vTs9acV.jpeg',
                    sourceUrl: 'https://whatsapp.com/channel/0029Vaan9TF9Bb62l8wpoD47',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                },
            },
        });
    }

    async cleanup() {
        await delay(100);
        this.client.ws.close();
        removeFile(this.sessionDir);
    }

    async retry() {
        await this.cleanup();
        await this.initialize();
        await this.generatePairCode();
        await this.handleSession();
    }
}

// Route handler
router.get('/', async (req, res) => {
    try {
        const id = makeid();
        const phoneNumber = req.query.number;
        
        if (!phoneNumber) {
            return res.status(400).send({ error: "Phone number is required" });
        }

        const session = new SessionGenerator(id, phoneNumber);
        await session.initialize();
        
        const code = await session.generatePairCode();
        if (code) {
            res.send({ code });
        }

        await session.handleSession();
    } catch (error) {
        console.error("Session generation error:", error);
        if (!res.headersSent) {
            res.status(500).send({ error: "Service is currently unavailable" });
        }
    }
});

module.exports = router;
