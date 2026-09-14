import { useMsal } from "@azure/msal-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTerminal,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import classes from "./Links.module.css";
import { msalConfig } from "../../auth/msal-config";

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

const Logout = () => {
  const { instance, accounts } = useMsal();

  const logoutHandler = () => {
    instance.logoutRedirect({
      account: accounts[0],
      postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
    });
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

const User = () => {
  const { accounts } = useMsal();
  const account = accounts[0];

  return (
    <div className={classes.user}>
      <FontAwesomeIcon icon={faUser} />
      <p>{account?.username || account?.name}</p>
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
