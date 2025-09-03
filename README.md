# LAN Scanner — Terminal Themed Dashboard

This is a small Node.js app that scans your local /24 subnet and displays connected devices in a terminal-themed web UI in real time using Socket.IO.

Quick start

1. Open a terminal in the project folder.
2. Install dependencies:

```powershell
npm install
```

3. Start the server:

```powershell
npm start
```

4. Open http://localhost:3000 in your browser.

Notes and limitations

-   The scanner uses ICMP ping and attempts addresses in the local /24 derived from your machine's IP. This is simple and works for most home/small networks.
-   Some devices may not respond to ICMP or may be filtered by the network.
-   Running on Windows may require Node.js to be allowed to send ICMP/ping traffic.

Security

This is a local development tool. Do not expose the port to untrusted networks.

# lan-scanner

