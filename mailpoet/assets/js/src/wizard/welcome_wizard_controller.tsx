import { useCallback, useEffect, useState } from 'react';
import { useSetting } from 'settings/store/hooks';
import { Settings } from 'settings/store/types';
import { partial } from 'underscore';

import { WelcomeWizardSenderStep } from './steps/sender_step';
import { WelcomeWizardUsageTrackingStep } from './steps/usage_tracking_step.jsx';
import { WelcomeWizardPitchMSSStep } from './steps/pitch_mss_step';
import { WooCommerceController } from './woocommerce_controller';
import { WelcomeWizardStepLayout } from './layout/step_layout.jsx';

import { createSenderSettings } from './create_sender_settings.jsx';
import {
  getStepsCount,
  mapStepNumberToStepName,
  redirectToNextStep,
} from './steps_numbers.jsx';
import { Steps } from '../common/steps/steps';
import { StepsContent } from '../common/steps/steps_content';
import { TopBar } from '../common/top_bar/top_bar';
import { ErrorBoundary } from '../common';
import { HideScreenOptions } from '../common/hide_screen_options/hide_screen_options';
import { finishWizard } from './finishWizard';
import { updateSettings } from './updateSettings';

type WelcomeWizardStepsControllerPropType = {
  match: { params: { step: string } };
  history: { push: (string) => void };
};

function WelcomeWizardStepsController({
  match,
  history,
}: WelcomeWizardStepsControllerPropType): JSX.Element {
  const stepsCount = getStepsCount();
  const step = parseInt(match.params.step, 10);

  const [loading, setLoading] = useState(false);
  const [sender, setSender] = useSetting('sender');
  const setAnalytics = useSetting('analytics')[1];
  const setThirdPartyLibs = useSetting('3rd_party_libs')[1];

  useEffect(() => {
    if (step > stepsCount || step < 1) {
      history.push('/steps/1');
    }
  }, [step, stepsCount, history]);

  const redirect = partial(redirectToNextStep, history, finishWizard);

  const submitTracking = useCallback(
    async (tracking, libs3rdParty) => {
      setLoading(true);
      const analyticsData: Settings['analytics'] = {
        enabled: tracking ? '1' : '',
      };
      const thirdPartyLibsData: Settings['3rd_party_libs'] = {
        enabled: libs3rdParty ? '1' : '',
      };
      const updateData = {
        analytics: analyticsData,
        '3rd_party_libs': thirdPartyLibsData,
      };
      await updateSettings(updateData);
      setAnalytics(analyticsData);
      setThirdPartyLibs(thirdPartyLibsData);
      redirect(step);
      setLoading(false);
    },
    [redirect, step, setAnalytics, setThirdPartyLibs],
  );

  const updateSender = useCallback(
    (data: { address: string }) => {
      setSender({ ...sender, ...data });
    },
    [sender, setSender],
  );

  const submitSender = useCallback(async () => {
    setLoading(true);
    await updateSettings(createSenderSettings(sender)).then(() =>
      redirect(step),
    );
    setLoading(false);
  }, [redirect, sender, step]);

  const skipSenderStep = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      const defaultSenderInfo = { address: window.admin_email, name: '' };

      await updateSettings(createSenderSettings(defaultSenderInfo)).then(() => {
        setSender(defaultSenderInfo);
        redirect(step);
      });
      setLoading(false);
    },
    [redirect, step, setSender],
  );

  const stepName = mapStepNumberToStepName(step);

  return (
    <>
      <HideScreenOptions />
      <TopBar logoWithLink={false}>
        <Steps count={stepsCount} current={step} />
      </TopBar>
      <StepsContent>
        {stepName === 'WelcomeWizardSenderStep' ? (
          <WelcomeWizardStepLayout
            illustrationUrl={window.wizard_sender_illustration_url}
          >
            <ErrorBoundary>
              <WelcomeWizardSenderStep
                update_sender={updateSender}
                submit_sender={submitSender}
                skipStep={skipSenderStep}
                loading={loading}
                sender={sender}
              />
            </ErrorBoundary>
          </WelcomeWizardStepLayout>
        ) : null}

        {stepName === 'WelcomeWizardUsageTrackingStep' ? (
          <WelcomeWizardStepLayout
            illustrationUrl={window.wizard_tracking_illustration_url}
          >
            <ErrorBoundary>
              <WelcomeWizardUsageTrackingStep
                loading={loading}
                submitForm={submitTracking}
              />
            </ErrorBoundary>
          </WelcomeWizardStepLayout>
        ) : null}

        {stepName === 'WelcomeWizardPitchMSSStep' ? (
          <WelcomeWizardStepLayout
            illustrationUrl={window.wizard_MSS_pitch_illustration_url}
          >
            <ErrorBoundary>
              <WelcomeWizardPitchMSSStep />
            </ErrorBoundary>
          </WelcomeWizardStepLayout>
        ) : null}

        {stepName === 'WizardWooCommerceStep' ? (
          <ErrorBoundary>
            <WooCommerceController
              isWizardStep
              redirectToNextStep={() => redirect(step)}
            />
          </ErrorBoundary>
        ) : null}
      </StepsContent>
    </>
  );
}

WelcomeWizardStepsController.displayName = 'WelcomeWizardStepsController';

export { WelcomeWizardStepsController };
