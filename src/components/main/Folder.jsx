import { Fragment } from "react";
import ReactTooltip from "react-tooltip";
import classes from "./Folder.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";

const Folder = ({ htmlKey, prefix, onClick, description }) => {
  return (
    <Fragment>
      <ReactTooltip />
      <div
        key={htmlKey}
        role="button"
        className={classes.container}
        data-prefix={prefix}
        onClick={onClick}
        data-tip={description}
        data-background-color="#061f33"
      >
        <div className={classes.icon}>
          <FontAwesomeIcon icon={faFolder} />
        </div>
        <div className={`${classes.description} ${classes.font}`}>
          <div>{description}</div>
        </div>
      </div>
    </Fragment>
  );
};

export default Folder;
