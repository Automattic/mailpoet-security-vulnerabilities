import { Button } from 'common/index';
import { t } from 'common/functions';
import { Messages } from 'common/premium_key/messages';
import { MssStatus } from 'settings/store/types';
import { MailPoet } from 'mailpoet';
import { select } from '@wordpress/data';
import { STORE_NAME } from 'settings/store/store_name';
import { useContext } from 'react';
import { GlobalContext } from 'context';
import { useAction, useSelector, useSetting } from 'settings/store/hooks';

type KeyState = {
  is_approved: boolean;
};

type KeyActivationButtonPropType = {
  label: string;
  isFullWidth?: boolean;
};

export function KeyActivationButton({
  label,
  isFullWidth = false,
}: KeyActivationButtonPropType) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { notices } = useContext<any>(GlobalContext);
  const state = useSelector('getKeyActivationState')();
  const setState = useAction('updateKeyActivationState');
  const verifyMssKey = useAction('verifyMssKey');
  const verifyPremiumKey = useAction('verifyPremiumKey');
  const sendCongratulatoryMssEmail = useAction('sendCongratulatoryMssEmail');
  const [apiKeyState] = useSetting('mta', 'mailpoet_api_key_state', 'data');

  async function activationCallback() {
    await verifyMssKey(state.key);
    sendCongratulatoryMssEmail();
    setState({ fromAddressModalCanBeShown: true });
  }

  const showPendingApprovalNotice =
    state.inProgress === false &&
    state.mssStatus === MssStatus.VALID_MSS_ACTIVE &&
    apiKeyState &&
    (apiKeyState as KeyState).is_approved === false;

  const buttonIsDisabled = state.key === '' || state.key === null;

  const verifyKey = async () => {
    if (!state.key) {
      notices.error(<p>{t('premiumTabNoKeyNotice')}</p>, { scroll: true });
      return;
    }
    await setState({
      mssStatus: null,
      premiumStatus: null,
      premiumInstallationStatus: null,
    });
    MailPoet.Modal.loading(true);
    setState({ inProgress: true });
    await verifyMssKey(state.key);
    const currentMssStatus =
      select(STORE_NAME).getKeyActivationState().mssStatus;
    if (currentMssStatus === MssStatus.VALID_MSS_ACTIVE) {
      await sendCongratulatoryMssEmail();
    }
    await verifyPremiumKey(state.key);
    setState({ inProgress: false });
    MailPoet.Modal.loading(false);
    setState({ fromAddressModalCanBeShown: true });
  };

  return (
    <>
      <Button
        type="button"
        onClick={verifyKey}
        isFullWidth={isFullWidth}
        isDisabled={buttonIsDisabled}
      >
        {label}
      </Button>
      {state.isKeyValid !== null &&
        Messages(state, showPendingApprovalNotice, activationCallback)}
    </>
  );
}