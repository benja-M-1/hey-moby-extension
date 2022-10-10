import { darken, SxProps, Theme, Typography } from "@mui/material";

export function DotProgress() {
  const size = 0.5;

  const dotStyles: SxProps<Theme> = {
    width: (theme) => theme.spacing(size),
    height: (theme) => theme.spacing(size),
    borderRadius: (theme) => theme.spacing(size),
    backgroundColor: (theme) => theme.palette.docker.grey[600],
    color: (theme) => theme.palette.docker.grey[600],
    animation: "dotFlashing 1s infinite alternate",
  };

  return (
    <Typography
      component="span"
      sx={{
        ...dotStyles,
        marginLeft: (theme) => theme.spacing(size * 2 + 0.5),
        display: "inline-block",
        position: "relative",
        animation: "dotFlashing 1s infinite linear alternate",
        animationDelay: ".5s",
        verticalAlign: "baseline",

        "&::before, &::after": {
          content: "''",
          display: "inline-block",
          position: "absolute",
          top: 0,
        },
        "&::before": {
          ...dotStyles,
          //left: 0,
          left: (theme) => theme.spacing(size * -2),
          animationDelay: "0s",
        },
        "&::after": {
          ...dotStyles,
          left: (theme) => theme.spacing(size * 2),
          animationDelay: "1s",
        },
        "@keyframes dotFlashing": {
          "0%": {
            backgroundColor: (theme) => theme.palette.docker.grey[600],
          },
          "50%, 100%": {
            backgroundColor: (theme) =>
              darken(theme.palette.docker.grey[600], 0.5),
          },
        },
      }}
    />
  );
}
