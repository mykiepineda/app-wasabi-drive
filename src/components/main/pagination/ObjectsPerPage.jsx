import classes from "./ObjectsPerPage.module.css";
import { useContext } from "react";
import PaginationContext from "../../../store/pagination-context";

const ObjectsPerPage = () => {
  const paginationCtx = useContext(PaginationContext);

  const onSelectHandler = (event) => {
    paginationCtx.maxKeys = parseInt(event.target.value);
    paginationCtx.onMaxKeysChange();
  };

  return (
    <div className={classes.container}>
      <label htmlFor="opp">Objects per page: </label>
      <select id="opp" onChange={onSelectHandler}>
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </div>
  );
};

export default ObjectsPerPage;