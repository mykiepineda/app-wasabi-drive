import { Fragment } from "react";
import ReactTooltip from "react-tooltip";
import classes from "./Bucket.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBucket } from "@fortawesome/free-solid-svg-icons";

const Bucket = ({ region, onClick, description }) => (
  <Fragment>
    <ReactTooltip />
    <button
      type="button"
      data-region={region}
      className={classes.container}
      onClick={onClick}
      data-tip={description}
      data-background-color="#061f33"
    >
      <span className={classes.icon}>
        <FontAwesomeIcon icon={faBucket} color="rgb(0,206,62)" />
      </span>
      <span className={classes.description}>
        <span className={classes.font}>{description}</span>
      </span>
    </button>
  </Fragment>
);

export default Bucket;
