import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardProps,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { Message as MessageType } from "./Conversation";

interface Props extends Omit<CardProps, "variant"> {
  message: MessageType;
}

export function Message({ message, sx, ...props }: Props) {
  return (
    <Card
      variant="outlined"
      elevation={0}
      sx={{ ...sx, "&:hover": { boxShadow: "none" } }}
      {...props}
    >
      <CardHeader
        avatar={<Avatar>{message.author.slice(0, 1)}</Avatar>}
        title={message.author}
        subheader={
          message.createdAt &&
          formatDistanceToNow(message.createdAt, { addSuffix: true })
        }
      />
      <CardContent>
        <Stack direction="row">
          <Typography mt={1} whiteSpace="pre-line">
            {!message.isSent && <CircularProgress size={14} />}
            {message.content}
          </Typography>
          {message.action && (
            <Link underline="always" onClick={message.action.onClick}>
              {message.action.text}
            </Link>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
