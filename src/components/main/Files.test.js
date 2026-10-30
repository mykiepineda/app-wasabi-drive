import { render, screen } from "@testing-library/react";
import Files from "./Files";

test("passes thumbnail previews through while preserving the original link", () => {
  const accessUrl =
    "https://objects.example.invalid/file?X-Amz-Signature=fake-original";
  const thumbnailAccessUrl =
    "https://objects.example.invalid/file.webp?X-Amz-Signature=fake-thumbnail";

  render(
    <Files
      fileList={[
        {
          key: "photo.jpg",
          description: "photo.jpg",
          accessUrl,
          thumbnailAccessUrl,
        },
      ]}
    />
  );

  expect(screen.getByRole("img")).toHaveAttribute("src", thumbnailAccessUrl);
  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});
