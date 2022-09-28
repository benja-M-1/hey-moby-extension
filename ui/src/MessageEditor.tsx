import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import { Message } from "./Conversation";

interface Props {
  onSend: (message: Message) => void;
}
export function MessageEditor({ onSend }: Props) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim().length === 0) {
      return;
    }

    onSend({
      author: "You",
      content: message.replace(/^\s+|\s+$/g, "").trim(),
      createdAt: new Date(),
      isSent: true,
    });
    setMessage("");
  };

  return (
    <FormControl fullWidth>
      <InputLabel htmlFor="message">Message</InputLabel>
      <OutlinedInput
        id="message"
        label="Message"
        multiline
        value={message}
        onChange={(e) => setMessage(e.target.value)}
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
              disabled={message.length === 0}
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
