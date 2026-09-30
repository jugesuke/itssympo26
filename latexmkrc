$latex = 'platex -interaction=nonstopmode';
$bibtex = 'pbibtex';
$dvipdf = 'dvipdfmx %O -o %D %S';
$makeindex = 'mendex -U %O -o %D %S';
$pdf_mode = 3; 
$bibtex_use = 2;
$out_dir = './out';

$ENV{TZ} = 'Asia/Tokyo';

$clean_ext = "dvi run.xml synctex.gz";
# ログを 79 文字で折り返さない（scrips/check-latex.mjs がファイル名を読めるように）
$ENV{max_print_line} = '10000';
