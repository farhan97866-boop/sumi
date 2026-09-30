/**
 * Reference set of common Chinese (Hanzi) characters.
 * Each entry carries the character, its pinyin reading, and a short meaning.
 * The flashcard deck and the reference list both read from this one array.
 */
export interface ChineseCharacter {
  /** The Hanzi glyph, e.g. "你". */
  character: string;
  /** Pinyin reading with tone marks, e.g. "nǐ". */
  pinyin: string;
  /** Short English meaning, e.g. "you". */
  meaning: string;
  /** Optional stroke count for the reference table. */
  strokes: number;
}

export const CHINESE_CHARACTERS: ChineseCharacter[] = [
  { character: "我", pinyin: "wǒ", meaning: "I; me", strokes: 7 },
  { character: "你", pinyin: "nǐ", meaning: "you", strokes: 7 },
  { character: "他", pinyin: "tā", meaning: "he; him", strokes: 5 },
  { character: "她", pinyin: "tā", meaning: "she; her", strokes: 6 },
  { character: "们", pinyin: "men", meaning: "plural marker", strokes: 5 },
  { character: "好", pinyin: "hǎo", meaning: "good; well", strokes: 6 },
  { character: "是", pinyin: "shì", meaning: "to be; yes", strokes: 9 },
  { character: "不", pinyin: "bù", meaning: "not; no", strokes: 4 },
  { character: "人", pinyin: "rén", meaning: "person; people", strokes: 2 },
  { character: "大", pinyin: "dà", meaning: "big; large", strokes: 3 },
  { character: "小", pinyin: "xiǎo", meaning: "small; little", strokes: 3 },
  { character: "中", pinyin: "zhōng", meaning: "middle; China", strokes: 4 },
  { character: "国", pinyin: "guó", meaning: "country; nation", strokes: 8 },
  { character: "日", pinyin: "rì", meaning: "sun; day", strokes: 4 },
  { character: "月", pinyin: "yuè", meaning: "moon; month", strokes: 4 },
  { character: "年", pinyin: "nián", meaning: "year", strokes: 6 },
  { character: "天", pinyin: "tiān", meaning: "sky; day", strokes: 4 },
  { character: "水", pinyin: "shuǐ", meaning: "water", strokes: 4 },
  { character: "火", pinyin: "huǒ", meaning: "fire", strokes: 4 },
  { character: "山", pinyin: "shān", meaning: "mountain", strokes: 3 },
  { character: "木", pinyin: "mù", meaning: "tree; wood", strokes: 4 },
  { character: "口", pinyin: "kǒu", meaning: "mouth", strokes: 3 },
  { character: "手", pinyin: "shǒu", meaning: "hand", strokes: 4 },
  { character: "心", pinyin: "xīn", meaning: "heart; mind", strokes: 4 },
  { character: "学", pinyin: "xué", meaning: "to study; learn", strokes: 8 },
  { character: "生", pinyin: "shēng", meaning: "life; student", strokes: 5 },
  { character: "老", pinyin: "lǎo", meaning: "old", strokes: 6 },
  { character: "师", pinyin: "shī", meaning: "teacher; master", strokes: 6 },
  { character: "朋", pinyin: "péng", meaning: "friend", strokes: 8 },
  { character: "友", pinyin: "yǒu", meaning: "friend", strokes: 4 },
  { character: "家", pinyin: "jiā", meaning: "home; family", strokes: 10 },
  { character: "爱", pinyin: "ài", meaning: "to love; love", strokes: 10 },
  { character: "吃", pinyin: "chī", meaning: "to eat", strokes: 6 },
  { character: "喝", pinyin: "hē", meaning: "to drink", strokes: 12 },
  { character: "看", pinyin: "kàn", meaning: "to look; watch", strokes: 9 },
  { character: "说", pinyin: "shuō", meaning: "to speak; say", strokes: 9 },
  { character: "听", pinyin: "tīng", meaning: "to listen", strokes: 7 },
  { character: "写", pinyin: "xiě", meaning: "to write", strokes: 5 },
  { character: "读", pinyin: "dú", meaning: "to read", strokes: 10 },
  { character: "走", pinyin: "zǒu", meaning: "to walk; go", strokes: 7 },
  { character: "来", pinyin: "lái", meaning: "to come", strokes: 7 },
  { character: "去", pinyin: "qù", meaning: "to go", strokes: 5 },
  { character: "有", pinyin: "yǒu", meaning: "to have; there is", strokes: 6 },
  { character: "在", pinyin: "zài", meaning: "at; to exist", strokes: 6 },
  { character: "这", pinyin: "zhè", meaning: "this", strokes: 7 },
  { character: "那", pinyin: "nà", meaning: "that", strokes: 6 },
  { character: "什", pinyin: "shén", meaning: "what", strokes: 4 },
  { character: "么", pinyin: "me", meaning: "suffix (what/how)", strokes: 3 },
  { character: "很", pinyin: "hěn", meaning: "very", strokes: 9 },
  { character: "都", pinyin: "dōu", meaning: "all; both", strokes: 10 },
  { character: "也", pinyin: "yě", meaning: "also; too", strokes: 3 },
  { character: "和", pinyin: "hé", meaning: "and; with", strokes: 8 },
  { character: "谢", pinyin: "xiè", meaning: "to thank", strokes: 12 },
  {
    character: "请",
    pinyin: "qǐng",
    meaning: "please; to invite",
    strokes: 10,
  },
  { character: "对", pinyin: "duì", meaning: "correct; toward", strokes: 5 },
  { character: "起", pinyin: "qǐ", meaning: "to rise; get up", strokes: 10 },
  { character: "时", pinyin: "shí", meaning: "time; hour", strokes: 7 },
  { character: "间", pinyin: "jiān", meaning: "between; interval", strokes: 7 },
  { character: "钱", pinyin: "qián", meaning: "money", strokes: 10 },
  { character: "买", pinyin: "mǎi", meaning: "to buy", strokes: 6 },
  { character: "卖", pinyin: "mài", meaning: "to sell", strokes: 8 },
  { character: "东", pinyin: "dōng", meaning: "east", strokes: 5 },
  { character: "西", pinyin: "xī", meaning: "west", strokes: 6 },
  { character: "南", pinyin: "nán", meaning: "south", strokes: 9 },
  { character: "北", pinyin: "běi", meaning: "north", strokes: 5 },
];

/** Total number of characters in the reference set. */
export const CHINESE_TOTAL = CHINESE_CHARACTERS.length;

/** Look up a character entry by its glyph. */
export function findChineseCharacter(
  character: string,
): ChineseCharacter | undefined {
  return CHINESE_CHARACTERS.find((entry) => entry.character === character);
}
