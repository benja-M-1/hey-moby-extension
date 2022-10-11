import MicRoundedIcon from "@mui/icons-material/MicRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import { Avatar, Grid, Typography, useMediaQuery } from "@mui/material";
import Button from "@mui/material/Button";

interface Props {
  listening: boolean;
  startListening: () => void;
}

export function NoConversation({ listening, startListening }: Props) {
  const isDarkTheme = useMediaQuery("(prefers-color-scheme: dark)");

  // @ts-expect-error This is an experimental but that is supported in Electron (see
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
  const isMacOS = navigator.userAgentData?.platform === "macOS" || true;

  return (
    <Grid
      container
      flex={1}
      sx={{ width: "100%" }}
      justifyContent="center"
      alignItems="center"
      direction="column"
    >
      <Grid
        item
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Avatar
          variant="circular"
          sx={{
            width: 56,
            height: 56,
            // FIXME: the theme mode and the colors should come from the theme but it is not currently
            //bgcolor: (theme) => useDarkTheme ? theme.palette.grey[400] : theme.palette.grey[200],
            bgcolor: isDarkTheme ? "#465C6E" : "#E1E2E6",
          }}
        >
          <TipsAndUpdatesRoundedIcon />
        </Avatar>
        <Typography variant="body1" marginTop={2}>
          {`Try something like "Hey Moby, how are you?"`}
        </Typography>
        <Typography variant="body1">
          {`Or "Hey Moby, run a node container"`}
        </Typography>
        {!listening && !isMacOS && (
          <>
            <Typography variant="body1" mt={2}>
              You can even say it to me!
            </Typography>
            <Button
              variant="contained"
              startIcon={<MicRoundedIcon />}
              size="large"
              onClick={startListening}
              sx={{ mt: 1 }}
            >
              Click to talk
            </Button>
          </>
        )}
      </Grid>
    </Grid>
  );
}
