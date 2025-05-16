const zlib = require('zlib');
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
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

// Enhanced compression function
async function compressSessionData(data) {
    return new Promise((resolve, reject) => {
        zlib.gzip(data, (err, buffer) => {
            if (err) return reject(err);
            resolve(buffer.toString('base64'));
        });
    });
}

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = Date.now().toString();
    
    async function BWM_XMD_QR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        try {
            let Qr_Code_By_Ibrahim_Adams = Ibrahim_Adams({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
                },
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
            });

            Qr_Code_By_Ibrahim_Adams.ev.on('creds.update', saveCreds);
            Qr_Code_By_Ibrahim_Adams.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    const qrImage = await QRCode.toDataURL(qr);
                    return res.send(`
                        <div style="text-align: center; padding: 20px;">
                            <img src="${qrImage}" alt="QR Code" style="max-width: 300px;"/>
                            <h2>Scan this QR code to connect</h2>
                            <p>Session will automatically close after successful connection</p>
                        </div>
                    `);
                }

                if (connection === "open") {
                    await delay(3000);
                    const credsPath = path.join(__dirname, `./temp/${id}/creds.json`);
                    const data = fs.readFileSync(credsPath);
                    
                    // Enhanced compression with error handling
                    let compressedSession;
                    try {
                        compressedSession = await compressSessionData(data);
                    } catch (compressErr) {
                        console.error("Compression error:", compressErr);
                        compressedSession = Buffer.from(data).toString('base64');
                    }

                    const sessionMessage = `KEITH;;;${compressedSession}`;
                    
                    // Send compressed session data
                    await Qr_Code_By_Ibrahim_Adams.sendMessage(
                        Qr_Code_By_Ibrahim_Adams.user.id, 
                        { text: sessionMessage }
                    );

                    // Success message with improved formatting
                    const successMessage = `
connected 
                    `;

                    await Qr_Code_By_Ibrahim_Adams.sendMessage(
                        Qr_Code_By_Ibrahim_Adams.user.id, 
                        { text: successMessage }
                    );

                    // Clean up
                    await delay(500);
                    await Qr_Code_By_Ibrahim_Adams.ws.close();
                    return removeFile(`./temp/${id}`);
                } 
                
                if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    return BWM_XMD_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Session error:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Service unavailable", details: err.message });
            }
            removeFile(`./temp/${id}`);
        }
    }

    return BWM_XMD_QR_CODE();
});

module.exports = router;
