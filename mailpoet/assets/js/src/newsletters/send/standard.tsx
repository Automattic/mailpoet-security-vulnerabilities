import { ChangeEvent, Component } from 'react';
import { MailPoet } from 'mailpoet';
import { Hooks } from 'wp-js-hooks';
import Moment from 'moment';
import { __ } from '@wordpress/i18n';

import { DateTime } from 'newsletters/send/date_time.jsx';
import { SenderField } from 'newsletters/send/sender_address_field.jsx';
import { GATrackingField } from 'newsletters/send/ga_tracking';
import { Toggle } from 'common/form/toggle/toggle';
import { withBoundary } from 'common';
import { NewsLetter, NewsletterStatus } from 'common/newsletter';
import { Field } from '../../form/types';

const currentTime = window.mailpoet_current_time || '00:00';
const tomorrowDateTime = `${window.mailpoet_tomorrow_date} 08:00:00`;
const timeOfDayItems = window.mailpoet_schedule_time_of_day;
const dateDisplayFormat = window.mailpoet_date_display_format;
const dateStorageFormat = window.mailpoet_date_storage_format;

type StandardSchedulingProps = {
  item?: NewsLetter;
  onValueChange: (targetWrap: {
    target: {
      name: string;
      value: string;
    };
  }) => void;
  field: Field;
};

class StandardScheduling extends Component<StandardSchedulingProps> {
  getCurrentValue = () => {
    const schedulingOptions = {
      isScheduled: '0',
      scheduledAt: tomorrowDateTime,
    };

    return {
      ...schedulingOptions,
      ...(this.props.item?.[this.props.field.name] ?? {}),
    };
  };

  getDateValidation = () => ({
    'data-parsley-required': true,
    'data-parsley-required-message': __(
      'Please enter the scheduled date.',
      'mailpoet',
    ),
    'data-parsley-errors-container': '#mailpoet_scheduling',
  });

  isScheduled = () => this.getCurrentValue().isScheduled === '1';

  handleCheckboxChange = (_, event: ChangeEvent<HTMLInputElement>): void => {
    const changeEvent = { ...event };
    changeEvent.target.value = event.target.checked ? '1' : '0';
    this.handleValueChange(changeEvent);
  };

  handleValueChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const oldValue = this.getCurrentValue();
    const newValue = {};
    newValue[event.target.name] = event.target.value;

    this.props.onValueChange({
      target: {
        name: this.props.field.name,
        value: { ...oldValue, ...newValue },
      },
    });
  };

  render() {
    let schedulingOptions;

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);

    if (this.isScheduled()) {
      schedulingOptions = (
        <>
          <span className="mailpoet-form-schedule-time">
            {__('Your website’s time is', 'mailpoet')} {currentTime}
          </span>
          <div className="mailpoet-gap" />
          <div id="mailpoet_scheduling">
            <DateTime
              name="scheduledAt"
              value={this.getCurrentValue().scheduledAt}
              onChange={this.handleValueChange}
              disabled={this.props.field.disabled}
              dateValidation={this.getDateValidation()}
              defaultDateTime={tomorrowDateTime}
              timeOfDayItems={timeOfDayItems}
              dateDisplayFormat={dateDisplayFormat}
              dateStorageFormat={dateStorageFormat}
              maxDate={maxDate}
            />
          </div>
        </>
      );
    }
    return (
      <div>
        <Toggle
          checked={this.isScheduled()}
          disabled={this.props.field.disabled}
          name="isScheduled"
          onCheck={this.handleCheckboxChange}
          automationId="email-schedule-checkbox"
        />

        {schedulingOptions}
      </div>
    );
  }
}

let fields: Array<Field> = [
  {
    name: 'email-header',
    label: null,
    tip: null,
    fields: [
      {
        name: 'subject',
        customLabel: __('Subject', 'mailpoet'),
        className: 'mailpoet-form-field-subject',
        placeholder: __('Type newsletter subject', 'mailpoet'),
        tooltip: __(
          "Be creative! It's the first thing that your subscribers see. Tempt them to open your email.",
          'mailpoet',
        ),
        type: 'text',
        validation: {
          'data-parsley-required': true,
          'data-parsley-required-message': __(
            'Please specify a subject',
            'mailpoet',
          ),
          maxLength: 250,
        },
      },
      {
        name: 'preheader',
        customLabel: __('Preview text', 'mailpoet'),
        className: 'mailpoet-form-field-preheader',
        placeholder: __(
          'Type preview text (usually displayed underneath the subject line in the inbox)',
          'mailpoet',
        ),
        tooltip: `${__(
          "This optional text will appear in your subscribers' inboxes, beside the subject line. Write something enticing!",
          'mailpoet',
        )} ${__(
          'Max length is 250 characters, however, we recommend 80 characters on a single line.',
          'mailpoet',
        )}`,
        type: 'textarea',
        validation: {
          maxLength: 250,
        },
      },
    ],
  },
  {
    name: 'segments',
    label: __('Lists', 'mailpoet'),
    tip: __(
      'Subscribers in multiple lists will only receive one email.',
      'mailpoet',
    ),
    type: 'selection',
    placeholder: __('Select a list', 'mailpoet'),
    id: 'mailpoet_segments',
    api_version: window.mailpoet_api_version,
    endpoint: 'segments',
    multiple: true,
    filter: function filter(segment: { deleted_at: string }): boolean {
      return !segment.deleted_at;
    },
    getLabel: function getLabel(segment: { name: string }): string {
      return segment.name;
    },
    getCount: function getCount(segment: { subscribers: string }): string {
      return parseInt(segment.subscribers, 10).toLocaleString();
    },
    transformChangedValue: function transformChangedValue(
      segmentIds: string[],
    ): unknown[] {
      const allSegments = this.getItems() || [];
      return segmentIds.map((id) =>
        allSegments.find((segment) => segment.id === id),
      );
    },
    validation: {
      'data-parsley-required': true,
      'data-parsley-required-message': __('Please select a list', 'mailpoet'),
      'data-parsley-segments-with-subscribers': __(
        'Please select a list with subscribers.',
        'mailpoet',
      ),
    },
  },
  {
    name: 'options',
    label: __('Schedule it', 'mailpoet'),
    type: 'reactComponent',
    component: withBoundary(StandardScheduling),
  },
  {
    name: 'sender',
    label: __('Sender', 'mailpoet'),
    tip: __('Your name and email', 'mailpoet'),
    fields: [
      {
        name: 'sender_name',
        type: 'text',
        placeholder: __('John Doe', 'mailpoet'),
        validation: {
          'data-parsley-required': true,
        },
      },
      {
        name: 'sender_address',
        type: 'reactComponent',
        component: withBoundary(SenderField),
        placeholder: __('john.doe@email.com', 'mailpoet'),
        validation: {
          'data-parsley-required': true,
          'data-parsley-type': 'email',
        },
      },
    ],
  },
  GATrackingField,
  {
    name: 'reply-to',
    label: __('Reply-to', 'mailpoet'),
    tip: __(
      'When your subscribers reply to your emails, their emails will go to this address.',
      'mailpoet',
    ),
    inline: true,
    fields: [
      {
        name: 'reply_to_name',
        type: 'text',
        placeholder: __('John Doe', 'mailpoet'),
      },
      {
        name: 'reply_to_address',
        type: 'text',
        placeholder: __('john.doe@email.com', 'mailpoet'),
        validation: {
          'data-parsley-type': 'email',
        },
      },
    ],
  },
];

fields = Hooks.applyFilters('mailpoet_newsletters_3rd_step_fields', fields);

type SendButtonOptions = {
  value: string;
  disabled?: 'disabled';
};

export const StandardNewsletterFields = {
  getFields: (): typeof fields => fields,
  getSendButtonOptions: (
    newsletter: Partial<NewsLetter> = {},
  ): SendButtonOptions => {
    const currentDateTime = Moment(window.mailpoet_current_date_time);
    const isScheduled =
      typeof newsletter.options === 'object' &&
      newsletter.options?.isScheduled === '1' &&
      MailPoet.Date.isInFuture(
        newsletter.options?.scheduledAt,
        currentDateTime,
      );

    const options: SendButtonOptions = {
      value: isScheduled ? __('Schedule', 'mailpoet') : __('Send', 'mailpoet'),
    };

    if (
      newsletter.status === NewsletterStatus.Sent ||
      newsletter.status === NewsletterStatus.Sending
    ) {
      options.disabled = 'disabled';
    }

    return options;
  },
};
