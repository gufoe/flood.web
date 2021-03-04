<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$REPLYTO = 'gcmrzz@gmail.com';
$FROM = 'no-reply@gufoe.it';
$FROM_NAME = 'Giacomo';
$SUBJECT = 'Email interessante';
$info = array_map(function($input) { return is_string($input) ? htmlentities($input) : $input; }, $_POST);
$BODY = "
<h1>Gentile {$info['name']} {$info['surname']}</h1>
<p>Benvenuto da noi.</p>

<h3>Dati</h3>
<div>
    Ragione Sociale: {$info['ragsoc']}<br>
    Nome: {$info['name']}<br>
    Cognome: {$info['surname']}<br>
    Email: {$info['email']}<br>
    Telefono: {$info['tel']}<br>
</div>

<h3>Domande</h3>
<div>
<ul>
<li>".implode('</li><li>', array_map(function($d) {
    return htmlentities($d['text']).'<br>'.($d['value'] ? 'Sì' : 'No').'<br><br>';
}, $_POST['domande']))."</li>
</ul>
</div>
";


require 'phpm/Exception.php';
require 'phpm/PHPMailer.php';
require 'phpm/SMTP.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);


$mail = new PHPMailer(true);

try {
    //Server settings
    $mail->SMTPDebug = 0;                                 // Enable verbose debug output
    $mail->isSMTP();                                      // Set mailer to use SMTP
    $mail->Host = 'mail.gufoe.it';  // Specify main and backup SMTP servers
    $mail->SMTPAuth = true;                               // Enable SMTP authentication
    $mail->Username = 'domande@gufoe.it';                 // SMTP username
    $mail->Password = 'ap98sdnpufa8sdpipf';                           // SMTP password
    $mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
    $mail->Port = 587;                                    // TCP port to connect to

    //Recipients
    // print_r($_POST);
    $mail->setFrom($FROM, $FROM_NAME);
    $mail->addAddress($_POST['email'], "{$_POST['name']} {$_POST['surname']}");     // Add a recipient
    $mail->addReplyTo($REPLYTO, $FROM_NAME);
    $mail->addBCC($REPLYTO);

    //Content
    $mail->isHTML(true);                                  // Set email format to HTML

    $mail->Subject = $SUBJECT;
    $mail->Body    = $BODY;

    echo 'Sending... ';
    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
}
