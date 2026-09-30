#!/usr/bin/env node
// ビルドログをそのまま出し、その後ろに、直す必要がありそうなものを「ファイル:行: メッセージ」の一覧で出す。
//   - 参照・引用・画像・\cite の前の空白・" による引用符：main.tex から \input をたどって、ソースから調べる（ビルド不要）
//   - 行のはみ出し・エラー・未定義の参照：ビルドログから拾う
// 使い方：node scrips/check-latex.mjs [入口のtex] [ログ]
import fs from "node:fs";
import path from "node:path";

const entry = process.argv[2] ?? "main.tex";
const logPath = process.argv[3] ?? "out/main.log";
const root = path.dirname(entry);

const problems = [];
const report = (file, line, message) => problems.push({ file, line, message });

// ---- ソースを読む -------------------------------------------------------

// % から後ろ（\% は除く）を消す。行番号は保つ
const stripComment = (line) => line.replace(/(^|[^\\])%.*$/, "$1");

const resolveTex = (name) => {
  const p = path.join(root, name);
  return fs.existsSync(p) ? p : fs.existsSync(p + ".tex") ? p + ".tex" : null;
};

// PDF に出る順に、[ファイル, 行番号, 行] を並べる
const lines = [];
const bibFiles = [];
const visit = (file) => {
  const text = fs.readFileSync(file, "utf8").split("\n");
  text.forEach((raw, i) => {
    const line = stripComment(raw);
    lines.push([file, i + 1, line]);
    for (const m of line.matchAll(/\\(?:input|include)\{([^}]+)\}/g)) {
      const child = resolveTex(m[1]);
      if (child) visit(child);
      else report(file, i + 1, `取り込むファイル ${m[1]} が見つかりません`);
    }
    for (const m of line.matchAll(/\\bibliography\{([^}]+)\}/g)) {
      for (const b of m[1].split(",")) bibFiles.push(path.join(root, b.trim().replace(/\.bib$/, "") + ".bib"));
    }
  });
};
visit(entry);

const splitKeys = (s) => s.split(",").map((k) => k.trim()).filter(Boolean);

// ---- ラベルと参照 -------------------------------------------------------

const labels = new Map(); // ラベル -> {file, line, float}
const refs = new Map(); // ラベル -> [{file, line}]
const floatStack = [];
for (const [file, line, text] of lines) {
  for (const m of text.matchAll(/\\(begin|end)\{(figure|table)\*?\}|\\label\{([^}]+)\}|\\(?:[cC]ref|eqref|autoref|pageref|ref)\{([^}]+)\}/g)) {
    if (m[1] === "begin") floatStack.push(m[2]);
    else if (m[1] === "end") floatStack.pop();
    else if (m[3]) {
      if (labels.has(m[3])) {
        const first = labels.get(m[3]);
        report(file, line, `ラベル ${m[3]} が 2 か所で定義されています（最初は ${first.file}:${first.line}）`);
      } else {
        labels.set(m[3], { file, line, float: floatStack.at(-1) });
      }
    } else {
      for (const key of splitKeys(m[4])) {
        if (!refs.has(key)) refs.set(key, []);
        refs.get(key).push({ file, line });
      }
    }
  }
}
for (const [key, uses] of refs) {
  if (!labels.has(key)) for (const u of uses) report(u.file, u.line, `ラベル ${key} は定義されていません（PDF では ?? になります）`);
}
for (const [key, l] of labels) {
  if (l.float && !refs.has(key)) {
    const kind = l.float === "figure" ? "図" : "表";
    report(l.file, l.line, `${kind}（ラベル ${key}）が本文から参照されていません`);
  }
}

// ---- 引用 ---------------------------------------------------------------

const bibKeys = new Set();
for (const bib of bibFiles) {
  if (!fs.existsSync(bib)) continue;
  for (const m of fs.readFileSync(bib, "utf8").matchAll(/^\s*@\w+\s*\{\s*([^,\s]+)\s*,/gm)) bibKeys.add(m[1]);
}
for (const [file, line, text] of lines) {
  for (const m of text.matchAll(/\\(?:no)?cite\w*\*?(?:\[[^\]]*\])*\{([^}]+)\}/g)) {
    for (const key of splitKeys(m[1])) {
      if (key !== "*" && !bibKeys.has(key)) report(file, line, `文献 ${key} が参考文献ファイルにありません（PDF では [?] になります）`);
    }
  }
}

// ---- 引用の前の空白と、引用符 -------------------------------------------

for (const [file, line, text] of lines) {
  if (/[^\s~]\s+\\cite/.test(text)) {
    report(file, line, "\\cite の前が普通の空白です。~ にしないと、番号だけが次の行の頭に送られることがあります");
  }
  // URL やファイル名の中の " は引用符ではないので除く
  if (/"/.test(text.replace(/\\(?:url|href|includegraphics|input|include)(?:\[[^\]]*\])?\{[^}]*\}|\\verb(.).*?\1/g, ""))) {
    report(file, line, `" で囲んでいます。LaTeX では両側とも閉じ引用符（”）になるので、\`\`…'' で書きます`);
  }
}

// ---- 画像 ---------------------------------------------------------------

for (const [file, line, text] of lines) {
  for (const m of text.matchAll(/\\includegraphics\*?(?:\[[^\]]*\])?\{([^}]+)\}/g)) {
    const p = path.join(root, m[1]);
    const found = [p, ...[".pdf", ".png", ".jpg", ".jpeg", ".eps"].map((e) => p + e)].some((c) => fs.existsSync(c));
    if (!found) report(file, line, `画像 ${m[1]} が見つかりません`);
  }
}

// ---- ビルドログ ---------------------------------------------------------
// ログそのものは出力の最初にそのまま出す。ここでは、直す必要がありそうなものだけを拾う。

const notes = [];
let logText = null;
if (!fs.existsSync(logPath)) {
  notes.push(`${logPath} が無いので、ビルドログは調べていません。ビルドしてから実行してください`);
} else {
  logText = fs.readFileSync(logPath, "utf8");
  const logTime = fs.statSync(logPath).mtimeMs;
  if (lines.some(([f]) => fs.statSync(f).mtimeMs > logTime)) {
    notes.push(`${logPath} は最後のビルドのときのものです。ログから拾ったものは、その時点のソースでの位置です`);
  }
  const displayName = (f) => (f.endsWith(".bbl") ? `${f}（参考文献の一覧）` : f);
  const fromSource = [...problems];
  const reportOnce = (file, line, key, message) => {
    // ソースから調べた結果と同じものは重ねて挙げない
    if (fromSource.some((p) => p.file === file && p.line === line && p.message.includes(` ${key} `))) return;
    report(file, line, message);
  };
  const log = logText.split("\n");
  const stack = [];
  for (let i = 0; i < log.length; i++) {
    const l = log[i];
    const file = displayName(stack.at(-1) ?? "?");
    const skipBody = () => { while (i + 1 < log.length && log[i + 1].trim() !== "") i++; };
    let m;
    if ((m = l.match(/^Overfull \\hbox \(([\d.]+)pt too wide\).*at lines? (\d+)/))) {
      skipBody();
      report(file, Number(m[2]), `行が ${m[1]}pt はみ出しています`);
      continue;
    }
    if ((m = l.match(/^Overfull \\vbox \(([\d.]+)pt too high\)(?:.*at lines? (\d+))?/))) {
      skipBody();
      report(file, Number(m[2] ?? 0), `ページか枠から縦に ${m[1]}pt はみ出しています`);
      continue;
    }
    if (l.startsWith("! ")) {
      let lineNo = 0;
      for (let j = i + 1; j < Math.min(i + 20, log.length); j++) {
        const n = log[j].match(/^l\.(\d+)/);
        if (n) { lineNo = Number(n[1]); break; }
      }
      report(file, lineNo, `ビルドエラー：${l.slice(2)}`);
      continue;
    }
    if (/^(?:LaTeX|Package|Class) (?:\S+ )?Warning: |^Underfull \\/.test(l)) {
      const lineNo = Number(l.match(/on input line (\d+)/)?.[1] ?? 0);
      let r;
      if ((r = l.match(/Reference `([^']+)' on page \S+ undefined/))) {
        reportOnce(file, lineNo, r[1], `ラベル ${r[1]} は定義されていません（PDF では ?? になります）`);
      } else if ((r = l.match(/Citation `([^']+)' on page \S+ undefined/))) {
        reportOnce(file, lineNo, r[1], `文献 ${r[1]} が参考文献ファイルにありません（PDF では [?] になります）`);
      } else if ((r = l.match(/Label `([^']+)' multiply defined/))) {
        reportOnce(file, lineNo, r[1], `ラベル ${r[1]} が 2 か所で定義されています`);
      }
      skipBody(); // 警告の続きの行に括弧が入っていても、開いているファイルの追跡を乱さない
      continue;
    }
    // 開いているファイルを、括弧の対応で追う
    for (const t of l.matchAll(/\(([^\s()]+)|\)/g)) {
      if (t[0] === ")") stack.pop();
      else stack.push(t[1].replace(/^\.\//, ""));
    }
  }
}

// ---- 出力 ---------------------------------------------------------------

if (logText !== null) {
  console.log(`== ${logPath} ==`);
  process.stdout.write(logText);
  console.log("");
}

const order = new Map(lines.map(([f], i) => [f, i]).reverse());
problems.sort((a, b) => (order.get(a.file) ?? 1e9) - (order.get(b.file) ?? 1e9) || a.line - b.line);
console.log(`== 直す必要がありそうなもの（${problems.length} 件）==`);
for (const p of problems) console.log(`${p.file}${p.line > 0 ? `:${p.line}` : ""}: ${p.message}`);
if (problems.length === 0) console.log("なし");
for (const n of notes) console.log(`（${n}）`);
process.exitCode = problems.length > 0 ? 1 : 0;
