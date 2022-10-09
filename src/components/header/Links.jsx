import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTerminal,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import classes from "./Links.module.css";
import AuthContext from "../../store/auth-context";

const ConsoleManagement = () => {
  return (
    <a
      className={classes.console}
      href="https://console.wasabisys.com/#/login"
      target="_blank"
      rel="noreferrer"
    >
      <div>
        <FontAwesomeIcon icon={faTerminal} />
      </div>
      <p>Console Management</p>
    </a>
  );
};

const Logout = ({ logout }) => {
  const authCtx = useContext(AuthContext);

  const logoutHandler = () => {
    authCtx.logout();
  };

  return (
    <div className={classes.logout}>
      <div>
        <FontAwesomeIcon icon={faRightFromBracket} />
      </div>
      <button onClick={logoutHandler}>Logout</button>
    </div>
  );
};

const User = ({ user }) => {
  const authCtx = useContext(AuthContext);
  return (
    <div className={classes.user}>
      <FontAwesomeIcon icon={faUser} />
      <p>{authCtx.user}</p>
    </div>
  );
};

const Links = () => {
  return (
    <div className={classes.links}>
      <ul>
        <li className={classes.link}>
          <ConsoleManagement />
        </li>
        <li className={classes.link}>
          <Logout />
        </li>
        <li>
          <User />
        </li>
      </ul>
    </div>
  );
};

export default Links;
