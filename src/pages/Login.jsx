import { useState, Fragment } from "react";
import { useMsal } from "@azure/msal-react";
import { ToastContainer, toast, Slide } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import classes from "./Login.module.css";
import logo from "../assets/wasabi_logo_brand_3.webp";
import { loginRequest } from "../auth/msal-config";

import "react-toastify/dist/ReactToastify.css";
import Spinner from "../components/ui/Spinner";

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
  const [isLoading, setIsLoading] = useState(false);
  const { instance } = useMsal();

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
      setIsLoading(true);
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      toast.error(<ToastMessage message={error.message} />, toastOptions);
      setIsLoading(false);
    }
  };

  return (
    <Fragment>
      {isLoading && <Spinner />}
      <div className={classes.background}>
        <ToastContainer />
        <div className={classes.modal}>
          <Logo />
          <form onSubmit={loginHandler}>
            <button
              type="submit"
              className={classes.signInButton}
              disabled={isLoading}
            >
              SIGN IN WITH MICROSOFT
            </button>
          </form>
        </div>
        <Footer />
      </div>
    </Fragment>
  );
};

export default Login;
