import { Box, BoxProps } from "@mui/material";
import { useEffect, useRef } from "react";

export function AutoScrollable({ children, ...props }: BoxProps) {
  const boxRef = useRef<HTMLElement>();

  useEffect(() => {
    if (boxRef.current) {
      const outer = boxRef.current;
      const observer = new ResizeObserver((entries) => {
        if (entries.length > 1) {
          return;
        }

        const entry = entries[0];
        console.log(entry.target.scrollTop, entry.target.scrollHeight);

        outer.scrollTop = entry.target.scrollHeight;
      });
      observer.observe(boxRef.current?.children[0] as HTMLElement);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxRef.current]);

  return (
    <Box ref={boxRef} overflow="auto" {...props}>
      <Box>{children}</Box>
    </Box>
  );
}
