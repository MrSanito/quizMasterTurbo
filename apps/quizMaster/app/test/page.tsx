import React from "react";

const images = [
  {
    name: "Teacher Vector",
    path: "/images/—Pngtree—picture of a teacher vector_11078651.png",
    psdPath: "/images/—Pngtree—picture of a teacher vector_11078651.psd",
  },
  {
    name: "Smiling Boy Cartoon (1)",
    path: "/images/—Pngtree—win clipart cartoon smiling boy_12151547 (1).png",
    psdPath: "/images/—Pngtree—win clipart cartoon smiling boy_12151547 (1).psd",
  },
  {
    name: "Smiling Boy Cartoon (2)",
    path: "/images/—Pngtree—win clipart cartoon smiling boy_12151547 (2).png",
    psdPath: "/images/—Pngtree—win clipart cartoon smiling boy_12151547 (2).psd",
  },
];

const Page = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Converted Assets Viewer
        </h1>
        <p className="text-slate-400 text-lg">
          Viewing successfully processed PSD files converted into browser-renderable PNG assets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-3xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
          >
            {/* Image container */}
            <div className="relative aspect-square w-full bg-slate-950 overflow-hidden flex items-center justify-center p-4">
              <img
                src={img.path}
                alt={img.name}
                className="max-h-full max-w-full object-contain rounded-2xl transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Info and Actions */}
            <div className="p-6 flex flex-col flex-grow justify-between border-t border-slate-800/80 bg-slate-900/30">
              <div>
                <h3 className="text-white font-bold text-lg tracking-wide mb-1">
                  {img.name}
                </h3>
                <p className="text-slate-500 text-xs truncate mb-4 font-mono">
                  {img.path.split("/").pop()}
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href={img.path}
                  download
                  className="flex-1 text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200"
                >
                  View PNG
                </a>
                <a
                  href={img.psdPath}
                  download
                  className="flex-1 text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700/50 transition-all duration-200"
                >
                  Download PSD
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
