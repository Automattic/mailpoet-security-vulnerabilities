<?php declare(strict_types = 1);

namespace MailPoet\Automation\Engine\Data;

use MailPoet\Automation\Engine\Exceptions;
use MailPoet\Automation\Engine\Exceptions\InvalidStateException;
use MailPoet\Automation\Engine\Integration\Payload;
use MailPoet\Automation\Engine\Integration\Subject;

class StepRunArgs {
  /** @var Automation */
  private $automation;

  /** @var AutomationRun */
  private $automationRun;

  /** @var Step */
  private $step;

  /** @var array<string, SubjectEntry<Subject<Payload>>[]> */
  private $subjectEntries = [];

  /** @var array<class-string, string> */
  private $subjectKeyClassMap = [];

  /** @param SubjectEntry<Subject<Payload>>[] $subjectsEntries */
  public function __construct(
    Automation $automation,
    AutomationRun $automationRun,
    Step $step,
    array $subjectsEntries
  ) {
    $this->automation = $automation;
    $this->step = $step;
    $this->automationRun = $automationRun;

    foreach ($subjectsEntries as $entry) {
      $subject = $entry->getSubject();
      $key = $subject->getKey();
      $this->subjectEntries[$key] = array_merge($this->subjectEntries[$key] ?? [], [$entry]);
      $this->subjectKeyClassMap[get_class($subject)] = $key;
    }
  }

  public function getAutomation(): Automation {
    return $this->automation;
  }

  public function getAutomationRun(): AutomationRun {
    return $this->automationRun;
  }

  public function getStep(): Step {
    return $this->step;
  }

  /** @return SubjectEntry<Subject<Payload>> */
  public function getSingleSubjectEntry(string $key): SubjectEntry {
    $subjects = $this->subjectEntries[$key] ?? [];
    if (count($subjects) === 0) {
      throw Exceptions::subjectDataNotFound($key, $this->automationRun->getId());
    }
    if (count($subjects) > 1) {
      throw Exceptions::multipleSubjectsFound($key, $this->automationRun->getId());
    }
    return $subjects[0];
  }

  /**
   * @template P of Payload
   * @template S of Subject<P>
   * @param class-string<S> $class
   * @return SubjectEntry<S<P>>
   */
  public function getSingleSubjectEntryByClass(string $class): SubjectEntry {
    $key = $this->subjectKeyClassMap[$class] ?? null;
    if (!$key) {
      throw Exceptions::subjectClassNotFound($class);
    }

    /** @var SubjectEntry<S<P>> $entry -- for PHPStan */
    $entry = $this->getSingleSubjectEntry($key);
    return $entry;
  }

  /**
   * @template P of Payload
   * @param class-string<P> $class
   * @return P
   */
  public function getSinglePayloadByClass(string $class): Payload {
    $payloads = [];
    foreach ($this->subjectEntries as $entries) {
      if (count($entries) > 1) {
        throw Exceptions::multiplePayloadsFound($class, $this->automationRun->getId());
      }

      $entry = $entries[0];
      $payload = $entry->getPayload();
      if (get_class($payload) === $class) {
        $payloads[] = $payload;
      }
    }

    if (count($payloads) === 0) {
      throw Exceptions::payloadNotFound($class, $this->automationRun->getId());
    }
    if (count($payloads) > 1) {
      throw Exceptions::multiplePayloadsFound($class, $this->automationRun->getId());
    }

    // ensure PHPStan we're indeed returning an instance of $class
    $payload = $payloads[0];
    if (!$payload instanceof $class) {
      throw InvalidStateException::create();
    }
    return $payload;
  }
}
