import { Trie } from "./trie.js";

export class Romaji {
  static wordRegexp = /([ぁ-ゖー]+|[ -~]+)/g;
  static hiraganaRegexp = /[ぁ-ゖー]+/g;
  static segmentRegexp = /っ*[ぁ-ゖー][ぁぃぅぇぉゃゅょ]?/g;
  static nagyoRegexp = /[なにぬねのん]/;
  static hatsuonRegexp = /(.)\1*$/;

  get inputedHiragana() {
    let hiragana = "";
    for (let i = 0; i < this.laticeIndex; i++) {
      hiragana += this.latice[i].hiragana;
    }
    if (hiragana.endsWith("っ")) {
      const hatsuonLength =
        this.inputedRomaji.match(Romaji.hatsuonRegexp)[0].length;
      hiragana = hiragana.replace(
        Romaji.hatsuonRegexp,
        "っ".repeat(hatsuonLength - 1),
      );
    }
    return hiragana;
  }

  get remainedRomaji() {
    const currentNode = this.currentNode;
    const trieRemained = currentNode ? currentNode.getFirstBranch() : "";
    const laticeRemained = this.latice.slice(this.laticeIndex + 1)
      .map((trie) => trie.root.getFirstBranch()).join("");
    return trieRemained + laticeRemained;
  }

  get remainedHiragana() {
    return this.hiragana.slice(this.inputedHiragana.length);
  }

  constructor(hiragana, options = {}) {
    this.hiragana = hiragana;
    this.options = options || {};
    this.options.shortSokuon = options.shortSokuon ?? true;
    this.options.shortHatsuon = options.shortHatsuon ?? true;
    this.latice = this.toLatice(hiragana);
    this.laticeIndex = 0;
    this.currentNode = this.latice[0].root;
    this.inputedRomaji = "";
  }

  toLatice(str) {
    const latice = [];
    const words = str.match(Romaji.wordRegexp);
    words.forEach((word) => {
      if (word.match(Romaji.hiraganaRegexp)) {
        const hiraganaLatice = this.toHiraganaLatice(word);
        latice.push(...hiraganaLatice);
      } else {
        const asciiLatice = this.toAsciiLatice(word);
        latice.push(...asciiLatice);
      }
    });
    return latice;
  }

  toAsciiLatice(ascii) {
    const latice = [];
    Array.from(ascii).forEach((char) => {
      const trie = new Trie();
      trie.set(char);
      latice.push(trie);
    });
    return latice;
  }

  toHiraganaLatice(hiragana) {
    // const latice = [];
    // const segments = hiragana.match(Romaji.segmentRegexp);
    // segments.forEach((segment) => {
    //   const trie = new Trie();
    //   trie.hiragana = segment;
    //   this.getRomajiPattern(segment).forEach((roma) => {
    //     trie.set(roma);
    //   });
    //   latice.push(trie);
    // });
    // return latice;

    const latice = [];
    const segments = hiragana.match(Romaji.segmentRegexp);
    for (const segment of segments) {
      const pos = segment.lastIndexOf("っ");
      if (segment.length > 1 && pos >= 0) {
        const afterSokuon = segment.slice(pos + 1);
        if (this.options.shortSokuon && afterSokuon.length > 0) {
          const trie = new Trie();
          trie.hiragana = afterSokuon;
          this.getRomajiPattern(afterSokuon).forEach((roma) => {
            trie.set(roma);
          });
          const firstChars = Array.from(trie.root.children.keys());
          for (let i = 0; i <= pos; i++) {
            const sokuonTrie = new Trie();
            sokuonTrie.hiragana = "っ";
            if (!afterSokuon[0].match(Romaji.nagyoRegexp)) {
              firstChars.forEach((firstChar) => {
                sokuonTrie.set(firstChar);
              });
            }
            this.getRomajiPattern("っ").forEach((roma) => {
              sokuonTrie.set(roma);
            });
            latice.push(sokuonTrie);
          }
          latice.push(trie);
        } else {
          for (let i = 0; i <= pos; i++) {
            const trie = new Trie();
            trie.hiragana = "っ";
            this.getRomajiPattern("っ").forEach((roma) => {
              trie.set(roma);
            });
            latice.push(trie);
          }
        }
      } else {
        const trie = new Trie();
        trie.hiragana = segment;
        this.getRomajiPattern(segment).forEach((roma) => {
          trie.set(roma);
        });
        latice.push(trie);
      }
    }
    return latice;
  }

  input(char) {
    if (!this.currentNode) return false;
    const node = this.currentNode.children.get(char);
    if (node) {
      if (node.isEnd) {
        this.laticeIndex += 1;
        if (this.laticeIndex >= this.latice.length) {
          this.currentNode = null;
        } else {
          this.currentNode = this.latice[this.laticeIndex].root;
        }
      } else {
        this.currentNode = node;
      }
      this.inputedRomaji += char;
      return true;
    } else {
      switch (this.latice[this.laticeIndex].hiragana) {
        case "ん": {
          if (!this.options.shortHatsuon) return false;
          if (!this.inputedRomaji.at(-1).match(/[xn]/)) return false;
          if (char.match(/[aiueoy]/)) return false;
          if (this.laticeIndex + 1 >= this.latice.length) return false;
          const nextTrie = this.latice[this.laticeIndex + 1];
          const nextNode = nextTrie.root.children.get(char);
          if (!nextNode) return false;
          this.laticeIndex += 1;
          this.currentNode = nextNode;
          this.inputedRomaji += char;
          return true;
        }
        case "っ": {
          if (!this.options.shortSokuon) return false;
          if (this.inputedRomaji.at(-1) !== char) return false;
          if (char.match(/[aiueon]/)) return false;
          if (this.laticeIndex + 1 >= this.latice.length) return false;
          const nextTrie = this.latice[this.laticeIndex + 1];
          const nextNode = nextTrie.root.children.get(char);
          if (!nextNode) return false;
          this.laticeIndex += 1;
          this.currentNode = nextNode;
          this.inputedRomaji += char;
          return true;
        }
      }
    }
    return false;
  }

  isEnd() {
    return (this.currentNode) ? false : true;
  }

  getCombinations(arrays, current = []) {
    if (current.length === arrays.length) {
      return [current.join("")];
    }

    const result = [];
    for (const item of arrays[current.length]) {
      result.push(...this.getCombinations(arrays, [...current, item]));
    }

    return result;
  }

  get2gramPattern(hiragana) {
    const arr0 = Romaji.table[hiragana[0]];
    const arr1 = Romaji.table[hiragana[1]];
    const pattern2 = this.getCombinations([arr0, arr1]);
    if (hiragana[0] === "っ") {
      if (Romaji.nagyoRegexp.test(hiragana[1])) {
        return pattern2;
      } else {
        const pattern1 = arr1.map((str) => str[0] + str);
        pattern1.push(...pattern2);
        return pattern1;
      }
    } else {
      const pattern1 = Romaji.table[hiragana] || [];
      pattern1.push(...pattern2);
      return pattern1;
    }
  }

  get3gramPattern(hiragana) {
    const arr0 = Romaji.table[hiragana[0]];
    const arr1 = Romaji.table[hiragana[1]];
    const arr2 = Romaji.table[hiragana[2]];
    const arr12 = Romaji.table[hiragana.slice(1)];
    const pattern2 = arr12 ? this.getCombinations([arr0, arr12]) : [];
    const pattern3 = this.getCombinations([arr0, arr1, arr2]);
    if (Romaji.nagyoRegexp.test(hiragana[1])) {
      pattern2.push(...pattern3);
      return pattern2;
    } else {
      const pattern2s = arr12 ? arr12.map((str) => str[0] + str) : [];
      const arr1s = arr1.map((str) => str[0] + str);
      const pattern3s = this.getCombinations([arr1s, arr2]);
      pattern2s.push(...pattern3s);
      pattern2s.push(...pattern2);
      pattern2s.push(...pattern3);
      return pattern2s;
    }
  }

  getRomajiPattern(hiragana) {
    switch (hiragana.length) {
      case 1:
        return Romaji.table[hiragana];
      case 2:
        return this.get2gramPattern(hiragana);
      case 3:
        return this.get3gramPattern(hiragana);
      default:
        throw new Error("parse error");
    }
  }

  static table = {
    "ー": ["-"],
    "いぇ": ["ye"],
    "うぁ": ["wha"],
    "うぃ": ["wi", "whi"],
    "うぇ": ["we", "whe"],
    "うぉ": ["who"],
    "ゔぁ": ["va"],
    "ゔぃ": ["vi", "vyi"],
    "ゔぇ": ["ve", "vye"],
    "ゔぉ": ["vo"],
    "ゔゃ": ["vya"],
    "ゔゅ": ["vyu"],
    "ゔょ": ["vyo"],
    "きゃ": ["kya"],
    "きぃ": ["kyi"],
    "きゅ": ["kyu"],
    "きぇ": ["kye"],
    "きょ": ["kyo"],
    "ぎゃ": ["gya"],
    "ぎぃ": ["gyi"],
    "ぎゅ": ["gyu"],
    "ぎぇ": ["gye"],
    "ぎょ": ["gyo"],
    "くぁ": ["kwa", "qa"],
    "くぃ": ["kwi", "qi"],
    "くぅ": ["kwu"],
    "くぇ": ["kwe", "qe"],
    "くぉ": ["kwo", "qo"],
    "くゃ": ["qya"],
    "くゅ": ["qyu"],
    "くょ": ["qyo"],
    "ぐぁ": ["gwa"],
    "ぐぃ": ["gwi"],
    "ぐぅ": ["gwu"],
    "ぐぇ": ["gwe"],
    "ぐぉ": ["gwo"],
    "しゃ": ["sha", "sya"],
    "しぃ": ["syi"],
    "しゅ": ["shu", "syu"],
    "しぇ": ["she", "sye"],
    "しょ": ["sho", "syo"],
    "じゃ": ["ja", "jya", "zya"],
    "じぃ": ["jyi", "zyi"],
    "じゅ": ["ju", "jyu", "zyu"],
    "じぇ": ["je", "jye", "zye"],
    "じょ": ["jo", "jyo", "zyo"],
    "すぁ": ["swa"],
    "すぃ": ["swi"],
    "すぅ": ["swu"],
    "すぇ": ["swe"],
    "すぉ": ["swo"],
    "ちゃ": ["cha", "cya", "tya"],
    "ちぃ": ["cyi", "tyi"],
    "ちゅ": ["chu", "cyu", "tyu"],
    "ちぇ": ["che", "cye", "tye"],
    "ちょ": ["cho", "cyo", "tyo"],
    "ぢゃ": ["dya"],
    "ぢぃ": ["dyi"],
    "ぢゅ": ["dyu"],
    "ぢぇ": ["dye"],
    "ぢょ": ["dyo"],
    "つぁ": ["tsa"],
    "つぃ": ["tsi"],
    "つぇ": ["tse"],
    "つぉ": ["tso"],
    "てゃ": ["tha"],
    "てぃ": ["thi"],
    "てゅ": ["thu"],
    "てぇ": ["the"],
    "てょ": ["tho"],
    "でゃ": ["dha"],
    "でぃ": ["dhi"],
    "でゅ": ["dhu"],
    "でぇ": ["dhe"],
    "でょ": ["dho"],
    "とぁ": ["twa"],
    "とぃ": ["twi"],
    "とぅ": ["twu"],
    "とぇ": ["twe"],
    "とぉ": ["two"],
    "どぁ": ["dwa"],
    "どぃ": ["dwi"],
    "どぅ": ["dwu"],
    "どぇ": ["dwe"],
    "どぉ": ["dwo"],
    "にゃ": ["nya"],
    "にぃ": ["nyi"],
    "にゅ": ["nyu"],
    "にぇ": ["nye"],
    "にょ": ["nyo"],
    "ひゃ": ["hya"],
    "ひぃ": ["hyi"],
    "ひゅ": ["hyu"],
    "ひぇ": ["hye"],
    "ひょ": ["hyo"],
    "びゃ": ["bya"],
    "びぃ": ["byi"],
    "びゅ": ["byu"],
    "びぇ": ["bye"],
    "びょ": ["byo"],
    "ぴゃ": ["pya"],
    "ぴぃ": ["pyi"],
    "ぴゅ": ["pyu"],
    "ぴぇ": ["pye"],
    "ぴょ": ["pyo"],
    "ふぁ": ["fa", "fwa", "hwa"],
    "ふぃ": ["fi", "fwi", "fyi", "hwi"],
    "ふぅ": ["fwu"],
    "ふぇ": ["fe", "fwe", "fye", "hwe"],
    "ふぉ": ["fo", "fwo", "hwo"],
    "ふゃ": ["fya"],
    "ふゅ": ["fyu"],
    "ふょ": ["fyo"],
    "みゃ": ["mya"],
    "みぃ": ["myi"],
    "みゅ": ["myu"],
    "みぇ": ["mye"],
    "みょ": ["myo"],
    "りゃ": ["rya"],
    "りぃ": ["ryi"],
    "りゅ": ["ryu"],
    "りぇ": ["rye"],
    "りょ": ["ryo"],
    "あ": ["a"],
    "い": ["i"],
    "う": ["u", "whu", "wu"],
    "え": ["e"],
    "お": ["o"],
    "か": ["ka", "ca"],
    "き": ["ki"],
    "く": ["ku", "cu", "qu"],
    "け": ["ke"],
    "こ": ["ko", "co"],
    "さ": ["sa"],
    "し": ["shi", "si", "ci"],
    "す": ["su"],
    "せ": ["se", "ce"],
    "そ": ["so"],
    "た": ["ta"],
    "ち": ["chi", "ti"],
    "つ": ["tsu", "tu"],
    "て": ["te"],
    "と": ["to"],
    "な": ["na"],
    "に": ["ni"],
    "ぬ": ["nu"],
    "ね": ["ne"],
    "の": ["no"],
    "は": ["ha"],
    "ひ": ["hi"],
    "ふ": ["fu", "hu"],
    "へ": ["he"],
    "ほ": ["ho"],
    "ま": ["ma"],
    "み": ["mi"],
    "む": ["mu"],
    "め": ["me"],
    "も": ["mo"],
    "や": ["ya"],
    "ゆ": ["yu"],
    "よ": ["yo"],
    "ら": ["ra"],
    "り": ["ri"],
    "る": ["ru"],
    "れ": ["re"],
    "ろ": ["ro"],
    "わ": ["wa"],
    "を": ["wo"],
    "ん": ["nn", "xn"],
    "ぁ": ["xa", "la"],
    "ぃ": ["xi", "li", "xyi", "lyi"],
    "ぅ": ["xu", "lu"],
    "ぇ": ["xe", "le", "xye", "lye"],
    "ぉ": ["xo", "lo"],
    "ゃ": ["xya", "lya"],
    "ゅ": ["xyu", "lyu"],
    "ょ": ["xyo", "lyo"],
    "ゕ": ["xka", "lka"],
    "ゖ": ["xke", "lke"],
    "っ": ["xtu", "xtsu", "ltu", "ltsu"],
    "ゎ": ["xwa", "lwa"],
    "が": ["ga"],
    "ぎ": ["gi"],
    "ぐ": ["gu"],
    "げ": ["ge"],
    "ご": ["go"],
    "ざ": ["za"],
    "じ": ["ji", "zi"],
    "ず": ["zu"],
    "ぜ": ["ze"],
    "ぞ": ["zo"],
    "だ": ["da"],
    "ぢ": ["di"],
    "づ": ["du"],
    "で": ["de"],
    "ど": ["do"],
    "ば": ["ba"],
    "び": ["bi"],
    "ぶ": ["bu"],
    "べ": ["be"],
    "ぼ": ["bo"],
    "ぱ": ["pa"],
    "ぴ": ["pi"],
    "ぷ": ["pu"],
    "ぺ": ["pe"],
    "ぽ": ["po"],
    "ゐ": ["wyi"],
    "ゑ": ["wye"],
    "ゔ": ["vu"],
  };
}
