<?php
use MailPoet\Cron\Workers\SendingQueue\Tasks\Newsletter as NewsletterTask;
use MailPoet\Models\Newsletter;
use MailPoet\Models\NewsletterLink;
use MailPoet\Models\NewsletterPost;
use MailPoet\Models\SendingQueue;
use MailPoet\Models\Subscriber;
use MailPoet\Router\Router;

if(!defined('ABSPATH')) exit;

class NewsletterTaskTest extends MailPoetTest {
  function _before() {
    $this->newsletter_task = new NewsletterTask();
    $this->subscriber = Subscriber::create();
    $this->subscriber->email = 'test@example.com';
    $this->subscriber->first_name = 'John';
    $this->subscriber->last_name = 'Doe';
    $this->subscriber->save();
    $this->post_id = 10;
    $this->newsletter = Newsletter::create();
    $this->newsletter->type = Newsletter::TYPE_STANDARD;
    $this->newsletter->subject = 'Newsletter for [subscriber:firstname]';
    $this->newsletter->body = '
      {
        "content": {
          "type": "container",
          "orientation": "vertical",
          "blocks": [
            {
              "type": "container",
              "styles": { "block": {} },
              "orientation": "horizontal",
              "blocks": [
                {
                  "type": "container",
                  "orientation": "vertical",
                  "styles": { "block": {} },
                  "blocks": [
                    {
                      "type": "text",
                      "text": "<a data-post-id=\"' . $this->post_id . '\" href=\"http://example.com\">Link</a>Hello [subscriber:firstname]"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }';
    $this->newsletter->save();
    $this->queue = SendingQueue::create();
    $this->queue->newsletter_id = $this->newsletter->id;
    $this->queue->save();
  }

  function testItConstructs() {
    expect($this->newsletter_task->tracking_enabled)->true();
  }

  function testItFailsToGetAndProcessNewsletterWhenNewsletterDoesNotExist() {
    $queue = $this->queue;
    $queue->newsletter_id = 0;
    expect($this->newsletter_task->getAndPreProcess($queue))->false();
  }

  function testItReturnsRenderedNewsletterBodyWhenItExists() {
    $queue = $this->queue;
    $queue->newsletter_rendered_body = json_encode('Sample newsletter');
    $result = $this->newsletter_task->getAndPreProcess($queue);
    expect($result->_transient->rendered_body)->equals(json_decode($queue->newsletter_rendered_body));
  }

  function testItHashesLinksAndInsertsTrackingImageWhenTrackingIsEnabled() {
    $newsletter_task = $this->newsletter_task;
    $newsletter_task->tracking_enabled = true;
    $result = $newsletter_task->getAndPreProcess($this->queue);
    $link = NewsletterLink::where('newsletter_id', $this->newsletter->id)
      ->findOne();
    expect($result->_transient->rendered_body['html'])
      ->contains('[mailpoet_click_data]-' . $link->hash);
    expect($result->_transient->rendered_body['html'])
      ->contains('[mailpoet_open_data]');
  }

  function testItDoesNotHashLinksAndInsertTrackingCodeWhenTrackingIsDisabled() {
    $newsletter_task = $this->newsletter_task;
    $newsletter_task->tracking_enabled = false;
    $result = $newsletter_task->getAndPreProcess($this->queue);
    $link = NewsletterLink::where('newsletter_id', $this->newsletter->id)
      ->findOne();
    expect($link)->false();
    expect($result->_transient->rendered_body['html'])
      ->notContains('[mailpoet_click_data]');
    expect($result->_transient->rendered_body['html'])
      ->notContains('[mailpoet_open_data]');
  }

  function testReturnsFalseWhenNewsletterIsANotificationWithoutPosts() {
    $newsletter = $this->newsletter;
    $newsletter->type = Newsletter::TYPE_NOTIFICATION;
    // replace post id data tag with something else
    $newsletter->body = str_replace('data-post-id', 'id', $newsletter->body);
    $newsletter->save();
    $result = $this->newsletter_task->getAndPreProcess($this->queue);
    expect($result)->false();
  }

  function testItSavesNewsletterPosts() {
    $result = $this->newsletter_task->getAndPreProcess($this->queue);
    $newsletter_post = NewsletterPost::where('newsletter_id', $this->newsletter->id)
      ->findOne();
    expect($result)->notEquals(false);
    expect($newsletter_post->post_id)->equals($this->post_id);
  }

  function testItUpdatesStatusToSentOnlyForStandardNewsletters() {
    // newsletter type is 'standard'
    $newsletter = $this->newsletter;
    expect($newsletter->type)->equals(Newsletter::TYPE_STANDARD);
    expect($newsletter->status)->notEquals(Newsletter::STATUS_SENT);
    $this->newsletter_task->markNewsletterAsSent($newsletter);
    $updated_newsletter = Newsletter::findOne($newsletter->id);
    expect($updated_newsletter->status)->equals(Newsletter::STATUS_SENT);

    // newsletter type is NOT 'standard'
    $newsletter->type = Newsletter::TYPE_NOTIFICATION;
    $newsletter->status = 'not_sent';
    $newsletter->save();
    $this->newsletter_task->markNewsletterAsSent($newsletter);
    $updated_newsletter = Newsletter::findOne($newsletter->id);
    expect($updated_newsletter->status)->notEquals(Newsletter::STATUS_SENT);
  }

  function testItRendersShortcodesAndReplacesSubscriberDataInLinks() {
    $newsletter = $this->newsletter_task->getAndPreProcess($this->queue);
    $result = $this->newsletter_task->prepareNewsletterForSending(
      $newsletter,
      $this->subscriber,
      $this->queue
    );
    expect($result['subject'])->contains($this->subscriber->first_name);
    expect($result['body']['html'])
      ->contains(Router::NAME . '&endpoint=track&action=click&data=');
    expect($result['body']['text'])
      ->contains(Router::NAME . '&endpoint=track&action=click&data=');
  }

  function testItDoesNotReplaceSubscriberDataInLinksWhenTrackingIsNotEnabled() {
    $newsletter_task = $this->newsletter_task;
    $newsletter_task->tracking_enabled = false;
    $newsletter = $newsletter_task->getAndPreProcess($this->queue);
    $result = $newsletter_task->prepareNewsletterForSending(
      $newsletter,
      $this->subscriber,
      $this->queue
    );
    expect($result['body']['html'])
      ->notContains(Router::NAME . '&endpoint=track&action=click&data=');
    expect($result['body']['text'])
      ->notContains(Router::NAME . '&endpoint=track&action=click&data=');
  }

  function _after() {
    ORM::raw_execute('TRUNCATE ' . Subscriber::$_table);
    ORM::raw_execute('TRUNCATE ' . Newsletter::$_table);
    ORM::raw_execute('TRUNCATE ' . SendingQueue::$_table);
    ORM::raw_execute('TRUNCATE ' . NewsletterLink::$_table);
    ORM::raw_execute('TRUNCATE ' . NewsletterPost::$_table);
  }
}