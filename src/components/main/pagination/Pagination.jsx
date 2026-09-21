import { useContext } from "react";
import classes from "./Pagination.module.css";
import PaginationContext from "../../../store/pagination-context";
import ChevronButton from "../../ui/ChevronButton";
import ObjectsPerPage from "./ObjectsPerPage";

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
}) => {
  return (
    <div className={classes["page-controls"]}>
      <ChevronButton
        disabled={reachedStart}
        onClick={onPreviousPageClick}
        chevron="left"
      />
      <ChevronButton
        disabled={reachedEnd}
        onClick={onNextPageClick}
        chevron="right"
      />
    </div>
  );
};

const Pagination = ({ onPreviousPageClick, onNextPageClick }) => {
  const paginationCtx = useContext(PaginationContext);
  return (
    <div className={classes.container}>
      <ObjectsPerPage />
      <ViewingPageXofY
        min={paginationCtx.minPageKey}
        max={paginationCtx.maxPageKey}
      />
      <PageControls
        onPreviousPageClick={onPreviousPageClick}
        onNextPageClick={onNextPageClick}
        reachedStart={paginationCtx.reachedStart}
        reachedEnd={paginationCtx.reachedEnd}
      />
    </div>
  );
};

export default Pagination;
