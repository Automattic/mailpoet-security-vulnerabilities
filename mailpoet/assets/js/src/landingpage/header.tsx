import { __ } from '@wordpress/i18n';
import { Heading } from 'common/typography/heading/heading';
import { AbTestButton } from './ab-test-button';

function Header() {
  return (
    <section className="landing-header">
      <div className="mailpoet-content-center">
        <Heading level={0}>
          {__('Better email — without leaving WordPress', 'mailpoet')}
        </Heading>
        <p>
          {__(
            'Whether you’re just starting out or have already established your business, we’ve got what you need to reach customers where they are.',
            'mailpoet',
          )}
        </p>
        <AbTestButton />
      </div>
    </section>
  );
}
Header.displayName = 'Landingpage Header';
export { Header };
