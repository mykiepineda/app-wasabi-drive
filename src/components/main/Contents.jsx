import { Fragment } from "react";
import classes from "./Contents.module.css";
import Buckets from "./Buckets";
import Folders from "./Folders";
import Files from "./Files";
import Empty from "./Empty";
import SubHeader from "./SubHeader";
import Pagination from "./pagination/Pagination";

const Wrapper = ({ children, onPreviousPageClick, onNextPageClick }) => {
  return (
    <section className={classes.contents}>
      <div className={classes.objects}>
        {children}
        <Pagination
          onPreviousPageClick={onPreviousPageClick}
          onNextPageClick={onNextPageClick}
        />
      </div>
    </section>
  );
};

const Contents = ({
  contents,
  onBucketClick,
  onObjectClick,
  onPreviousPageClick,
  onNextPageClick,
  isHomePage,
}) => {
  const displayBucketsContents = contents && contents.buckets.length > 0;
  const displayFolderContents = contents && contents.folders.length > 0;
  const displayFileContents = contents && contents.files.length > 0;
  const displayAllContents =
    displayBucketsContents || displayFolderContents || displayFileContents;

  const bucketContents = (
    <Buckets buckets={contents.buckets} onClick={onBucketClick} />
  );

  const objectContents = (
    <Fragment>
      {displayFolderContents && (
        <Folders folderList={contents.folders} onClick={onObjectClick} />
      )}
      {displayFolderContents && displayFileContents && (
        <div className={classes.separator} />
      )}
      {displayFileContents && (
        <Files fileList={contents.files} onClick={onObjectClick} />
      )}
      {!displayAllContents && <Empty />}
    </Fragment>
  );

  const wrapper = (
    <Wrapper
      onPreviousPageClick={onPreviousPageClick}
      onNextPageClick={onNextPageClick}
    >
      {displayBucketsContents ? bucketContents : objectContents}
    </Wrapper>
  );

  let subPage;

  if (isHomePage) {
    if (displayAllContents) {
      subPage = wrapper;
    }
  } else {
    subPage = wrapper;
  }

  return (
    <Fragment>
      <SubHeader contents={contents} />
      {subPage}
    </Fragment>
  );
};

export default Contents;
