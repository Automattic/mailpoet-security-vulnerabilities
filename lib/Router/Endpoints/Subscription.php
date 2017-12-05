<?php

namespace MailPoet\Router\Endpoints;

use MailPoet\Config\AccessControl;
use MailPoet\Subscription as UserSubscription;

if(!defined('ABSPATH')) exit;

class Subscription {
  const ENDPOINT = 'subscription';
  const ACTION_CONFIRM = 'confirm';
  const ACTION_MANAGE = 'manage';
  const ACTION_UNSUBSCRIBE = 'unsubscribe';
  public $allowed_actions = array(
    self::ACTION_CONFIRM,
    self::ACTION_MANAGE,
    self::ACTION_UNSUBSCRIBE
  );
  public $data;
  public $permissions = array(
    'global' => AccessControl::NO_ACCESS_RESTRICTION
  );

  function __construct($data) {
    $this->data = $data;
  }

  function confirm() {
    $subscription = new UserSubscription\Pages('confirm', $this->data, true);
    $subscription->confirm();
  }

  function manage() {
    $subscription = new UserSubscription\Pages('manage', $this->data, true);
  }

  function unsubscribe() {
    $subscription = new UserSubscription\Pages('unsubscribe', $this->data, true);
    $subscription->unsubscribe();
  }
}