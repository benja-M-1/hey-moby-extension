import { Stack, Typography } from "@mui/material";

export function Header() {
  return (
    <>
      <Typography variant="h3" role="title">
        Hey Moby 👋
      </Typography>
      <Stack direction="row" justifyContent="space-between" mt={2}>
        <Typography variant="body1" color="text.secondary">
          🐳 Tell me what you want me to add in you dockerfiles or compose stack
        </Typography>
      </Stack>
    </>
  );
}
