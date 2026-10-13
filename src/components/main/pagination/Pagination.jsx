import { useContext } from "react";
import classes from "./Pagination.module.css";
import PaginationContext from "../../../store/pagination-context";
import ChevronButton from "../../ui/ChevronButton";
import ObjectsPerPage from "./ObjectsPerPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const ViewingPageXofY = ({ min, max }) => {
  return (
    <div>
      <p>Viewing {min}-{max}</p>
    </div>
  );
};

const PageControls = ({
  reachedStart,
  onPreviousPageClick,
  reachedEnd,
  onNextPageClick,
  isLoading,
}) => {
  return (
    <div className={classes["page-controls"]}>
      <ChevronButton
        disabled={isLoading || reachedStart}
        onClick={onPreviousPageClick}
        chevron="left"
      />
      <ChevronButton
        disabled={isLoading || reachedEnd}
        onClick={onNextPageClick}
        chevron="right"
      />
    </div>
  );
};

const Pagination = ({ onPreviousPageClick, onNextPageClick, isLoading }) => {
  const paginationCtx = useContext(PaginationContext);
  const hasVisibleRange =
    paginationCtx.maxPageKey >= paginationCtx.minPageKey;

  return (
    <div className={classes.container}>
      <ObjectsPerPage disabled={isLoading} />
      {isLoading && (
        <div className={classes.loadingStatus} role="status">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Loading page...</span>
        </div>
      )}
      {hasVisibleRange && (
        <ViewingPageXofY
          min={paginationCtx.minPageKey}
          max={paginationCtx.maxPageKey}
        />
      )}
      <PageControls
        onPreviousPageClick={onPreviousPageClick}
        onNextPageClick={onNextPageClick}
        reachedStart={paginationCtx.reachedStart}
        reachedEnd={paginationCtx.reachedEnd}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Pagination;