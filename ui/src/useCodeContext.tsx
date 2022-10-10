import React, { createContext, useContext, useState } from "react";

type ICodeContext = {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
};

const CodeContext = createContext<ICodeContext>({
  code: "",
  setCode: (_) => undefined,
});

export function CodeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [code, setCode] = useState<string>("");

  return (
    <CodeContext.Provider
      value={{
        code,
        setCode,
      }}
    >
      {children}
    </CodeContext.Provider>
  );
}

export function useCodeContext() {
  return useContext(CodeContext);
}
