import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Switch, Route, Redirect,
} from 'react-router-dom';

import StepMethodSelection from './import/step_method_selection.jsx';
import StepInputValidation from './import/step_input_validation.jsx';
import StepDataManipulation from './import/step_data_manipulation.jsx';

const container = document.getElementById('import_container');

const subscribersLimitForValidation = 500;

const ImportSubscribers = () => {
  const [stepMethodSelectionData, setStepMethodSelectionData] = useState(undefined);
  return (
    <HashRouter>
      <Switch>
        <Route
          path="/step_method_selection"
          render={props => (
            <StepMethodSelection
              {...props}
              setStepMethodSelectionData={setStepMethodSelectionData}
              subscribersLimitForValidation={subscribersLimitForValidation}
            />
          )}
        />
        <Route
          path="/step_input_validation"
          render={props => (
            <StepInputValidation
              {...props}
              stepMethodSelectionData={stepMethodSelectionData}
            />
          )}
        />
        <Route
          path="/step_data_manipulation"
          render={props => (
            <StepDataManipulation
              {...props}
              stepMethodSelectionData={stepMethodSelectionData}
              subscribersLimitForValidation={subscribersLimitForValidation}
            />
          )}
        />
        <Route
          path="*"
          render={() => <Redirect to="/step_method_selection" />}
        />
      </Switch>
    </HashRouter>
  );
};

if (container) {
  ReactDOM.render(<ImportSubscribers />, container);
}
