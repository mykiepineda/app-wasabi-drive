import { render, screen } from "@testing-library/react";
import PaginationContext from "../../../store/pagination-context";
import Pagination from "./Pagination";

test("shows the current visible range without requiring an exact total", () => {
  render(
    <PaginationContext.Provider
      value={{
        maxKeys: 10,
        onMaxKeysChange: jest.fn(),
        minPageKey: 11,
        maxPageKey: 20,
        reachedStart: false,
        reachedEnd: false,
      }}
    >
      <Pagination
        onPreviousPageClick={jest.fn()}
        onNextPageClick={jest.fn()}
      />
    </PaginationContext.Provider>
  );

  expect(screen.getByText("Viewing 11-20")).toBeInTheDocument();
  expect(screen.queryByText(/\bof\b/i)).not.toBeInTheDocument();
});

test("does not show an invalid visible range while results are unavailable", () => {
  render(
    <PaginationContext.Provider
      value={{
        maxKeys: 10,
        onMaxKeysChange: jest.fn(),
        minPageKey: 1,
        maxPageKey: 0,
        reachedStart: true,
        reachedEnd: true,
      }}
    >
      <Pagination
        onPreviousPageClick={jest.fn()}
        onNextPageClick={jest.fn()}
      />
    </PaginationContext.Provider>
  );

  expect(screen.queryByText(/^Viewing /)).not.toBeInTheDocument();
});