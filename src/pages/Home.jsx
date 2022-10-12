import { useEffect, useState } from "react";
import classes from "./Home.module.css";
import BucketContext from "../store/bucket-context";
import PaginationContext from "../store/pagination-context";
import Spinner from "../components/ui/Spinner";
import Header from "../components/header/Header";
import Contents from "../components/main/Contents";

const TURN_PAGE_FORWARD = "forward";
const TURN_PAGE_BACKWARD = "backward";

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
  const [isLoading, setIsLoading] = useState(true);
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
    onMaxKeysChange: () => {
      setTurnPage((prevState) => ({
        switch: !prevState.switch,
        direction: null,
      }));
    },
    nextContinuationToken: null,
    keyCount: 0,
    totalKeyCount: 0,
    minPageKey: 1,
    maxPageKey: 0,
    pageHistoryIndex: 0,
    pageHistory: [],
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/buckets`, {
        method: "GET",
        headers: {
          "X-Api-Key": process.env.REACT_APP_API_KEY,
        },
      });
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
        totalKeyCount: buckets.length,
        minPageKey: 1,
        maxPageKey: buckets.length,
        reachedStart: true,
        reachedEnd: true,
        pageHistory: ["/"],
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/buckets/${bucket}/region`,
        {
          method: "GET",
          headers: {
            "X-Api-Key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      return await response.json();
    };

    const fetchObjects = async () => {
      const { bucket, prefix } = navigation;
      const {
        maxKeys,
        nextContinuationToken,
        totalKeyCount,
        keyCount,
        pageHistoryIndex,
        pageHistory,
      } = paginationContext;

      let path = `${process.env.REACT_APP_API_URL}/buckets/${bucket}/objects/`;
      let breadcrumb = null;

      if (prefix) {
        path = `${path}${prefix}`;
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

      // Pagination Query Parameters
      path = `${path}?MaxKeys=${maxKeys}`;
      let continuationToken;
      switch (turnPage.direction) {
        case TURN_PAGE_FORWARD:
          if (Math.ceil(totalKeyCount / keyCount) === pageHistory.length) {
            continuationToken = pageHistory[pageHistoryIndex];
          } else {
            continuationToken = nextContinuationToken;
          }
          break;
        case TURN_PAGE_BACKWARD:
          continuationToken = pageHistory[pageHistoryIndex];
          break;
        default:
          break;
      }
      if (continuationToken) {
        path = `${path}&ContinuationToken=${continuationToken}`;
      }

      const response = await fetch(path, {
        method: "GET",
        headers: {
          "X-Api-Key": process.env.REACT_APP_API_KEY,
        },
      });
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
          };
        });
      }

      setPaginationContext((prevState) => {
        let minPageKey = 1;
        let maxPageKey = body.KeyCount;
        let pageHistory = prevState.pageHistory;

        if (pageHistoryIndex > 0) {
          minPageKey = pageHistoryIndex * body.MaxKeys + 1;
          maxPageKey = minPageKey + body.KeyCount - 1;
        }

        if (
          (turnPage.direction === TURN_PAGE_FORWARD &&
            Math.ceil(body.TotalKeyCount / body.KeyCount) !==
              prevState.pageHistory.length) ||
          prevState.pageHistory.length === 0
        ) {
          const push = !prevState.pageHistory.some(
            (ph) => ph === body.ContinuationToken
          );
          if (push) {
            pageHistory = [
              ...prevState.pageHistory,
              body.ContinuationToken ? body.ContinuationToken : "/",
            ];
          }
        }

        const newContext = {
          ...prevState,
          reachedStart: pageHistoryIndex === 0,
          reachedEnd: maxPageKey === body.TotalKeyCount,
          keyCount: body.KeyCount,
          totalKeyCount: body.TotalKeyCount,
          nextContinuationToken: body.NextContinuationToken,
          minPageKey,
          maxPageKey,
          pageHistory,
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
    if (navigation.isHomePage) {
      fetchBuckets();
    } else {
      fetchObjects();
    }
  }, [navigation, turnPage]);

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
      pageHistoryIndex: prevState.pageHistoryIndex - 1,
    }));
    // Flick switch to trigger state change
    setTurnPage((prevState) => ({
      switch: !prevState.switch,
      direction: TURN_PAGE_BACKWARD,
    }));
  };

  const nextPageClickHandler = (event) => {
    event.stopPropagation();
    setPaginationContext((prevState) => ({
      ...prevState,
      pageHistoryIndex: prevState.pageHistoryIndex + 1,
    }));
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
          <Contents
            contents={contents}
            onBucketClick={bucketClickHandler}
            onObjectClick={objectClickHandler}
            onPreviousPageClick={previousPageClickHandler}
            onNextPageClick={nextPageClickHandler}
            isHomePage={navigation.isHomePage}
          />
        </main>
      </BucketContext.Provider>
    </PaginationContext.Provider>
  );
};

export default Home;
