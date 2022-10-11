import { Typography } from "@mui/material";
import { DotProgress } from "./DotProgress";
import { useMessagesContext } from "./hooks/useMessagesContext";

export function CurrentlyWriting() {
  const { currentlyWriting } = useMessagesContext();

  if (!currentlyWriting) {
    return null;
  }

  return (
    <Typography variant="body2" color="text.secondary" mb={2}>
      {currentlyWriting} is writing
      <DotProgress />
    </Typography>
  );
}
