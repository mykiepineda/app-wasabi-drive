import classes from "./Header.module.css";
import Logo from "../ui/Logo";
import Links from "./Links";

const Header = () => {
  return (
    <header className={classes.header}>
      <Logo />
      <Links />
    </header>
  );
};

export default Header;
