import { useContext } from "react";
import classes from "./Files.module.css";
import File from "./File";
import BucketContext from "../../store/bucket-context";

const Files = ({ fileList, onClick }) => {
  const bucketCtx = useContext(BucketContext);
  return (
    <div>
      <div className="h2-container">
        <h2>Files</h2>
      </div>
      <div className={classes.files}>
        {fileList.map((file, index) => (
          <File
            key={index}
            prefix={file.key}
            description={file.description}
            bucket={bucketCtx.name}
            region={bucketCtx.region.region}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Files;
