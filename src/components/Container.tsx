import React from "react";

export const InputContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="flex flex-col rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-geist">
      {children}
    </div>
  );
};
