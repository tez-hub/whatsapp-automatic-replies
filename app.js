const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys'); // Store session info
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Show QR code in the terminal
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp(); // Reconnect automatically
            }
        } else if (connection === 'open') {
            console.log('WhatsApp Web connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds); // Save credentials automatically

    sock.ev.on('messages.upsert', async (m) => {
        console.log('New message:', JSON.stringify(m, null, 2));
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.key.remoteJid) {
            const from = msg.key.remoteJid;
            await sock.sendMessage(from, { text: 'Hello! This is an automated reply.' });
        }
    });
}

connectToWhatsApp();
