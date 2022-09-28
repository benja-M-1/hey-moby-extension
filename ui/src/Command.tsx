import {
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

interface Props {
  requests: string[];
  responses: string[];
  currentRequest: string;
  isSpeaking: boolean;
  isWorking: boolean;
}

export function Commands({
  requests,
  responses,
  currentRequest,
  isSpeaking,
  isWorking,
}: Props) {
  return (
    <Grid container flex={1} spacing={2} mt={2} overflow="hidden" minHeight={0}>
      <Grid item flex={1}>
        <Typography variant="body1" color="text.secondary">
          You
        </Typography>
        <Stack height="100%" sx={{ overflowY: "hidden" }}>
          {requests.map((r, key) => (
            <Typography key={key}>{r}</Typography>
          ))}
          <Typography>
            {currentRequest} {isSpeaking && <CircularProgress size={14} />}
          </Typography>
        </Stack>
      </Grid>
      <Divider orientation="vertical" flexItem />
      <Grid item flex={1}>
        <Typography variant="body1" color="text.secondary">
          Me 🐳
        </Typography>
        <Stack height="100%" sx={{ overflowY: "hidden" }}>
          {responses.map((r, key) => (
            <Typography key={key}>{r}</Typography>
          ))}
          {isWorking && <CircularProgress size={14} />}
        </Stack>
      </Grid>
    </Grid>
  );
}
