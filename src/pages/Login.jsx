import { useState, useContext, Fragment } from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import classes from "./Login.module.css";
import logo from "../assets/wasabi_logo_brand_3.webp";
import AuthContext from "../store/auth-context";

import "react-toastify/dist/ReactToastify.css";
import Spinner from "../components/ui/Spinner";
import Form from "../components/login/Form";
import ForgotPassword from "../components/login/ForgotPassword";

const ToastMessage = ({ message }) => {
  return (
    <div>
      <h4>Error</h4>
      <p>{message}</p>
    </div>
  );
};

const Logo = () => {
  return (
    <div className={classes.brand}>
      <img src={logo} />
      <h1>drive</h1>
    </div>
  );
};

const Footer = () => {
  return (
    <div className={classes.footer}>
      <span>
        by{" "}
        <a href="https://inihaw.co.nz" target="_blank" rel="noreferrer">
          inihaw.co.nz
        </a>
      </span>
    </div>
  );
};

const Login = () => {
  const [enteredAccount, setEnteredAccount] = useState();
  const [enteredPassword, setEnteredPassword] = useState();
  const [disableSignIn, setDisableSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const authCtx = useContext(AuthContext);

  const loginHandler = async (event) => {
    const toastOptions = {
      toastId: "toast-id",
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      theme: "colored",
      icon: <FontAwesomeIcon icon={faTriangleExclamation} />,
      transition: Slide,
    };
    try {
      event.preventDefault();
      const authenticateUser = async () => {
        const payload = { name: enteredAccount, password: enteredPassword };
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/users/validate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": process.env.REACT_APP_API_KEY,
            },
            body: JSON.stringify(payload),
          }
        );
        const results = await response.json();
        setIsLoading(false);
        return results;
      };

      setIsLoading(true);

      const { isAuthenticated, token } = await authenticateUser();

      if (isAuthenticated) {
        authCtx.login(enteredAccount, token);
      } else {
        toast.error(
          <ToastMessage message="The email address and password combination is not correct!" />,
          toastOptions
        );
      }
    } catch (error) {
      toast.error(<ToastMessage message={error.message} />, toastOptions);
      setIsLoading(false);
    }
  };

  const accountChangeHandler = (event) => {
    const account = event.target.value;
    setEnteredAccount(account);
    if (account && enteredPassword) {
      setDisableSignIn(false);
    } else {
      setDisableSignIn(true);
    }
  };

  const passwordChangeHandler = (event) => {
    const password = event.target.value;
    setEnteredPassword(password);
    if (password && enteredAccount) {
      setDisableSignIn(false);
    } else {
      setDisableSignIn(true);
    }
  };

  const isButtonDisabled = disableSignIn || isLoading;

  return (
    <Fragment>
      {isLoading && <Spinner />}
      <div className={classes.background}>
        <ToastContainer />
        <div className={classes.modal}>
          <Logo />
          <Form
            onAccountChange={accountChangeHandler}
            onPasswordChange={passwordChangeHandler}
            isButtonDisabled={isButtonDisabled}
            onSubmit={loginHandler}
          />
          <ForgotPassword />
        </div>
        <Footer />
      </div>
    </Fragment>
  );
};

export default Login;
