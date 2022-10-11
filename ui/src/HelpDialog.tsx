import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogProps,
  DialogTitle,
} from "@mui/material";
import Button from "@mui/material/Button";
import { Command } from "./hooks/useIntents";

interface Props extends DialogProps {
  commands: Command[];
}

export function HelpDialog(props: Props) {
  const { commands, open, onClose } = props;
  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>🛟 Hey Moby Help center</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Hey moby is a voice assistant that helps you to manage your Docker
          tasks and control Docker Desktop with the voice. Think Siri for
          Docker.
        </DialogContentText>
        <DialogContentText></DialogContentText>
        <DialogContentText>
          You can tell Moby to create a Dockerfile for a Nodejs app and save it.
          It will use Openai's Codex API to generate the code and a specific
          intent that reacts when you send the "save" command.
        </DialogContentText>
        <DialogContentText>
          Here is the list of commands you can use to interact with Moby.
        </DialogContentText>
        <DialogContentText component="ul">
          {commands.map((cmd, key) => (
            <li key={key}>{cmd.example}</li>
          ))}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={(e) => onClose?.(e, "backdropClick")}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
