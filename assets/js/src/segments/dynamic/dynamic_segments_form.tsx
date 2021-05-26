import React, { useEffect, useState } from 'react';
import {
  assign,
  compose,
  has,
  prop,
} from 'lodash/fp';
import { useRouteMatch, Link, useHistory } from 'react-router-dom';

import MailPoet from 'mailpoet';
import Background from 'common/background/background';
import Heading from 'common/typography/heading/heading';
import HideScreenOptions from 'common/hide_screen_options/hide_screen_options';
import { EmailSegmentOptions } from './dynamic_segments_filters/email';
import { WooCommerceOptions } from './dynamic_segments_filters/woocommerce';
import { SubscriberSegmentOptions } from './dynamic_segments_filters/subscriber';
import { WooCommerceSubscriptionOptions } from './dynamic_segments_filters/woocommerce_subscription';
import { SegmentFormData } from './segment_form_data';
import { Form } from './form';

import {
  AnyFormItem,
  FilterValue,
  GroupFilterValue,
  SubscriberActionTypes,
} from './types';
import APIErrorsNotice from '../../notices/api_errors_notice';

const messages = {
  onUpdate: (): void => {
    MailPoet.Notice.success(MailPoet.I18n.t('dynamicSegmentUpdated'));
  },
  onCreate: (data): void => {
    MailPoet.Notice.success(MailPoet.I18n.t('dynamicSegmentAdded'));
    MailPoet.trackEvent('Segments > Add new', {
      'MailPoet Free version': MailPoet.version,
      type: data.segmentType || 'unknown type',
      subtype: data.action || data.wordpressRole || 'unknown subtype',
    });
  },
};

function getAvailableFilters(): GroupFilterValue[] {
  const filters: GroupFilterValue[] = [
    {
      label: MailPoet.I18n.t('email'),
      options: EmailSegmentOptions,
    },
    {
      label: MailPoet.I18n.t('wpUserRole'),
      options: SubscriberSegmentOptions,
    },
  ];
  if (MailPoet.isWoocommerceActive) {
    filters.push({
      label: MailPoet.I18n.t('woocommerce'),
      options: WooCommerceOptions,
    });
  }
  if (MailPoet.isWoocommerceActive && SegmentFormData.canUseWooSubscriptions) {
    filters.push({
      label: MailPoet.I18n.t('woocommerceSubscriptions'),
      options: WooCommerceSubscriptionOptions,
    });
  }
  return filters;
}

const DynamicSegmentForm: React.FunctionComponent = () => {
  const [segmentFilters] = useState(getAvailableFilters());
  const [errors, setErrors] = useState([]);
  const [segmentType, setSegmentType] = useState<FilterValue | undefined>(undefined);
  const [item, setItem] = useState<AnyFormItem>({});
  const match = useRouteMatch<{id: string}>();
  const history = useHistory();

  useEffect(() => {
    function findSegmentType(itemSearch): FilterValue | undefined {
      let found: FilterValue | undefined;
      if (itemSearch.action === undefined) {
        // bc compatibility, the wordpress user role segment doesn't have action
        return SubscriberSegmentOptions.find(
          (value) => value.value === SubscriberActionTypes.WORDPRESS_ROLE
        );
      }

      segmentFilters.forEach((filter: GroupFilterValue) => {
        filter.options.forEach((option: FilterValue) => {
          if (option.group === itemSearch.segmentType) {
            if (itemSearch.action === option.value) {
              found = option;
            }
          }
        });
      });
      return found;
    }

    function convertSavedData(data: {
      [key: string]: string | number;
    }): AnyFormItem {
      let converted: AnyFormItem = JSON.parse(JSON.stringify(data));
      // for compatibility with older data
      if (has('link_id', data)) converted = assign(converted, { link_id: data.link_id.toString() });
      if (has('newsletter_id', data)) converted = assign(converted, { newsletter_id: data.newsletter_id.toString() });
      if (has('product_id', data)) converted = assign(converted, { product_id: data.product_id.toString() });
      if (has('category_id', data)) converted = assign(converted, { category_id: data.category_id.toString() });
      return converted;
    }

    function loadSegment(segmentId): void {
      MailPoet.Ajax.post({
        api_version: MailPoet.apiVersion,
        endpoint: 'dynamic_segments',
        action: 'get',
        data: {
          id: segmentId,
        },
      })
        .done((response) => {
          if (response.data.is_plugin_missing) {
            history.push('/segments');
          } else {
            setItem(convertSavedData(response.data));
            setSegmentType(findSegmentType(response.data));
          }
        })
        .fail(() => {
          history.push('/segments');
        });
    }

    if (match.params.id !== undefined) {
      loadSegment(match.params.id);
    }
  }, [segmentFilters, match.params.id, history]);

  function handleSave(e: Event): void {
    e.preventDefault();
    setErrors([]);
    MailPoet.Ajax.post({
      api_version: MailPoet.apiVersion,
      endpoint: 'dynamic_segments',
      action: 'save',
      data: item,
    }).done(() => {
      history.push('/segments');

      if (match.params.id !== undefined) {
        messages.onUpdate();
      } else {
        messages.onCreate(item);
      }
    }).fail(compose([setErrors, prop('errors')]));
  }

  return (
    <>
      <Background color="#fff" />
      <HideScreenOptions />
      {(errors.length > 0 && (
        <APIErrorsNotice errors={errors} />
      ))}

      <Heading level={1} className="mailpoet-title">
        <span>{MailPoet.I18n.t('formPageTitle')}</span>
        <Link className="mailpoet-button mailpoet-button-small" to="/segments">{MailPoet.I18n.t('backToList')}</Link>
      </Heading>

      <Form
        onSave={handleSave}
        segmentType={segmentType}
        item={item}
        onItemChange={setItem}
        onSegmentTypeChange={setSegmentType}
        segmentFilters={segmentFilters}
      />
    </>
  );
};

export default DynamicSegmentForm;
