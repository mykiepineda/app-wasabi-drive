import { Fragment } from "react";
import ReactTooltip from "react-tooltip";
import classes from "./Bucket.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBucket } from "@fortawesome/free-solid-svg-icons";

const Bucket = ({region, onClick, description}) => {
  return (
    <Fragment>
      <ReactTooltip />
      <div
        role="button"
        data-region={region}
        className={classes.container}
        onClick={onClick}
        data-tip={description}
        data-background-color="#061f33"
      >
        <div className={classes.icon}>
          <FontAwesomeIcon icon={faBucket} color="rgb(0,206,62)" />
        </div>
        <div className={classes.description}>
          <div className={classes.font}>{description}</div>
        </div>
      </div>
    </Fragment>
  );
};

export default Bucket;
