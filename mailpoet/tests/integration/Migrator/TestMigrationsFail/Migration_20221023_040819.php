<?php declare(strict_types = 1);

namespace MailPoet\Migrations;

use Exception;
use MailPoet\Migrator\Migration;

//phpcs:disable Squiz.Classes.ValidClassName.NotCamelCaps
class Migration_20221023_040819 extends Migration {
  public function run(): void {
    throw new Exception('Testing failing migration.');
  }
}
