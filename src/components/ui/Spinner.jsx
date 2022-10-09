import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Fragment } from "react";
import classes from "./Spinner.module.css";

const Backdrop = () => {
  return <div className={classes.backdrop} />;
};

const ModalOverlay = () => {
  return (
    <div className={classes.modal}>
      <FontAwesomeIcon
        icon={faSpinner}
        spin={true}
        size="10x"
        color="rgb(0,206,62)"
      />
    </div>
  );
};

const Spinner = () => {
  return (
    <Fragment>
      {ReactDOM.createPortal(
        <Backdrop />,
        document.querySelector("#backdrop-root")
      )}
      {ReactDOM.createPortal(
        <ModalOverlay />,
        document.querySelector("#overlay-root")
      )}
    </Fragment>
  );
};

export default Spinner;
