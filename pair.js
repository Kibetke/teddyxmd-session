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

const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const router = express.Router();

// Media URLs
const MEDIA = {
    audio: [
        "https://files.catbox.moe/hpwsi2.mp3",
        "https://files.catbox.moe/xci982.mp3",
        // ... rest of audio URLs
    ],
    video: [
        "https://i.imgur.com/Zuun5CJ.mp4",
        "https://i.imgur.com/tz9u2RC.mp4",
        // ... rest of video URLs
    ],
    quotes: [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal...",
        // ... rest of quotes
    ]
};

// Utility functions
const utils = {
    getRandom: (array) => array[Math.floor(Math.random() * array.length)],
    removeFile: (path) => {
        if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    },
    cleanNumber: (num) => num.replace(/[^0-9]/g, '')
};

async function handlePairing(req, res) {
    const id = makeid();
    let number = utils.cleanNumber(req.query.number);
    const authPath = `./temp/${id}`;

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authPath);
        const client = WhatsAppClient({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: Browsers.macOS('Desktop') // Changed to MacOS Safari
        });

        if (!client.authState.creds.registered) {
            await delay(1500);
            const code = await client.requestPairingCode(number);
            if (!res.headersSent) res.send({ code });
        }

        client.ev.on('creds.update', saveCreds);
        client.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
            if (connection === "open") {
                await delay(5000);
                const sessionData = fs.readFileSync(`${__dirname}/temp/${id}/creds.json`);
                
                // Compress and encode session
                const compressed = zlib.gzipSync(sessionData);
                const encoded = compressed.toString('base64');

                // Send session data
                await client.sendMessage(client.user.id, { text: `ALPHA;;;${encoded}` });

                // Send random media
                await sendRandomMedia(client);

                await delay(100);
                client.ws.close();
                utils.removeFile(authPath);
            } else if (connection === "close" && lastDisconnect?.error?.output.statusCode !== 401) {
                await delay(10000);
                handlePairing(req, res);
            }
        });
    } catch (error) {
        console.error("Pairing error:", error);
        utils.removeFile(authPath);
        if (!res.headersSent) res.send({ code: "Service unavailable" });
    }
}

async function sendRandomMedia(client) {
    try {
        // Send random quote with video
        await client.sendMessage(client.user.id, {
            video: { url: utils.getRandom(MEDIA.video) },
            caption: utils.getRandom(MEDIA.quotes)
        });

        // Send random audio
        await client.sendMessage(client.user.id, {
            audio: { url: utils.getRandom(MEDIA.audio) },
            mimetype: 'audio/mp4',
            ptt: true,
            waveform: [100, 0, 100, 0, 100, 0, 100],
            contextInfo: {
                mentionedJid: [client.user.id],
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
    } catch (error) {
        console.error("Media sending error:", error);
    }
}

router.get('/', (req, res) => handlePairing(req, res));

module.exports = router;
