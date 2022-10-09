import Bucket from "./Bucket";
import classes from "./Buckets.module.css";

const Buckets = ({buckets, onClick}) => {
  return (
    <div>
      <div className="h2-container">
        <h2>Bucket List</h2>
      </div>
      <div className={classes.buckets}>
        {buckets.map((bucket, index) => {
          return (
            <Bucket
              key={index}
              description={bucket.Name}
              onClick={onClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Buckets;
