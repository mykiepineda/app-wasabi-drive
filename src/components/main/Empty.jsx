import classes from "./Empty.module.css";

const Empty = () => {
  return (
    <div>
      <div className="h2-container">
        <h2>Objects</h2>
      </div>
      <div className={classes.message}>
        <h3>Your Bucket Is Empty</h3>
        <p>Login to your Wasabi Console Management to upload files or folders</p>
      </div>
    </div>
  );
};

export default Empty;
