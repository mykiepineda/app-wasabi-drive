import { Fragment } from "react";
import { useMsal } from "@azure/msal-react";
import Home from "./pages/Home";
import Login from "./pages/Login";

const App = () => {
  const { accounts } = useMsal();
  const isLoggedIn = accounts.length > 0;

  return (
    <Fragment>
      {!isLoggedIn && <Login />}
      {isLoggedIn && <Home />}
    </Fragment>
  );
};

export default App;
