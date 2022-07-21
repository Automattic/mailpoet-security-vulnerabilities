<?php declare(strict_types = 1);

namespace MailPoet\Cron\ActionScheduler\Actions;

use MailPoet\Cron\ActionScheduler\ActionScheduler;
use MailPoet\Cron\ActionScheduler\RemoteExecutorHandler;
use MailPoet\Cron\Triggers\WordPress;
use MailPoet\WP\Functions as WPFunctions;

class DaemonTrigger {
  const NAME = 'mailpoet/cron/daemon-trigger';

  /** @var WPFunctions */
  private $wp;

  /** @var WordPress */
  private $wordpressTrigger;

  /** @var RemoteExecutorHandler */
  private $remoteExecutorHandler;

  /** @var ActionScheduler */
  private $actionScheduler;

  public function __construct(
    WPFunctions $wp,
    WordPress $wordpressTrigger,
    RemoteExecutorHandler $remoteExecutorHandler,
    ActionScheduler $actionScheduler
  ) {
    $this->wp = $wp;
    $this->wordpressTrigger = $wordpressTrigger;
    $this->remoteExecutorHandler = $remoteExecutorHandler;
    $this->actionScheduler = $actionScheduler;
  }

  public function init() {
    $this->wp->addAction(self::NAME, [$this, 'process']);
    if (!$this->actionScheduler->hasScheduledAction(self::NAME)) {
      $this->actionScheduler->scheduleRecurringAction($this->wp->currentTime('timestamp'), 20, self::NAME);
    }
  }

  /**
   * In regular intervals checks if there are scheduled tasks to execute.
   * In case there are tasks it spawns a recurring action.
   */
  public function process(): void {
    $hasJobsToDo = $this->wordpressTrigger->checkExecutionRequirements();
    if (!$hasJobsToDo) {
      $this->actionScheduler->unscheduleAction(DaemonRun::NAME);
      return;
    }
    if ($this->actionScheduler->hasScheduledAction(DaemonRun::NAME)) {
      return;
    }
    // Start recurring action with minimal interval to ensure continuous execution of the daemon
    $this->actionScheduler->scheduleRecurringAction($this->wp->currentTime('timestamp') - 1, 1, DaemonRun::NAME);
    $this->remoteExecutorHandler->triggerExecutor();
  }
}