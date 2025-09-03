const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ip = require("ip");
const path = require("path");
const os = require("os");
const { Worker } = require("worker_threads");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const WORKER_PATH = path.resolve(__dirname, "worker_scan.js");

function chunkArray(arr, parts) {
	const out = [];
	const chunkSize = Math.ceil(arr.length / parts);
	for (let i = 0; i < arr.length; i += chunkSize) out.push(arr.slice(i, i + chunkSize));
	return out;
}

function runWorker(addresses) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(WORKER_PATH);
		const timeout = setTimeout(() => {
			worker.terminate().catch(() => {});
			reject(new Error("worker timeout"));
		}, 30_000);

		worker.once("message", (msg) => {
			clearTimeout(timeout);
			resolve(msg);
			worker.terminate().catch(() => {});
		});
		worker.once("error", (err) => {
			clearTimeout(timeout);
			reject(err);
		});
		worker.postMessage(addresses);
	});
}

async function scanNetwork() {
	const local = ip.address();
	const basePrefix = local.split(".").slice(0, 3).join(".");
	const addresses = [];
	for (let i = 1; i < 255; i++) addresses.push(`${basePrefix}.${i}`);

	const cpuCount = Math.max(1, os.cpus().length - 1);
	const workers = Math.min(8, cpuCount);
	const chunks = chunkArray(addresses, workers);

	const promises = chunks.map((chunk) => runWorker(chunk));
	const resultsParts = await Promise.all(promises);
	const flat = resultsParts.flat();
	return flat;
}

let lastDevices = [];

async function pollAndEmit() {
	try {
		const devices = await scanNetwork();
		devices.push({ ip: ip.address(), alive: true, time: 0, local: true });
		lastDevices = devices;
		io.emit("devices", devices);
	} catch (err) {
		console.error("Scan failed", err);
	}
}

io.on("connection", (socket) => {
	console.log("client connected", socket.id);
	socket.emit("devices", lastDevices);
	socket.on("rescan", async () => {
		const devices = await scanNetwork();
		devices.push({ ip: ip.address(), alive: true, time: 0, local: true });
		lastDevices = devices;
		io.emit("devices", devices);
	});
});

// Start periodic scanning
pollAndEmit();
setInterval(pollAndEmit, 10 * 1000);

server.listen(PORT, () => {
	console.log(`LAN Scanner dashboard running on http://localhost:${PORT}`);
});
