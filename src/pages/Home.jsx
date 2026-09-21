import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import classes from "./Home.module.css";
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

const encodePrefix = (prefix) =>
  prefix
    .split("/")
    .map((component) => encodeURIComponent(component))
    .join("/");

const breadcrumbsReducer = (state, action) => {
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
  } else {
    return state.splice(0, idx + 1);
  }
};

const Home = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [contents, setContents] = useState({
    breadcrumbs: [],
    buckets: [],
    folders: [],
    files: [],
  });
  const initialNavigationState = {
    isHomePage: true,
    bucket: null,
    prefix: null,
  };
  const [navigation, setNavigation] = useState(initialNavigationState);
  const [bucketContext, setBucketContext] = useState({
    name: null,
    region: null,
  });
  const initialPaginationContext = {
    maxKeys: 10,
    onMaxKeysChange: (maxKeys) => {
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
  };
  const [paginationContext, setPaginationContext] = useState(
    initialPaginationContext
  );
  const [turnPage, setTurnPage] = useState({
    switch: false,
    direction: null,
  });

  useEffect(() => {
    const fetchBuckets = async () => {
      const response = await authenticatedFetch(
        instance,
        account,
        `${process.env.REACT_APP_API_URL}/buckets`,
        {
          method: "GET",
        }
      );
      if (!response) {
        return;
      }
      const results = await response.json();
      const buckets = results.Buckets;
      const initialBreadcrumbsState = [
        {
          target: "Buckets",
          onClick: () => setNavigation(initialNavigationState),
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
        }
      );
      if (!response) {
        return null;
      }
      return await response.json();
    };

    const fetchObjects = async () => {
      const { bucket, prefix } = navigation;
      const {
        maxKeys,
        pageHistoryIndex,
        pageHistory,
      } = paginationContext;

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
      });
      if (!response) {
        return;
      }
      const body = await response.json();

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

      setPaginationContext((prevState) => {
        let minPageKey = 1;
        const keyCount = body.KeyCount ?? folders.length + files.length;
        const maxPageKey =
          pageHistoryIndex * maxKeys + keyCount;

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

      setContents((prevState) => {
        return {
          breadcrumbs: breadcrumbsReducer(prevState.breadcrumbs, breadcrumb),
          buckets: [],
          folders,
          files,
        };
      });

      setIsLoading(false);
    };

    // Main
    setIsLoading(true);
    setErrorMessage(null);
    const fetchPage = navigation.isHomePage ? fetchBuckets : fetchObjects;

    fetchPage()
      .catch((error) => {
        setContents({
          breadcrumbs: [],
          buckets: [],
          folders: [],
          files: [],
        });
        setErrorMessage(
          error instanceof ApiRequestError
            ? error.message
            : API_ERROR_MESSAGES.service
        );
      })
      .finally(() => setIsLoading(false));
  }, [account, instance, navigation, turnPage]);

  const objectClickHandler = (event) => {
    event.stopPropagation();
    setPaginationContext((prevState) => {
      return { ...initialPaginationContext, maxKeys: prevState.maxKeys };
    });
    setTurnPage((prevState) => ({
      switch: !prevState.switch,
      direction: null,
    }));
    const prefix = event.currentTarget.dataset.prefix;
    setNavigation((prevState) => {
      return {
        isHomePage: false,
        bucket: prevState.bucket,
        prefix,
      };
    });
  };

  const bucketClickHandler = (event) => {
    event.stopPropagation();
    setPaginationContext((prevState) => ({
      ...initialPaginationContext,
      maxKeys: prevState.maxKeys,
    }));
    const bucket = event.currentTarget.innerText;
    setNavigation({
      isHomePage: false,
      bucket,
      prefix: null,
    });
  };

  const previousPageClickHandler = (event) => {
    event.stopPropagation();
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
          {isLoading && <Spinner />}
          {errorMessage ? (
            <p role="alert">{errorMessage}</p>
          ) : (
            <Contents
              contents={contents}
              onBucketClick={bucketClickHandler}
              onObjectClick={objectClickHandler}
              onPreviousPageClick={previousPageClickHandler}
              onNextPageClick={nextPageClickHandler}
              isHomePage={navigation.isHomePage}
            />
          )}
        </main>
      </BucketContext.Provider>
    </PaginationContext.Provider>
  );
};

export default Home;
