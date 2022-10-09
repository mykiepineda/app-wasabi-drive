import classes from "./ChevronButton.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const ButtonIcon = ({ chevron }) => {
  const icon = chevron === "left" ? faChevronLeft : faChevronRight;
  return (
    <div>
      <FontAwesomeIcon icon={icon} size="xs" />
    </div>
  );
};

const ChevronButton = ({ disabled, chevron, onClick }) => {
  if (disabled) {
    return (
      <button className={`${classes.button} ${classes.disabled}`}>
        <ButtonIcon chevron={chevron} />
      </button>
    );
  }
  return (
    <button className={classes.button} onClick={onClick}>
      <ButtonIcon chevron={chevron} />
    </button>
  );
};

export default ChevronButton;
