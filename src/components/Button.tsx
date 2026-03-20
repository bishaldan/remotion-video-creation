import React, { forwardRef } from "react";
import { Spacing } from "./Spacing";
import { Spinner } from "./Spinner";
import { cn } from "../lib/utils";

const ButtonForward: React.ForwardRefRenderFunction<
  HTMLButtonElement,
  {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    loading?: boolean;
    secondary?: boolean;
  }
> = ({ onClick, disabled, children, loading, secondary }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center appearance-none rounded-geist border border-cyan-400/30 bg-cyan-400 px-geist-half font-geist text-sm font-semibold text-slate-950 transition-all duration-150 ease-in-out hover:border-cyan-300 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:border-unfocused-border-color disabled:bg-button-disabled-color disabled:text-disabled-text-color",
        secondary
          ? "border-white/10 bg-slate-950/70 text-foreground hover:bg-slate-900 hover:text-foreground"
          : undefined,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {loading && (
        <>
          <Spinner size={20}></Spinner>
          <Spacing></Spacing>
        </>
      )}
      {children}
    </button>
  );
};

export const Button = forwardRef(ButtonForward);
