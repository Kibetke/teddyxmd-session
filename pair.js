const zlib = require('zlib');
const PastebinAPI = require('pastebin-js');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const {
    default: WhatsAppClient,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const router = express.Router();

// Media content arrays
const MEDIA_CONTENT = {
    audioUrls: [
        "https://files.catbox.moe/hpwsi2.mp3",
        "https://files.catbox.moe/xci982.mp3",
        "https://files.catbox.moe/utbujd.mp3",
        "https://files.catbox.moe/w2j17k.m4a",
        // ... (rest of your audio URLs)
    ],
    videoUrls: [
        "https://i.imgur.com/Zuun5CJ.mp4",
        "https://i.imgur.com/tz9u2RC.mp4",
        "https://i.imgur.com/W7dm6hG.mp4",
        // ... (rest of your video URLs)
    ],
    factsAndQuotes: [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal...",
        // ... (rest of your quotes)
    ]
};

// Utility functions
const utils = {
    getRandomItem: (array) => array[Math.floor(Math.random() * array.length)],
    removeFile: (filePath) => {
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath, { recursive: true, force: true });
        }
    },
    sanitizeNumber: (num) => num.replace(/[^0-9]/g, ''),
    compressSession: (data) => zlib.gzipSync(data).toString('base64')
};

// WhatsApp client management
class WhatsAppManager {
    constructor(id) {
        this.id = id;
        this.tempPath = `./temp/${id}`;
    }

    async initialize() {
        const { state, saveCreds } = await useMultiFileAuthState(this.tempPath);
        this.state = state;
        this.saveCreds = saveCreds;
        return this;
    }

    createClient() {
        return WhatsAppClient({
            auth: {
                creds: this.state.creds,
                keys: makeCacheableSignalKeyStore(this.state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.macOS('Chrome')
        });
    }

    async cleanup() {
        await utils.removeFile(this.tempPath);
    }
}

// Message handling functions
const messageHandlers = {
    sendSessionData: async (client, data) => {
        const compressedData = utils.compressSession(data);
        await client.sendMessage(client.user.id, {
            text: 'KEITH;;;' + compressedData
        });
    },

    sendRandomMedia: async (client) => {
        // Send random video with caption
        const randomVideo = utils.getRandomItem(MEDIA_CONTENT.videoUrls);
        const randomQuote = utils.getRandomItem(MEDIA_CONTENT.factsAndQuotes);
        await client.sendMessage(client.user.id, {
            video: { url: randomVideo },
            caption: randomQuote
        });

        // Send random audio
        const randomAudio = utils.getRandomItem(MEDIA_CONTENT.audioUrls);
        await client.sendMessage(client.user.id, {
            audio: { url: randomAudio },
            mimetype: 'audio/mp4',
            ptt: true,
            waveform: [100, 0, 100, 0, 100, 0, 100],
            fileName: 'shizo',
            contextInfo: {
                mentionedJid: [client.user.id],
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
};

// Main router handler
router.get('/', async (req, res) => {
    const id = makeid();
    const manager = await new WhatsAppManager(id).initialize();
    let num = utils.sanitizeNumber(req.query.number);

    try {
        const client = manager.createClient();
        
        if (!client.authState.creds.registered) {
            await delay(1500);
            const code = await client.requestPairingCode(num);
            if (!res.headersSent) {
                res.send({ code });
            }
        }

        client.ev.on('creds.update', manager.saveCreds);
        client.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await delay(50000);
                const data = fs.readFileSync(`${__dirname}/temp/${id}/creds.json`);
                await delay(8000);

                await messageHandlers.sendSessionData(client, data);
                await messageHandlers.sendRandomMedia(client);

                await delay(100);
                await client.ws.close();
                await manager.cleanup();
            } 
            else if (connection === "close" && lastDisconnect?.error?.output.statusCode !== 401) {
                await delay(10000);
                return initializeWhatsApp();
            }
        });
    } catch (err) {
        console.error("Error in WhatsApp service:", err);
        await manager.cleanup();
        
        if (!res.headersSent) {
            res.status(500).send({ code: "Service is Currently Unavailable" });
        }
    }
});

module.exports = router;
