import { Fragment } from "react";
import classes from "./Contents.module.css";
import Buckets from "./Buckets";
import Folders from "./Folders";
import Files from "./Files";
import Empty from "./Empty";
import SubHeader from "./SubHeader";
import FolderTree from "./FolderTree";
import Pagination from "./pagination/Pagination";

const ViewToggle = ({ viewMode, onChange }) => (
  <div className={classes.viewToggle} role="group" aria-label="File display">
    <button
      type="button"
      aria-pressed={viewMode === "grid"}
      onClick={() => onChange("grid")}
    >
      Grid
    </button>
    <button
      type="button"
      aria-pressed={viewMode === "list"}
      onClick={() => onChange("list")}
    >
      List
    </button>
  </div>
);

const Wrapper = ({
  children,
  onPreviousPageClick,
  onNextPageClick,
  viewMode,
  onViewModeChange,
  showViewToggle,
}) => (
  <section className={classes.contents}>
    <div className={classes.objects}>
      {showViewToggle && (
        <div className={classes.toolbar}>
          <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        </div>
      )}
      {children}
      <Pagination
        onPreviousPageClick={onPreviousPageClick}
        onNextPageClick={onNextPageClick}
      />
    </div>
  </section>
);

const Contents = ({
  contents,
  onBucketClick,
  onObjectClick,
  onSelectBucket,
  onSelectPrefix,
  loadTreeFolders,
  buckets,
  selectedBucket,
  selectedPrefix,
  onPreviousPageClick,
  onNextPageClick,
  isHomePage,
  viewMode,
  onViewModeChange,
}) => {
  const displayBucketContents = contents && contents.buckets.length > 0;
  const displayFolderContents = contents && contents.folders.length > 0;
  const displayFileContents = contents && contents.files.length > 0;
  const displayAllContents =
    displayBucketContents || displayFolderContents || displayFileContents;

  const bucketContents = (
    <Buckets buckets={contents.buckets} onClick={onBucketClick} />
  );
  const objectContents = (
    <Fragment>
      {displayFolderContents && (
        <Folders
          folderList={contents.folders}
          onClick={onObjectClick}
          viewMode={viewMode}
        />
      )}
      {displayFolderContents && displayFileContents && (
        <div className={classes.separator} />
      )}
      {displayFileContents && (
        <Files fileList={contents.files} viewMode={viewMode} />
      )}
      {!displayAllContents && <Empty />}
    </Fragment>
  );

  let content;
  if (isHomePage) {
    content = displayAllContents ? bucketContents : null;
  } else {
    content = objectContents;
  }

  return (
    <Fragment>
      <SubHeader contents={contents} />
      <div className={classes.workspace}>
        {!isHomePage && (
          <FolderTree
            buckets={buckets}
            selectedBucket={selectedBucket}
            selectedPrefix={selectedPrefix}
            onSelectBucket={onSelectBucket}
            onSelectPrefix={onSelectPrefix}
            loadFolders={loadTreeFolders}
          />
        )}
        {(!isHomePage || displayAllContents) && (
          <Wrapper
            onPreviousPageClick={onPreviousPageClick}
            onNextPageClick={onNextPageClick}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            showViewToggle={!isHomePage}
          >
            {content}
          </Wrapper>
        )}
      </div>
    </Fragment>
  );
};

export default Contents;
