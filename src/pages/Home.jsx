import { useCallback, useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { ToastContainer, toast, Slide } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import classes from "./Home.module.css";
import "react-toastify/dist/ReactToastify.css";
import BucketContext from "../store/bucket-context";
import PaginationContext from "../store/pagination-context";
import Spinner from "../components/ui/Spinner";
import Header from "../components/header/Header";
import Contents from "../components/main/Contents";
import {
  API_ERROR_MESSAGES,
  ApiRequestError,
  authenticatedFetch,
} from "../auth/api-client";

const TURN_PAGE_FORWARD = "forward";
const TURN_PAGE_BACKWARD = "backward";
const INITIAL_NAVIGATION_STATE = {
  isHomePage: true,
  bucket: null,
  prefix: null,
};

const ToastMessage = ({ message }) => (
  <div>
    <h4>Error</h4>
    <p>{message}</p>
  </div>
);

const homeToastOptions = {
  toastId: "home-error-toast",
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  theme: "colored",
  icon: <FontAwesomeIcon icon={faTriangleExclamation} />,
  transition: Slide,
};

const showToastError = (message) =>
  toast.error(<ToastMessage message={message} />, homeToastOptions);

const encodePrefix = (prefix) =>
  prefix
    .split("/")
    .map((component) => encodeURIComponent(component))
    .join("/");

export const breadcrumbsReducer = (state, action) => {
  let idx = -1;
  for (let i = 0; i < state.length; i++) {
    if (state[i].target === action.target) {
      idx = i;
      break;
    }
  }
  if (idx < 0) {
    const newState = {
      target: action.target,
      onClick: action.onClick,
      level: state.length + 1,
      onClickString: action.onClickString,
    };
    return [...state, newState];
  }
  return state.slice(0, idx + 1);
};

const Home = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const [loadingType, setLoadingType] = useState("initial");
  const loadTypeRef = useRef("navigation");
  const [contents, setContents] = useState({
    breadcrumbs: [],
    buckets: [],
    folders: [],
    files: [],
  });
  const [navigation, setNavigation] = useState(INITIAL_NAVIGATION_STATE);
  const [bucketList, setBucketList] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [bucketContext, setBucketContext] = useState({
    name: null,
    region: null,
  });
  const [turnPage, setTurnPage] = useState({
    switch: false,
    direction: null,
  });
  const [paginationContext, setPaginationContext] = useState({
    maxKeys: 10,
    onMaxKeysChange: (maxKeys) => {
      loadTypeRef.current = "page";
      setPaginationContext((prevState) => ({
        ...prevState,
        maxKeys,
        nextContinuationToken: null,
        minPageKey: 1,
        maxPageKey: 0,
        pageHistoryIndex: 0,
        pageHistory: [null],
        reachedStart: true,
        reachedEnd: true,
      }));
      setTurnPage((prevState) => ({
        switch: !prevState.switch,
        direction: null,
      }));
    },
    nextContinuationToken: null,
    keyCount: 0,
    minPageKey: 1,
    maxPageKey: 0,
    pageHistoryIndex: 0,
    pageHistory: [null],
    reachedStart: true,
    reachedEnd: true,
    isNotEmpty: false,
  });

  const resetPagination = useCallback(() => {
    setPaginationContext((prevState) => ({
      ...prevState,
      nextContinuationToken: null,
      keyCount: 0,
      minPageKey: 1,
      maxPageKey: 0,
      pageHistoryIndex: 0,
      pageHistory: [null],
      reachedStart: true,
      reachedEnd: true,
      isNotEmpty: false,
    }));
  }, []);

  const selectPrefix = useCallback((prefix) => {
    loadTypeRef.current = "navigation";
    resetPagination();
    setTurnPage((prevState) => ({
      switch: !prevState.switch,
      direction: null,
    }));
    setNavigation((prevState) => ({
      isHomePage: false,
      bucket: prevState.bucket,
      prefix,
    }));
  }, [resetPagination]);

  const objectClickHandler = useCallback((event) => {
    event.stopPropagation();
    selectPrefix(event.currentTarget.dataset.prefix);
  }, [selectPrefix]);

  const selectBucket = useCallback((bucket) => {
    loadTypeRef.current = "navigation";
    resetPagination();
    setNavigation({
      isHomePage: false,
      bucket,
      prefix: null,
    });
  }, [resetPagination]);

  const bucketClickHandler = useCallback((event) => {
    event.stopPropagation();
    selectBucket(event.currentTarget.innerText);
  }, [selectBucket]);

  const loadTreeFolders = useCallback(async (bucket, prefix, signal) => {
    const path = process.env.REACT_APP_API_URL + "/buckets/" +
      encodeURIComponent(bucket) + "/objects/" + (prefix ? encodePrefix(prefix) : "");
    const folders = [];
    let continuationToken = null;

    do {
      const url = new URL(path);
      url.searchParams.set("MaxKeys", "1000");
      if (continuationToken) {
        url.searchParams.set("ContinuationToken", continuationToken);
      }
      const response = await authenticatedFetch(instance, account, url.toString(), {
        method: "GET",
        signal,
      });
      if (!response || signal?.aborted) {
        return [];
      }
      const body = await response.json();
      if (signal?.aborted) {
        return [];
      }
      folders.push(...(body.CommonPrefixes || []).map(({ Prefix: childPrefix }) => ({
        prefix: childPrefix,
        description: childPrefix.substring(
          prefix ? prefix.length : 0,
          childPrefix.length - 1
        ),
      })));
      continuationToken = body.IsTruncated ? body.NextContinuationToken : null;
    } while (continuationToken && !signal?.aborted);

    return folders;
  }, [account, instance]);

  const maxKeys = navigation.isHomePage ? null : paginationContext.maxKeys;
  const pageHistoryIndex = navigation.isHomePage
    ? null
    : paginationContext.pageHistoryIndex;
  const pageHistory = navigation.isHomePage
    ? null
    : paginationContext.pageHistory;

  useEffect(() => {
    const controller = new AbortController();

    const fetchBuckets = async () => {
      const response = await authenticatedFetch(
        instance,
        account,
        `${process.env.REACT_APP_API_URL}/buckets`,
        {
          method: "GET",
          signal: controller.signal,
        }
      );
      if (!response || controller.signal.aborted) {
        return;
      }
      const results = await response.json();
      if (controller.signal.aborted) {
        return;
      }

      const buckets = results.Buckets;
      const initialBreadcrumbsState = [
        {
          target: "Buckets",
          onClick: () => {
            loadTypeRef.current = "navigation";
            setNavigation(INITIAL_NAVIGATION_STATE);
          },
          level: 1,
        },
      ];

      setPaginationContext((prevState) => ({
        ...prevState,
        keyCount: buckets.length,
        minPageKey: 1,
        maxPageKey: buckets.length,
        reachedStart: true,
        reachedEnd: true,
        nextContinuationToken: null,
        pageHistory: [null],
        pageHistoryIndex: 0,
        isNotEmpty: buckets.length > 0,
      }));

      setBucketList(buckets);
      setContents({
        breadcrumbs: initialBreadcrumbsState,
        buckets,
        folders: [],
        files: [],
      });

      setBucketContext(null);
      setIsLoading(false);
    };

    const fetchRegion = async (bucket) => {
      const response = await authenticatedFetch(
        instance,
        account,
        `${process.env.REACT_APP_API_URL}/buckets/${bucket}/region`,
        {
          method: "GET",
          signal: controller.signal,
        }
      );
      if (!response || controller.signal.aborted) {
        return null;
      }
      const region = await response.json();
      if (controller.signal.aborted) {
        return null;
      }
      return region;
    };

    const fetchObjects = async () => {
      const { bucket, prefix } = navigation;
      const path = `${process.env.REACT_APP_API_URL}/buckets/${encodeURIComponent(
        bucket
      )}/objects/`;
      let breadcrumb = null;

      if (prefix) {
        breadcrumb = {
          target: prefix,
          onClick: objectClickHandler,
        };
      } else {
        const region = await fetchRegion(bucket);
        if (controller.signal.aborted) {
          return;
        }
        setBucketContext({
          name: bucket,
          region,
        });
        breadcrumb = {
          target: bucket,
          onClick: bucketClickHandler,
        };
      }

      const url = new URL(
        `${path}${prefix ? encodePrefix(prefix) : ""}`
      );
      url.searchParams.set("MaxKeys", String(maxKeys));
      const continuationToken = pageHistory[pageHistoryIndex];
      if (continuationToken) {
        url.searchParams.set("ContinuationToken", continuationToken);
      }

      const response = await authenticatedFetch(instance, account, url.toString(), {
        method: "GET",
        signal: controller.signal,
      });
      if (!response || controller.signal.aborted) {
        return;
      }
      const body = await response.json();
      if (controller.signal.aborted) {
        return;
      }

      let folders = [];
      let files = [];

      if (body.CommonPrefixes && body.CommonPrefixes.length > 0) {
        folders = body.CommonPrefixes.map((commonPrefix) => {
          const p = commonPrefix.Prefix;
          return {
            prefix: p,
            description: p.substring(prefix ? prefix.length : 0, p.length - 1),
          };
        });
      }

      if (body.Contents && body.Contents.length > 0) {
        files = body.Contents.map((content) => {
          const key = content.Key;
          const description = prefix ? key.substring(prefix.length) : key;
          return {
            key,
            description,
            accessUrl: content.AccessUrl,
          };
        });
      }

      if (controller.signal.aborted) {
        return;
      }

      setPaginationContext((prevState) => {
        let minPageKey = 1;
        const keyCount = body.KeyCount ?? folders.length + files.length;
        const maxPageKey = pageHistoryIndex * maxKeys + keyCount;

        if (pageHistoryIndex > 0) {
          minPageKey = pageHistoryIndex * maxKeys + 1;
        }

        const newContext = {
          ...prevState,
          reachedStart: pageHistoryIndex === 0,
          reachedEnd: !body.IsTruncated || !body.NextContinuationToken,
          keyCount,
          nextContinuationToken: body.NextContinuationToken,
          minPageKey,
          maxPageKey,
          isNotEmpty: folders.length > 0 || files.length > 0,
        };
        return newContext;
      });

      if (controller.signal.aborted) {
        return;
      }

      setContents((prevState) => {
        return {
          breadcrumbs: breadcrumbsReducer(prevState.breadcrumbs, breadcrumb),
          buckets: [],
          folders,
          files,
        };
      });

      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    };

    // Main
    const nextLoadingType = hasLoadedRef.current
      ? loadTypeRef.current
      : "initial";
    loadTypeRef.current = "navigation";
    setLoadingType(nextLoadingType);
    setIsLoading(true);
    const fetchPage = navigation.isHomePage ? fetchBuckets : fetchObjects;

    fetchPage()
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") {
          return;
        }
        setContents({
          breadcrumbs: [],
          buckets: [],
          folders: [],
          files: [],
        });
        const message =
          error instanceof ApiRequestError
            ? error.message
            : API_ERROR_MESSAGES.service;
        showToastError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          hasLoadedRef.current = true;
          setHasLoaded(true);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    account,
    bucketClickHandler,
    instance,
    navigation,
    objectClickHandler,
    maxKeys,
    pageHistoryIndex,
    pageHistory,
    turnPage,
  ]);

  const previousPageClickHandler = (event) => {
    event.stopPropagation();
    loadTypeRef.current = "page";
    setPaginationContext((prevState) => ({
      ...prevState,
      pageHistoryIndex: Math.max(0, prevState.pageHistoryIndex - 1),
    }));
    // Flick switch to trigger state change
    setTurnPage((prevState) => ({
      switch: !prevState.switch,
      direction: TURN_PAGE_BACKWARD,
    }));
  };

  const nextPageClickHandler = (event) => {
    event.stopPropagation();
    loadTypeRef.current = "page";
    setPaginationContext((prevState) => {
      if (prevState.reachedEnd || !prevState.nextContinuationToken) {
        return prevState;
      }
      return {
        ...prevState,
        pageHistoryIndex: prevState.pageHistoryIndex + 1,
        pageHistory: [
          ...prevState.pageHistory.slice(0, prevState.pageHistoryIndex + 1),
          prevState.nextContinuationToken,
        ],
      };
    });
    // Flick switch to trigger state change
    setTurnPage((prevState) => ({
      switch: !prevState.switch,
      direction: TURN_PAGE_FORWARD,
    }));
  };
  return (
    <PaginationContext.Provider value={paginationContext}>
      <BucketContext.Provider value={bucketContext}>
        <Header />
        <main className={classes.root}>
          <ToastContainer />
          {isLoading && !hasLoaded ? (
            <Spinner />
          ) : (
            <Contents
              contents={contents}
              onBucketClick={bucketClickHandler}
              onObjectClick={objectClickHandler}
              onSelectBucket={selectBucket}
              onSelectPrefix={selectPrefix}
              loadTreeFolders={loadTreeFolders}
              onTreeError={showToastError}
              buckets={bucketList}
              selectedBucket={navigation.bucket}
              selectedPrefix={navigation.prefix}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onPreviousPageClick={previousPageClickHandler}
              onNextPageClick={nextPageClickHandler}
              isHomePage={navigation.isHomePage}
              isLoading={isLoading}
              loadingType={loadingType}
            />
          )}
        </main>
      </BucketContext.Provider>
    </PaginationContext.Provider>
  );
};

export default Home;
