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
  messages: MessageType[];
}

export function CombinedMessage({ messages, ...props }: Props) {
  const firstMessage = messages[0];

  return (
    <Card variant="outlined" {...props}>
      <CardHeader
        avatar={<Avatar>{firstMessage.author.slice(0, 1)}</Avatar>}
        title={firstMessage.author}
        subheader={
          firstMessage.createdAt &&
          formatDistanceToNow(firstMessage.createdAt, { addSuffix: true })
        }
      />
      <CardContent>
        {messages.map((message, key) => (
          <Typography key={key} mt={1} whiteSpace="pre-line">
            {!message.isSent && <CircularProgress size={14} />}
            {message.content}
          </Typography>
        ))}
      </CardContent>
    </Card>
  );
}
