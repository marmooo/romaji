export class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }

  getFirstBranch() {
    function traverse(current) {
      let result = "";
      while (!current.isEnd) {
        const char = current.children.keys().next().value;
        result += char;
        current = current.children.get(char);
      }
      return result;
    }

    return traverse(this);
  }

  getSuffixes() {
    const suffixes = [];

    function traverse(current, prefix) {
      if (current.isEnd) {
        suffixes.push(prefix);
      }
      for (const [char, child] of current.children.entries()) {
        traverse(child, prefix + char);
      }
    }
    traverse(this, "");

    return suffixes;
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  set(word) {
    let current = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }
    current.isEnd = true;
  }

  get(word) {
    let current = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!current.children.has(char)) return null;
      current = current.children.get(char);
    }
    return current;
  }
}
