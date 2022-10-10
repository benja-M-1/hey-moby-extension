import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogProps,
  DialogTitle,
} from "@mui/material";
import Button from "@mui/material/Button";
import { Command } from "./useIntents";

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
