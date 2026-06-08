import { pinyin } from 'pinyin-pro';

const initials = {
  "b":"ㄅ","p":"ㄆ","m":"ㄇ","f":"ㄈ",
  "d":"ㄉ","t":"ㄊ","n":"ㄋ","l":"ㄌ",
  "g":"ㄍ","k":"ㄎ","h":"ㄏ",
  "j":"ㄐ","q":"ㄑ","x":"ㄒ",
  "zh":"ㄓ","ch":"ㄔ","sh":"ㄕ","r":"ㄖ",
  "z":"ㄗ","c":"ㄘ","s":"ㄙ"
};

const finals = {
  "a":"ㄚ","o":"ㄛ","e":"ㄜ","i":"ㄧ","u":"ㄨ","v":"ㄩ",
  "ai":"ㄞ","ei":"ㄟ","ao":"ㄠ","ou":"ㄡ",
  "an":"ㄢ","en":"ㄣ","ang":"ㄤ","eng":"ㄥ","er":"ㄦ",
  "ia":"ㄧㄚ","ie":"ㄧㄝ","iao":"ㄧㄠ","iu":"ㄧㄡ","iou":"ㄧㄡ",
  "ian":"ㄧㄢ","in":"ㄧㄣ","iang":"ㄧㄤ","ing":"ㄧㄥ",
  "ua":"ㄨㄚ","uo":"ㄨㄛ","uai":"ㄨㄞ","ui":"ㄨㄟ","uei":"ㄨㄟ",
  "uan":"ㄨㄢ","un":"ㄨㄣ","uen":"ㄨㄣ","uang":"ㄨㄤ","ong":"ㄨㄥ",
  "ve":"ㄩㄝ","ue":"ㄩㄝ",
  "van":"ㄩㄢ","vn":"ㄩㄣ","iong":"ㄩㄥ"
};

/* tone 1=no mark, 2=ˊ, 3=ˇ, 4=ˋ, 5=˙(light,prefix) */
const toneMarks = ["", "", "\u02CA", "\u02C7", "\u02CB"];

const PINYIN_TO_ZHUYIN = {
  convert(py) {
    if (!py) return "";
    py = py.trim().toLowerCase();

    /* ── Extract numeric tone (pinyin-pro toneType:"num" gives "yi1") ── */
    let tone = 0;
    let plain = py;
    const last = py.charAt(py.length - 1);
    if (last >= "1" && last <= "5") {
      tone = parseInt(last, 10);
      plain = py.slice(0, -1);
    }

    /* ── Handle y-/w- spellings ── */
    if      (plain === "yi")  plain = "i";
    else if (plain === "wu")  plain = "u";
    else if (plain === "yu")  plain = "v";
    else if (plain === "yin") plain = "in";
    else if (plain === "ying")plain = "ing";
    else if (plain === "yun") plain = "vn";
    else if (plain === "yue") plain = "ve";
    else if (plain === "yuan")plain = "van";
    else if (plain === "yong")plain = "iong";
    else if (plain.charAt(0) === "y") plain = plain.slice(1);
    else if (plain.charAt(0) === "w") {
      plain = plain.slice(1);
      if (plain.charAt(0) !== "u") plain = "u" + plain;
    }

    /* ── Find initial ── */
    let initial = "";
    let fin = plain;
    const two = plain.slice(0, 2);
    if (initials[two]) { 
      initial = initials[two]; 
      fin = plain.slice(2); 
    } else if (plain.length && initials[plain.charAt(0)]) {
      initial = initials[plain.charAt(0)]; 
      fin = plain.slice(1);
      /* j/q/x + u → ü */
      if ("jqx".indexOf(plain.charAt(0)) >= 0 && fin.charAt(0) === "u") {
        fin = "v" + fin.slice(1);
      }
    }

    /* ── zh/ch/sh/z/c/s/r + i only → standalone ── */
    if (fin === "i" && (initial === "ㄓ"||initial === "ㄔ"||initial === "ㄕ"||
        initial === "ㄖ"||initial === "ㄗ"||initial === "ㄘ"||initial === "ㄙ")) {
      fin = "";
    }

    /* ── Find final ── */
    let zy = "";
    if (fin && finals[fin]) { 
      zy = finals[fin]; 
    } else if (fin) {
      for (let l = Math.min(fin.length, 5); l >= 1; l--) {
        if (finals[fin.slice(0, l)]) { 
          zy = finals[fin.slice(0, l)]; 
          break; 
        }
      }
    }

    let result = initial + zy;
    if (!result) return "";          /* conversion failed → return "" not pinyin */

    /* ── Append tone mark ── */
    if (tone === 5) result = "\u02D9" + result;   /* ˙ prefix for light tone */
    else if (tone >= 2 && tone <= 4) result += toneMarks[tone];

    return result;
  }
};

/*
 * Hardcoded Bopomofo for the most common characters.
 * Checked FIRST — never depends on pinyin-pro encoding quirks.
 */
const COMMON_ZHUYIN = {
  "一": "ㄧ", "二": "ㄦˋ", "三": "ㄙㄢ", "四": "ㄙˋ", "五": "ㄨˇ",
  "六": "ㄌㄧㄡˋ", "七": "ㄑㄧ", "八": "ㄅㄚ", "九": "ㄐㄧㄡˇ", "十": "ㄕˊ",
  "百": "ㄅㄞˇ", "千": "ㄑㄧㄢ", "萬": "ㄨㄢˋ", "零": "ㄌㄧㄥˊ",
  "月": "ㄩㄝˋ", "日": "ㄖˋ", "星": "ㄒㄧㄥ", "期": "ㄑㄧˊ",
  "年": "ㄋㄧㄢˊ", "今": "ㄐㄧㄣ", "天": "ㄊㄧㄢ",
  "國": "ㄍㄨㄛˊ", "語": "ㄩˇ", "數": "ㄕㄨˋ", "學": "ㄒㄩㄝˊ",
  "自": "ㄗˋ", "然": "ㄖㄢˊ", "社": "ㄕㄜˋ", "會": "ㄏㄨㄟˋ",
  "音": "ㄧㄣ", "樂": "ㄩㄝˋ", "體": "ㄊㄧˇ", "育": "ㄩˋ",
  "美": "ㄇㄟˇ", "術": "ㄕㄨˋ", "健": "ㄐㄧㄢˋ", "康": "ㄎㄤ",
  "電": "ㄉㄧㄢˋ", "腦": "ㄋㄠˇ", "英": "ㄧㄥ", "文": "ㄨㄣˊ",
  "彈": "ㄊㄢˊ", "性": "ㄒㄧㄥˋ", "綜": "ㄗㄨㄥ", "合": "ㄏㄜˊ",
  "第": "ㄉㄧˋ", "課": "ㄎㄜˋ", "生": "ㄕㄥ", "字": "ㄗˋ",
  "回": "ㄏㄨㄟˊ", "家": "ㄐㄧㄚ", "作": "ㄗㄨㄛˋ", "業": "ㄧㄝˋ",
  "功": "ㄍㄨㄥ", "明": "ㄇㄧㄥˊ", "穿": "ㄔㄨㄢ",
  "運": "ㄩㄣˋ", "動": "ㄉㄨㄥˋ", "服": "ㄈㄨˊ",
  "習": "ㄒㄧˊ", "讀": "ㄉㄨˊ", "寫": "ㄒㄧㄝˇ",
  "的": "ㄉㄜ˙", "了": "ㄌㄜ˙", "是": "ㄕˋ", "我": "ㄨㄛˇ",
  "不": "ㄅㄨˋ", "有": "ㄧㄡˇ", "在": "ㄗㄞˋ", "和": "ㄏㄜˊ",
  "老": "ㄌㄠˇ", "師": "ㄕ", "同": "ㄊㄨㄥˊ",
  "請": "ㄑㄧㄥˇ", "帶": "ㄉㄞˋ", "交": "ㄐㄧㄠ", "來": "ㄌㄞˊ"
};

export const getZhuyinForChar = (char) => {
  if (!/[\u4e00-\u9fa5]/.test(char)) return "";
  /* 1. Hardcoded table first – always reliable */
  if (COMMON_ZHUYIN[char]) return COMMON_ZHUYIN[char];
  /* 2. Fall back to pinyin-pro */
  try {
    const py = pinyin(char, { toneType: "num", type: "string" });
    if (!py || py === char) return "";
    return PINYIN_TO_ZHUYIN.convert(py.trim()) || "";
  } catch (e) { 
    return ""; 
  }
};

export const parseLineToZhuyin = (line) => {
  const result = [];
  let i = 0;
  while (i < line.length) {
    const remaining = line.slice(i);
    // Match English, numbers, and symbols like hyphen, dots, slashes, pluses
    const enNumRegex = /^[a-zA-Z0-9\-\.\/\+]+/;
    const enNumMatch = remaining.match(enNumRegex);
    
    if (enNumMatch) {
      const matchText = enNumMatch[0];
      result.push({
        type: 'horizontal',
        text: matchText
      });
      i += matchText.length;
    } else {
      const char = line[i];
      if (/[\u4e00-\u9fa5]/.test(char)) {
        result.push({
          type: 'chinese',
          char,
          zhuyin: getZhuyinForChar(char)
        });
      } else {
        result.push({
          type: 'normal',
          char
        });
      }
      i++;
    }
  }
  return result;
};
