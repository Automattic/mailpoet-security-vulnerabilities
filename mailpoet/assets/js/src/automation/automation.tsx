import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { TopBarWithBeamer } from 'common/top_bar/top_bar';
import { plusIcon } from 'common/button/icon/plus';
import { Button, Flex, Popover, SlotFillProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { initializeApi, useMutation } from './api';
import { registerTranslations } from './i18n';
import { createStore, storeName } from './listing/store';
import { AutomationListing } from './listing';
import { registerApiErrorHandler } from './listing/api-error-handler';
import { Notices } from './listing/components/notices';
import { WorkflowListingNotices } from './listing/workflow-listing-notices';
import { Onboarding } from './onboarding';
import {
  CreateEmptyWorkflowButton,
  CreateWorkflowFromTemplateButton,
} from './testing';
import { MailPoet } from '../mailpoet';

function Content(): JSX.Element {
  const count = useSelect((select) => select(storeName).getWorkflowCount());
  return count > 0 ? <AutomationListing /> : <Onboarding />;
}

function Workflows(): JSX.Element {
  return (
    <>
      <TopBarWithBeamer />
      <Flex className="mailpoet-automation-listing-heading">
        <h1 className="wp-heading-inline">{__('Automations', 'mailpoet')}</h1>
        <Button
          href={MailPoet.urls.automationTemplates}
          icon={plusIcon}
          variant="primary"
          className="mailpoet-add-new-button"
        >
          {__('New automation', 'mailpoet')}
        </Button>
      </Flex>
      <Notices />
      <Content />
    </>
  );
}

function RecreateSchemaButton(): JSX.Element {
  const [createSchema, { loading, error }] = useMutation('system/database', {
    method: 'POST',
  });

  return (
    <div>
      <WorkflowListingNotices />
      <button
        className="button button-link-delete"
        type="button"
        onClick={() => createSchema()}
        disabled={loading}
      >
        Recreate DB schema (data will be lost)
      </button>
      {error && (
        <div>{error?.data?.message ?? 'An unknown error occurred'}</div>
      )}
    </div>
  );
}

function DeleteSchemaButton(): JSX.Element {
  const [deleteSchema, { loading, error }] = useMutation('system/database', {
    method: 'DELETE',
  });

  return (
    <div>
      <button
        className="button button-link-delete"
        type="button"
        onClick={async () => {
          await deleteSchema();
          window.location.href =
            '/wp-admin/admin.php?page=mailpoet-experimental';
        }}
        disabled={loading}
      >
        Delete DB schema & deactivate feature
      </button>
      {error && (
        <div>{error?.data?.message ?? 'An unknown error occurred'}</div>
      )}
    </div>
  );
}

function App(): JSX.Element {
  return (
    <SlotFillProvider>
      <BrowserRouter>
        <div>
          <Workflows />
          <div style={{ marginTop: 30, display: 'grid', gridGap: 8 }}>
            <CreateEmptyWorkflowButton />
            <CreateWorkflowFromTemplateButton slug="simple-welcome-email">
              Create testing workflow from template (welcome email)
            </CreateWorkflowFromTemplateButton>
            <CreateWorkflowFromTemplateButton slug="welcome-email-sequence">
              Create testing workflow from template (welcome sequence, only
              premium)
            </CreateWorkflowFromTemplateButton>
            <CreateWorkflowFromTemplateButton slug="advanced-welcome-email-sequence">
              Create testing workflow from template (advanced welcome sequence,
              only premium)
            </CreateWorkflowFromTemplateButton>
            <RecreateSchemaButton />
            <DeleteSchemaButton />
          </div>
          <Popover.Slot />
        </div>
      </BrowserRouter>
    </SlotFillProvider>
  );
}

window.addEventListener('DOMContentLoaded', () => {
  createStore();

  const root = document.getElementById('mailpoet_automation');
  if (root) {
    registerTranslations();
    registerApiErrorHandler();
    initializeApi();
    ReactDOM.render(<App />, root);
  }
});
