import { FaBook, FaGripfire } from "react-icons/fa";
import React from "react";
import { IoDiamond } from "react-icons/io5";
import { LuCrown } from "react-icons/lu";

const Card = ({ title, icon, content, server , size = "64", progressBar =false, text="xl"  }) => {
  console.log(icon);
  const iconMap = {
    FaBook: FaBook,
    FaGripfire: FaGripfire,
    IoDiamond: IoDiamond,
    LuCrown: LuCrown,
  };

  const textSize= {
    sm: "text-sm font-  ",
    md: "text-md ",
    lg: "text-lg",
    xl: "text-2xl",
  }

  const SelectedIcon = iconMap[icon];
  console.log("server",server);
  return (
    <>
      <div
        className={`card w-${size} bg-base-100 shadow-sm border border-base-200`}
      >
        <div className="card-body gap-4">
          {/* Header Section */}
          <div className="flex items-center gap-2 text-xl font-bsold">
            {SelectedIcon ? (
              <SelectedIcon className="text-primary" />
            ) : (
              <LuCrown className="text-primary" /> // Fallback icon
            )}
            <h2>{title}</h2>
          </div>

          {/* Main Value */}
          <h2 className={`text-4xl ${textSize[text] || ""} `}>
            {content}
          </h2>

          {/* Status and Progress Section */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Status Indicator */}
            {server ? (
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </div>
                <p className="text-sm font-medium opacity-70">Vetern scholar</p>
              </div>
            ) : (
              " "
            )}

            {/* Progress Bar */}
            {progressBar ? (
              <progress
                className="progress progress-success w-full"
                value="88"
                max="100"
              ></progress>
            ) : (
              " "
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Card;
