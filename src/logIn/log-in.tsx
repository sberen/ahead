import React from 'react';
import {useForm} from './../logic/logic';

interface logInValues {
    email: string;
    password: string;
}

/**
 * Renders a page for logging into the business-side web app
 * @return {html} Form with inputs for email, input for password,
 *    and submit button
 */
const BusinessLogInPage = () => {
  const [formValues, setFormValues] = useForm({email: '', password: ''});

  return (
    <div className="form">
      <input
        type="text"
        name="email"
        value={formValues.email}
        placeholder="Business E-mail"
        onChange={setFormValues}
      />
      <input
        type="password"
        name="password"
        value={formValues.password}
        placeholder="Password"
        onChange={setFormValues}
      />
      <button onClick={() => submitFormValues(
          {
            email: formValues.email,
            password: formValues.password,
          },
      )}>Log In</button>
    </div>
  );
};

/**
 * Validates the given username and password.
 * @param {logInValues} formValues Email and password entered by the
 *    user when logging in
 */
const submitFormValues = (formValues : logInValues) => {
  // TODO: Implement function (console.log is a placeholder)
  console.log([formValues.email, formValues.password]);
};

export default BusinessLogInPage;