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
    <div className="w-full rounded-2xl bg-white shadow-lg border border-gray-100">
      <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-5">
        
        {/* Header */}
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900">
          <SelectedIcon className="text-[#7047C7] text-lg sm:text-xl" />
          <h2 className="truncate">{title}</h2>
        </div>

        {/* Content */}
        <h2 className={`${textSize[text]} font-semibold break-words text-gray-800`}>
          {content}
        </h2>

        {/* Footer */}
        <div className="flex flex-col gap-3 mt-2">
          {server && (
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
          )}

          {progressBar && (
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: "88%" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

 

export default Card;