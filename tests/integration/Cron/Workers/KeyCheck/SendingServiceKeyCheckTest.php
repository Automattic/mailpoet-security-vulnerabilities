<?php
namespace MailPoet\Test\Cron\Workers\KeyCheck;

use Codeception\Stub;
use Codeception\Stub\Expected;
use MailPoet\Cron\Workers\KeyCheck\SendingServiceKeyCheck;
use MailPoet\Mailer\Mailer;
use MailPoet\Models\Setting;
use MailPoet\Services\Bridge;

class SendingServiceKeyCheckTest extends \MailPoetTest {
  function _before() {
    parent::_before();
    $this->mss_key = 'some_key';
    $this->worker = new SendingServiceKeyCheck(microtime(true));
  }

  function testItRequiresMailPoetMethodToBeSetUp() {
    expect($this->worker->checkProcessingRequirements())->false();
    $this->setMailPoetSendingMethod();
    expect($this->worker->checkProcessingRequirements())->true();
  }

  function testItChecksMSSKey() {
    $response = array('code' => Bridge::KEY_VALID);
    $this->worker->bridge = Stub::make(
      new Bridge,
      array(
        'checkMSSKey' => $response,
        'storeMSSKeyAndState' => null,
        'updateSubscriberCount' => Expected::once()
      ),
      $this
    );
    $this->worker->bridge->expects($this->once())
      ->method('checkMSSKey')
      ->with($this->equalTo($this->mss_key));
    $this->worker->bridge->expects($this->once())
      ->method('storeMSSKeyAndState')
      ->with(
        $this->equalTo($this->mss_key),
        $this->equalTo($response)
      );
    $this->setMailPoetSendingMethod();
    expect($this->worker->checkKey())->equals($response);
  }

  private function setMailPoetSendingMethod() {
    Setting::setValue(
      Mailer::MAILER_CONFIG_SETTING_NAME,
      array(
        'method' => 'MailPoet',
        'mailpoet_api_key' => $this->mss_key,
      )
    );
  }

  function _after() {
    \ORM::raw_execute('TRUNCATE ' . Setting::$_table);
  }
}