---
name: add-reference
description: 参考文献を references.bib に追加・修正する。書誌情報を集め、文献の中身に合うエントリタイプを選び、tipsj.bst で正しく出力されるフィールドだけで書く。
argument-hint: "[文献の URL、書誌情報の JSON、題名など]"
---

参考文献を [references.bib](../../../references.bib) に追加するか、書き直す。
この論文は `\bibliographystyle{tipsj}`（情報処理学会の形式に合わせたスタイル、引用順）を使い、`pbibtex` で処理する。
このスキルに書いた出力は、TeX Live 2026 の `tipsj.bst` で確かめたもの。
表にある種類とフィールドだけで書けば、毎回 `pbibtex` にかけて確かめ直さなくてよい。

## 1. 書誌情報を集める

`$ARGUMENTS` に URL や書誌データがあれば、そこから取る。

- 情報処理学会電子図書館（`ipsj.ixsq.nii.ac.jp/records/<id>`）の文献は、`/records/<id>/export/json` に書誌情報がある
  - `item_4_creator_5`：著者名
  - `item_4_biblio_info_10`：誌名、巻（`bibliographicVolumeNumber`）、号、ページ、発行日
  - `item_publisher`：出版者
  - `item_resource_type`：資源タイプ
- PDF で配られる仕様書などは、表紙と改版履歴を見て、発行者、版、発行年月を取る

足りない情報を推測で埋めない。見つからないときは書き手に聞く。

## 2. 書き方の手本

references.bib にあって本文で `\cite` されていないエントリ（`pLaTeX2e1` から `TeXWiki` まで）は、テンプレートの記載例。
テンプレートでは、これらを `thebibliography` に直接書いていた。
元の出力は「乙部厳己＋江口庄英: 書名, ソフトバンク (1998).」の形で、`tipsj` はこれに近い形で出す。
投稿先に参考文献の書式の指定はないので、`tipsj` の出力に合わせて、細かな違い（著者の区切りが「,」になる、など）は気にしない。

書き方の慣習は、例エントリを手本にする。

- 書籍には URL を付けない。著者、書名、出版社、年で特定できる文献には URL を付けない
- Web でしか特定できない資料（Web ページ、Web で配布される仕様書）にだけ、`URL: \url{...}` の形で URL を付ける

ただし、エントリタイプは例の見た目から選ばない。
文献の中身から選ぶ（3 節）。

## 3. エントリタイプを選ぶ

| 文献 | タイプ |
|---|---|
| 学術雑誌の論文 | `@article` |
| 会議・シンポジウムの予稿（ITS シンポジウムなど） | `@inproceedings` |
| 研究会の研究報告（情報処理学会の研究報告など） | `@techreport` |
| 官公庁・団体が出す仕様書、ガイドライン | `@manual` |
| 書籍 | `@book` |
| 書籍の章 | `@incollection` |
| 修士論文、博士論文 | `@mastersthesis`、`@phdthesis` |
| Web ページ、上のどれにも当たらないもの | `@misc` |

## 4. タイプごとの出力

次の表は、日本語のエントリで各フィールドがどう並ぶかを示す。
表にないフィールドは出力されない。

| タイプ | 出力の並び |
|---|---|
| `@article` | author：title, journal, Vol.~volume, No.~number, pp. pages (year), note. |
| `@inproceedings` | author：title, editor（編）, booktitle, pp. pages, address (year), organization, publisher, note. |
| `@techreport` | author：title, type number, institution, address (year), note. |
| `@manual` | author：title, organization, address, 第edition版 (year), note. |
| `@manual`（author なし） | organization：title, address, 第edition版 (year), note. |
| `@book` | author：title, series, 第volume巻, publisher, address, 第edition版 (year), note. |
| `@incollection` | author：title, editor（編）, booktitle, 第chapter章, pp. pages, publisher, address (year). |
| `@misc` | author：title, howpublished (year), note. |
| `@mastersthesis` / `@phdthesis` | author：title, type, school, address (year). |

出力の例：

```
寸田和輝, 伊藤昌毅, 奥野拓：GTFSを用いた設置者自身でカスタマイズ可能なバスサイネージシステムの構築, 高度交通システムとスマートコミュニティ（ITS） Vol.2026-ITS-104, No.3, 情報処理学会 (2026).
国土交通省総合政策局：公共交通運行情報標準データ仕様（GTFS-JP）, 第4.0版 (2026), URL \url{https://...}.
```

### 出力されないフィールド

- `url`、`doi`：どのタイプでも出力されない。URL は `howpublished`（`@misc`）か `note` に書く
- `month`：どのタイプでも出力されない。書かなくてよい
- `pages`：`@techreport`、`@manual`、`@misc` では出力されない。ページを載せたいときは、`number` などに `pp.1--8` と書き込む
- `issue`：`tipsj` のフィールドではない。号は `number` に書く

### 落とし穴

- **`@techreport` の `type`**：省略すると `Technical Report` と英語で出る。日本語の研究報告では必ず書く。研究会名を `type` に、巻と号を `number` にまとめて書く（例：`number = {Vol.2026-ITS-104, No.3}`）
- **`@mastersthesis` / `@phdthesis` の `type`**：省略すると `Master's thesis`、`PhD thesis` と英語で出る。`type = {修士論文}`、`type = {博士論文}` と書く
- **`@inproceedings` の `organization` と `publisher`**：年の後ろに出る。日本語の予稿では書かない
- **`@misc` の `year`**：省略すると警告が出て、`note` の前が「：」になる。必ず書く。参照日は `note = {（参照 2026-09-29）}` と書く
- **`edition`**：`4.0` や `2` のように数字だけを書くと `第4.0版` と出る
- **日本語の組織が著者のとき**：`author = {{国土交通省}}` のように二重の波括弧で囲む。`@manual` では `author` を書かずに `organization` を使う
- **英語の組織が著者のとき**：`{Japanese TeX Development Community Board},~:` のように、名前の後ろに `,~` が付く。`tipsj` は英語の著者名を「姓,~イニシャル」の形で組むので、書き方を変えても消えない。避けられないときは書き手に伝える
- **英語の著者名**：`John Smith` は `Smith,~J.` と出る。複数の著者は `and` でつなぐ
- **日本語の著者名**：`寸田 和輝` のように姓と名をスペースで区切って書く。出力ではスペースが消え、著者は「,」でつながる
- **英語の書名**：`@book` の英語の `title` と、`@article` の英語の `journal` は斜体になる
- **題名の大文字**：`title` の英字の大文字は、書いたとおりに出る。`{GTFS}` のように波括弧で囲まなくてよい（囲んでもよい）

## 5. 書き込む

- 既存エントリを直すときは、本文で使われている引用キーを変えない。`grep -rn '\\cite' documents/` で確かめる
- 表と落とし穴にない書き方をしたときだけ、次の手順で出力を確かめる

```sh
mkdir -p out/bibtest && cp references.bib out/bibtest/
printf '\\citation{<キー>}\n\\bibstyle{tipsj}\n\\bibdata{references}\n' > out/bibtest/t.aux
docker compose run --rm -T texlive sh -c 'cd out/bibtest && pbibtex t >/dev/null; cat t.bbl; grep -i warn t.blg'
rm -rf out/bibtest
```

書き手には、追加したエントリと、出力される形（`.bbl` の中身か、4 節の表から組み立てたもの）を見せる。
