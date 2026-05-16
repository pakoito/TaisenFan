/**
 * Pure JavaScript MD5 implementation.
 *
 * Web Crypto API does not support MD5, so we need a standalone
 * implementation for cross-platform (Node + browser) compatibility.
 */

// Per-round shift amounts
const S = [
	7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
	9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
	16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
	21,
];

// Pre-computed constants: floor(2^32 × abs(sin(i + 1)))
const K = [
	0xd7_6a_a4_78, 0xe8_c7_b7_56, 0x24_20_70_db, 0xc1_bd_ce_ee, 0xf5_7c_0f_af,
	0x47_87_c6_2a, 0xa8_30_46_13, 0xfd_46_95_01, 0x69_80_98_d8, 0x8b_44_f7_af,
	0xff_ff_5b_b1, 0x89_5c_d7_be, 0x6b_90_11_22, 0xfd_98_71_93, 0xa6_79_43_8e,
	0x49_b4_08_21, 0xf6_1e_25_62, 0xc0_40_b3_40, 0x26_5e_5a_51, 0xe9_b6_c7_aa,
	0xd6_2f_10_5d, 0x02_44_14_53, 0xd8_a1_e6_81, 0xe7_d3_fb_c8, 0x21_e1_cd_e6,
	0xc3_37_07_d6, 0xf4_d5_0d_87, 0x45_5a_14_ed, 0xa9_e3_e9_05, 0xfc_ef_a3_f8,
	0x67_6f_02_d9, 0x8d_2a_4c_8a, 0xff_fa_39_42, 0x87_71_f6_81, 0x6d_9d_61_22,
	0xfd_e5_38_0c, 0xa4_be_ea_44, 0x4b_de_cf_a9, 0xf6_bb_4b_60, 0xbe_bf_bc_70,
	0x28_9b_7e_c6, 0xea_a1_27_fa, 0xd4_ef_30_85, 0x04_88_1d_05, 0xd9_d4_d0_39,
	0xe6_db_99_e5, 0x1f_a2_7c_f8, 0xc4_ac_56_65, 0xf4_29_22_44, 0x43_2a_ff_97,
	0xab_94_23_a7, 0xfc_93_a0_39, 0x65_5b_59_c3, 0x8f_0c_cc_92, 0xff_ef_f4_7d,
	0x85_84_5d_d1, 0x6f_a8_7e_4f, 0xfe_2c_e6_e0, 0xa3_01_43_14, 0x4e_08_11_a1,
	0xf7_53_7e_82, 0xbd_3a_f2_35, 0x2a_d7_d2_bb, 0xeb_86_d3_91,
];

export function md5(data: Uint8Array): Uint8Array {
	const len = data.length;

	// Pad: append 0x80, then zeros, then 64-bit length (LE)
	// Total must be multiple of 64 bytes
	const padLen = (len + 8 + 63) & ~63;
	const padded = new Uint8Array(padLen);
	padded.set(data);
	padded[len] = 0x80;

	// Append bit length as 64-bit little-endian
	const view = new DataView(padded.buffer);
	const bitLen = len * 8;
	view.setUint32(padLen - 8, bitLen >>> 0, true);
	view.setUint32(padLen - 4, Math.floor(bitLen / 0x1_00_00_00_00) >>> 0, true);

	// Initial state
	let a0 = 0x67_45_23_01;
	let b0 = 0xef_cd_ab_89;
	let c0 = 0x98_ba_dc_fe;
	let d0 = 0x10_32_54_76;

	// Process each 64-byte block
	for (let offset = 0; offset < padLen; offset += 64) {
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(offset + j * 4, true);
		}

		let A = a0;
		let B = b0;
		let C = c0;
		let D = d0;

		for (let i = 0; i < 64; i++) {
			let F: number;
			let g: number;

			if (i < 16) {
				F = (B & C) | (~B & D);
				g = i;
			} else if (i < 32) {
				F = (D & B) | (~D & C);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				F = B ^ C ^ D;
				g = (3 * i + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * i) % 16;
			}

			F = ((F >>> 0) + A + K[i]! + M[g]!) >>> 0;
			A = D;
			D = C;
			C = B;
			B = (B + ((F << S[i]!) | (F >>> (32 - S[i]!)))) >>> 0;
		}

		a0 = (a0 + A) >>> 0;
		b0 = (b0 + B) >>> 0;
		c0 = (c0 + C) >>> 0;
		d0 = (d0 + D) >>> 0;
	}

	const result = new Uint8Array(16);
	const rv = new DataView(result.buffer);
	rv.setUint32(0, a0, true);
	rv.setUint32(4, b0, true);
	rv.setUint32(8, c0, true);
	rv.setUint32(12, d0, true);

	return result;
}
