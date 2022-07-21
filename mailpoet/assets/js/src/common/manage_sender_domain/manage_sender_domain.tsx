import PropTypes from 'prop-types';
import { noop } from 'lodash';
import ReactStringReplace from 'react-string-replace';
import { Button, Loader, TypographyHeading as Heading } from 'common';
import { MailPoet } from 'mailpoet';
import { SenderDomainEntity } from './manage_sender_domain_types';

type Props = {
  max_width: string;
  rows: Array<SenderDomainEntity>;
  loadingButton: boolean;
  verifyDnsButtonClicked: () => void;
};
function ManageSenderDomain({
  max_width,
  rows,
  loadingButton,
  verifyDnsButtonClicked,
}: Props) {
  if (rows.length === 0) return <Loader size={84} />;

  const { dns, domain } = rows[0];

  return (
    <div>
      <Heading level={2}>
        {' '}
        {MailPoet.I18n.t('manageSenderDomainHeaderTitle')}{' '}
      </Heading>
      <p>
        {ReactStringReplace(
          MailPoet.I18n.t('manageSenderDomainHeaderSubtitle'),
          /\[link](.*?)\[\/link]/g,
          (match) => (
            <a
              key={match}
              className="mailpoet-link"
              href="https://kb.mailpoet.com/article/188-how-to-set-up-mailpoet-sending-service#dns"
              target="_blank"
              rel="noopener noreferrer"
            >
              {match}
            </a>
          ),
        )}
      </p>

      <table className="widefat fixed" style={{ maxWidth: max_width }}>
        <thead>
          <tr>
            <th> {MailPoet.I18n.t('manageSenderDomainTableHeaderType')} </th>
            <th> {MailPoet.I18n.t('manageSenderDomainTableHeaderHost')} </th>
            <th> {MailPoet.I18n.t('manageSenderDomainTableHeaderValue')} </th>
            <th> {MailPoet.I18n.t('manageSenderDomainTableHeaderStatus')} </th>
          </tr>
        </thead>
        <tbody>
          {dns.map((dnsRecord) => (
            <tr key={`row_${domain}_${dnsRecord.host}`}>
              <td>{dnsRecord.type}</td>
              <td>{dnsRecord.host}</td>
              <td>{dnsRecord.value}</td>
              <td>{dnsRecord.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button withSpinner={loadingButton} onClick={verifyDnsButtonClicked}>
        {' '}
        {MailPoet.I18n.t('manageSenderDomainVerifyButton')}{' '}
      </Button>
    </div>
  );
}

ManageSenderDomain.propTypes = {
  max_width: PropTypes.string,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      domain: PropTypes.string.isRequired,
      dns: PropTypes.arrayOf(
        PropTypes.shape({
          host: PropTypes.string,
          value: PropTypes.string,
          type: PropTypes.string,
          status: PropTypes.string,
          message: PropTypes.string,
        }),
      ).isRequired,
    }),
  ).isRequired,
  verifyDnsButtonClicked: PropTypes.func,
};

ManageSenderDomain.defaultProps = {
  max_width: 'auto',
  verifyDnsButtonClicked: noop,
};

export { ManageSenderDomain };