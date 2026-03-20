import React, { useCallback } from "react";

export const Input: React.FC<{
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
}> = ({ text, setText, disabled }) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setText(e.currentTarget.value);
    },
    [setText],
  );

  return (
    <input
      className="block w-full rounded-geist border border-white/10 bg-slate-950/70 p-geist-half text-sm leading-[1.7] text-foreground outline-none transition-colors duration-150 ease-in-out focus:border-focused-border-color"
      disabled={disabled}
      name="title"
      value={text}
      onChange={onChange}
    />
  );
};
