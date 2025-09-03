const socket = io();

const listEl = document.getElementById("list");
const localIpEl = document.getElementById("localIp");
const rescanBtn = document.getElementById("rescan");

function render(devices) {
	localIpEl.textContent = devices.find((d) => d.local)?.ip || "-";
	// Sort: local first, then by ip
	devices = devices.slice().sort((a, b) => (a.local ? -1 : 0) - (b.local ? -1 : 0) || a.ip.localeCompare(b.ip));

	listEl.innerHTML = devices
		.map((d) => {
			const ip = d.ip;
			const time = d.time === 0 ? "local" : `${d.time}ms`;
			return `<div class="row"><span class="ip">${ip}</span><span class="time">${time}</span></div>`;
		})
		.join("");
}

socket.on("devices", (devices) => {
	render(devices);
});

rescanBtn.addEventListener("click", () => {
	socket.emit("rescan");
});
