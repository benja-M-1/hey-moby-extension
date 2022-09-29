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
  messages: MessageType[];
}

export function CombinedMessage({ messages, sx, ...props }: Props) {
  const firstMessage = messages[0];

  return (
    <Card
      variant="outlined"
      sx={{ ...sx, "&:hover": { boxShadow: "none" } }}
      {...props}
    >
      <CardHeader
        avatar={<Avatar>{firstMessage.author.slice(0, 1)}</Avatar>}
        title={firstMessage.author}
        subheader={
          firstMessage.createdAt &&
          formatDistanceToNow(firstMessage.createdAt, { addSuffix: true })
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {messages.map((message, key) => (
          <Stack key={key} direction="row" justifyContent="space-between">
            <Typography mt={key > 0 ? 1 : 0} whiteSpace="pre-line">
              {!message.isSent && <CircularProgress size={14} />}
              {message.content}
            </Typography>
            {message.action && (
              <Link underline="always" onClick={message.action.onClick}>
                {message.action.text}
              </Link>
            )}
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
}
