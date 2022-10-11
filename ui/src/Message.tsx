import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardProps,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { TimestampedMessage } from "./hooks/useMessagesContext";

interface Props extends Omit<CardProps, "variant"> {
  message: TimestampedMessage;
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
      <CardContent sx={{ pt: 0 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography whiteSpace="pre-line">{message.content}</Typography>
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
