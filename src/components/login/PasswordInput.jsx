import { Fragment } from "react";
import classes from "./PasswordInput.module.css";

const PasswordInput = ({ onPasswordChange }) => {
  return (
    <Fragment>
      <label htmlFor="password">Password</label>
      <div className={classes["input-container"]}>
        <input
          id="password"
          type="password"
          onChange={onPasswordChange}
        ></input>
      </div>
    </Fragment>
  );
};

export default PasswordInput;
