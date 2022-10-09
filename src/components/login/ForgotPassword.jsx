import { Fragment } from "react";
import classes from "./ForgotPassword.module.css";

const Link = () => {
  return (
    <div className={classes.container}>
      <button className={classes.button}>Forgot Password?</button>
    </div>
  );
};

const ForgotPassword = () => {
  return (
    <Fragment>
      <Link />
    </Fragment>
  );
};

export default ForgotPassword;
