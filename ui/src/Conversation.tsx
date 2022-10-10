import { Stack } from "@mui/material";
import { add, compareAsc, isBefore } from "date-fns";
import { useMemo } from "react";
import { CombinedMessage } from "./CombinedMessage";
import { Message as MessageBlock } from "./Message";
import { TimestampedMessage } from "./useMessagesContext";

interface Props {
  messages: TimestampedMessage[];
}

export function Conversation({ messages }: Props) {
  const combinedMessages: Array<TimestampedMessage | TimestampedMessage[]> =
    useMemo(() => {
      const sortedMessage = messages.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) {
          return 0;
        }
        return compareAsc(a.createdAt, b.createdAt);
      });

      return sortedMessage.reduce(
        (acc: Array<TimestampedMessage | TimestampedMessage[]>, message) => {
          if (acc.length === 0) {
            return [message];
          }

          let prevMessages =
            (acc[acc.length - 1] as TimestampedMessage[]) || [];
          let prevMessage: TimestampedMessage;
          if (Array.isArray(prevMessages)) {
            prevMessage = prevMessages[0];
          } else {
            prevMessage = prevMessages;
            prevMessages = [prevMessages];
          }

          if (
            prevMessage.author === message.author &&
            isBefore(
              message.createdAt,
              add(prevMessage.createdAt, { minutes: 1 })
            )
          ) {
            return [...acc.slice(0, -1), [...prevMessages, message]];
          }

          return [...acc, message];
        },
        []
      );
    }, [messages]);

  return (
    <Stack>
      {combinedMessages.map((message, key) => {
        if (message instanceof Array) {
          return (
            <CombinedMessage
              key={key}
              sx={{ mt: key > 0 ? 2 : 0 }}
              messages={message}
            />
          );
        }
        return (
          <MessageBlock
            key={key}
            sx={{ mt: key > 0 ? 2 : 0 }}
            message={message}
          />
        );
      })}
    </Stack>
  );
}
