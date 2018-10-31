import MailPoet from 'mailpoet';
import jQuery from 'jquery';
import React from 'react';
import createReactClass from 'create-react-class';
import _ from 'underscore';
import { Link } from 'react-router';
import classNames from 'classnames';
import ListingBulkActions from 'listing/bulk_actions.jsx';
import ListingHeader from 'listing/header.jsx';
import ListingPages from 'listing/pages.jsx';
import ListingSearch from 'listing/search.jsx';
import ListingGroups from 'listing/groups.jsx';
import ListingFilters from 'listing/filters.jsx';

class ListingItem extends React.Component {
  state = {
    expanded: false,
  };

  handleSelectItem = (e) => {
    this.props.onSelectItem(
      parseInt(e.target.value, 10),
      e.target.checked
    );

    return !e.target.checked;
  };

  handleRestoreItem = (id) => {
    this.props.onRestoreItem(id);
  };

  handleTrashItem = (id) => {
    this.props.onTrashItem(id);
  };

  handleDeleteItem = (id) => {
    this.props.onDeleteItem(id);
  };

  handleToggleItem = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    let checkbox = false;

    if (this.props.is_selectable === true) {
      checkbox = (
        <th className="check-column" scope="row">
          <label className="screen-reader-text" htmlFor={`listing-row-checkbox-${this.props.item.id}`}>{
            `Select ${this.props.item[this.props.columns[0].name]}`
          }</label>
          <input
            type="checkbox"
            value={this.props.item.id}
            checked={
              this.props.item.selected || this.props.selection === 'all'
            }
            onChange={this.handleSelectItem}
            disabled={this.props.selection === 'all'}
            id={`listing-row-checkbox-${this.props.item.id}`}
          />
        </th>
      );
    }

    const customActions = this.props.item_actions;
    let itemActions = false;

    if (customActions.length > 0) {
      let isFirst = true;
      itemActions = customActions
        .filter(action => action.display === undefined || action.display(this.props.item))
        .map((action, index) => {
          let customAction = null;

          if (action.name === 'trash') {
            customAction = (
              <span key={`action-${action.name}`} className="trash">
                {(!isFirst) ? ' | ' : ''}
                <a
                  href="javascript:;"
                  onClick={() => this.handleTrashItem(this.props.item.id)}
                >
                  {MailPoet.I18n.t('moveToTrash')}
                </a>
              </span>
            );
          } else if (action.refresh) {
            customAction = (
              <span
                onClick={this.props.onRefreshItems}
                key={`action-${action.name}`}
                className={action.name}
                role="button"
                tabIndex={index}
              >
                {(!isFirst) ? ' | ' : ''}
                { action.link(this.props.item) }
              </span>
            );
          } else if (action.link) {
            customAction = (
              <span
                key={`action-${action.name}`}
                className={action.name}
              >
                {(!isFirst) ? ' | ' : ''}
                { action.link(this.props.item) }
              </span>
            );
          } else {
            customAction = (
              <span
                key={`action-${action.name}`}
                className={action.name}
              >
                {(!isFirst) ? ' | ' : ''}
                <a
                  href="javascript:;"
                  onClick={
                    (action.onClick !== undefined)
                      ? () => action.onClick(this.props.item, this.props.onRefreshItems)
                      : false
                  }
                >{ action.label }</a>
              </span>
            );
          }

          if (customAction !== null && isFirst === true) {
            isFirst = false;
          }

          return customAction;
        });
    } else {
      itemActions = (
        <span className="edit">
          <Link to={`/edit/${this.props.item.id}`}>{MailPoet.I18n.t('edit')}</Link>
        </span>
      );
    }

    let actions;

    if (this.props.group === 'trash') {
      actions = (
        <div>
          <div className="row-actions">
            <span>
              <a
                href="javascript:;"
                onClick={() => this.handleRestoreItem(this.props.item.id)}
              >{MailPoet.I18n.t('restore')}</a>
            </span>
            { ' | ' }
            <span className="delete">
              <a
                className="submitdelete"
                href="javascript:;"
                onClick={() => this.handleDeleteItem(this.props.item.id)}
              >{MailPoet.I18n.t('deletePermanently')}</a>
            </span>
          </div>
          <button
            onClick={() => this.handleToggleItem(this.props.item.id)}
            className="toggle-row"
            type="button"
          >
            <span className="screen-reader-text">{MailPoet.I18n.t('showMoreDetails')}</span>
          </button>
        </div>
      );
    } else {
      actions = (
        <div>
          <div className="row-actions">
            { itemActions }
          </div>
          <button
            onClick={() => this.handleToggleItem(this.props.item.id)}
            className="toggle-row"
            type="button"
          >
            <span className="screen-reader-text">{MailPoet.I18n.t('showMoreDetails')}</span>
          </button>
        </div>
      );
    }

    const rowClasses = classNames({ 'is-expanded': this.state.expanded });

    return (
      <tr className={rowClasses} data-automation-id={`listing_item_${this.props.item.id}`}>
        { checkbox }
        { this.props.onRenderItem(this.props.item, actions) }
      </tr>
    );
  }
}

class ListingItems extends React.Component {
  render() {
    if (this.props.items.length === 0) {
      let message;
      if (this.props.loading === true) {
        message = (this.props.messages.onLoadingItems
          && this.props.messages.onLoadingItems(this.props.group))
          || MailPoet.I18n.t('loadingItems');
      } else {
        message = (this.props.messages.onNoItemsFound
          && this.props.messages.onNoItemsFound(this.props.group))
          || MailPoet.I18n.t('noItemsFound');
      }

      return (
        <tbody>
          <tr className="no-items">
            <td
              colSpan={
                this.props.columns.length
                + (this.props.is_selectable ? 1 : 0)
              }
              className="colspanchange"
            >
              {message}
            </td>
          </tr>
        </tbody>
      );
    }
    const selectAllClasses = classNames(
      'mailpoet_select_all',
      { mailpoet_hidden: (
        this.props.selection === false
            || (this.props.count <= this.props.limit)
      ),
      }
    );

    return (
      <tbody>
        <tr className={selectAllClasses}>
          <td colSpan={
            this.props.columns.length
                + (this.props.is_selectable ? 1 : 0)
          }
          >
            {
              (this.props.selection !== 'all')
                ? MailPoet.I18n.t('selectAllLabel')
                : MailPoet.I18n.t('selectedAllLabel').replace(
                  '%d',
                  this.props.count.toLocaleString()
                )
            }
              &nbsp;
            <a
              onClick={this.props.onSelectAll}
              href="javascript:;"
            >{
                (this.props.selection !== 'all')
                  ? MailPoet.I18n.t('selectAllLink')
                  : MailPoet.I18n.t('clearSelection')
              }</a>
          </td>
        </tr>

        {this.props.items.map((item) => {
          const renderItem = item;
          renderItem.id = parseInt(item.id, 10);
          renderItem.selected = (this.props.selected_ids.indexOf(renderItem.id) !== -1);
          let key = `item-${renderItem.id}-${item.id}`;
          if (typeof this.props.getListingItemKey === 'function') {
            key = this.props.getListingItemKey(item);
          }

          return (
            <ListingItem
              columns={this.props.columns}
              onSelectItem={this.props.onSelectItem}
              onRenderItem={this.props.onRenderItem}
              onDeleteItem={this.props.onDeleteItem}
              onRestoreItem={this.props.onRestoreItem}
              onTrashItem={this.props.onTrashItem}
              onRefreshItems={this.props.onRefreshItems}
              selection={this.props.selection}
              is_selectable={this.props.is_selectable}
              item_actions={this.props.item_actions}
              group={this.props.group}
              key={key}
              item={renderItem}
            />
          );
        })}
      </tbody>
    );
  }
}

const Listing = createReactClass({
  displayName: 'Listing',

  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },

  getInitialState: function getInitialState() {
    return {
      loading: false,
      search: '',
      page: 1,
      count: 0,
      limit: 10,
      sort_by: null,
      sort_order: null,
      items: [],
      groups: [],
      group: 'all',
      filters: {},
      filter: {},
      selected_ids: [],
      selection: false,
      meta: {},
    };
  },

  getParam: function getParam(param) {
    const regex = /(.*)\[(.*)\]/;
    const matches = regex.exec(param);
    return [matches[1], matches[2]];
  },

  initWithParams: function initWithParams(params) {
    const state = this.getInitialState();
    // check for url params
    if (params.splat) {
      params.splat.split('/').forEach((param) => {
        const [key, value] = this.getParam(param);
        const filters = {};
        switch (key) {
          case 'filter':
            value.split('&').forEach((pair) => {
              const [k, v] = pair.split('=');
              filters[k] = v;
            });

            state.filter = filters;
            break;
          default:
            state[key] = value;
        }
      });
    }

    // limit per page
    if (this.props.limit !== undefined) {
      state.limit = Math.abs(Number(this.props.limit));
    }

    // sort by
    if (state.sort_by === null && this.props.sort_by !== undefined) {
      state.sort_by = this.props.sort_by;
    }

    // sort order
    if (state.sort_order === null && this.props.sort_order !== undefined) {
      state.sort_order = this.props.sort_order;
    }

    this.setState(state, () => {
      this.getItems();
    });
  },

  getParams: function getParams() {
    // get all route parameters (without the "splat")
    const params = _.omit(this.props.params, 'splat');
    // TODO:
    // find a way to set the "type" in the routes definition
    // so that it appears in `this.props.params`
    if (this.props.type) {
      params.type = this.props.type;
    }
    return params;
  },

  setParams: function setParams() {
    if (this.props.location) {
      const params = Object.keys(this.state)
        .filter(key => (
          [
            'group',
            'filter',
            'search',
            'page',
            'sort_by',
            'sort_order',
          ].indexOf(key) !== -1
        ))
        .map((key) => {
          let value = this.state[key];
          if (value === Object(value)) {
            value = jQuery.param(value);
          } else if (value === Boolean(value)) {
            value = value.toString();
          }
          return {
            key,
            value,
          };
        })
        .filter(({ value }) => value !== '' && value !== null)
        .map(({ key, value }) => `${key}[${value}]`)
        .join('/');

      // set url
      const url = this.getUrlWithParams(params);

      if (this.props.location.pathname !== url) {
        this.context.router.push(`${url}`);
      }
    }
  },

  getUrlWithParams: function getUrlWithParams(params) {
    let baseUrl = (this.props.base_url !== undefined)
      ? this.props.base_url
      : null;

    if (baseUrl !== null) {
      baseUrl = this.setBaseUrlParams(baseUrl);
      return `/${baseUrl}/${params}`;
    }
    return `/${params}`;
  },

  setBaseUrlParams: function setBaseUrlParams(baseUrl) {
    let ret = baseUrl;
    if (ret.indexOf(':') !== -1) {
      const params = this.getParams();
      Object.keys(params).forEach((key) => {
        if (ret.indexOf(`:${key}`) !== -1) {
          ret = ret.replace(`:${key}`, params[key]);
        }
      });
    }

    return ret;
  },

  componentDidMount: function componentDidMount() {
    this.isComponentMounted = true;
    const params = this.props.params || {};
    this.initWithParams(params);

    if (this.props.auto_refresh) {
      jQuery(document).on('heartbeat-tick.mailpoet', () => {
        this.getItems();
      });
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    this.isComponentMounted = false;
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    const params = nextProps.params || {};
    this.initWithParams(params);
  },

  getItems: function getItems() {
    if (!this.isComponentMounted) return;

    this.setState({ loading: true });
    this.clearSelection();

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'listing',
      data: {
        params: this.getParams(),
        offset: (this.state.page - 1) * this.state.limit,
        limit: this.state.limit,
        group: this.state.group,
        filter: this.state.filter,
        search: this.state.search,
        sort_by: this.state.sort_by,
        sort_order: this.state.sort_order,
      },
    }).always(() => {
      if (!this.isComponentMounted) return;
      this.setState({ loading: false });
    }).done((response) => {
      if (!this.isComponentMounted) return;
      this.setState({
        items: response.data || [],
        filters: response.meta.filters || {},
        groups: response.meta.groups || [],
        count: response.meta.count || 0,
        meta: _.omit(response.meta, ['filters', 'groups', 'count']),
      }, () => {
        // if viewing an empty trash
        if (this.state.group === 'trash' && response.meta.count === 0) {
          // redirect to default group
          this.handleGroup('all');
        }

        // trigger afterGetItems callback if specified
        if (this.props.afterGetItems !== undefined) {
          this.props.afterGetItems(this.state);
        }
      });
    }).fail((response) => {
      if (response.errors.length > 0) {
        MailPoet.Notice.error(
          response.errors.map(error => error.message),
          { scroll: true }
        );
      }
    });
  },

  handleRestoreItem: function handleRestoreItem(id) {
    this.setState({
      loading: true,
      page: 1,
    });

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'restore',
      data: {
        id,
      },
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onRestore !== undefined
      ) {
        this.props.messages.onRestore(response);
      }
      this.getItems();
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleTrashItem: function handleTrashItem(id) {
    this.setState({
      loading: true,
      page: 1,
    });

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'trash',
      data: {
        id,
      },
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onTrash !== undefined
      ) {
        this.props.messages.onTrash(response);
      }
      this.getItems();
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleDeleteItem: function handleDeleteItem(id) {
    this.setState({
      loading: true,
      page: 1,
    });

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'delete',
      data: {
        id,
      },
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onDelete !== undefined
      ) {
        this.props.messages.onDelete(response);
      }
      this.getItems();
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleEmptyTrash: function handleEmptyTrash() {
    return this.handleBulkAction('all', {
      action: 'delete',
      group: 'trash',
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onDelete !== undefined
      ) {
        this.props.messages.onDelete(response);
      }
      // redirect to default group
      this.handleGroup('all');
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleBulkAction: function handleBulkAction(selectedIds, params) {
    if (
      this.state.selection === false
      && this.state.selected_ids.length === 0
      && selectedIds !== 'all'
    ) {
      return false;
    }

    this.setState({ loading: true });

    const data = params || {};
    data.listing = {
      params: this.getParams(),
      offset: 0,
      limit: 0,
      filter: this.state.filter,
      group: this.state.group,
      search: this.state.search,
    };
    if (selectedIds !== 'all') {
      data.listing.selection = selectedIds;
    }

    return MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'bulkAction',
      data,
    }).done(() => {
      this.getItems();
    }).fail((response) => {
      if (response.errors.length > 0) {
        MailPoet.Notice.error(
          response.errors.map(error => error.message),
          { scroll: true }
        );
      }
    });
  },

  handleSearch: function handleSearch(search) {
    this.setState({
      search,
      page: 1,
      selection: false,
      selected_ids: [],
    }, () => {
      this.setParams();
    });
  },

  handleSort: function handleSort(sortBy, sortOrder = 'asc') {
    this.setState({
      sort_by: sortBy,
      sort_order: (sortOrder === 'asc') ? 'asc' : 'desc',
    }, () => {
      this.setParams();
    });
  },

  handleSelectItem: function handleSelectItem(id, isChecked) {
    let selectedIds = this.state.selected_ids;
    let selection = false;

    if (isChecked) {
      selectedIds = jQuery.merge(selectedIds, [id]);
      // check whether all items on the page are selected
      if (
        jQuery('tbody .check-column :checkbox:not(:checked)').length === 0
      ) {
        selection = 'page';
      }
    } else {
      selectedIds.splice(selectedIds.indexOf(id), 1);
    }

    this.setState({
      selection,
      selected_ids: selectedIds,
    });
  },

  handleSelectItems: function handleSelectItems(isChecked) {
    if (isChecked === false) {
      this.clearSelection();
    } else {
      const selectedIds = this.state.items.map(item => Number(item.id));

      this.setState({
        selected_ids: selectedIds,
        selection: 'page',
      });
    }
  },

  handleSelectAll: function handleSelectAll() {
    if (this.state.selection === 'all') {
      this.clearSelection();
    } else {
      this.setState({
        selection: 'all',
        selected_ids: [],
      });
    }
  },

  clearSelection: function clearSelection() {
    this.setState({
      selection: false,
      selected_ids: [],
    });
  },

  handleFilter: function handleFilter(filters) {
    this.setState({
      filter: filters,
      page: 1,
    }, () => {
      this.setParams();
    });
  },

  handleGroup: function handleGroup(group) {
    // reset search
    jQuery('#search_input').val('');

    this.setState({
      group,
      filter: {},
      search: '',
      page: 1,
    }, () => {
      this.setParams();
    });
  },

  handleSetPage: function handleSetPage(page) {
    this.setState({
      page,
      selection: false,
      selected_ids: [],
    }, () => {
      this.setParams();
    });
  },

  handleRenderItem: function handleRenderItem(item, actions) {
    const render = this.props.onRenderItem(item, actions, this.state.meta);
    return render.props.children;
  },

  handleRefreshItems: function handleRefreshItems() {
    this.getItems();
  },

  render: function render() {
    const items = this.state.items;
    const sortBy = this.state.sort_by;
    const sortOrder = this.state.sort_order;

    // columns
    let columns = this.props.columns || [];
    columns = columns.filter(
      column => (column.display === undefined || !!(column.display) === true)
    );

    // bulk actions
    let bulkActions = this.props.bulk_actions || [];

    if (this.state.group === 'trash' && bulkActions.length > 0) {
      bulkActions = [
        {
          name: 'restore',
          label: MailPoet.I18n.t('restore'),
          onSuccess: this.props.messages.onRestore,
        },
        {
          name: 'delete',
          label: MailPoet.I18n.t('deletePermanently'),
          onSuccess: this.props.messages.onDelete,
        },
      ];
    }

    // item actions
    const itemActions = this.props.item_actions || [];

    const tableClasses = classNames(
      'mailpoet_listing_table',
      'wp-list-table',
      'widefat',
      'fixed',
      'striped',
      { mailpoet_listing_loading: this.state.loading }
    );

    // search
    let search = (
      <ListingSearch
        onSearch={this.handleSearch}
        search={this.state.search}
      />
    );
    if (this.props.search === false) {
      search = false;
    }

    // groups
    let groups = (
      <ListingGroups
        groups={this.state.groups}
        group={this.state.group}
        onSelectGroup={this.handleGroup}
      />
    );
    if (this.props.groups === false) {
      groups = false;
    }

    // messages
    let messages = {};
    if (this.props.messages !== undefined) {
      messages = this.props.messages;
    }
    let extraActions;
    if (typeof this.props.renderExtraActions === 'function') {
      extraActions = this.props.renderExtraActions(this.state);
    }

    return (
      <div>
        { groups }
        { search }
        <div className="tablenav top clearfix">
          <ListingBulkActions
            count={this.state.count}
            bulk_actions={bulkActions}
            selection={this.state.selection}
            selected_ids={this.state.selected_ids}
            onBulkAction={this.handleBulkAction}
          />
          <ListingFilters
            filters={this.state.filters}
            filter={this.state.filter}
            group={this.state.group}
            onBeforeSelectFilter={this.props.onBeforeSelectFilter || null}
            onSelectFilter={this.handleFilter}
            onEmptyTrash={this.handleEmptyTrash}
          />
          {extraActions}
          <ListingPages
            count={this.state.count}
            page={this.state.page}
            limit={this.state.limit}
            onSetPage={this.handleSetPage}
          />
        </div>
        <table className={tableClasses}>
          <thead>
            <ListingHeader
              onSort={this.handleSort}
              onSelectItems={this.handleSelectItems}
              selection={this.state.selection}
              sort_by={sortBy}
              sort_order={sortOrder}
              columns={columns}
              is_selectable={bulkActions.length > 0}
            />
          </thead>

          <ListingItems
            onRenderItem={this.handleRenderItem}
            getListingItemKey={this.props.getListingItemKey}
            onDeleteItem={this.handleDeleteItem}
            onRestoreItem={this.handleRestoreItem}
            onTrashItem={this.handleTrashItem}
            onRefreshItems={this.handleRefreshItems}
            columns={columns}
            is_selectable={bulkActions.length > 0}
            onSelectItem={this.handleSelectItem}
            onSelectAll={this.handleSelectAll}
            selection={this.state.selection}
            selected_ids={this.state.selected_ids}
            loading={this.state.loading}
            group={this.state.group}
            count={this.state.count}
            limit={this.state.limit}
            item_actions={itemActions}
            messages={messages}
            items={items}
          />

          <tfoot>
            <ListingHeader
              onSort={this.handleSort}
              onSelectItems={this.handleSelectItems}
              selection={this.state.selection}
              sort_by={sortBy}
              sort_order={sortOrder}
              columns={columns}
              is_selectable={bulkActions.length > 0}
            />
          </tfoot>

        </table>
        <div className="tablenav bottom">
          <ListingBulkActions
            count={this.state.count}
            bulk_actions={bulkActions}
            selection={this.state.selection}
            selected_ids={this.state.selected_ids}
            onBulkAction={this.handleBulkAction}
          />
          <ListingPages
            count={this.state.count}
            page={this.state.page}
            limit={this.state.limit}
            onSetPage={this.handleSetPage}
          />
        </div>
      </div>
    );
  },
});

module.exports = Listing;
