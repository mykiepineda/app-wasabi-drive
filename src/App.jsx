import { Fragment, useContext } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AuthContext from "./store/auth-context";

const App = () => {
  const authCtx = useContext(AuthContext);
  const { isLoggedIn } = authCtx;
  return (
    <Fragment>
      {!isLoggedIn && <Login />}
      {isLoggedIn && <Home />}
    </Fragment>
  );
};

export default App;
