<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
if (isset($argv) && count($argv) > 1) {
  parse_str(implode('&', array_slice($argv, 1)), $_GET);
}
ob_start();
require __DIR__ . '/fpdf184/fpdf.php';
require __DIR__ . '/../../db/db.php';
$image1 = __DIR__ . '/../../img/peso.png';

date_default_timezone_set('Asia/Manila');
$year_beg = date('Y');
$date_today = date('m/d/Y');

$ada_no = isset($_GET['a']) ? $_GET['a'] : '';

$pdf = new FPDF('P', 'mm', 'Letter');
$pdf->AddPage();

$default = $conn->query("SELECT * FROM default_value LIMIT 1");
$default_row = $default ? $default->fetch_array() : [];

$ada_list = $conn->query("SELECT * FROM ada_list WHERE ada_no = '$ada_no'");
$ada_list_row = $ada_list ? $ada_list->fetch_array() : [];
$date = date_create(isset($ada_list_row['ada_date']) ? $ada_list_row['ada_date'] : date('Y-m-d'));
$acc_no = isset($ada_list_row['account_no']) ? $ada_list_row['account_no'] : '';

$total1 = "0";
$office1 = $conn->query("SELECT * FROM office WHERE ada_no = '$ada_no'");
if ($office1) {
  while ($office1_row = $office1->fetch_array()) {
    $total1 += $office1_row["amount"];
  }
}

$office2 = $conn->query("SELECT * FROM office WHERE ada_no = '$ada_no'");

$logo = __DIR__ . '/../../img/cityhall_logo.png';
$pdf->Image($logo, 10, 5, 25);

$pdf->SetFont('Times', 'I', 10);
$pdf->Cell(195, 5, "Appendix 36", 0, 1, 'R');

$pdf->SetFont('Times', '', 12);
$pdf->Cell(195, 5, "CITY GOVERNMENT OF COTABATO", 0, 1, 'C');
$pdf->Cell(195, 3, "", 0, 1);

$pdf->SetFont('Times', 'B', 12);
$pdf->Cell(195, 5, "AUTHORITY TO DEBIT ACCOUNT (ADA)", 0, 1, 'C');
$pdf->Cell(195, 5, "", 0, 1);

$pdf->SetFont('Times', 'UB', 12);
$pdf->Cell(97.5, 5, $default_row['addressee'], 0, 0, 'L');

$pdf->SetFont('Times', '', 12);
$pdf->Cell(67.5, 5, "ADA No. ", 0, 0, 'R');

$pdf->SetFont('Times', 'B', 12);
$pdf->Cell(30, 5, $ada_list_row['ada_no'], 'B', 1, 'L');

$pdf->SetFont('Times', 'U', 12);
$pdf->Cell(97.5, 5, $default_row['bank'], 0, 0, 'L');

$pdf->SetFont('Times', '', 12);
$pdf->Cell(67.5, 5, "Date: ", 0, 0, 'R');

$pdf->SetFont('Times', 'B', 12);
$pdf->Cell(30, 5, date_format($date, "m/j/Y"), 'B', 1, 'L');

$pdf->SetFont('Times', '', 11);
$pdf->Cell(195, 5, "", 0, 1);
$pdf->Cell(195, 5, "Sir/Madam:", 0, 1);
$pdf->Cell(195, 3, "", 0, 1);
$pdf->Cell(110, 5, "Please debit the agency Account No.", 0, 0, 'R');
$pdf->SetFont('Times', 'B', 12);
$pdf->Cell(60, 5, $acc_no, 'B', 0, 'C');
$pdf->SetFont('Times', '', 11);
$pdf->Cell(25, 5, "the amount of", 0, 1, 'R');

function number_to_word($num = '')
{
  $num = (string) ((int) $num);

  if ((int) ($num) && ctype_digit($num)) {
    $words = array();

    $num = str_replace(array(',', ' '), '', trim($num));

    // $list1 = array('','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN',
    //     'EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN',
    //     'FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN');

    // $list2 = array('','TEN','TWENTY','THIRTY','FORTY','FIFTY','SIXTY',
    //     'SEVENTY','EIGHTY','NINETY','HUNDRED');

    // $list3 = array('','THOUSAND','MILLION','BILLION','TRILLION',
    //     'QUADRILLION','QUINTILLION','SEXTILLION','SEPTILLION',
    //     'OCTILLION','NONILLION','decillion','undecillion',
    //     'duodecillion','tredecillion','quattuordecillion',
    //     'quindecillion','sexdecillion','septendecillion',
    //     'octodecillion','novemdecillion','vigintillion');

    $list1 = array(
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    );

    $list2 = array(
      '',
      'Ten',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
      'Hundred'
    );

    $list3 = array(
      '',
      'Thousand',
      'Million',
      'Billion',
      'Trillion',
      'Quadrillion',
      'Quintillion',
      'Sextillion',
      'Septillion',
      'Octillion',
      'Nonillion',
      'Decillion',
      'Undecillion',
      'Duodecillion',
      'Tredecillion',
      'Quattuordecillion',
      'Quindecillion',
      'Sexdecillion',
      'Septendecillion',
      'Octodecillion',
      'Novemdecillion',
      'Vigintillion'
    );

    $num_length = strlen($num);
    $levels = (int) (($num_length + 2) / 3);
    $max_length = $levels * 3;
    $num = substr('00' . $num, -$max_length);
    $num_levels = str_split($num, 3);

    foreach ($num_levels as $num_part) {
      $levels--;
      $hundreds = (int) ($num_part / 100);
      // $hundreds = ( $hundreds ? ' ' . $list1[$hundreds] . ' Hundred' . ( $hundreds == 1 ? '' : 's' ) . ' ' : '' );
      $hundreds = ($hundreds ? ' ' . $list1[$hundreds] . ' Hundred' . ($hundreds == 1 ? '' : '') . ' ' : '');
      $tens = (int) ($num_part % 100);
      $singles = '';

      if ($tens < 20) {
        $tens = ($tens ? ' ' . $list1[$tens] . ' ' : '');
      } else {
        $tens = (int) ($tens / 10);
        $tens = ' ' . $list2[$tens] . ' ';
        $singles = (int) ($num_part % 10);
        $singles = ' ' . $list1[$singles] . ' ';
      }
      $words[] = $hundreds . $tens . $singles . (($levels && (int) ($num_part)) ? ' ' . $list3[$levels] . ' ' : '');
    }
    $commas = count($words);
    if ($commas > 1) {
      $commas = $commas - 1;
    }

    $words = implode(', ', $words);

    $words = trim(str_replace(' ,', ',', ucwords($words)), ', ');
    if ($commas) {
      // $words = str_replace( ',' , ' and' , $words );
      $words = str_replace(',', ' ', $words);
    }

    return $words;
  } else if (!((int) $num)) {
    return 'ZERO';
  }
  return '';
}

$totalz = number_format($total1, 2);
$pattern = '/,/i';
$num = preg_replace($pattern, '', $totalz);
$num_arr = explode(".", $num);
$wholenum = $num_arr[0];
$decnum = $num_arr[1];
// $wholenum = 100000000; 
// $decnum = 12; 

//$num = $total1;
//$num = 12312312.67;
// function numberTowords($num){
//   $ones = array(
//     0 =>"Zero",
//     1 => "One",
//     2 => "Two",
//     3 => "Three",
//     4 => "Four",
//     5 => "Five",
//     6 => "Six",
//     7 => "Seven",
//     8 => "Eight",
//     9 => "Nine",
//     10 => "Ten",
//     11 => "Eleven",
//     12 => "Twelve",
//     13 => "Thirteen",
//     14 => "Fourteen",
//     15 => "Fifteen",
//     16 => "Sixteen",
//     17 => "Seventeen",
//     18 => "Eighteen",
//     19 => "Nineteen",
//     "014" => "Fourteen"
//   );
//   $tens = array( 
//     0 => "Zero",
//     1 => "Ten",
//     2 => "Twenty",
//     3 => "Thirty", 
//     4 => "Forty", 
//     5 => "Fifty", 
//     6 => "Sixty", 
//     7 => "Seventy", 
//     8 => "Eighty", 
//     9 => "Ninety" 
//   ); 
//   $hundreds = array( 
//     "Hundred", 
//     "Thousand", 
//     "Million", 
//     "Billion", 
//     "Trillion", 
//     "Quardrillion" 
//   ); /*limit t quadrillion */
//   $num = number_format($num,2,".",","); 
//   $num_arr = explode(".",$num); 
//   $wholenum = $num_arr[0]; 
//   $decnum = $num_arr[1]; 
//   $whole_arr = array_reverse(explode(",",$wholenum)); 
//   krsort($whole_arr,1); 
//   $rettxt = ""; 
//   foreach($whole_arr as $key => $i){
//     while(substr($i,0,1)=="0")
//       $i=substr($i,1,5);
//     if($i < 20){ 
//       /* echo "getting:".$i; */
//       $rettxt .= $ones[$i]; 
//     }elseif($i < 100){ 
//       if(substr($i,0,1)!="0")$rettxt .= $tens[substr($i,0,1)]; 
//       if(substr($i,1,1)!="0")$rettxt .= " ".$ones[substr($i,1,1)]; 
//     }else{ 
//       if(substr($i,0,1)!="0")$rettxt .= $ones[substr($i,0,1)]." ".$hundreds[0]; 
//       if(substr($i,1,1)!="0")$rettxt .= " ".$tens[substr($i,1,1)]; 
//       if(substr($i,2,1)!="0")$rettxt .= " ".$ones[substr($i,2,1)]; 
//     } 
//     if($key > 0){ 
//       $rettxt .= " ".$hundreds[$key]." "; 
//     }
//   } 
//   if($decnum > 0){
//     // $asd=explode(".", $num);
//     // $val=$asd[1];
//     $rettxt .= " Pesos & ".$decnum."/100 Centavos Only";
//     // if($decnum < 20){
//     //   $rettxt .= $ones[$decnum];
//     // }elseif($decnum < 100){
//     //   $rettxt .= $tens[substr($decnum,0,1)];
//     //   $rettxt .= " ".$ones[substr($decnum,1,1)];
//     // }
//   } else {
//     $rettxt .= " Pesos Only";
//   }
//   return $rettxt;
// }

$pdf->SetFont('Times', 'BU', 11);
// $pdf->Cell(195,7,numberTowords($num),0,1,'C');

if ($decnum > 0) {
  $pdf->MultiCell(195, 7, number_to_word($wholenum) . ' Pesos & ' . $decnum . '/100 Only', 0, 'C');
} else {
  $pdf->MultiCell(195, 7, number_to_word($wholenum) . ' Pesos Only', 0, 'C');
}

$pdf->SetFont('Times', '', 9);
$pdf->Cell(195, 3, "(In Words)", 0, 1, 'C');
$pdf->Cell(50, 5.3, '', 'B', 0);
$pdf->Cell(50, 1, '', 0, 1);

$pdf->SetFont('Times', '', 13);
$pdf->Cell(50, 5, $pdf->Image($image1, $pdf->GetX(), $pdf->GetY(), 5) . number_format($total1, 2), 'B', 1, 'C');
$pdf->SetFont('Times', '', 9);
$pdf->Cell(50, 3, "(In Figures)", 0, 1, 'C');

$pdf->SetFont('Times', '', 11);
$pdf->Cell(195, 5, "", 0, 1);
$pdf->Cell(195, 5, "Please credit the accounts of the listed creditors to cover payment of payables.", 0, 1, 'L');
$pdf->Cell(195, 3, "", 0, 1);

//FOR ADJUSTMENT///////////
$pdf->SetFont('Times', 'B', 12.5);
$pdf->Cell(65, 5, "Office/Department/Payee", 1, 0, 'C');
$pdf->Cell(32, 5, "Reference", 1, 0, 'C');
$pdf->Cell(61, 5, "Nature of Payment", 1, 0, 'C');
$pdf->Cell(37, 5, "Amount", 1, 1, 'C');
$pdf->SetFont('Times', '', 12.5);
//FOR ADJUSTMENT///////////
$total2 = 0;
while ($office2_row = $office2->fetch_array()) {
  $total2 += $office2_row['amount'];
  $pdf->SetFont('Times', '', 12);
  $pdf->Cell(65, 5, $office2_row['office'], 1, 0, 'C');
  $pdf->SetFont('Times', '', 12.5);
  $pdf->Cell(32, 5, $office2_row['reference'], 1, 0, 'C');
  if (strlen($office2_row['nop']) > 24) {
    $pdf->SetFont('Times', '', 11);
    $pdf->Cell(61, 5, $office2_row['nop'], 1, 0, 'C');
  } else {
    $pdf->SetFont('Times', '', 12.5);
    $pdf->Cell(61, 5, $office2_row['nop'], 1, 0, 'C');
  }
  $pdf->Cell(37, 5, $pdf->Image($image1, $pdf->GetX(), $pdf->GetY(), 5) . number_format($office2_row['amount'], 2), 1, 1, 'R');
}
//FOR ADJUSTMENT///////////
$pdf->Cell(65, 5, "", 1, 0, 'C');
$pdf->Cell(32, 5, "", 1, 0, 'C');
$pdf->Cell(61, 5, "", 1, 0, 'C');
$pdf->Cell(37, 5, "", 1, 1, 'R');

///////////////////////
$pdf->Cell(158, 5, "Total Amount", 1, 0, 'R');
$pdf->Cell(37, 4.3, '', 1, 0); // --- AMOUNT ---
$pdf->Cell(37, 0, '', 0, 1); // --- AMOUNT ---
$pdf->Cell(158, 5, '', 0, 0, 'R');
$pdf->Cell(37, 5, $pdf->Image($image1, $pdf->GetX(), $pdf->GetY(), 5) . number_format($total2, 2), 1, 1, 'R'); // --- AMOUNT ---

$pdf->SetFont('Times', 'B', 11);
$pdf->Cell(195, 5, "Agency Authorized Signatories", 0, 1, 'C');
$pdf->Cell(195, 6, "", 0, 1);
$pdf->SetFont('Times', 'B', 11);
$pdf->Cell(70, 5, $default_row['left_name'], 'B', 0, 'C');
$pdf->Cell(55, 5, "", 0, 0, 'C');
$pdf->Cell(70, 5, $default_row['right_name'], 'B', 1, 'C');

$pdf->SetFont('Times', '', 11);
$pdf->Cell(70, 5, $default_row['left_title'], 0, 0, 'C');
$pdf->Cell(55, 5, "", 0, 0, 'C');
$pdf->Cell(70, 5, $default_row['right_title'], 0, 1, 'C');

ob_end_clean();
$pdf->Output('I');
