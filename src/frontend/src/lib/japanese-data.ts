/**
 * Japanese study data — hiragana, katakana, and a starter kanji set.
 *
 * Each script is a "set" whose `id` is the key used by the backend
 * (`getJapaneseLearned(setId)` / `markJapaneseLearned(setId, …)`), so the
 * ids here must stay stable.
 */

export type ScriptId = "hiragana" | "katakana" | "kanji";

export interface KanaEntry {
  /** The character itself, e.g. "あ". */
  character: string;
  /** Hepburn romanisation, e.g. "a". */
  romaji: string;
  /** Short English meaning or usage note. */
  meaning: string;
}

export interface ScriptSet {
  id: ScriptId;
  name: string;
  /** Japanese label for the script. */
  japaneseName: string;
  /** One-line description of what the set covers. */
  description: string;
  /** Hanko seal glyph for the set. */
  seal: string;
  entries: KanaEntry[];
}

/** Hiragana — the 46 base characters, in gojūon order. */
const HIRAGANA: KanaEntry[] = [
  { character: "あ", romaji: "a", meaning: "vowel a" },
  { character: "い", romaji: "i", meaning: "vowel i" },
  { character: "う", romaji: "u", meaning: "vowel u" },
  { character: "え", romaji: "e", meaning: "vowel e" },
  { character: "お", romaji: "o", meaning: "vowel o" },
  { character: "か", romaji: "ka", meaning: "ka" },
  { character: "き", romaji: "ki", meaning: "ki" },
  { character: "く", romaji: "ku", meaning: "ku" },
  { character: "け", romaji: "ke", meaning: "ke" },
  { character: "こ", romaji: "ko", meaning: "ko" },
  { character: "さ", romaji: "sa", meaning: "sa" },
  { character: "し", romaji: "shi", meaning: "shi" },
  { character: "す", romaji: "su", meaning: "su" },
  { character: "せ", romaji: "se", meaning: "se" },
  { character: "そ", romaji: "so", meaning: "so" },
  { character: "た", romaji: "ta", meaning: "ta" },
  { character: "ち", romaji: "chi", meaning: "chi" },
  { character: "つ", romaji: "tsu", meaning: "tsu" },
  { character: "て", romaji: "te", meaning: "te" },
  { character: "と", romaji: "to", meaning: "to" },
  { character: "な", romaji: "na", meaning: "na" },
  { character: "に", romaji: "ni", meaning: "ni" },
  { character: "ぬ", romaji: "nu", meaning: "nu" },
  { character: "ね", romaji: "ne", meaning: "ne" },
  { character: "の", romaji: "no", meaning: "no" },
  { character: "は", romaji: "ha", meaning: "ha" },
  { character: "ひ", romaji: "hi", meaning: "hi" },
  { character: "ふ", romaji: "fu", meaning: "fu" },
  { character: "へ", romaji: "he", meaning: "he" },
  { character: "ほ", romaji: "ho", meaning: "ho" },
  { character: "ま", romaji: "ma", meaning: "ma" },
  { character: "み", romaji: "mi", meaning: "mi" },
  { character: "む", romaji: "mu", meaning: "mu" },
  { character: "め", romaji: "me", meaning: "me" },
  { character: "も", romaji: "mo", meaning: "mo" },
  { character: "や", romaji: "ya", meaning: "ya" },
  { character: "ゆ", romaji: "yu", meaning: "yu" },
  { character: "よ", romaji: "yo", meaning: "yo" },
  { character: "ら", romaji: "ra", meaning: "ra" },
  { character: "り", romaji: "ri", meaning: "ri" },
  { character: "る", romaji: "ru", meaning: "ru" },
  { character: "れ", romaji: "re", meaning: "re" },
  { character: "ろ", romaji: "ro", meaning: "ro" },
  { character: "わ", romaji: "wa", meaning: "wa" },
  { character: "を", romaji: "wo", meaning: "object particle" },
  { character: "ん", romaji: "n", meaning: "syllabic n" },
];

/** Katakana — the 46 base characters, in gojūon order. */
const KATAKANA: KanaEntry[] = [
  { character: "ア", romaji: "a", meaning: "vowel a" },
  { character: "イ", romaji: "i", meaning: "vowel i" },
  { character: "ウ", romaji: "u", meaning: "vowel u" },
  { character: "エ", romaji: "e", meaning: "vowel e" },
  { character: "オ", romaji: "o", meaning: "vowel o" },
  { character: "カ", romaji: "ka", meaning: "ka" },
  { character: "キ", romaji: "ki", meaning: "ki" },
  { character: "ク", romaji: "ku", meaning: "ku" },
  { character: "ケ", romaji: "ke", meaning: "ke" },
  { character: "コ", romaji: "ko", meaning: "ko" },
  { character: "サ", romaji: "sa", meaning: "sa" },
  { character: "シ", romaji: "shi", meaning: "shi" },
  { character: "ス", romaji: "su", meaning: "su" },
  { character: "セ", romaji: "se", meaning: "se" },
  { character: "ソ", romaji: "so", meaning: "so" },
  { character: "タ", romaji: "ta", meaning: "ta" },
  { character: "チ", romaji: "chi", meaning: "chi" },
  { character: "ツ", romaji: "tsu", meaning: "tsu" },
  { character: "テ", romaji: "te", meaning: "te" },
  { character: "ト", romaji: "to", meaning: "to" },
  { character: "ナ", romaji: "na", meaning: "na" },
  { character: "ニ", romaji: "ni", meaning: "ni" },
  { character: "ヌ", romaji: "nu", meaning: "nu" },
  { character: "ネ", romaji: "ne", meaning: "ne" },
  { character: "ノ", romaji: "no", meaning: "no" },
  { character: "ハ", romaji: "ha", meaning: "ha" },
  { character: "ヒ", romaji: "hi", meaning: "hi" },
  { character: "フ", romaji: "fu", meaning: "fu" },
  { character: "ヘ", romaji: "he", meaning: "he" },
  { character: "ホ", romaji: "ho", meaning: "ho" },
  { character: "マ", romaji: "ma", meaning: "ma" },
  { character: "ミ", romaji: "mi", meaning: "mi" },
  { character: "ム", romaji: "mu", meaning: "mu" },
  { character: "メ", romaji: "me", meaning: "me" },
  { character: "モ", romaji: "mo", meaning: "mo" },
  { character: "ヤ", romaji: "ya", meaning: "ya" },
  { character: "ユ", romaji: "yu", meaning: "yu" },
  { character: "ヨ", romaji: "yo", meaning: "yo" },
  { character: "ラ", romaji: "ra", meaning: "ra" },
  { character: "リ", romaji: "ri", meaning: "ri" },
  { character: "ル", romaji: "ru", meaning: "ru" },
  { character: "レ", romaji: "re", meaning: "re" },
  { character: "ロ", romaji: "ro", meaning: "ro" },
  { character: "ワ", romaji: "wa", meaning: "wa" },
  { character: "ヲ", romaji: "wo", meaning: "object particle" },
  { character: "ン", romaji: "n", meaning: "syllabic n" },
];

/** Starter kanji — everyday characters with readings and meanings. */
const KANJI: KanaEntry[] = [
  { character: "日", romaji: "nichi / hi", meaning: "day, sun" },
  { character: "月", romaji: "getsu / tsuki", meaning: "month, moon" },
  { character: "火", romaji: "ka / hi", meaning: "fire" },
  { character: "水", romaji: "sui / mizu", meaning: "water" },
  { character: "木", romaji: "moku / ki", meaning: "tree, wood" },
  { character: "金", romaji: "kin / kane", meaning: "gold, money" },
  { character: "土", romaji: "do / tsuchi", meaning: "earth, soil" },
  { character: "人", romaji: "jin / hito", meaning: "person" },
  { character: "口", romaji: "kō / kuchi", meaning: "mouth" },
  { character: "目", romaji: "moku / me", meaning: "eye" },
  { character: "耳", romaji: "ji / mimi", meaning: "ear" },
  { character: "手", romaji: "shu / te", meaning: "hand" },
  { character: "足", romaji: "soku / ashi", meaning: "foot, leg" },
  { character: "山", romaji: "san / yama", meaning: "mountain" },
  { character: "川", romaji: "sen / kawa", meaning: "river" },
  { character: "田", romaji: "den / ta", meaning: "rice field" },
  { character: "大", romaji: "dai / ō", meaning: "big, large" },
  { character: "小", romaji: "shō / chī", meaning: "small" },
  { character: "中", romaji: "chū / naka", meaning: "middle, inside" },
  { character: "上", romaji: "jō / ue", meaning: "up, above" },
  { character: "下", romaji: "ka / shita", meaning: "down, below" },
  { character: "左", romaji: "sa / hidari", meaning: "left" },
  { character: "右", romaji: "u / migi", meaning: "right" },
  { character: "学", romaji: "gaku / manabu", meaning: "study, learning" },
  { character: "校", romaji: "kō", meaning: "school" },
  { character: "先", romaji: "sen / saki", meaning: "ahead, previous" },
  { character: "生", romaji: "sei / ikiru", meaning: "life, birth" },
  { character: "年", romaji: "nen / toshi", meaning: "year" },
  { character: "時", romaji: "ji / toki", meaning: "time, hour" },
  { character: "分", romaji: "fun / wakaru", meaning: "minute, divide" },
];

export const SCRIPT_SETS: ScriptSet[] = [
  {
    id: "hiragana",
    name: "Hiragana",
    japaneseName: "ひらがな",
    description: "The 46 base syllabary used for native Japanese words.",
    seal: "あ",
    entries: HIRAGANA,
  },
  {
    id: "katakana",
    name: "Katakana",
    japaneseName: "カタカナ",
    description: "The 46 base syllabary used for loanwords and emphasis.",
    seal: "ア",
    entries: KATAKANA,
  },
  {
    id: "kanji",
    name: "Kanji",
    japaneseName: "漢字",
    description: "A starter set of everyday characters with readings.",
    seal: "漢",
    entries: KANJI,
  },
];

export function getScriptSet(id: ScriptId): ScriptSet {
  const set = SCRIPT_SETS.find((candidate) => candidate.id === id);
  if (!set) throw new Error(`Unknown script set: ${id}`);
  return set;
}
