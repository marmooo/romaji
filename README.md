# @marmooo/romaji

Convert hiragana to romaji latice.

## Usage

```
import { Romaji } from "@marmooo/romaji";

const problem = "がっこう";
const romaji = new Romaji(problem);
romaji.input("g"); // --> true
romaji.input("j"); // --> false
romaji.input("a"); // --> true
romaji.inputedRomaji;   // --> "ga"
romaji.inputedHiragana; // --> "が"

globalThis.addEventListener("keydown", (event) => {
  if (romaji.input(event.key)) {
    if (romaji.isEnd()) {
      nextProblem();
    } else {
      correctType();
    }
  } else {
    incorrectType();
  }
});
```

## Test

1. install [SudachiDict](https://github.com/WorksApplications/SudachiDict)
2. `deno test --allow-read`

## License

MIT

## References

- [ローマ字入力 - Wikipedia](https://ja.wikipedia.org/wiki/ローマ字入力)
