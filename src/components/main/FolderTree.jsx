import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBucket, faChevronDown, faChevronRight, faFolder } from "@fortawesome/free-solid-svg-icons";
import classes from "./FolderTree.module.css";

const keyFor = (bucket, prefix) => bucket + "::" + prefix;

const FolderTree = ({
  buckets,
  selectedBucket,
  selectedPrefix,
  onSelectBucket,
  onSelectPrefix,
  loadFolders,
  onError,
}) => {
  const [cache, setCache] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleBranch = async (bucket, prefix) => {
    const key = keyFor(bucket, prefix);
    if (expanded[key]) {
      setExpanded((current) => ({ ...current, [key]: false }));
      return;
    }
    setExpanded((current) => ({ ...current, [key]: true }));
    if (cache[key] !== undefined || loading[key]) return;

    setLoading((current) => ({ ...current, [key]: true }));
    try {
      const folders = await loadFolders(bucket, prefix);
      setCache((current) => ({ ...current, [key]: folders }));
    } catch {
      onError("Could not load folders. Try expanding again.");
      setExpanded((current) => ({ ...current, [key]: false }));
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  };

  const renderFolders = (bucket, prefix, depth) => {
    const key = keyFor(bucket, prefix);
    return (cache[key] || []).map((folder) => {
      const childKey = keyFor(bucket, folder.prefix);
      const isExpanded = Boolean(expanded[childKey]);
      const isSelected = selectedPrefix === folder.prefix;
      return (
        <li key={folder.prefix}>
          <div className={classes.row} style={{ "--depth": depth }}>
            <button
              type="button"
              className={classes.expander}
              aria-label={(isExpanded ? "Collapse " : "Expand ") + folder.description}
              aria-expanded={isExpanded}
              onClick={() => toggleBranch(bucket, folder.prefix)}
            >
              <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
            </button>
            <button
              type="button"
              className={classes.item}
              aria-current={isSelected ? "page" : undefined}
              onClick={() => onSelectPrefix(folder.prefix)}
            >
              <FontAwesomeIcon className={classes.folderIcon} icon={faFolder} />
              <span title={folder.description}>{folder.description}</span>
            </button>
          </div>
          {isExpanded && (
            <ul>{loading[childKey] ? <li className={classes.loading}>Loading...</li> : renderFolders(bucket, folder.prefix, depth + 1)}</ul>
          )}
        </li>
      );
    });
  };

  return (
    <aside className={classes.sidebar}>
      <button
        type="button"
        className={classes.mobileToggle}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? "Hide folders" : "Browse folders"}
        <FontAwesomeIcon icon={mobileOpen ? faChevronDown : faChevronRight} />
      </button>
      <div className={mobileOpen ? classes.panelOpen : classes.panel}>
        <h2 className={classes.title}>Browse</h2>
        <ul className={classes.tree}>
          {buckets.map((bucket) => {
            const rootKey = keyFor(bucket.Name, "");
            const isExpanded = Boolean(expanded[rootKey]);
            const isSelected = selectedBucket === bucket.Name && !selectedPrefix;
            return (
              <li key={bucket.Name}>
                <div className={classes.row} style={{ "--depth": 0 }}>
                  <button
                    type="button"
                    className={classes.expander}
                    aria-label={(isExpanded ? "Collapse " : "Expand ") + bucket.Name}
                    aria-expanded={isExpanded}
                    onClick={() => toggleBranch(bucket.Name, "")}
                  >
                    <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
                  </button>
                  <button
                    type="button"
                    className={classes.item}
                    aria-current={isSelected ? "page" : undefined}
                    onClick={() => onSelectBucket(bucket.Name)}
                  >
                    <FontAwesomeIcon className={classes.bucketIcon} icon={faBucket} />
                    <span title={bucket.Name}>{bucket.Name}</span>
                  </button>
                </div>
                {isExpanded && (
                  <ul>{loading[rootKey] ? <li className={classes.loading}>Loading...</li> : renderFolders(bucket.Name, "", 1)}</ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default FolderTree;
