import React from 'react';

const FormFieldTextarea = () => (
  <textarea
    type="text"
    className="regular-text"
    name={this.props.field.name}
    id={`field_${this.props.field.name}`}
    value={this.props.item[this.props.field.name]}
    placeholder={this.props.field.placeholder}
    defaultValue={this.props.field.defaultValue}
    onChange={this.props.onValueChange}
    {...this.props.field.validation}
  />
);

export default FormFieldTextarea;
