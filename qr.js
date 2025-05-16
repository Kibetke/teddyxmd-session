const zlib = require('zlib'); // For compression
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { 
    default: Ibrahim_Adams, 
    useMultiFileAuthState, 
    Browsers, 
    delay 
} = require("@whiskeysockets/baileys");

// List of audio URLs
const audioUrls = [
    "https://files.catbox.moe/hpwsi2.mp3",
    "https://files.catbox.moe/xci982.mp3",
    "https://files.catbox.moe/utbujd.mp3",
    // Add more audio URLs as needed
];

// List of video URLs
const videoUrls = [
    "https://i.imgur.com/Zuun5CJ.mp4",
    "https://i.imgur.com/tz9u2RC.mp4",
    "https://i.imgur.com/W7dm6hG.mp4",
    // Add more video URLs as needed
];

// List of random facts and quotes
const factsAndQuotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    // Add more quotes as needed
];

// Function to get a random audio URL
function getRandomAudioUrl() {
    const randomIndex = Math.floor(Math.random() * audioUrls.length);
    return audioUrls[randomIndex];
}

// Function to get a random video URL
function getRandomVideoUrl() {
    const randomIndex = Math.floor(Math.random() * videoUrls.length);
    return videoUrls[randomIndex];
}

// Function to get a random fact/quote
function getRandomFactOrQuote() {
    const randomIndex = Math.floor(Math.random() * factsAndQuotes.length);
    return factsAndQuotes[randomIndex];
}

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = Date.now().toString(); // Use timestamp-based unique ID
    
    async function BWM_XMD_QR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let Qr_Code_By_Ibrahim_Adams = Ibrahim_Adams({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Desktop")
            });

            Qr_Code_By_Ibrahim_Adams.ev.on('creds.update', saveCreds);
            Qr_Code_By_Ibrahim_Adams.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) {
                    // Send QR code as an image response
                    const qrImage = await QRCode.toDataURL(qr);
                    return res.send(`<img src="${qrImage}" alt="QR Code" />`);
                }

                if (connection === "open") {
                    await delay(50000);

                    let data = fs.readFileSync(path.join(__dirname, `/temp/${id}/creds.json`));
                    await delay(8000);
                    
                    // Compress and encode session data
                    let compressedData = zlib.gzipSync(data); // Compress
                    let b64data = compressedData.toString('base64'); // Base64 encode
                    let sessionData = `KEITH;;;${b64data}`;

                    // Send session data
                    await Qr_Code_By_Ibrahim_Adams.sendMessage(Qr_Code_By_Ibrahim_Adams.user.id, { text: sessionData });

                    // Get a random fact/quote
                    let randomFactOrQuote = getRandomFactOrQuote();
                    let randomVideoUrl = getRandomVideoUrl();

                    // Send the video with caption
                    await Qr_Code_By_Ibrahim_Adams.sendMessage(Qr_Code_By_Ibrahim_Adams.user.id, { 
                        video: { url: randomVideoUrl },
                        caption: randomFactOrQuote 
                    });

                    // Send the random audio URL as a voice note
                    const randomAudioUrl = getRandomAudioUrl();
                    await Qr_Code_By_Ibrahim_Adams.sendMessage(Qr_Code_By_Ibrahim_Adams.user.id, { 
                        audio: { url: randomAudioUrl },
                        mimetype: 'audio/mp4',
                        ptt: true,
                        waveform: [100, 0, 100, 0, 100, 0, 100],
                        fileName: 'shizo',
                        contextInfo: {
                            mentionedJid: [Qr_Code_By_Ibrahim_Adams.user.id],
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

                    await delay(100);
                    await Qr_Code_By_Ibrahim_Adams.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    BWM_XMD_QR_CODE();
                }
            });
        } catch (err) {
            console.log("service restarted");
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.json({ code: "Service is Currently Unavailable" });
            }
        }
    }

    return await BWM_XMD_QR_CODE();
});

module.exports = router;
