import { Fragment, useContext } from "react";
import Breadcrumbs from "./Breadcrumbs";
import classes from "./SubHeader.module.css";
import BucketContext from "../../store/bucket-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

const Heading = ({ heading, location }) => {
  return (
    <div className={`h1-container ${classes.header}`}>
      <h1>{heading}</h1>
      {location && (
        <div>
          <FontAwesomeIcon icon={faLocationDot} />
          <p>{location}</p>
        </div>
      )}
    </div>
  );
};

const SubHeader = ({ contents }) => {
  const bucketCtx = useContext(BucketContext);
  return (
    <section className={classes.container}>
      {bucketCtx && contents && contents.breadcrumbs.length > 1 ? (
        <Fragment>
          <Heading
            heading={bucketCtx.name}
            location={bucketCtx.region.shortDescription}
          />
          <Breadcrumbs breadcrumbs={contents.breadcrumbs} />
        </Fragment>
      ) : (
        <Heading heading="Buckets" />
      )}
    </section>
  );
};

export default SubHeader;
