import { Fragment } from "react";
import classes from "./Form.module.css";
import PasswordInput from "./PasswordInput";

const Account = ({ onAccountChange }) => {
  return (
    <Fragment>
      <label htmlFor="account">Root Account Email or Alias</label>
      <div className={classes["input-container"]}>
        <input
          id="account"
          type="text"
          className={classes.focus}
          onChange={onAccountChange}
        ></input>
      </div>
    </Fragment>
  );
};

const Button = ({ buttonClasses }) => {
  return (
    <button type="submit" className={buttonClasses}>
      SIGN IN
    </button>
  );
};

const Form = ({
  onAccountChange,
  onPasswordChange,
  onSubmit,
  isButtonDisabled,
}) => {
  const buttonClasses = isButtonDisabled
    ? `${classes.button} ${classes.disabled}`
    : classes.button;
  return (
    <form onSubmit={onSubmit}>
      <Account onAccountChange={onAccountChange} />
      <PasswordInput onPasswordChange={onPasswordChange} />
      <Button buttonClasses={buttonClasses} />
    </form>
  );
};

export default Form;
