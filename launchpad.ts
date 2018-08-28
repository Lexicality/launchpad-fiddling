// https://github.com/bwiklund/node-novation-launchpad but not in coffeescript and actually working

const midi: any = require('midi')

export class Launchpad {
	private port: number;
	private midiIn: any;
	private midiOut: any;

	constructor() {
		this.onExit = this.onExit.bind(this);
		this.onMidiEvent = this.onMidiEvent.bind(this);
		this.clear = this.clear.bind(this);

		this.midiOut = new midi.output();
		this.midiIn = new midi.input();

		process.on("SIGINT", this.onExit);

		this.midiIn.openPort(0);
		this.midiIn.on("message", this.onMidiEvent);

		this.port = -1;
		for (let i = 0; i < this.midiOut.getPortCount(); i++) {
			let portName: string = this.midiOut.getPortName(i);
			console.log(`Port ${ i }: ${ portName }`);
			if (/^Launchpad(:\d+)?/.test(portName)) {
				this.port = i;
				break;
			}
		}
		if (this.port === -1) {
			throw "Launchpad was not detected";
		}

		this.clear();
		this.midiOut.openPort(this.port);
	}

	private onExit() {
		// in case there's an error, this is ensured to happen
		setTimeout(() => process.exit(), 1000);
		this.stopMidi();
	}

	private onMidiEvent(delta: number, msg: [number, number, number]): void {
		let x, y;
		if (msg[0] == 144) {
			x = msg[1] % 16;
			y = Math.floor(msg[1] / 16);
		} else if (msg[0] == 176) {
			x = msg[1] - 104;
			y = 8;
		} else {
			console.warn("Unexpected message %d!", msg[0]);
			return;
		}

		if (msg[2] !== 0) {
			this.onButtonDown(x, y);
		} else {
			this.onButtonUp(x, y);
		}
	}

	private shutdown = false;
	public stopMidi() {
		if (this.shutdown) { return }
		this.shutdown = true
		console.log("shutting down midi");
		this.clear();
		this.midiOut.closePort();
		this.midiIn.closePort();
	}

	onButtonDown(x: number, y: number): void { }

	onButtonUp(x: number, y: number): void { }

	// convert XY coordinate to the midi index needed
	private xy2i(x: number, y: number): number {
		return 16 * (y % 9) + x;
	}

	// clamp a number into the int range needed for lighting up pixels
	private cRange(c: number): number {
		return Math.floor(Math.min(Math.max(0, c), 3));
	}

	// get a color code
	private color(red: number, green: number): number {
		return 16 * this.cRange(green) + this.cRange(red) + 12;
	}

	// set a pixel on the board
	public set(x: number, y: number, r: number, g: number): void {
		if (y >= 8) {
			this.setTopBar(x, r, g);
		}
		this.midiOut.sendMessage([
			144,
			this.xy2i(x, y),
			this.color(r, g),
		]);
	}

	private setTopBar(x: number, r: number, g: number): void {
		this.midiOut.sendMessage([
			176,
			104 + x,
			this.color(r, g),
		]);

	}

	public clear(): void {
		for (let x = 0; x <= 8; x++) {
			for (let y = 0; y <= 8; y++) {
				this.set(x, y, 0, 0);
			}
		}
	}
}

/*

for reference:

https://github.com/Granjow/launchpad-mini/blob/master/doc/launchpad-programmers-reference.pdf

*/
