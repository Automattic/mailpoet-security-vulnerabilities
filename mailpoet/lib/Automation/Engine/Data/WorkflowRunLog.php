<?php declare(strict_types = 1);

namespace MailPoet\Automation\Engine\Data;

use DateTimeImmutable;
use MailPoet\Automation\Engine\Utils\Json;

class WorkflowRunLog {

  const STATUS_RUNNING = 'running';
  const STATUS_COMPLETED = 'completed';
  const STATUS_FAILED = 'failed';

  /** @var int */
  private $id;

  /** @var int */
  private $workflowRunId;

  /** @var DateTimeImmutable */
  private $createdAt;

  /** @var DateTimeImmutable */
  private $updatedAt;

  /** @var DateTimeImmutable|null */
  private $completedAt;

  /** @var string */
  private $status;

  /** @var array */
  private $errors;

  /** @var array */
  private $data;

  /** @var string */
  private $stepId;

  /** @var array */
  private $args;

  public function __construct(
    int $workflowRunId,
    string $stepId,
    array $args,
    int $id = null
  ) {
    $this->workflowRunId = $workflowRunId;
    $this->stepId = $stepId;
    $this->args = $args;
    $this->status = self::STATUS_RUNNING;

    if ($id) {
      $this->id = $id;
    }

    $now = new DateTimeImmutable();
    $this->createdAt = $now;
    $this->updatedAt = $now;

    $this->errors = [];
    $this->data = [];
  }

  public function getId(): int {
    return $this->id;
  }

  public function getWorkflowRunId(): int {
    return $this->workflowRunId;
  }

  public function getStepId(): string {
    return $this->stepId;
  }

  public function getStatus(): string {
    return $this->status;
  }

  public function getArgs(): array {
    return $this->args;
  }

  public function getErrors(): array {
    return $this->errors;
  }

  public function getData(): array {
    return $this->data;
  }

  /**
   * @return DateTimeImmutable|null
   */
  public function getCompletedAt() {
    return $this->completedAt;
  }

  /**
   * @param string $key
   * @param mixed $value
   * @return void
   */
  public function setData(string $key, $value): void {
    $this->data[$key] = $value;
  }

  public function getCreatedAt(): DateTimeImmutable {
    return $this->createdAt;
  }

  public function getUpdatedAt(): DateTimeImmutable {
    return $this->updatedAt;
  }

  public function toArray(): array {
    return [
      'workflow_run_id' => $this->workflowRunId,
      'step_id' => $this->stepId,
      'status' => $this->status,
      'created_at' => $this->createdAt->format(DateTimeImmutable::W3C),
      'updated_at' => $this->updatedAt->format(DateTimeImmutable::W3C),
      'completed_at' => $this->completedAt ? $this->completedAt->format(DateTimeImmutable::W3C) : null,
      'args' => Json::encode($this->args),
      'errors' => Json::encode($this->errors),
      'data' => Json::encode($this->data),
    ];
  }

  public function markCompleted(): void {
    $this->status = self::STATUS_COMPLETED;
    $this->completedAt = new DateTimeImmutable();
  }

  public function markFailed(): void {
    $this->status = self::STATUS_FAILED;
  }

  public function addError(\Exception $exception, string $userFacingMessage = ''): void {
    $error = [
      'message' => $exception->getMessage(),
      'exceptionClass' => get_class($exception),
      'userFacingMessage' => $userFacingMessage,
      'code' => $exception->getCode(),
      'trace' => $exception->getTrace(),
    ];

    $this->errors[] = $error;
  }

  public static function fromArray(array $data): self {
    $workflowRunLog = new WorkflowRunLog((int)$data['workflow_run_id'], $data['step_id'], []);
    $workflowRunLog->id = (int)$data['id'];
    $workflowRunLog->status = $data['status'];
    $workflowRunLog->errors = Json::decode($data['errors']);
    $workflowRunLog->data = Json::decode($data['data']);
    $workflowRunLog->args = Json::decode($data['args']);
    $workflowRunLog->createdAt = new DateTimeImmutable($data['created_at']);
    $workflowRunLog->updatedAt = new DateTimeImmutable($data['updated_at']);

    if ($data['completed_at']) {
      $workflowRunLog->completedAt = new DateTimeImmutable($data['completed_at']);
    }

    return $workflowRunLog;
  }
}