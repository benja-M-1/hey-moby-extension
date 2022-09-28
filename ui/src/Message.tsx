import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardProps,
  CircularProgress,
  Typography,
} from "@mui/material";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { Message as MessageType } from "./Conversation";

interface Props extends Omit<CardProps, "variant"> {
  message: MessageType;
}

export function Message({ message, ...props }: Props) {
  return (
    <Card variant="outlined" {...props}>
      <CardHeader
        avatar={<Avatar>{message.author.slice(0, 1)}</Avatar>}
        title={message.author}
        subheader={
          message.createdAt &&
          formatDistanceToNow(message.createdAt, { addSuffix: true })
        }
      />
      <CardContent>
        <Typography mt={1} whiteSpace="pre-line">
          {!message.isSent && <CircularProgress size={14} />}
          {message.content}
        </Typography>
      </CardContent>
    </Card>
  );
}
