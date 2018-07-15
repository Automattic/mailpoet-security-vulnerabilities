<?php

namespace MailPoet\Analytics;

use Carbon\Carbon;
use Codeception\Stub;
use Codeception\Stub\Expected;
use MailPoet\Models\Setting;

class AnalyticsTest extends \MailPoetTest {

  protected $backupGlobals = false;

  function testIsEnabledReturnsTrueIfSettingEnabled() {

    Setting::setValue('analytics', array('enabled' => '1'));

    $analytics = new Analytics(new Reporter());
    expect($analytics->isEnabled())->true();
  }

  function testIsEnabledReturnsFalseIfEmptySettings() {

    Setting::setValue('analytics', array());

    $analytics = new Analytics(new Reporter());
    expect($analytics->isEnabled())->false();
  }

  function testIsEnabledReturnsFalseIfNotEnabled() {

    Setting::setValue('analytics', array('enabled' => ''));

    $analytics = new Analytics(new Reporter());
    expect($analytics->isEnabled())->false();
  }

  function testGetDataIfSettingsIsDisabled() {
    $reporter = Stub::makeEmpty(
      'MailPoet\Analytics\Reporter',
      array(
        'getData' => Expected::never(),
      ),
      $this
    );
    Setting::setValue('analytics', array('enabled' => ''));
    $analytics = new Analytics($reporter);

    expect($analytics->generateAnalytics())->null();
  }

  function testGetDataIfSentRecently() {
    $reporter = Stub::makeEmpty(
      'MailPoet\Analytics\Reporter',
      array(
        'getData' => Expected::never(),
      ),
      $this
    );
    Setting::setValue('analytics', array('enabled' => '1'));
    Setting::setValue('analytics_last_sent', Carbon::now()->subHours(1));
    $analytics = new Analytics($reporter);

    expect($analytics->generateAnalytics())->null();
  }

  function testGetDataIfEnabledButNeverSent() {
    $data = array();
    $reporter = Stub::makeEmpty(
      'MailPoet\Analytics\Reporter',
      array(
        'getData' => Expected::once(function() use ($data){
          return $data;
        }),
      ),
      $this
    );
    Setting::setValue('analytics', array('enabled' => '1'));
    Setting::setValue('analytics_last_sent', null);

    $analytics = new Analytics($reporter);

    expect($analytics->generateAnalytics())->equals($data);
  }

  function testGetDataIfEnabledAndSentLongTimeAgo() {
    $data = array();
    $reporter = Stub::makeEmpty(
      'MailPoet\Analytics\Reporter',
      array(
        'getData' => Expected::once(function() use ($data){
          return $data;
        }),
      ),
      $this
    );
    Setting::setValue('analytics', array('enabled' => '1'));
    Setting::setValue('analytics_last_sent', Carbon::now()->subYear());

    $analytics = new Analytics($reporter);

    expect($analytics->generateAnalytics())->equals($data);
  }

  function testSetPublicId() {
    $analytics = new Analytics(new Reporter());
    $fakePublicId = 'alk-ded-egrg-zaz-fvf-rtr-zdef';

    Setting::setValue('new_public_id', 'true');
    $analytics->setPublicId($fakePublicId);
    expect(Setting::getValue('public_id'))->equals($fakePublicId);
    // When we update public_id it's marked as new
    expect(Setting::getValue('new_public_id'))->equals('true');
    expect(Setting::isPublicIdNew())->true();

    $analytics->setPublicId($fakePublicId);
    expect(Setting::getValue('public_id'))->equals($fakePublicId);
    // We tried to update public_id with the same value, so it's not marked as new
    expect(Setting::getValue('new_public_id'))->equals('false');
    expect(Setting::isPublicIdNew())->false();
  }

}
