import { Launchpad } from "./launchpad";

let lp = new Launchpad();


console.log("woop")
let i = 0;
for (let x = 0; x <= 8; x++) {
	for (let y = 0; y <= 8; y++) {
		lp.set(x, y, x % 4, y % 4);
	}
}

lp.onButtonDown = (x, y) => console.log("PRESS!", x, y)
console.log("plang")
