const zlib = require('zlib'); // For compression
const PastebinAPI = require('pastebin-js'),
pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: Ibrahim_Adams,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// List of audio URLs
const audioUrls = [
    "https://files.catbox.moe/hpwsi2.mp3",
    "https://files.catbox.moe/xci982.mp3",
    "https://files.catbox.moe/utbujd.mp3",
    "https://files.catbox.moe/w2j17k.m4a",
    "https://files.catbox.moe/851skv.m4a",
    "https://files.catbox.moe/qnhtbu.m4a",
    "https://files.catbox.moe/lb0x7w.mp3",
    "https://files.catbox.moe/efmcxm.mp3",
    "https://files.catbox.moe/gco5bq.mp3",
    "https://files.catbox.moe/26oeeh.mp3",
    "https://files.catbox.moe/a1sh4u.mp3",
    "https://files.catbox.moe/vuuvwn.m4a",
    "https://files.catbox.moe/wx8q6h.mp3",
    "https://files.catbox.moe/uj8fps.m4a",
    "https://files.catbox.moe/dc88bx.m4a",
    "https://files.catbox.moe/tn32z0.m4a",
    "https://files.catbox.moe/9fm6gi.mp3",
    "https://files.catbox.moe/9h8i2a.mp3",
    "https://files.catbox.moe/5pm55z.mp3",
    "https://files.catbox.moe/zjk77k.mp3",
    "https://files.catbox.moe/fe5lem.m4a",
    "https://files.catbox.moe/4b1ohl.mp3"
];

// List of video URLs
const videoUrls = [
    "https://i.imgur.com/Zuun5CJ.mp4",
    "https://i.imgur.com/tz9u2RC.mp4",
    "https://i.imgur.com/W7dm6hG.mp4",
    "https://i.imgur.com/vElB6hY.mp4",
    "https://i.imgur.com/KEs4JGe.mp4",
    "https://i.imgur.com/ry0z5iY.mp4",
    "https://i.imgur.com/gUVzqp0.mp4",
    "https://i.imgur.com/5zXuU0f.mp4",
    "https://i.imgur.com/7tYyJst.mp4",
    "https://i.imgur.com/1sf08VI.mp4",
    "https://i.imgur.com/b82uXEY.mp4",
    "https://i.imgur.com/ZmUHE9n.mp4",
    "https://i.imgur.com/V6wOAMg.mp4",
    "https://i.imgur.com/LBeULsl.mp4",
    "https://i.imgur.com/lvKo3PN.mp4",
    "https://i.imgur.com/HMqqdpN.mp4",
    "https://i.imgur.com/xm4j3yT.mp4",
    "https://i.imgur.com/oJTzrh0.mp4",
    "https://i.imgur.com/DSOZOx3.mp4",
    "https://i.imgur.com/GNm3TCN.mp4",
    "https://i.imgur.com/WVYlxDb.mp4",
    "https://i.imgur.com/xPbhwjz.mp4",
    "https://i.imgur.com/VDUNXrp.mp4",
    "https://i.imgur.com/wynK50w.mp4",
    "https://i.imgur.com/CF79jVv.mp4",
    "https://i.imgur.com/CF79jVv.mp4",
    "https://i.imgur.com/CF79jVv.mp4",
    "https://i.imgur.com/Ob7hzMz.mp4",
    "https://i.imgur.com/etEV3om.mp4",
    "https://i.imgur.com/OLqupmU.mp4",
    "https://i.imgur.com/OLqupmU.mp4",
    "https://i.imgur.com/imDK97l.mp4",
    "https://i.imgur.com/pNArg0x.mp4",
    "https://i.imgur.com/pNArg0x.mp4",
    "https://i.imgur.com/wIEwUS2.mp4",
    "https://i.imgur.com/upNLbX8.mp4",
    "https://i.imgur.com/AlKaIdq.mp4"
];

// List of random facts and quotes
const factsAndQuotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    "In the end, we only regret the chances we didn’t take.",
    "The best way to predict the future is to create it. - Peter Drucker",
    "Don’t watch the clock; do what it does. Keep going. - Sam Levenson",
    "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
    "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle. - Christian D. Larson",
    "Act as if what you do makes a difference. It does. - William James"
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
};

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function BWM_XMD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let Pair_Code_By_Ibrahim_Adams = Ibrahim_Adams({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Chrome (Linux)", "", ""]
            });

            if (!Pair_Code_By_Ibrahim_Adams.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_Ibrahim_Adams.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Pair_Code_By_Ibrahim_Adams.ev.on('creds.update', saveCreds);
            Pair_Code_By_Ibrahim_Adams.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(50000);
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(8000);

                    // Compress and encode session data
                    let compressedData = zlib.gzipSync(data); // Compress
                    let b64data = compressedData.toString('base64'); // Base64 encode

                    // Send session data first
                    let sessionMessage = await Pair_Code_By_Ibrahim_Adams.sendMessage(Pair_Code_By_Ibrahim_Adams.user.id, {
                        text: 'ALPHA;;;' + b64data
                    });

                    // Get a random fact/quote
                    let randomFactOrQuote = getRandomFactOrQuote();
                    let randomVideoUrl = getRandomVideoUrl(); // Get a random video URL

                    // Send the video with caption
                    await Pair_Code_By_Ibrahim_Adams.sendMessage(Pair_Code_By_Ibrahim_Adams.user.id, { 
                        video: { url: randomVideoUrl },
                        caption: randomFactOrQuote 
                    });

                    // Send the random audio URL as a voice note
                    const randomAudioUrl = getRandomAudioUrl(); // Get a random audio URL
                    await Pair_Code_By_Ibrahim_Adams.sendMessage(Pair_Code_By_Ibrahim_Adams.user.id, { 
                        audio: { url: randomAudioUrl },
                        mimetype: 'audio/mp4', // MIME type for voice notes
                        ptt: true,
                        waveform: [100, 0, 100, 0, 100, 0, 100], // Optional waveform pattern
                        fileName: 'shizo',
                        contextInfo: {
                            mentionedJid: [Pair_Code_By_Ibrahim_Adams.user.id], // Mention the sender in the audio message
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
                    await Pair_Code_By_Ibrahim_Adams.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    BWM_XMD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("service restarted");
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "Service is Currently Unavailable" });
            }
        }
    }

    return await BWM_XMD_PAIR_CODE();
});

module.exports = router;
