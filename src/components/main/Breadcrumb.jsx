import { Fragment } from "react";
import classes from "./Breadcrumb.module.css";

const Breadcrumb = ({isActive, description, prefix, onClick}) => {
  return (
    <div className={classes.container}>
      {isActive && (
        <div className={`${classes.link} ${classes.active}`}>
          {description}
        </div>
      )}
      {!isActive && (
        <Fragment>
          <div
            className={classes.link}
            data-prefix={prefix}
            onClick={onClick}
          >
            {description}
          </div>
          <div>/</div>
        </Fragment>
      )}
    </div>
  );
};

export default Breadcrumb;
