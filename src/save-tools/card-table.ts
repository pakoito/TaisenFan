/**
 * Card lookup table — maps readable Card ID ↔ internal No + metadata.
 *
 * Card ID format: "Wei-001", "Shu-019", "Wu-009", "Han-031", "LE-01", "DS-01", "EX-08"
 *
 * Generated from translation/tbl/translations/cardlib.json.
 * 192 real playable cards (excludes dummy entries).
 */

export type Faction = 'Wei' | 'Shu' | 'Wu' | 'Han' | 'LE' | 'DS' | 'EX';

export type CardEntry = {
	no: number; // Internal No (offset in save file)
	cardId: string; // Readable ID: "Wei-001", "Shu-019", etc.
	faction: Faction;
	name: string; // English name
};

// [No, cardId, faction, name]
// CardId is derived from the original 魏001 format → Wei-001
const RAW: [number, string, Faction, string][] = [
	// Wei (魏) - 39 cards
	[1, 'Wei-001', 'Wei', 'Yu Jin'],
	[2, 'Wei-002', 'Wei', 'Wang Yi'],
	[3, 'Wei-003', 'Wei', 'Jia Xu'],
	[4, 'Wei-004', 'Wei', 'Guo Jia'],
	[5, 'Wei-005', 'Wei', 'Lady Guo'],
	[7, 'Wei-006', 'Wei', 'Yue Jin'],
	[8, 'Wei-007', 'Wei', 'Xiahou Yuan'],
	[13, 'Wei-008', 'Wei', 'Xiahou Yuan'],
	[6, 'Wei-009', 'Wei', 'Xiahou Dun'],
	[9, 'Wei-010', 'Wei', 'Xiahou Dun'],
	[10, 'Wei-011', 'Wei', 'Niu Jin'],
	[11, 'Wei-012', 'Wei', 'Xu Chu'],
	[12, 'Wei-013', 'Wei', 'Cai Wenji'],
	[30, 'Wei-014', 'Wei', 'Cai Mao'],
	[14, 'Wei-015', 'Wei', 'Sima Yi'],
	[15, 'Wei-016', 'Wei', 'Xun Yu'],
	[16, 'Wei-017', 'Wei', 'Xun You'],
	[17, 'Wei-018', 'Wei', 'Zhong Hui'],
	[18, 'Wei-019', 'Wei', 'Xu Huang'],
	[19, 'Wei-020', 'Wei', 'Lady Zhen'],
	[20, 'Wei-021', 'Wei', 'Cao Hong'],
	[31, 'Wei-022', 'Wei', 'Cao Ang'],
	[22, 'Wei-023', 'Wei', 'Cao Zhang'],
	[23, 'Wei-024', 'Wei', 'Cao Zhi'],
	[24, 'Wei-025', 'Wei', 'Cao Ren'],
	[25, 'Wei-026', 'Wei', 'Cao Cao'],
	[26, 'Wei-027', 'Wei', 'Cao Pi'],
	[27, 'Wei-028', 'Wei', 'Zhang He'],
	[28, 'Wei-029', 'Wei', 'Zhang Chunhua'],
	[29, 'Wei-030', 'Wei', 'Zhang Liao'],
	[32, 'Wei-031', 'Wei', 'Cheng Yu'],
	[33, 'Wei-032', 'Wei', 'Dian Wei'],
	[34, 'Wei-033', 'Wei', 'Deng Ai'],
	[35, 'Wei-034', 'Wei', 'Lady Bian'],
	[36, 'Wei-035', 'Wei', 'Pang De'],
	[37, 'Wei-036', 'Wei', 'Man Chong'],
	[21, 'Wei-037', 'Wei', 'Yang Hu'],
	[38, 'Wei-038', 'Wei', 'Li Dian'],
	[39, 'Wei-039', 'Wei', 'Liu Ye'],

	// Shu (蜀) - 40 cards
	[40, 'Shu-001', 'Shu', 'Yi Ji'],
	[41, 'Shu-002', 'Shu', 'Wang Ping'],
	[42, 'Shu-003', 'Shu', 'Xiahou Yueji'],
	[74, 'Shu-004', 'Shu', 'Guan Yu'],
	[44, 'Shu-005', 'Shu', 'Guan Yu'],
	[45, 'Shu-006', 'Shu', 'Guan Yinping'],
	[47, 'Shu-007', 'Shu', 'Lady Gan'],
	[48, 'Shu-008', 'Shu', 'Guan Ping'],
	[49, 'Shu-009', 'Shu', 'Jian Yong'],
	[50, 'Shu-010', 'Shu', 'Wei Yan'],
	[159, 'Shu-011', 'Shu', 'Wei Yan'],
	[51, 'Shu-012', 'Shu', 'Jiang Wei'],
	[52, 'Shu-013', 'Shu', 'Yan Yan'],
	[69, 'Shu-014', 'Shu', 'Wu Yi'],
	[53, 'Shu-015', 'Shu', 'Huang Yueying'],
	[55, 'Shu-016', 'Shu', 'Huang Zhong'],
	[54, 'Shu-017', 'Shu', 'Huang Zhong'],
	[56, 'Shu-018', 'Shu', 'Zhou Cang'],
	[58, 'Shu-019', 'Shu', 'Zhuge Liang'],
	[59, 'Shu-020', 'Shu', 'Xu Shu'],
	[60, 'Shu-021', 'Shu', 'Sun Ren'],
	[61, 'Shu-022', 'Shu', 'Zhao Yun'],
	[46, 'Shu-023', 'Shu', 'Zhao Yun'],
	[62, 'Shu-024', 'Shu', 'Zhang Song'],
	[63, 'Shu-025', 'Shu', 'Zhang Fei'],
	[76, 'Shu-026', 'Shu', 'Zhang Fei'],
	[64, 'Shu-027', 'Shu', 'Zhao Lei'],
	[65, 'Shu-028', 'Shu', 'Ma Su'],
	[66, 'Shu-029', 'Shu', 'Ma Dai'],
	[67, 'Shu-030', 'Shu', 'Ma Chao'],
	[43, 'Shu-031', 'Shu', 'Ma Chao'],
	[68, 'Shu-032', 'Shu', 'Ma Liang'],
	[70, 'Shu-033', 'Shu', 'Lady Mi'],
	[71, 'Shu-034', 'Shu', 'Fa Zheng'],
	[72, 'Shu-035', 'Shu', 'Pang Tong'],
	[73, 'Shu-036', 'Shu', 'Meng Da'],
	[57, 'Shu-037', 'Shu', 'Liu Bei'],
	[75, 'Shu-038', 'Shu', 'Liu Bei'],
	[77, 'Shu-039', 'Shu', 'Liu Feng'],
	[78, 'Shu-040', 'Shu', 'Liao Hua'],

	// Wu (呉) - 39 cards
	[80, 'Wu-001', 'Wu', 'Kan Ze'],
	[81, 'Wu-002', 'Wu', 'Han Dang'],
	[160, 'Wu-003', 'Wu', 'Gan Ning'],
	[82, 'Wu-004', 'Wu', 'Gan Ning'],
	[83, 'Wu-005', 'Wu', 'Yu Fan'],
	[84, 'Wu-006', 'Wu', 'Huang Gai'],
	[86, 'Wu-007', 'Wu', 'Lady Wu'],
	[87, 'Wu-008', 'Wu', 'Zhou Tai'],
	[88, 'Wu-009', 'Wu', 'Zhou Yu'],
	[89, 'Wu-010', 'Wu', 'Zhu Huan'],
	[90, 'Wu-011', 'Wu', 'Zhu Zhi'],
	[91, 'Wu-012', 'Wu', 'Xiao Qiao'],
	[92, 'Wu-013', 'Wu', 'Jiang Qin'],
	[94, 'Wu-014', 'Wu', 'Zhuge Jin'],
	[95, 'Wu-015', 'Wu', 'Xu Sheng'],
	[96, 'Wu-016', 'Wu', 'Zu Mao'],
	[79, 'Wu-017', 'Wu', 'Sun Huan'],
	[97, 'Wu-018', 'Wu', 'Sun Jian'],
	[98, 'Wu-019', 'Wu', 'Sun Quan'],
	[85, 'Wu-020', 'Wu', 'Sun Ce'],
	[99, 'Wu-021', 'Wu', 'Sun Ce'],
	[100, 'Wu-022', 'Wu', 'Sun Ren'],
	[101, 'Wu-023', 'Wu', 'Da Qiao'],
	[102, 'Wu-024', 'Wu', 'Taishi Ci'],
	[93, 'Wu-025', 'Wu', 'Taishi Ci'],
	[103, 'Wu-026', 'Wu', 'Zhang Hong'],
	[104, 'Wu-027', 'Wu', 'Zhang Zhao'],
	[106, 'Wu-028', 'Wu', 'Chen Wu'],
	[107, 'Wu-029', 'Wu', 'Cheng Pu'],
	[108, 'Wu-030', 'Wu', 'Ding Feng'],
	[109, 'Wu-031', 'Wu', 'Dong Xi'],
	[110, 'Wu-032', 'Wu', 'Pan Zhang'],
	[105, 'Wu-033', 'Wu', 'Lu Kang'],
	[111, 'Wu-034', 'Wu', 'Lu Xun'],
	[112, 'Wu-035', 'Wu', 'Ling Cao'],
	[113, 'Wu-036', 'Wu', 'Ling Tong'],
	[114, 'Wu-037', 'Wu', 'Lu Fan'],
	[115, 'Wu-038', 'Wu', 'Lu Meng'],
	[116, 'Wu-039', 'Wu', 'Lu Su'],

	// Han/Rogue (群) - 31 cards
	[117, 'Han-001', 'Han', 'Yu Ji'],
	[118, 'Han-002', 'Han', 'Yuan Shu'],
	[119, 'Han-003', 'Han', 'Jia Xu'],
	[120, 'Han-004', 'Han', 'Hua Xiong'],
	[121, 'Han-005', 'Han', 'Ji Ling'],
	[122, 'Han-006', 'Han', 'Yan'],
	[123, 'Han-007', 'Han', 'Gao Shun'],
	[124, 'Han-008', 'Han', 'Gongsun Zan'],
	[135, 'Han-009', 'Han', 'Hu Cheer'],
	[161, 'Han-010', 'Han', 'Zuo Ci'],
	[125, 'Han-011', 'Han', 'Lady Zou'],
	[126, 'Han-012', 'Han', 'Zhang Jiao'],
	[127, 'Han-013', 'Han', 'Zhang Xun'],
	[136, 'Han-014', 'Han', 'Zhang Xiu'],
	[128, 'Han-015', 'Han', 'Diao Chan'],
	[130, 'Han-016', 'Han', 'Zhang Liao'],
	[131, 'Han-017', 'Han', 'Zhang Liang'],
	[132, 'Han-018', 'Han', 'Zhang Lu'],
	[133, 'Han-019', 'Han', 'Chen Gong'],
	[134, 'Han-020', 'Han', 'Chen Lan'],
	[129, 'Han-021', 'Han', 'Cheng Yuanzhi'],
	[137, 'Han-022', 'Han', 'Dong Zhuo'],
	[138, 'Han-023', 'Han', 'Dong Bai'],
	[139, 'Han-024', 'Han', 'Pei Yuanshao'],
	[141, 'Han-025', 'Han', 'Ma Yuanyi'],
	[140, 'Han-026', 'Han', 'Yang Hong'],
	[142, 'Han-027', 'Han', 'Lei Bo'],
	[143, 'Han-028', 'Han', 'Li Guo'],
	[144, 'Han-029', 'Han', 'Li Ru'],
	[145, 'Han-030', 'Han', 'Lu Lingqi'],
	[146, 'Han-031', 'Han', 'Lu Bu'],

	// LE (Legend) - 12 cards
	[157, 'LE-01', 'LE', 'Cao Cao'],
	[151, 'LE-02', 'LE', 'Xiahou Dun'],
	[150, 'LE-03', 'LE', 'Xiahou Yuan'],
	[153, 'LE-04', 'LE', 'Xun Yu'],
	[148, 'LE-05', 'LE', 'Guo Jia'],
	[147, 'LE-06', 'LE', 'Jia Xu'],
	[158, 'LE-07', 'LE', 'Zhang Liao'],
	[149, 'LE-08', 'LE', 'Yue Jin'],
	[152, 'LE-09', 'LE', 'Xu Chu'],
	[155, 'LE-10', 'LE', 'Xu Huang'],
	[154, 'LE-11', 'LE', 'Xun You'],
	[156, 'LE-12', 'LE', 'Cao Ren'],

	// DS (DS-exclusive) - 25 cards
	[198, 'DS-01', 'DS', 'Lady Guo'],
	[199, 'DS-02', 'DS', 'Lady Gan'],
	[200, 'DS-03', 'DS', 'Ma Dai'],
	[201, 'DS-04', 'DS', 'Diao Chan'],
	[202, 'DS-05', 'DS', 'Chunyu Qiong'],
	[203, 'DS-06', 'DS', 'Ling Tong'],
	[204, 'DS-07', 'DS', 'Zhao Yun'],
	[205, 'DS-08', 'DS', 'Dian Wei'],
	[208, 'DS-09', 'DS', 'Cao Pi'],
	[210, 'DS-10', 'DS', 'Wang Yi'],
	[211, 'DS-11', 'DS', 'Xu Chu'],
	[212, 'DS-12', 'DS', 'Xu Huang'],
	[213, 'DS-13', 'DS', 'Kuai Yue'],
	[214, 'DS-14', 'DS', 'Xiahou Yuan'],
	[215, 'DS-15', 'DS', 'Guan Yu'],
	[216, 'DS-16', 'DS', 'Jiang Wei'],
	[217, 'DS-17', 'DS', 'Huang Yueying'],
	[218, 'DS-18', 'DS', 'Gongsun Zan'],
	[219, 'DS-19', 'DS', 'Sima Yi'],
	[220, 'DS-20', 'DS', 'Zhou Cang'],
	[221, 'DS-21', 'DS', 'Xiao Qiao'],
	[222, 'DS-22', 'DS', 'Cao Zhang'],
	[223, 'DS-23', 'DS', 'Sun Ren'],
	[224, 'DS-24', 'DS', 'Taishi Ci'],
	[225, 'DS-25', 'DS', 'Zhang Fei'],
	[226, 'DS-26', 'DS', 'Ma Liang'],
	[227, 'DS-27', 'DS', 'Lu Xun'],
	[228, 'DS-28', 'DS', 'Yue Jin'],
	[229, 'DS-29', 'DS', 'Jiang Wei'],
	[230, 'DS-30', 'DS', 'Sun Ren'],
	[231, 'DS-31', 'DS', 'Lu Lingqi'],

	// EX (Extra) - 6 cards
	[203, 'EX-08', 'EX', 'Ling Tong'],
	[204, 'EX-13', 'EX', 'Zhao Yun'],
	[205, 'EX-14', 'EX', 'Dian Wei'],
	[210, 'EX-15', 'EX', 'Wang Yi'],
	[211, 'EX-16', 'EX', 'Xu Chu'],
	[212, 'EX-17', 'EX', 'Xu Huang'],
];

export const CARD_TABLE: CardEntry[] = RAW.map(
	([no, cardId, faction, name]) => ({
		no,
		cardId,
		faction,
		name,
	}),
);

/** cardId → No lookup (e.g., "Wei-026" → 25) */
export const CARD_ID_TO_NO: Record<string, number> = {};

/** No → cardId lookup (e.g., 25 → "Wei-026") */
export const CARD_NO_TO_ID: Record<number, string> = {};

/** cardId → CardEntry lookup */
export const CARD_BY_ID: Record<string, CardEntry> = {};

for (const entry of CARD_TABLE) {
	CARD_ID_TO_NO[entry.cardId] = entry.no;
	CARD_NO_TO_ID[entry.no] = entry.cardId;
	CARD_BY_ID[entry.cardId] = entry;
}

// Total card slots in save file (includes dummy entries)
export const CARD_TOTAL_SLOTS = 232;
