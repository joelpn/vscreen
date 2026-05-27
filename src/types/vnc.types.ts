export interface VncServer {
	displayId: string;
	port: number;
	pid?: number;
	running: boolean;
	startedAt?: string;
}
