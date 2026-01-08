import { FaBook, FaGripfire } from "react-icons/fa";
import React from "react";
import { IoDiamond } from "react-icons/io5";
import { LuCrown } from "react-icons/lu";

const Card = ({
  title,
  icon,
  content,
  server,
  progressBar = false,
  text = "xl",
}) => {
  const iconMap = {
    FaBook,
    FaGripfire,
    IoDiamond,
    LuCrown,
  };

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl sm:text-2xl",
  };

  const SelectedIcon = iconMap[icon] || LuCrown;

  return (
    <div className="card w-full bg-base-100 shadow-sm border border-base-200">
      <div className="card-body gap-3 sm:gap-4 p-4 sm:p-5">
        
        {/* Header */}
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold">
          <SelectedIcon className="text-primary text-lg sm:text-xl" />
          <h2 className="truncate">{title}</h2>
        </div>

        {/* Content */}
        <h2 className={`${textSize[text]} font-semibold break-words`}>
          {content}
        </h2>

        {/* Footer */}
        <div className="flex flex-col gap-3 mt-2">
          {server && (
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
              </span>
              <p className="text-sm opacity-70">Coming Soon</p>
            </div>
          )}

          {progressBar && (
            <progress
              className="progress progress-success w-full"
              value="88"
              max="100"
            />
          )}
        </div>
      </div>
    </div>
  );
};

 

export default Card;
