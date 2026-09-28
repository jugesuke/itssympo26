$latex = 'platex -interaction=nonstopmode';
$bibtex = 'pbibtex';
$dvipdf = 'dvipdfmx %O -o %D %S';
$makeindex = 'mendex -U %O -o %D %S';
$pdf_mode = 3; 
$bibtex_use = 2;
$out_dir = './out';

$ENV{TZ} = 'Asia/Tokyo';

$clean_ext = "dvi run.xml synctex.gz";
