const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const port = 3000;

http.createServer((req, res) => {
    let filePath = req.url === '/' ? './index.html' : `.${req.url}`;
    
    // If the path doesn't have extension, assume .html
    if (!path.extname(filePath)) {
        filePath += '.html';
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // If file not found, serve index.html (SPA behavior)
            filePath = './index.html';
        }

        // Determine content type based on extension
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.json': 'application/json',
            '.ico': 'image/x-icon'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Read the file as a binary buffer and serve with correct MIME type
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 - File Not Found');
                return;
            }

            // Send the file with no-cache headers
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(data);
        });
    });
}).listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Serving files from: ${process.cwd()}`);
    
    // Scan network interfaces to find the LAN IP addresses
    const nets = os.networkInterfaces();
    console.log('\n📱 To open this app on your mobile phone (on same Wi-Fi):');
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`👉 http://${net.address}:${port}`);
            }
        }
    }
    console.log('');
});
