import PropTypes from 'prop-types';
import { Placeholder, Spinner } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

import { MailPoet } from 'mailpoet';
import { Icon } from './icon.jsx';
import { AddCustomFieldForm } from './add_custom_field_form.jsx';
import { storeName } from '../../store/constants';

function AddCustomField({ clientId }) {
  const { createCustomField } = useDispatch(storeName);

  const dateSettings = useSelect(
    (sel) => sel(storeName).getDateSettingsData(),
    [],
  );

  const isCreating = useSelect(
    (sel) => sel(storeName).getIsCustomFieldCreating(),
    [],
  );

  const onSubmit = (formData) => {
    createCustomField(formData, clientId);
  };

  return (
    <Placeholder
      icon={<BlockIcon icon={Icon} showColors />}
      label={MailPoet.I18n.t('blockAddCustomFieldFormHeading')}
      className="mailpoet_custom_field_add_placeholder"
    >
      {!isCreating ? (
        <>
          <p>{MailPoet.I18n.t('blockAddCustomFieldDescription')}</p>
          <AddCustomFieldForm onSubmit={onSubmit} dateSettings={dateSettings} />
        </>
      ) : (
        <Spinner />
      )}
    </Placeholder>
  );
}

AddCustomField.propTypes = {
  clientId: PropTypes.string.isRequired,
};

export { AddCustomField };
