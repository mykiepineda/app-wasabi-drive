import classes from "./Logo.module.css";
import logo from "../../assets/wasabi_logo_brand_1.svg";

const Logo = () => {
  return (
    <div className={classes.container}>
      <img src={logo} alt="Wasabi Logo" className={classes.logo} />
      <h1 className={classes.header}>drive</h1>
    </div>
  );
};

export default Logo;
