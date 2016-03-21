<?php
namespace MailPoet\Config;
use MailPoet\Cron\Workers\Scheduler;
use MailPoet\Cron\Workers\SendingQueue;
use \MailPoet\Models\Setting;

class Hooks {
  function __construct() {
  }

  function init() {
    $this->setupSubscribe();
    $this->setupWPUsers();
    $this->setupImageSize();
    $this->setupListing();
    $this->setupCronWorkers();
  }

  function setupSubscribe() {
    $subscribe = Setting::getValue('subscribe', array());
    // Subscribe in comments
    if(
      isset($subscribe['on_comment']['enabled'])
      &&
      (bool)$subscribe['on_comment']['enabled']
    ) {
      if(is_user_logged_in()) {
        add_action(
          'comment_form_field_comment',
          '\MailPoet\Subscription\Comment::extendLoggedInForm'
        );
      } else {
        add_action(
          'comment_form_after_fields',
          '\MailPoet\Subscription\Comment::extendLoggedOutForm'
        );
      }

      add_action(
        'comment_post',
        '\MailPoet\Subscription\Comment::onSubmit',
        60,
        2
      );

      add_action(
        'wp_set_comment_status',
        '\MailPoet\Subscription\Comment::onStatusUpdate',
        60,
        2
      );
    }

    // Subscribe in registration form
    if(
      isset($subscribe['on_register']['enabled'])
      &&
      (bool)$subscribe['on_register']['enabled']
    ) {
      if(is_multisite()) {
        add_action(
          'signup_extra_fields',
          '\MailPoet\Subscription\Registration::extendForm'
        );
        add_action(
          'wpmu_validate_user_signup',
          '\MailPoet\Subscription\Registration::onMultiSiteRegister',
          60,
          1
        );
      } else {
        add_action(
          'register_form',
          '\MailPoet\Subscription\Registration::extendForm'
        );
        add_action(
          'register_post',
          '\MailPoet\Subscription\Registration::onRegister',
          60,
          3
        );
      }
    }
  }

  function setupWPUsers() {
    // WP Users synchronization
    add_action(
      'user_register',
      '\MailPoet\Segments\WP::synchronizeUser',
      1
    );
    add_action(
      'added_existing_user',
      '\MailPoet\Segments\WP::synchronizeUser',
      1
    );
    add_action(
      'profile_update',
      '\MailPoet\Segments\WP::synchronizeUser',
      1
    );
    add_action(
      'delete_user',
      '\MailPoet\Segments\WP::synchronizeUser',
      1
    );
    // multisite
    add_action(
      'deleted_user',
      '\MailPoet\Segments\WP::synchronizeUser',
      1
    );
    add_action(
      'remove_user_from_blog',
      '\MailPoet\Segments\WP::synchronizeUser',
      1
    );
  }

  function setupImageSize() {
    add_filter(
      'image_size_names_choose',
      array($this, 'appendImageSize'),
      10, 1
    );
  }

  function appendImageSize($sizes) {
    return array_merge($sizes, array(
      'mailpoet_newsletter_max' => __('MailPoet Newsletter')
    ));
  }

  function setupListing() {
    add_filter(
      'set-screen-option',
      array($this, 'setScreenOption'),
      10, 3
    );
  }

  function setScreenOption($status, $option, $value) {
    if(preg_match('/^mailpoet_(.*)_per_page$/', $option)) {
      return $value;
    } else {
      return $status;
    }
  }

  function setupCronWorkers() {
    add_action('mailpoet_scheduler_worker', array($this, 'runSchedulerWorker'), 10, 1);
    add_action('mailpoet_queue_worker', array($this, 'runSendingQueueWorker'), 10, 1);
  }

  function runSchedulerWorker($timer) {
    $scheduler = new Scheduler($timer);
    $scheduler->process();

  }
  function runSendingQueueWorker($timer) {
    $sending_queue = new SendingQueue($timer);
    $sending_queue->process();
  }
}
