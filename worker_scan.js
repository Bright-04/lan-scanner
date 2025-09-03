const { parentPort } = require("worker_threads");
const ping = require("ping");

parentPort.once("message", async (addresses) => {
	const results = [];
	const limit = 50; // limit concurrent pings inside worker
	let running = 0;
	let idx = 0;

	await new Promise((resolve) => {
		function next() {
			while (running < limit && idx < addresses.length) {
				const addr = addresses[idx++];
				running++;
				ping.promise
					.probe(addr, { timeout: 2 })
					.then((res) => {
						if (res.alive) results.push({ ip: addr, alive: true, time: res.time });
					})
					.catch(() => {})
					.finally(() => {
						running--;
						if (idx >= addresses.length && running === 0) resolve();
						else next();
					});
			}
		}
		next();
	});

	parentPort.postMessage(results);
});
