import { Romaji } from "./mod.js";
import { hiraToRoma, table, tree } from "https://raw.githubusercontent.com/marmooo/hiraroma/main/mod.js";
import { TextLineStream } from "jsr:@std/streams/text-line-stream";
import { assertEquals } from "jsr:@std/assert/equals";

function kanaToHira(str) {
  return str.replace(/[ァ-ヶ]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

const dicts = [
  "SudachiDict/src/main/text/small_lex.csv",
  "SudachiDict/src/main/text/core_lex.csv",
  "SudachiDict/src/main/text/notcore_lex.csv",
];

async function testSudachi(dicts) {
  for (const dict of dicts) {
    const file = await Deno.open(dict);
    const lineStream = file.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    for await (const line of lineStream) {
      const yomiKana = line.split(",")[11];
      if (!yomiKana.match(/^[ァ-ヶーゐゑ-]+$/)) continue;
      const yomiHira = kanaToHira(yomiKana);
      const yomi = yomiHira.replace(/-/g, "ー");
      testHira(yomi);
    }
  }
}

function testHira(hira, options) {
  const roma = hiraToRoma(hira);
  const romaji = new Romaji(hira, options);
  const state = Array.from(roma)
    .every((alphabet) => romaji.input(alphabet));
  assertEquals(state, true);
}

function testHiraRoma(hiraTest, roma, options = {}, expected = true) {
  const romaji = new Romaji(hiraTest, options);
  const state = Array.from(roma)
    .every((alphabet) => romaji.input(alphabet));
  assertEquals(state, expected);
}

function testRomaHira(romaTest, hira, options = {}, expected = true) {
  const romaji = new Romaji(hira, options);
  const state = Array.from(romaTest)
    .every((alphabet) => romaji.input(alphabet));
  assertEquals(state, expected);
}

function traverse(node, path = [], result = []) {
  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const newPath = [...path, key];
      traverse(value, newPath, result);
      if (typeof value === "string") {
        const kv = [newPath.join(""), value];
        result.push(kv);
      }
    }
  }
  return result;
}

Deno.test("Hiraroma tree check", () => {
  traverse(tree).forEach(([roma, hira]) => {
    const romaji = new Romaji(hira);
    Array.from(roma).forEach((alphabet) => {
      assertEquals(romaji.input(alphabet), true);
    });
  });
});
Deno.test("Hiraroma table check", () => {
  for (const [hira, roma] of Object.entries(table)) {
    const romaji = new Romaji(hira);
    Array.from(roma).forEach((alphabet) => {
      assertEquals(romaji.input(alphabet), true);
    });
  }
});
Deno.test("ASCII check", () => {
  testHiraRoma("a!b?c#d$e%f&g'h(i)j,k", "a!b?c#d$e%f&g'h(i)j,k");
  testHiraRoma("あaAあaあ", "aaAaaa");
  testHiraRoma("This is a test.", "This is a test.");
  testHiraRoma("What is this?", "What is this?");
  testHiraRoma("あ!? (べし)", "a!? (beshi)");
});
Deno.test("Latice check", () => {
  testHiraRoma("がっこう", "gakkou");
  testHiraRoma("がっこう", "galtukou");
  testHiraRoma("がっこう", "gaxtsukou");
  testHiraRoma("らっきょ", "rakkyo");
  testHiraRoma("らっきょ", "raltsukilyo");
  testHiraRoma("らっきょ", "raxtsukyo");
  testHiraRoma("ぴんっ", "pinltu");
  testHiraRoma("ぴんっ", "pinnltu");
  testHiraRoma("ぴんっ", "pixnxtu");
});
Deno.test("Sokuon check", () => {
  // testHiraRoma("あっネコ", "axtuネコ");
  // testHiraRoma("あっ犬", "axtu犬");
  testHiraRoma("あっ!?", "axtu!?");
  testHiraRoma("あっー", "axtu-");
  testHiraRoma("あっあ", "axtua");
  testHiraRoma("あっい", "axtui");
  testHiraRoma("あっう", "axtuu");
  testHiraRoma("あっえ", "axtue");
  testHiraRoma("あっお", "axtuo");
  testHiraRoma("あっな", "axtuna");
  testHiraRoma("あっに", "axtuni");
  testHiraRoma("あっぬ", "axtunu");
  testHiraRoma("あっね", "axtune");
  testHiraRoma("あっの", "axtuno");
  testHiraRoma("あっにゃ", "axtunya");
});
Deno.test("Hatsuon check", () => {
  testRomaHira("annnya", "あんにゃ");
  testRomaHira("annya", "あんや");
  testRomaHira("anno", "あんお");
  testRomaHira("annno", "あんの");
  testRomaHira("annki", "あんき");
  testRomaHira("axnnya", "あんにゃ");
  testRomaHira("axnya", "あんや");
  testRomaHira("axno", "あんお");
  testRomaHira("axnno", "あんの");
  testRomaHira("axnki", "あんき");
});
Deno.test("Short hatsuon check", () => {
  testRomaHira("anko", "あんこ");
  testRomaHira("tankobu", "たんこぶ");
  testRomaHira("tantanmenn", "たんたんめん");
  testRomaHira("ponpon", "ぽんぽん");
  testRomaHira("kanjou", "かんじょう");
});
Deno.test("Short sokuon check", () => {
  testRomaHira("alltu", "あっっ");
  testRomaHira("nyokilltu", "にょきっっ");
  testRomaHira("nyokkki", "にょっっき");
  testRomaHira("xxtu", "っっ");
  testRomaHira("xxn", "っん");
});
Deno.test("Options check", () => {
  testRomaHira("anko", "あんこ", { shortHatsuon: false }, false);
  testRomaHira("annko", "あんこ", { shortHatsuon: false }, true);
  testRomaHira("tankobu", "たんこぶ", { shortHatsuon: false }, false);
  testRomaHira("tannkobu", "たんこぶ", { shortHatsuon: false }, true);
  testRomaHira("alltu", "あっっ", { shortSokuon: false }, false);
  testRomaHira("altultu", "あっっ", { shortSokuon: false }, true);
  testRomaHira("nyokilltu", "にょきっっ", { shortSokuon: false }, false);
  testRomaHira("nyokixtultu", "にょきっっ", { shortSokuon: false }, true);
});
Deno.test("Inputed/remained check", () => {
  const roma = "gyakkkou";
  const hira = "ぎゃっっこう";
  const romaji = new Romaji(hira);
  const hiraPoses = [0, 0, 2, 2, 3, 4, 5, 6];
  Array.from(roma).forEach((alphabet, i) => {
    romaji.input(alphabet);
    const inputedRomaji = roma.slice(0, i + 1);
    const remainedRomaji = roma.slice(i + 1);
    assertEquals(romaji.inputedRomaji, inputedRomaji);
    assertEquals(romaji.remainedRomaji, remainedRomaji);
    const inputedHiragana = hira.slice(0, hiraPoses[i]);
    const remainedHiragana = hira.slice(hiraPoses[i]);
    assertEquals(romaji.inputedHiragana, inputedHiragana);
    assertEquals(romaji.remainedHiragana, remainedHiragana);
  });
});
try {
  Deno.statSync("SudachiDict");
  Deno.test("SudachiDict check", async () => {
    await testSudachi(dicts);
  });
} catch {
  console.warn("test SudachiDict check ... skip");
}
