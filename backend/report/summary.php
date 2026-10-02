<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
if (isset($argv) && count($argv) > 1) {
  parse_str(implode('&', array_slice($argv, 1)), $_GET);
}
ob_start();
if (session_status() === PHP_SESSION_NONE) {
  @session_start();
}
require __DIR__ . '/fpdf184/fpdf.php';
require __DIR__ . '/../../db/db.php';
$image1 = __DIR__ . '/../../img/peso.png';

date_default_timezone_set('Asia/Manila');
$date_today = date('m/d/Y');
$_SESSION['date_today'] = $date_today;

$report_no_param = isset($_GET['report_no']) ? $_GET['report_no'] : '';
$radai = $conn->query("SELECT * FROM radai_list WHERE report_no = '$report_no_param'");
$radai_row = $radai ? $radai->fetch_array() : [];
$_SESSION['report_no'] = isset($radai_row['report_no']) ? $radai_row['report_no'] : '';
$_SESSION['date_range'] = isset($radai_row['date_range']) ? $radai_row['date_range'] : '';
$_SESSION['one_date'] = isset($radai_row['one_date']) ? $radai_row['one_date'] : '';
$_SESSION['two_date'] = isset($radai_row['two_date']) ? $radai_row['two_date'] : '';
$_SESSION['fund'] = isset($radai_row['fund']) ? $radai_row['fund'] : '';
$_SESSION['account_no'] = isset($radai_row['account_no']) ? $radai_row['account_no'] : '';

$fund = isset($_GET['fund']) && $_GET['fund'] !== '' ? $_GET['fund'] : (isset($radai_row['fund']) ? $radai_row['fund'] : '');
$acctno = isset($_GET['acct']) && $_GET['acct'] !== '' ? $_GET['acct'] : (isset($radai_row['account_no']) ? $radai_row['account_no'] : '');

$date_range = isset($radai_row['date_range']) ? $radai_row['date_range'] : 'daily';
$one_date = isset($radai_row['one_date']) ? $radai_row['one_date'] : '';
$two_date = isset($radai_row['two_date']) ? $radai_row['two_date'] : '';
$year_beg = isset($radai_row['year_beg']) ? $radai_row['year_beg'] : date('Y');

$default = $conn->query("SELECT * FROM default_value LIMIT 1");
$default_row = $default ? $default->fetch_array() : [];
$_SESSION['radai_name'] = isset($default_row['radai_name']) ? $default_row['radai_name'] : '';
$_SESSION['radai_position'] = isset($default_row['radai_position']) ? $default_row['radai_position'] : '';

class PDF extends FPDF
{

  // Page header
  function Header()
  {

    $select_value = $_SESSION['date_range'];
    if ($select_value == 'daily') {
      $todays_date = $_SESSION['one_date'];
      $todaysDate = date_create($todays_date);
    } else if ($select_value == 'as_of') {
      $fix_date = $_SESSION['one_date'];
      $todays_date = $_SESSION['two_date'];
      $fixDate = date_create($fix_date);
      $todaysDate = date_create($todays_date);
    } else if ($select_value == 'periodic') {
      $beg_date = $_SESSION['one_date'];
      $end_date = $_SESSION['two_date'];
      $begDate = date_create($beg_date);
      $endDate = date_create($end_date);
    }

    // Logo
    // $this->Image('logo.png',10,6,30);
    // Times bold 15
    // $this->SetFont('Times','B',15);
    // Move to the right
    // $this->Cell(80);
    // Title
    // $this->Cell(30,10,'Title',1,0,'C');
    // Line break
    // $this->Ln(20);

    $logo = __DIR__ . '/../../img/cityhall_logo.png';
    $this->Image($logo, 10, 5, 25);

    $this->SetFont('Times', 'I', 10);
    $this->Cell(195, 5, "Appendix 37", 0, 1, 'R');

    $this->SetFont('Times', 'B', 12);
    $this->Cell(195, 7, "REPORT OF AUTHORITY TO DEBIT ACCOUNT ISSUED", 0, 1, 'C');
    if ($select_value == 'daily') {
      $this->Cell(195, 5, 'Period Covered: ' . date_format($todaysDate, "F d, Y"), 0, 1, 'C');
    } else if ($select_value == 'as_of') {
      $this->Cell(195, 5, 'Period Covered: From ' . date_format($fixDate, "F d, Y") . ' To ' . date_format($todaysDate, "F d, Y"), 0, 1, 'C');
    } else if ($select_value == 'periodic') {
      $this->Cell(195, 5, 'Period Covered: From ' . date_format($begDate, "F d, Y") . ' To ' . date_format($endDate, "F d, Y"), 0, 1, 'C');
    }

    $this->SetFont('Times', '', 11);
    $this->Cell(195, 5, '', 0, 1);
    $this->Cell(10, 5, "LGU:", 0, 0, 'L');
    $this->Cell(63, 5, "City Government of Cotabato", 'B', 1, 'L');

    $fund = $_GET['fund'];
    $acctno = $_GET['acct'];

    $this->Cell(11, 5, "Fund:", 0, 0, 'L');
    $this->Cell(62, 5, $fund, 'B', 0, 'L');
    $this->Cell(66, 5, '', 0, 0, 'L');
    $this->Cell(19, 5, "Report No.:", 0, 0, 'L');
    $this->Cell(37, 5, $_SESSION['report_no'], 'B', 1, 'L');

    $this->Cell(42, 5, "Bank Name/Account No.:", 0, 0, 'L');
    $this->Cell(35, 5, $acctno, 'B', 0, 'L');
    $this->Cell(62, 5, '', 0, 0, 'L');
    $this->Cell(18, 5, "Sheet No.:", 0, 0, 'L');
    $this->Cell(38, 5, $this->PageNo() . "-" . '{nb}', 'B', 1, 'L');

    $this->SetFont('Times', '', 10);
    $this->Cell(195, 3, "", 0, 1);
    $this->Cell(38, 5, "ADA", 1, 0, 'C');
    $this->Cell(22, 5, "DV/Payroll", 'TL', 0, 'C');
    $this->Cell(17, 5, "CAFOA", 'TL', 0, 'C');
    $this->Cell(50, 10, "Payee", 1, 0, 'C');
    $this->Cell(41, 10, "Nature of Payment", 1, 0, 'C');
    $this->Cell(27, 10, "Amount", 1, 0, 'C');

    $this->Cell(31, 5, '', 0, 1);
    $this->Cell(17, 5, "Date", 1, 0, 'C');
    $this->Cell(21, 5, "Serial No.", 1, 0, 'C');
    $this->Cell(22, 5, "No.", 0, 0, 'C');
    $this->Cell(19, 5, "No.", 'L', 0, 'C');
    $this->Cell(55, 5, "", 0, 0, 'C');
    $this->Cell(30, 5, "", 0, 0, 'C');
    $this->Cell(31, 5, "", 0, 1, 'C');
  }
}

if ($date_range == 'daily') {
  $ada_list = $conn->query("SELECT * FROM ada_list WHERE ada_date = '$one_date' AND account_no = '$acctno'");
} else {
  $ada_list = $conn->query("SELECT * FROM ada_list WHERE ada_date >= '$one_date' AND ada_date <= '$two_date' AND account_no = '$acctno'");
}

$pdf = new pdf('P', 'mm', 'Letter');
$pdf->AliasNbPages();
$pdf->AddPage();

$count = 0;
while ($ada_list_row = $ada_list->fetch_array()) {
  $office = $conn->query("SELECT * FROM office WHERE ada_no = '$ada_list_row[ada_no]'");
  while ($office_row = $office->fetch_array()) {
    $arr[] = $ada_list_row['ada_no'];
    $pdf->SetFont('Times', '', 9);
    $pdf->Cell(17, 5, $ada_list_row['ada_date'], 1, 0, 'C');
    $pdf->SetFont('Times', '', 8);
    $pdf->Cell(21, 5, $ada_list_row['ada_no'], 1, 0, 'C');
    $pdf->SetFont('Times', '', 9);
    $pdf->Cell(22, 5, $office_row['reference'], 1, 0, 'C');
    $pdf->Cell(17, 5, $office_row['cafoa'], 1, 0, 'C');
    $pdf->SetFont('Times', '', 8);
    $pdf->Cell(50, 5, $office_row['office'], 1, 0, 'C');
    if (strlen($office_row['nop']) >= 22) {
      $pdf->SetFont('Times', '', 8);
      $pdf->Cell(41, 5, $office_row['nop'], 1, 0, 'C');
    } else {
      $pdf->SetFont('Times', '', 9);
      $pdf->Cell(41, 5, $office_row['nop'], 1, 0, 'C');
    }
    //$pdf->Cell(10,5,,1,0,'R');
    $pdf->SetFont('Times', '', 10);
    $pdf->Cell(27, 5, $pdf->Image($image1, $pdf->GetX(), $pdf->GetY(), 5) . " " . number_format($office_row['amount'], 2), 1, 1, 'R');
    $pdf->SetFont('Times', '', 9);
    $count++;
    //29
    if ($count == 38) {
      $pdf->AddPage();
      $count = 0;
    }
  }
}

$_SESSION['start'] = min($arr);
$_SESSION['end'] = max($arr);

$pdf->Cell(17, 5, "", 1, 0);
$pdf->Cell(21, 5, "", 1, 0);
$pdf->Cell(22, 5, "", 1, 0);
$pdf->Cell(17, 5, "", 1, 0);
$pdf->Cell(50, 5, "", 1, 0);
$pdf->Cell(41, 5, "", 1, 0);
$pdf->Cell(27, 5, "", 1, 1);

$pdf->SetFont('Times', 'B', 12);
$pdf->Cell(195, 10, 'CERTIFICATION', 0, 1, 'C');

$pdf->SetFont('Times', '', 10);
$pdf->Cell(195, 4, 'I hereby certify on my official oath that the above is a true statement of all ADAs issued this me during', 0, 1, 'C');
$pdf->Cell(56, 4, 'period stated above for which ADA Nos.', 0, 0, 'R');
$pdf->Cell(25, 4, $_SESSION['start'], 'B', 0, 'C');
$pdf->Cell(4, 4, 'to', 0, 0, 'L');
$pdf->Cell(25, 4, $_SESSION['end'], 'B', 0, 'C');
$pdf->Cell(80, 4, 'inclusive, were actually this by me in the amounts shown there.', 0, 1, 'L');

$pdf->SetFont('Times', '', 11);
$pdf->Cell(195, 5, "", 0, 1,);
$pdf->Cell(60, 5, "", 0, 0, 'C');
$pdf->Cell(75, 5, $_SESSION['radai_name'], 'B', 0, 'C');
$pdf->Cell(60, 5, "", 0, 1, 'C');
$pdf->Cell(195, 5, "Name and Signature of Local Treasurer", 0, 1, 'C');
$pdf->Cell(195, 3, "", 0, 1,);
$pdf->Cell(80, 5, "", 0, 0, 'C');
$pdf->Cell(35, 5, $_SESSION['date_today'], 'B', 0, 'C');
$pdf->Cell(80, 5, "", 0, 1, 'C');
$pdf->Cell(195, 5, "Date", 0, 0, 'C');

ob_end_clean();
$pdf->Output('I');
