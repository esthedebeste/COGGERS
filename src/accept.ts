type Mime = {
	type: string;
	subtype: string;
	weight: number;
	mime: string;
};

/**
 * For every "q-group", matches:
 *  - A comma-seperated list of mime-types
 *  - Their q level (without "q=")
 */
const chunkRe =
	/((?:(?:\*\/\*|(?:[\w-+.]+\/(?:\*|[\w-+.]+))),?\s*)+)(?:\s*;\s*q=(0\.\d{0,3}|1\.0{0,3}))?/g;

// Offset to have */* match lower, q has a max of 3 decimals
const offset = 1e-4;

function parseMime(mime: string, weight = 0): Mime {
	const [type, subtype] = mime.split("/");
	if (type === "*") weight -= offset;
	if (subtype === "*") weight -= offset;
	return { type, subtype, weight, mime };
}

const eq = (a: Mime, b: Mime) =>
	(a.type === b.type || a.type === "*" || b.type === "*") &&
	(a.subtype === b.subtype || a.subtype === "*" || b.subtype === "*");

export class Accept {
	private mimes: Mime[] = [];
	constructor(accept: string) {
		for (const part of accept.matchAll(chunkRe)) {
			const mimes = part[1].split(",").map(a => a.trim());
			const q = part[2] ? parseFloat(part[2]) : 1;
			for (const mime of mimes) this.mimes.push(parseMime(mime, q));
		}
		// Reverse weight sort (highest first)
		this.mimes.sort((a, b) => b.weight - a.weight);
	}

	allPreferred(mimes: string[]): string[] {
		const parsed = mimes.map(mime => parseMime(mime));
		const preferred: { weight: number; mime: string }[] = [];
		for (const mime of this.mimes)
			for (const poss of parsed)
				if (eq(poss, mime))
					preferred.push({
						weight: mime.weight + poss.weight,
						mime: poss.mime,
					});
		return preferred.sort((a, b) => b.weight - a.weight).map(a => a.mime);
	}

	preferred(mimes: string[]): string | undefined {
		return this.allPreferred(mimes)[0];
	}

	accepts(mime: string): boolean {
		const parsed = parseMime(mime);
		return !!this.mimes.find(mime => eq(mime, parsed));
	}
}
