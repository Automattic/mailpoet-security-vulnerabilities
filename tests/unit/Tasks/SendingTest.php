<?php
namespace MailPoet\Test\Tasks;

use Carbon\Carbon;
use MailPoet\Models\Newsletter;
use MailPoet\Models\ScheduledTask;
use MailPoet\Models\ScheduledTaskSubscriber;
use MailPoet\Models\SendingQueue;
use MailPoet\Tasks\Sending as SendingTask;
use MailPoet\Tasks\Subscribers;

class SendingTest extends \MailPoetTest {
  function _before() {
    $newsletter = Newsletter::create();
    $newsletter->type = Newsletter::TYPE_STANDARD;
    $this->newsletter = $newsletter->save();

    $task = ScheduledTask::create();
    $task->type = SendingTask::TASK_TYPE;
    $this->task = $task->save();

    $queue = SendingQueue::create();
    $queue->newsletter_id = $this->newsletter->id;
    $queue->task_id = $this->task->id;
    $this->queue = $queue->save();

    $this->sending = SendingTask::create($this->task, $this->queue);
    $this->sending->setSubscribers(array(123, 456)); // random IDs
  }

  function testItCanBeConstructed() {
    $sending = SendingTask::create();
    expect_that($sending instanceof SendingTask);
    expect_that($sending->queue() instanceof SendingQueue);
    expect_that($sending->task() instanceof ScheduledTask);
    expect_that($sending->taskSubscribers() instanceof Subscribers);
  }

  function testItCanBeConstructedOnlyWithAProperTaskType() {
    $this->task->type = 'wrong_type';
    try {
      $sending = SendingTask::create($this->task, $this->queue);
      $this->fail('Exception was not thrown');
    } catch(\Exception $e) {
      // No exception handling necessary
    }
  }

  function testItCanBeCreatedFromTask() {
    $sending = SendingTask::createFromTask($this->task);
    $queue = $sending->queue();
    expect($queue->task_id)->equals($this->task->id);
  }

  function testItCanBeCreatedFromQueue() {
    $sending = SendingTask::createFromQueue($this->queue);
    $task = $sending->task();
    expect($task->id)->equals($this->queue->task_id);
  }

  function testItCanBeInitializedByNewsletterId() {
    $sending = SendingTask::getByNewsletterId($this->newsletter->id);
    $queue = $sending->queue();
    $task = $sending->task();
    expect($queue->id)->equals($this->newsletter->id);
    expect($task->id)->equals($queue->task_id);
  }

  function testItCanBeConvertedToArray() {
    $sending = $this->sending->asArray();
    expect($sending['id'])->equals($this->queue->id);
    expect($sending['task_id'])->equals($this->task->id);
  }

  function testItSavesDataForUnderlyingModels() {
    $newsletter_rendered_subject = 'Abc';
    $status = ScheduledTask::STATUS_PAUSED;
    $this->sending->status = $status;
    $this->sending->newsletter_rendered_subject = $newsletter_rendered_subject;
    $this->sending->save();
    $task = ScheduledTask::findOne($this->task->id);
    $queue = SendingQueue::findOne($this->queue->id);
    expect($task->status)->equals($status);
    expect($queue->newsletter_rendered_subject)->equals($newsletter_rendered_subject);
  }

  function testItDeletesUnderlyingModels() {
    $this->sending->delete();
    expect(ScheduledTask::findOne($this->task->id))->equals(false);
    expect(SendingQueue::findOne($this->queue->id))->equals(false);
    expect(ScheduledTaskSubscriber::where('task_id', $this->task->id)->findMany())->isEmpty();
  }

  function testItGetsSubscribers() {
    expect($this->sending->getSubscribers())->equals(array(123, 456));
  }

  function testItSetsSubscribers() {
    $subscriber_ids = array(1, 2, 3);
    $this->sending->setSubscribers($subscriber_ids);
    expect($this->sending->getSubscribers())->equals($subscriber_ids);
    expect($this->sending->count_total)->equals(count($subscriber_ids));
  }

  function testItRemovesSubscribers() {
    $subscriber_ids = array(456);
    $this->sending->removeSubscribers($subscriber_ids);
    expect($this->sending->getSubscribers())->equals(array(123));
    expect($this->sending->count_total)->equals(1);
  }

  function testItRemovesAllSubscribers() {
    $this->sending->removeAllSubscribers();
    expect($this->sending->getSubscribers())->equals(array());
    expect($this->sending->count_total)->equals(0);
  }

  function testItUpdatesProcessedSubscribers() {
    expect($this->sending->count_to_process)->equals(2);
    expect($this->sending->count_processed)->equals(0);
    $subscriber_ids = array(456);
    $this->sending->updateProcessedSubscribers($subscriber_ids);
    expect($this->sending->count_to_process)->equals(1);
    expect($this->sending->count_processed)->equals(1);
  }

  function testItGetsScheduledQueues() {
    $this->sending->status = ScheduledTask::STATUS_SCHEDULED;
    $this->sending->scheduled_at = Carbon::createFromTimestamp(current_time('timestamp'))->subHours(1);
    $this->sending->save();
    $tasks = SendingTask::getScheduledQueues();
    expect($tasks)->notEmpty();
    foreach($tasks as $task) {
      expect($task)->isInstanceOf('MailPoet\Tasks\Sending');
    }

    // if task exists but sending queue is missing, results should not contain empty (false) values
    $this->queue->delete();
    $tasks = SendingTask::getRunningQueues();
    expect($tasks)->isEmpty();
  }

  function testItGetsBatchOfScheduledQueues() {
    $amount = 5;
    for($i = 0; $i < $amount + 3; $i += 1) {
      $this->createNewSendingTask(ScheduledTask::STATUS_SCHEDULED);
    }
    expect(count(SendingTask::getScheduledQueues($amount)))->equals($amount);
  }

  function testItGetsRunningQueues() {
    $this->sending->status = null;
    $this->sending->scheduled_at = Carbon::createFromTimestamp(current_time('timestamp'))->subHours(1);
    $this->sending->save();
    $tasks = SendingTask::getRunningQueues();
    expect($tasks)->notEmpty();
    foreach($tasks as $task) {
      expect($task)->isInstanceOf('MailPoet\Tasks\Sending');
    }

    // if task exists but sending queue is missing, results should not contain empty (false) values
    $this->queue->delete();
    $tasks = SendingTask::getRunningQueues();
    expect($tasks)->isEmpty();
  }

  function testItGetsBatchOfRunningQueues() {
    $amount = 5;
    for($i = 0; $i < $amount + 3; $i += 1) {
      $this->createNewSendingTask(null);
    }
    expect(count(SendingTask::getRunningQueues($amount)))->equals($amount);
  }

  function createNewSendingTask($status = null) {
    $newsletter = Newsletter::create();
    $newsletter->type = Newsletter::TYPE_STANDARD;
    $newsletter->save();

    $task = ScheduledTask::create();
    $task->type = SendingTask::TASK_TYPE;
    $task->save();

    $queue = SendingQueue::create();
    $queue->newsletter_id = $newsletter->id;
    $queue->task_id = $task->id;
    $queue->save();

    $sending = SendingTask::create($task, $queue);
    $sending->setSubscribers(array(123, 456)); // random IDs
    $sending->status = $status;
    $sending->scheduled_at = Carbon::createFromTimestamp(current_time('timestamp'))->subHours(1);
    $sending->save();
  }

  function _after() {
    \ORM::raw_execute('TRUNCATE ' . Newsletter::$_table);
    \ORM::raw_execute('TRUNCATE ' . ScheduledTask::$_table);
    \ORM::raw_execute('TRUNCATE ' . ScheduledTaskSubscriber::$_table);
    \ORM::raw_execute('TRUNCATE ' . SendingQueue::$_table);
  }
}
