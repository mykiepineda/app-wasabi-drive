import { Fragment } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Spinner from "./components/ui/Spinner";

const App = () => {
  const { accounts, inProgress } = useMsal();
  if (inProgress !== InteractionStatus.None) {
    return <Spinner />;
  }

  const isLoggedIn = accounts.length > 0;

  return (
    <Fragment>
      {!isLoggedIn && <Login />}
      {isLoggedIn && <Home />}
    </Fragment>
  );
};

export default App;
