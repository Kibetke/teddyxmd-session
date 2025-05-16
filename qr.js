const zlib = require('zlib');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');

const router = express.Router();

// Constants
const TEMP_DIR = './temp';
const SESSION_PREFIX = 'BWM_XMD_SESSION:::';
const RECONNECT_DELAY = 10000;
const SESSION_DELAY = 5000;

// Utility functions
const removeFile = (filePath) => {
    if (!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
};

const ensureTempDirExists = () => {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
};

const getCompressionMethod = (acceptEncoding) => {
    if (acceptEncoding.includes('gzip')) return 'gzip';
    if (acceptEncoding.includes('deflate')) return 'deflate';
    return null;
};

const generateHTMLResponse = (qrImage) => `
<!DOCTYPE html>
<html>
<head>
    <title>Professional Session Scanner</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #fff;
            text-align: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            max-width: 90%;
            width: 500px;
        }
        .qr-container {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
            display: inline-block;
        }
        .description {
            margin-top: 20px;
            font-size: 14px;
            line-height: 1.6;
            opacity: 0.9;
        }
        h1 {
            margin: 0 0 10px 0;
            font-weight: 600;
            color: #4facfe;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>WHATSAPP SESSION SCANNER</h1>
        <p>Scan this QR code with your WhatsApp mobile app</p>
        
        <div class="qr-container">
            <img src="${qrImage}" alt="QR Code" style="width: 200px; height: 200px;"/>
        </div>
        
        <div class="description">
            <p>This is a professional session scanner that securely connects your WhatsApp account to our system.</p>
            <p>Your session data will be encrypted and stored safely for seamless integration.</p>
        </div>
        
        <div class="footer">
            <p>Developed by Ibrahim Adams | Secure Connection Protocol v2.4</p>
        </div>
    </div>
</body>
</html>
`;

const CONNECTED_MESSAGE = `
🌟 *Session Connected!* 🌟  

- 🚀 Stay updated with new bot features!  
- 🔗 Get support and explore more:  
   - Github: _https://github.com/ibrahimaitech_  
   - Website: _https://www.ibrahimadams.site_  
   - Whatsappchannel: _https://whatsapp.com/channel/0029VaZuGSxEawdxZK9CzM0Y_

😎 _Made with ❤️ by Ibrahim Adams_
`;

async function handleSessionCreation(id, res, compressionMethod) {
    ensureTempDirExists();
    
    const { state, saveCreds } = await useMultiFileAuthState(path.join(TEMP_DIR, id));
    
    try {
        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: Browsers.macOS("Desktop"),
        });

        socket.ev.on('creds.update', saveCreds);
        
        socket.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                try {
                    const qrImage = await QRCode.toDataURL(qr);
                    const htmlResponse = generateHTMLResponse(qrImage);

                    if (compressionMethod) {
                        res.setHeader('Content-Encoding', compressionMethod);
                        zlib[compressionMethod](htmlResponse, (err, buffer) => {
                            if (err) {
                                console.error('Compression error:', err);
                                return res.status(500).send('Compression error');
                            }
                            res.setHeader('Content-Type', 'text/html');
                            res.send(buffer);
                        });
                    } else {
                        res.send(htmlResponse);
                    }
                } catch (error) {
                    console.error('QR generation error:', error);
                    if (!res.headersSent) {
                        res.status(500).json({ error: "Failed to generate QR code" });
                    }
                }
            }

            if (connection === "open") {
                await delay(SESSION_DELAY);

                try {
                    const credsPath = path.join(TEMP_DIR, id, 'creds.json');
                    const data = fs.readFileSync(credsPath);
                    await delay(800);
                    
                    const b64data = Buffer.from(data).toString('base64');
                    const sessionData = `${SESSION_PREFIX}${b64data}`;

                    await socket.sendMessage(socket.user.id, { text: sessionData });
                    await socket.sendMessage(socket.user.id, { text: CONNECTED_MESSAGE });

                    await delay(100);
                    await socket.ws.close();
                    removeFile(path.join(TEMP_DIR, id));
                } catch (error) {
                    console.error('Session save error:', error);
                }
            } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                await delay(RECONNECT_DELAY);
                handleSessionCreation(id, res, compressionMethod);
            }
        });
    } catch (error) {
        console.error('Session creation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Service is Currently Unavailable" });
        }
        removeFile(path.join(TEMP_DIR, id));
    }
}

router.get('/', async (req, res) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const compressionMethod = getCompressionMethod(acceptEncoding);
    const sessionId = Date.now().toString();

    try {
        await handleSessionCreation(sessionId, res, compressionMethod);
    } catch (error) {
        console.error('Route handler error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

module.exports = router;
