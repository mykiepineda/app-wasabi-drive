import classes from "./Files.module.css";
import File from "./File";

const Files = ({ fileList, viewMode }) => {
  return (
    <div>
      <div className="h2-container">
        <h2>Files</h2>
      </div>
      <div className={viewMode === "list" ? classes.list : classes.files}>
        {fileList.map((file) => (
          <File
            key={file.key}
            prefix={file.key}
            description={file.description}
            accessUrl={file.accessUrl}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

export default Files;
