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

const File = ({ region, bucket, prefix, description }) => {
  //TODO: Proxy URL through a CDN
  const url = `https://s3.${region}.wasabisys.com/${bucket}/${prefix}`;
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
      htmlText: <img src={url} alt={description} />,
    };
  }

  if (VIDEO.indexOf(fileExtension) >= 0) {
    attributes = {
      ...attributes,
      icon: faFileVideo,
      color: "blue",
      htmlText: (
        <video>
          <source src={url} type={`video/${fileExtension}`} />
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
      href={url}
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
