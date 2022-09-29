import SendIcon from "@mui/icons-material/Send";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Message } from "./Conversation";

interface Props {
  message?: Message;
  autoSave: boolean;
  onSend: (message: Message) => void;
}

export function MessageEditor({ message, autoSave, onSend }: Props) {
  const [willAutoSave, setWillAutoSave] = useState(false);
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (content.trim().length === 0) {
      return;
    }

    onSend({
      author: "You",
      content: content
        .replace(/^\s+|\s+$/g, "")
        .trim()
        .toLowerCase(),
      createdAt: new Date(),
      isSent: true,
    });
    setContent("");
  };

  useEffect(() => {
    if (message) {
      setContent(message.content);
    }
  }, [message]);

  useEffect(() => {
    if (autoSave) {
      setWillAutoSave(true);
    }

    if (!autoSave && willAutoSave) {
      handleSend();
      setWillAutoSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, willAutoSave]);

  return (
    <FormControl fullWidth>
      <InputLabel htmlFor="message">Message</InputLabel>
      <OutlinedInput
        id="message"
        label="Message"
        multiline
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              color="primary"
              disabled={content.length === 0}
              onClick={handleSend}
            >
              <SendIcon />
            </IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
  );
}
