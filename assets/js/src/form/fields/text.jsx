import React from 'react';

const FormFieldText = React.createClass({
  render() {
    const name = this.props.field.name || null;
    const item = this.props.item || {};
    let value;
    let defaultValue;
    // value should only be set when onChangeValue is configured
    if (this.props.onValueChange instanceof Function) {
      value = item[this.props.field.name];
      // set value to defaultValue if available
      value = (value === undefined) ?
        (this.props.field.defaultValue || '') : value;
    }
    // defaultValue should only be set only when value is not set
    if (!value && this.props.field.defaultValue) {
      defaultValue = this.props.field.defaultValue;
    }

    let id = this.props.field.id || null;
    if (!id && this.props.field.name) {
      id = `field_${this.props.field.name}`;
    }

    let className = this.props.field.class || null;
    if (!className && !this.props.field.size) {
      className = 'regular-text';
    }

    return (
      <input
        type="text"
        disabled={
          (this.props.field.disabled !== undefined)
          ? this.props.field.disabled(this.props.item)
          : false
        }
        className={className}
        size={
          (this.props.field.size !== 'auto' && this.props.field.size > 0)
          ? this.props.field.size
          : false
        }
        name={name}
        id={id}
        value={value}
        defaultValue={defaultValue}
        placeholder={this.props.field.placeholder}
        onChange={this.props.onValueChange}
        {...this.props.field.validation}
      />
    );
  },
});

module.exports = FormFieldText;
