import fs from 'node:fs';
import path from 'node:path';
import {
	calcFileSeed,
	DET_LZ,
	DET_OBF,
	deobfuscate,
	lz10Decompress,
	lzDecompress,
	lzType,
	unpackNfp,
} from '@/utils/nfp-unpack';

const NFP_FIXTURE = path.resolve(
	import.meta.dirname,
	'__fixtures__/kpcbustup.nfp',
);

const hasFixture = fs.existsSync(NFP_FIXTURE);
const KPC_EXT = /\.KPC$/u;

describe('lz10Decompress', () => {
	it('returns null for non-LZ10 data', () => {
		const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
		expect(lz10Decompress(data)).toBeNull();
	});

	it('returns null for zero decompressed size', () => {
		const data = new Uint8Array([0x10, 0x00, 0x00, 0x00]);
		expect(lz10Decompress(data)).toBeNull();
	});

	it('decompresses a simple literal-only LZ10 stream', () => {
		// LZ10 header: magic=0x10, size=4 (LE 24-bit)
		// flags byte 0x00 = 8 literals
		// Then 4 literal bytes
		const data = new Uint8Array([
			0x10, 0x04, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc, 0xdd,
		]);
		const result = lz10Decompress(data);
		expect(result).not.toBeNull();
		expect(result?.length).toBe(4);
		expect(result?.[0]).toBe(0xaa);
		expect(result?.[1]).toBe(0xbb);
		expect(result?.[2]).toBe(0xcc);
		expect(result?.[3]).toBe(0xdd);
	});
});

// "ABCABCABCABC": three literals, then a 9-byte copy from 3 back.
const ABC12 = new TextEncoder().encode('ABCABCABCABC');
const LZ10_ABC12 = [0x10, 0x0c, 0x00, 0x00, 0x10, 0x41, 0x42, 0x43, 0x60, 0x02];
const LZ11_ABC12 = [0x11, 0x0c, 0x00, 0x00, 0x10, 0x41, 0x42, 0x43, 0x80, 0x02];
// "ABCABC" as LZ10 (a 3-byte copy) under an LZ11 header byte, padded to 8
// like the shipped files: the shape of SENRYAKUMODE JID_TOB.YCE. Read as
// LZ11, the copy token becomes a 3-byte one reaching 0x201 bytes back.
const LZ11_HEADER_OVER_LZ10 = [
	0x11, 0x06, 0x00, 0x00, 0x10, 0x41, 0x42, 0x43, 0x00, 0x02, 0, 0, 0, 0, 0, 0,
];

describe('lzDecompress', () => {
	it('picks the LZ type from the header low nibble, as the ROM does', () => {
		expect(lzType(0x10)).toBe(0x10);
		expect(lzType(0x11)).toBe(0x11);
		expect(lzType(0x00)).toBe(0x10);
		expect(lzType(0x31)).toBe(0x11);
	});

	it('decodes LZ10 and LZ11 streams', () => {
		expect(lzDecompress(new Uint8Array(LZ10_ABC12))).toEqual(ABC12);
		expect(lzDecompress(new Uint8Array(LZ11_ABC12))).toEqual(ABC12);
	});

	it('decodes LZ11 3-byte and 4-byte copy tokens', () => {
		// 1 literal, then a 0x20-byte copy (3-byte token) and a 0x120-byte
		// copy (4-byte token), both from 1 back.
		const out = lzDecompress(
			new Uint8Array([
				0x11, 0x41, 0x01, 0x00, 0x60, 0x5a, 0x00, 0xf0, 0x00, 0x10, 0x00, 0xf0,
				0x00,
			]),
		);
		expect(out?.length).toBe(0x1_41);
		expect(out?.every(b => b === 0x5a)).toBe(true);
	});

	it('returns null for a copy from before the output', () => {
		expect(lzDecompress(new Uint8Array(LZ11_HEADER_OVER_LZ10))).toBeNull();
		expect(
			lzDecompress(new Uint8Array(LZ11_HEADER_OVER_LZ10), 0, 0x10),
		).toEqual(new TextEncoder().encode('ABCABC'));
	});

	it('returns null when the stream ends early', () => {
		expect(lzDecompress(new Uint8Array(LZ10_ABC12.slice(0, 8)))).toBeNull();
	});
});

/** Build an NFP archive the way the shipped ones are laid out. */
type TestFile = {
	name: string;
	size: number;
	lz?: boolean;
	obf?: boolean;
	stored: number[];
};

function buildNfp(files: TestFile[]) {
	const tableOff = 0x50;
	const dataOff = tableOff + files.length * 0x18;
	const seed0 = 0x12_34_56_78;
	const seed1 = 0x9a_bc_de_f0;
	const table = new Uint8Array(files.length * 0x18);
	const tableView = new DataView(table.buffer);
	const blobs: Uint8Array[] = [];
	let off = dataOff;
	files.forEach((f, i) => {
		const entry = table.subarray(i * 0x18, (i + 1) * 0x18);
		entry.set(new TextEncoder().encode(f.name));
		tableView.setUint32(i * 0x18 + 0x10, off, true);
		const det = f.size * 4 + (f.lz ? DET_LZ : 0) + (f.obf ? DET_OBF : 0);
		tableView.setUint32(i * 0x18 + 0x14, det, true);
		const stored = new Uint8Array(f.stored);
		blobs.push(f.obf ? deobfuscate(stored, calcFileSeed(entry), 0) : stored);
		off += stored.length;
	});
	const out = new Uint8Array(off);
	out.set(new TextEncoder().encode('Copyright 1997-2007 ALPHA-UNIT'));
	const view = new DataView(out.buffer);
	view.setInt32(0x34, files.length, true);
	view.setInt32(0x38, tableOff, true);
	view.setInt32(0x3c, dataOff, true);
	view.setUint32(0x40, seed0, true);
	view.setUint32(0x44, seed1, true);
	out[0x48] = 1;
	out.set(deobfuscate(table, seed0, seed1), tableOff);
	let at = dataOff;
	for (const b of blobs) {
		out.set(b, at);
		at += b.length;
	}
	return out;
}

const pad8 = (bytes: number[]) => [
	...bytes,
	...new Array((8 - (bytes.length % 8)) % 8).fill(0),
];

describe('unpackNfp decodes by the det bits', () => {
	// An XOR-only file whose data starts with 0x10: it must not be
	// LZ-decoded (det bit 0 is clear).
	const xorOnly = pad8([0x10, 0x04, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc]);
	const files = unpackNfp(
		buildNfp([
			{name: 'A_XOR.BIN', obf: true, size: 8, stored: xorOnly},
			{lz: true, name: 'B_LZ.BIN', size: 12, stored: pad8(LZ10_ABC12)},
			{
				lz: true,
				name: 'C_LZ11.BIN',
				obf: true,
				size: 12,
				stored: pad8(LZ11_ABC12),
			},
			{name: 'D_PLAIN.BIN', size: 5, stored: pad8([1, 2, 3, 4, 5])},
			{
				lz: true,
				name: 'JID_TOB.YCE',
				obf: true,
				size: 6,
				stored: LZ11_HEADER_OVER_LZ10,
			},
		]),
	);
	const byName = new Map(files.map(f => [f.name, f.data]));

	it('keeps an XOR-only file that starts with 0x10 as stored', () => {
		expect(byName.get('A_XOR.BIN')).toEqual(new Uint8Array(xorOnly));
	});

	it('LZ-decodes a file with bit 0 set and bit 1 clear', () => {
		expect(byName.get('B_LZ.BIN')).toEqual(ABC12);
	});

	it('LZ-decodes an LZ11 file', () => {
		expect(byName.get('C_LZ11.BIN')).toEqual(ABC12);
	});

	it('cuts a plain file to det >> 2 bytes', () => {
		expect(byName.get('D_PLAIN.BIN')).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
	});

	it('decodes an LZ11 header over an LZ10 stream (JID_TOB.YCE) as LZ10', () => {
		expect(byName.get('JID_TOB.YCE')).toEqual(
			new TextEncoder().encode('ABCABC'),
		);
	});
});

describe('deobfuscate', () => {
	it('returns a Uint8Array of the same length', () => {
		const data = new Uint8Array(32).fill(0x42);
		const result = deobfuscate(data, 0x12_34, 0x56_78);
		expect(result.length).toBe(data.length);
	});

	it('is deterministic with same seeds', () => {
		const data = new Uint8Array(64).fill(0xab);
		const r1 = deobfuscate(data, 0x11_11, 0x22_22);
		const r2 = deobfuscate(data, 0x11_11, 0x22_22);
		expect(r1).toEqual(r2);
	});

	it('produces different output with different seeds', () => {
		const data = new Uint8Array(64).fill(0xab);
		const r1 = deobfuscate(data, 0x11_11, 0x22_22);
		const r2 = deobfuscate(data, 0x33_33, 0x44_44);
		expect(r1).not.toEqual(r2);
	});
});

describe.skipIf(!hasFixture)('unpackNfp', () => {
	let nfpData: Uint8Array;

	beforeAll(() => {
		nfpData = new Uint8Array(fs.readFileSync(NFP_FIXTURE));
	});

	it('unpacks kpcbustup.NFP into files', () => {
		const files = unpackNfp(nfpData);
		expect(files.length).toBeGreaterThan(0);
	});

	it('all files have KPC extension', () => {
		const files = unpackNfp(nfpData);
		for (const f of files) {
			expect(f.name.toUpperCase()).toMatch(KPC_EXT);
		}
	});

	it('all files have non-empty data', () => {
		const files = unpackNfp(nfpData);
		for (const f of files) {
			expect(f.data.length).toBeGreaterThan(0);
		}
	});

	it('all files start with KPC magic (2CPK)', () => {
		const files = unpackNfp(nfpData);
		for (const f of files) {
			const magic = String.fromCharCode(
				f.data[0] ?? 0,
				f.data[1] ?? 0,
				f.data[2] ?? 0,
				f.data[3] ?? 0,
			);
			expect(magic).toBe('2CPK');
		}
	});

	it('throws for non-NFP data', () => {
		const bad = new Uint8Array(64).fill(0);
		expect(() => unpackNfp(bad)).toThrow('Not an NFP file');
	});
});
