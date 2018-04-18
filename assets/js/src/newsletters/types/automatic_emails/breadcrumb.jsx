import Breadcrumb from 'newsletters/breadcrumb.jsx';
import React from 'react';
import MailPoet from 'mailpoet';
import PropTypes from 'prop-types';

function AutomaticEmailsBreadcrumb(props) {
  const steps = [
    {
      name: 'type',
      label: MailPoet.I18n.t('selectType'),
      link: '/new',
    },
    {
      name: 'events',
      label: MailPoet.I18n.t('events'),
    },
    {
      name: 'conditions',
      label: MailPoet.I18n.t('conditions'),
    },
    {
      name: 'template',
      label: MailPoet.I18n.t('template'),
    },
    {
      name: 'editor',
      label: MailPoet.I18n.t('designer'),
    },
    {
      name: 'send',
      label: MailPoet.I18n.t('send'),
    },
  ];

  return (
    <Breadcrumb step={props.step} steps={steps} />
  );
}

AutomaticEmailsBreadcrumb.propTypes = {
  step: PropTypes.string.isRequired,
};

module.exports = AutomaticEmailsBreadcrumb;
