import { Fragment } from "react";
import ReactTooltip from "react-tooltip";
import classes from "./Folder.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";

const Folder = ({ prefix, onClick, description }) => (
  <Fragment>
    <ReactTooltip />
    <button
      type="button"
      className={classes.container}
      data-prefix={prefix}
      onClick={onClick}
      data-tip={description}
      data-background-color="#061f33"
    >
      <span className={classes.icon}>
        <FontAwesomeIcon icon={faFolder} />
      </span>
      <span className={classes.description}>
        <span className={classes.font}>{description}</span>
      </span>
    </button>
  </Fragment>
);

export default Folder;
