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
    delay 
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    // Compress response using zlib
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const compressionMethod = acceptEncoding.includes('gzip') ? 'gzip' : 
                            acceptEncoding.includes('deflate') ? 'deflate' : null;

    const id = Date.now().toString();
    
    async function BWM_XMD_QR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let Qr_Code_By_Ibrahim_Adams = Ibrahim_Adams({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
            });

            Qr_Code_By_Ibrahim_Adams.ev.on('creds.update', saveCreds);
            Qr_Code_By_Ibrahim_Adams.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) {
                    const qrImage = await QRCode.toDataURL(qr);
                    const htmlResponse = `
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

                    if (compressionMethod) {
                        res.setHeader('Content-Encoding', compressionMethod);
                        zlib[compressionMethod](htmlResponse, (err, buffer) => {
                            if (err) {
                                res.status(500).send('Compression error');
                                return;
                            }
                            res.setHeader('Content-Type', 'text/html');
                            res.send(buffer);
                        });
                    } else {
                        res.send(htmlResponse);
                    }
                }

                if (connection === "open") {
                    await delay(5000);

                    let data = fs.readFileSync(path.join(__dirname, `/temp/${id}/creds.json`));
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');
                    let sessionData = `BWM_XMD_SESSION:::${b64data}`;

                    await Qr_Code_By_Ibrahim_Adams.sendMessage(Qr_Code_By_Ibrahim_Adams.user.id, { text: sessionData });

                    let BWM_XMD_TEXT = `
🌟 *Session Connected!* 🌟  

- 🚀 Stay updated with new bot features!  
- 🔗 Get support and explore more:  
   - Github: _https://github.com/ibrahimaitech_  
   - Website: _https://www.ibrahimadams.site_  
   - Whatsappchannel: _https://whatsapp.com/channel/0029VaZuGSxEawdxZK9CzM0Y_

😎 _Made with ❤️ by Ibrahim Adams_
`;

                    await Qr_Code_By_Ibrahim_Adams.sendMessage(Qr_Code_By_Ibrahim_Adams.user.id, { text: BWM_XMD_TEXT });

                    await delay(100);
                    await Qr_Code_By_Ibrahim_Adams.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    BWM_XMD_QR_CODE();
                }
            });
        } catch (err) {
            if (!res.headersSent) {
                await res.json({ code: "Service is Currently Unavailable" });
            }
            console.log(err);
            await removeFile('./temp/' + id);
        }
    }

    return await BWM_XMD_QR_CODE();
});

module.exports = router;
