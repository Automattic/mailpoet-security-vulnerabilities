<?php declare(strict_types = 1);

namespace MailPoet\Automation\Engine\Control\Steps;

use MailPoet\Automation\Engine\Control\StepRunner;
use MailPoet\Automation\Engine\Data\StepRunArgs;
use MailPoet\Automation\Engine\Data\StepValidationArgs;
use MailPoet\Automation\Engine\Exceptions\InvalidStateException;
use MailPoet\Automation\Engine\Registry;

class ActionStepRunner implements StepRunner {
  /** @var Registry */
  private $registry;

  public function __construct(
    Registry $registry
  ) {
    $this->registry = $registry;
  }

  public function run(StepRunArgs $runArgs, StepValidationArgs $validationArgs): void {
    $action = $this->registry->getAction($runArgs->getStep()->getKey());
    if (!$action) {
      throw new InvalidStateException();
    }

    $action->validate($validationArgs);
    $action->run($runArgs);
  }
}
