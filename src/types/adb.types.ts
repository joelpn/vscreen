export interface AdbDevice {
	serial: string;
	state: "device" | "unauthorized" | "offline";
	model?: string;
}

export interface AdbTunnel {
	deviceSerial: string;
	localPort: number;
	remotePort: number;
	active: boolean;
}
