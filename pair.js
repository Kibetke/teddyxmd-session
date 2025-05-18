const zlib = require('zlib');
const PastebinAPI = require('pastebin-js');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const pino = require('pino');
const {
    default: WhatsAppClient,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const router = express.Router();
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');

// Media content resources
const MEDIA_CONTENT = {
    audioUrls: [
        "https://files.catbox.moe/hpwsi2.mp3",
        "https://files.catbox.moe/xci982.mp3",
        // ... (rest of your audio URLs)
    ],
    videoUrls: [
        "https://i.imgur.com/Zuun5CJ.mp4",
        "https://i.imgur.com/tz9u2RC.mp4",
        // ... (rest of your video URLs)
    ],
    factsAndQuotes: [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
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
    cleanNumber: (num) => num.replace(/[^0-9]/g, '')
};

// WhatsApp client handlers
const whatsappHandlers = {
    initializeClient: async (id) => {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        return {
            client: WhatsAppClient({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS('Chrome')
            }),
            saveCreds
        };
    },
    handleConnection: async (client, saveCreds, id, res) => {
        client.ev.on('creds.update', saveCreds);
        
        client.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await this.handleSuccessfulConnection(client, id, res);
            } else if (connection === "close" && lastDisconnect?.error?.output.statusCode !== 401) {
                await delay(10000);
                await this.reconnect(client, id, res);
            }
        });
    },
    handleSuccessfulConnection: async (client, id, res) => {
        try {
            await delay(50000);
            const data = fs.readFileSync(`${__dirname}/temp/${id}/creds.json`);
            await delay(8000);

            // Compress and encode session data
            const compressedData = zlib.gzipSync(data);
            const b64data = compressedData.toString('base64');

            // Send session data
            await client.sendMessage(client.user.id, { text: 'KEITH;;;' + b64data });

            // Send media content
            await this.sendMediaContent(client);
            
            // Clean up
            await delay(100);
            await client.ws.close();
            utils.removeFile(`./temp/${id}`);
        } catch (error) {
            console.error('Connection handling error:', error);
            throw error;
        }
    },
    sendMediaContent: async (client) => {
        // Send random video with quote
        const randomQuote = utils.getRandomItem(MEDIA_CONTENT.factsAndQuotes);
        const randomVideo = utils.getRandomItem(MEDIA_CONTENT.videoUrls);
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
    },
    reconnect: async (client, id, res) => {
        utils.removeFile(`./temp/${id}`);
        await this.pairCodeHandler(client, id, res);
    },
    pairCodeHandler: async (client, id, res) => {
        if (!client.authState.creds.registered) {
            await delay(1500);
            const code = await client.requestPairingCode(utils.cleanNumber(res.query.number));
            if (!res.headersSent) {
                res.send({ code });
            }
        }
    }
};

// Main router handler
router.get('/', async (req, res) => {
    const id = makeid();
    
    try {
        const { client, saveCreds } = await whatsappHandlers.initializeClient(id);
        await whatsappHandlers.handleConnection(client, saveCreds, id, res);
        await whatsappHandlers.pairCodeHandler(client, id, res);
    } catch (error) {
        console.error("Service error:", error);
        utils.removeFile(`./temp/${id}`);
        if (!res.headersSent) {
            res.status(500).send({ code: "Service is Currently Unavailable" });
        }
    }
});

module.exports = router;
