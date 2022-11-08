<?php

namespace MailPoet\Test\Acceptance;

use MailPoet\Automation\Engine\Migrations\Migrator;
use MailPoet\DI\ContainerWrapper;
use MailPoet\Features\FeaturesController;
use MailPoet\Test\DataFactories\Features;

class ConfirmLeaveWhenUnsavedChangesCest
{
  public function _before() {
    // @ToDo Remove once MVP is released.
    $features = new Features();
    $features->withFeatureEnabled(FeaturesController::AUTOMATION);
    $container = ContainerWrapper::getInstance();
    $migrator = $container->get(Migrator::class);
    $migrator->deleteSchema();
    $migrator->createSchema();
  }

  public function confirmationIsRequiredIfWorkflowNotSaved(\AcceptanceTester $i) {
    $i->wantTo('Edit a new workflow draft');
    $i->login();

    $i->amOnMailpoetPage('Automation');
    $i->see('Automations');
    $i->waitForText('Better engagement begins with automation');
    $i->dontSee('Active');
    $i->dontSee('Entered');

    $i->click('Start with a template');
    $i->see('Choose your automation template');
    $i->click('Simple welcome email');

    $i->waitForText('Draft');
    $i->click('Trigger');
    $i->fillField('When someone subscribes to the following lists:', 'Newsletter mailing list');
    $i->click('Delay');
    $i->fillField('Wait for', '5');

    $i->wantTo('Leave the page without saving.');
    $i->reloadPage();
    $i->cancelPopup();

    $i->wantTo('Leave the page after saving.');
    $i->click('Save');
    $i->waitForText('saved');
    $i->reloadPage();
    $i->waitForText('Draft');
  }
}