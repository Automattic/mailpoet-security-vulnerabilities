import { Workflow } from './workflow';
import { Actions, Name, Status, Subscribers } from './components/cells';

export function getRow(workflow: Workflow): object[] {
  return [
    {
      id: workflow.id,
      value: workflow.name,
      display: <Name workflow={workflow} />,
    },
    {
      id: workflow.id,
      value: null,
      display: <Subscribers workflow={workflow} />,
    },
    {
      id: workflow.id,
      value: workflow.status,
      display: <Status workflow={workflow} />,
    },
    {
      id: workflow.id,
      value: null,
      display: <Actions workflow={workflow} />,
    },
  ];
}
