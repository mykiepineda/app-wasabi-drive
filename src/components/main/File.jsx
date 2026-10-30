import ReactTooltip from "react-tooltip";
import classes from "./File.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faFileVideo,
  faFileAudio,
  faFileZipper,
  faLinkSlash,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFileCsv,
  faFileCode,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";

const IMAGE = ["jpg", "jpeg", "webp", "bmp", "png", "gif", "heic"];
const VIDEO = ["mp4", "m4v", "mov"];
const AUDIO = ["mp3"];
const ZIP = ["zip", "rar"];
const FILE_PDF = ["pdf"];
const FILE_WORD = ["doc", "docx"];
const FILE_EXCEL = ["xls", "xlsx"];
const FILE_CSV = ["csv"];
const FILE_CODE = ["htm", "html", "js", "css"];
const FILE_TXT = ["txt"];

const Card = ({ attributes }) => {
  return (
    <div className={classes["card-container"]}>
      <div className={classes.background}>
        <FontAwesomeIcon
          icon={attributes.icon}
          color={attributes.color}
          size="6x"
        />
      </div>
      <div className={classes.foreground}>{attributes.htmlText}</div>
    </div>
  );
};

const getUsablePreviewUrl = (value) => {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    return null;
  }

  try {
    const url = new URL(value);
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname
    ) {
      return value;
    }
  } catch {
    return null;
  }

  return null;
};

const ImagePreview = ({ accessUrl, thumbnailAccessUrl, description }) => {
  const originalPreviewUrl = getUsablePreviewUrl(accessUrl);
  const thumbnailPreviewUrl = getUsablePreviewUrl(thumbnailAccessUrl);
  const initialPreviewUrl = thumbnailPreviewUrl || originalPreviewUrl;
  const [previewStage, setPreviewStage] = React.useState("initial");

  const previewUrl =
    previewStage === "initial"
      ? initialPreviewUrl
      : previewStage === "original"
      ? originalPreviewUrl
      : null;

  if (previewStage === "unavailable") {
    return null;
  }

  return (
    <img
      src={previewUrl || undefined}
      alt={description}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (
          previewStage === "initial" &&
          thumbnailPreviewUrl &&
          originalPreviewUrl &&
          thumbnailPreviewUrl !== originalPreviewUrl
        ) {
          setPreviewStage("original");
        } else {
          setPreviewStage("unavailable");
        }
      }}
    />
  );
};

const File = ({
  prefix,
  accessUrl,
  thumbnailAccessUrl,
  description,
}) => {
  const idx = description.lastIndexOf(".");
  const fileExtension = description.substring(idx + 1).toLowerCase();

  let attributes = {
    fileExtension,
    icon: faLinkSlash,
    color: "black",
  };

  if (IMAGE.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faImage,
      color: "purple",
      htmlText: (
        <ImagePreview
          key={JSON.stringify([
            prefix,
            description,
            accessUrl,
            thumbnailAccessUrl,
          ])}
          accessUrl={accessUrl}
          thumbnailAccessUrl={thumbnailAccessUrl}
          description={description}
        />
      ),
    };
  }

  if (VIDEO.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileVideo,
      color: "blue",
      htmlText: (
        <video>
          <source src={accessUrl} type={`video/${fileExtension}`} />
        </video>
      ),
    };
  }

  if (AUDIO.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileAudio,
      color: "orange",
    };
  }

  if (ZIP.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileZipper,
      color: "red",
    };
  }

  if (FILE_PDF.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFilePdf,
      color: "red",
    };
  }

  if (FILE_WORD.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileWord,
      color: "blue",
    };
  }

  if (FILE_EXCEL.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileExcel,
      color: "green",
    };
  }

  if (FILE_CSV.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileCsv,
      color: "green",
    };
  }

  if (FILE_CODE.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileCode,
      color: "gray",
    };
  }

  if (FILE_TXT.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileLines,
      color: "blue",
    };
  }

  return (
    <a
      className={classes.container}
      href={accessUrl}
      target="_blank"
      rel="noreferrer"
    >
      <Card attributes={attributes} />
      <div className={classes["description-container"]}>
        <div className={classes.icon}>
          <FontAwesomeIcon icon={attributes.icon} color={attributes.color} />
        </div>
        <div className={classes.description}>
          <ReactTooltip />
          <div
            className={classes.font}
            data-tip={description}
            data-background-color="#061f33"
          >
            {description}
          </div>
        </div>
      </div>
    </a>
  );
};

export default File;
