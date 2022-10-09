import classes from "./Breadcrumbs.module.css";

import Breadcrumb from "./Breadcrumb";

const getDescription = (breadcrumb) => {
  let description = breadcrumb.target;
  if (description.endsWith("/")) {
    // Strip off last /
    description = description.substring(0, description.length - 1);
  }
  // Strip off trailing paths
  const idx = description.lastIndexOf("/");
  if (idx > 0) {
    description = description.substring(idx + 1);
  }
  return description;
};

const Breadcrumbs = ({breadcrumbs}) => {
  return (
    <section>
      <ul className={classes.breadcrumbs}>
        {breadcrumbs.map((b, i) => {
          return (
            <li key={i}>
              <Breadcrumb
                prefix={b.target}
                description={getDescription(b)}
                onClick={b.onClick}
                isActive={i === breadcrumbs.length - 1}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default Breadcrumbs;
