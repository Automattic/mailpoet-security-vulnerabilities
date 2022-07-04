import { useEffect, useRef, useState } from 'react';
import ReactStringReplace from 'react-string-replace';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import moment from 'moment';
import { MailPoet } from 'mailpoet';
import { Modal } from 'common/modal/modal';
import { Button, Loader } from 'common';

const SET_INTERVAL_SECONDS = 15;

const STOP_POLLING_AFTER = 2; // hours

type ApiActionType = 'create' | 'confirm' | 'setup';

/**
 * @param {string} email - Email address
 * @param {ApiActionType} type - action type
 * @returns {Promise}
 */
const makeApiRequest = (email: string, type: ApiActionType = 'create') => {
  let requestAction = 'authorizeSenderEmailAddress';
  let requestData: unknown = { email };

  if (type === 'confirm') {
    requestAction = 'confirmSenderEmailAddressIsAuthorized';
  } else if (type === 'setup') {
    requestAction = 'setAuthorizedFromAddress';
    requestData = {
      address: email,
    };
  }

  return MailPoet.Ajax.post({
    api_version: MailPoet.apiVersion,
    endpoint: 'settings',
    action: requestAction,
    data: requestData,
  });
};

const removeUnauthorizedEmailNotices = () => {
  const unauthorizedEmailNotice = document.querySelector(
    '[data-notice="unauthorized-email-addresses-notice"]',
  );
  if (unauthorizedEmailNotice) {
    unauthorizedEmailNotice.remove();
  }
  const unauthorizedEmailInNewsletterNotice = document.querySelector(
    '[data-notice="unauthorized-email-in-newsletters-addresses-notice"]',
  );
  if (unauthorizedEmailInNewsletterNotice) {
    unauthorizedEmailInNewsletterNotice.remove();
  }
  const unauthorizedEmailInNewsletterDynamicNotice = document.querySelector(
    '[data-id="mailpoet_authorization_error"]',
  );
  if (unauthorizedEmailInNewsletterDynamicNotice) {
    unauthorizedEmailInNewsletterDynamicNotice.remove();
  }
};

type Props = {
  senderEmail: string;
  onRequestClose: () => void;
  setAuthorizedAddress?: (emailAddress: string) => void;
};

function AuthorizeSenderEmailModal({
  senderEmail,
  onRequestClose,
  setAuthorizedAddress,
}: Props) {
  const [createEmailApiResponse, setCreateEmailApiResponse] =
    useState<boolean>(null);
  const [confirmEmailApiResponse, setConfirmEmailApiResponse] =
    useState<boolean>(null);
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const setIntervalId = useRef<NodeJS.Timeout>();
  const setIntervalStopTime = useRef<number>();

  const senderEmailAddress = String(senderEmail).toLowerCase();

  useEffect(() => {
    if (!senderEmailAddress) {
      return null;
    }

    const clearCurrentInterval = (intervalID: NodeJS.Timeout) => {
      clearInterval(intervalID);
    };

    const executeAction = () => {
      const currentIntervalId = setIntervalId.current;
      const currentIntervalStopTime = setIntervalStopTime.current;

      if (currentIntervalStopTime && Date.now() >= currentIntervalStopTime) {
        // stop polling after 2 hours
        clearCurrentInterval(currentIntervalId);
        return;
      }

      makeApiRequest(senderEmailAddress, 'confirm')
        .then((res) => {
          const response = Boolean(res?.data?.isAuthorized);

          if (response) {
            clearCurrentInterval(currentIntervalId);
            return makeApiRequest(senderEmailAddress, 'setup');
          }
          throw new Error('Error: unconfirmed');
        })
        .then(() => {
          setCreateEmailApiResponse(null);
          setShowLoader(false);
          setConfirmEmailApiResponse(true);
          setAuthorizedAddress(senderEmailAddress);
          removeUnauthorizedEmailNotices();
        })
        .catch(() => {
          //
        });
    };

    makeApiRequest(senderEmailAddress)
      .then((res) => {
        const response = Boolean(res?.data);
        setCreateEmailApiResponse(response);
        setShowLoader(response);
        if (response) {
          // if pending or already authorized perform the check ahead
          executeAction();
        }
      })
      .catch(() => {
        setCreateEmailApiResponse(false);
        setShowLoader(false);
      });

    clearCurrentInterval(setIntervalId.current);
    setIntervalStopTime.current = moment()
      .add(STOP_POLLING_AFTER, 'hours')
      .valueOf();

    const invervalID = setInterval(executeAction, 1000 * SET_INTERVAL_SECONDS);
    setIntervalId.current = invervalID;

    return () => clearCurrentInterval(invervalID);
  }, [senderEmailAddress, setAuthorizedAddress]);

  return (
    <Modal
      title={MailPoet.I18n.t('authorizeSenderEmailModalTitle').replace(
        '[senderEmail]',
        senderEmailAddress,
      )}
      onRequestClose={onRequestClose}
      contentClassName="authorize-sender-email-modal"
    >
      {createEmailApiResponse && (
        <p>
          {ReactStringReplace(
            MailPoet.I18n.t('authorizeSenderEmailModalDescription'),
            /\[bold\](.*?)\[\/bold\]/g,
            (match, i) => (
              <strong key={i}>{match}</strong>
            ),
          )}
        </p>
      )}
      {createEmailApiResponse === false && (
        <p>{MailPoet.I18n.t('authorizeSenderEmailMessageError')}</p>
      )}

      {showLoader && <Loader size={64} />}

      {confirmEmailApiResponse && (
        <>
          <p>{MailPoet.I18n.t('authorizeSenderEmailMessageSuccess')}</p>
          <Button onClick={onRequestClose} className="button-on-top">
            {' '}
            {MailPoet.I18n.t('close')}{' '}
          </Button>
        </>
      )}
    </Modal>
  );
}

AuthorizeSenderEmailModal.propTypes = {
  senderEmail: PropTypes.string.isRequired,
};

AuthorizeSenderEmailModal.defaultProps = {
  setAuthorizedAddress: noop,
};

export { AuthorizeSenderEmailModal };