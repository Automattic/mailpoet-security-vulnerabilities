<?php declare(strict_types = 1);

namespace MailPoet\Automation\Engine\Validation\AutomationRules;

use MailPoet\Automation\Engine\Data\Automation;
use MailPoet\Automation\Engine\Data\Step;
use MailPoet\Automation\Engine\Exceptions;
use MailPoet\Automation\Engine\Validation\AutomationGraph\AutomationNode;
use MailPoet\Automation\Engine\Validation\AutomationGraph\AutomationNodeVisitor;

class TriggerNeedsToBeFollowedByActionRule implements AutomationNodeVisitor {
  public const RULE_ID = 'trigger-needs-to-be-followed-by-action';

  public function initialize(Automation $automation): void {
  }

  public function visitNode(Automation $automation, AutomationNode $node): void {
    if (!$automation->needsFullValidation()) {
      return;
    }

    $step = $node->getStep();
    if ($step->getType() !== Step::TYPE_TRIGGER) {
      return;
    }
    $nextSteps = $step->getNextSteps();
    if (!count($nextSteps)) {
      throw Exceptions::automationStructureNotValid(__('A trigger needs to be followed by an action.', 'mailpoet'), self::RULE_ID);
    }
    foreach ($nextSteps as $step) {
      $step = $automation->getStep($step->getId());
      if ($step && $step->getType() === Step::TYPE_ACTION) {
        continue;
      }
      throw Exceptions::automationStructureNotValid(__('A trigger needs to be followed by an action.', 'mailpoet'), self::RULE_ID);
    }
  }

  public function complete(Automation $automation): void {
  }
}
