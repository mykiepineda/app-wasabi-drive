import classes from "./Files.module.css";
import File from "./File";

const Files = ({ fileList, onClick }) => {
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
            accessUrl={file.accessUrl}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Files;
