import classes from "./Folders.module.css";
import Folder from "./Folder";

const Folders = ({ folderList, onClick }) => {
  return (
    <div>
      <div className="h2-container">
        <h2>Folders</h2>
      </div>
      <div className={classes.folders}>
        {folderList.map((folder, index) => (
          <Folder
            key={index}
            prefix={folder.prefix}
            onClick={onClick}
            description={folder.description}
          />
        ))}
      </div>
    </div>
  );
};

export default Folders;
