import { createDockerDesktopClient } from "@docker/extension-api-client";
import { ExecResult } from "@docker/extension-api-client-types/dist/v1/exec";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import {
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import { createSpeechlySpeechRecognition } from "@speechly/speech-recognition-polyfill";
import { useEffect, useMemo, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Commands } from "./Command";

const appId = import.meta.env.VITE_SPEECHLY_APP_ID as string;
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

const ddClient = createDockerDesktopClient();

export function App() {
  const [commandRequests, setCommandRequests] = useState<string[]>([]);
  const [commandResults, setCommandResults] = useState<string[]>([]);
  const [isExecutingCommand, setExecutingCommand] = useState(false);

  const commands = useMemo(
    () => [
      {
        command: "create a docker file",
        callback: () => {
          setExecutingCommand(true);
          setCommandResults((current) => [...current, "touch Dockerfile"]);
          setExecutingCommand(false);
        },
        bestMatchOnly: true,
      },
      {
        command: "run a :container container",
        callback: async (container: string) => {
          console.log("container", container);
          setExecutingCommand(true);
          let image = "";
          switch (container.toLowerCase()) {
            case "node":
              image = "node:latest";
              break;
            case "postgres":
              image = "postgres:latest";
              break;
            default:
              setExecutingCommand(false);
              setCommandResults((current) => [
                ...current,
                `I don't know which container to run, what is "${container}"`,
              ]);
              return;
          }

          let output: ExecResult;
          try {
            output = await ddClient.docker.cli.exec("run", [
              "--rm",
              "-d",
              image,
            ]);
            console.log(output);
            setCommandResults((current) => [
              ...current,
              output.stdout
                ? output.stdout?.toString()
                : output.stderr?.toString(),
              `There you go, I ran a ${container} container for you 🐳`,
            ]);
          } catch (e) {
            console.log(e);
            setCommandResults((current) => [...current, e as string]);
          } finally {
            setExecutingCommand(false);
          }
        },
        bestMatchOnly: true,
      },
    ],
    []
  );

  const { transcript, interimTranscript, listening, resetTranscript } =
    useSpeechRecognition({
      commands,
    });

  // By default, the transcript contains the entire conversation
  // This effect allows us to reset the transcript when the user stops speaking.
  useEffect(() => {
    if (!listening) {
      return;
    }

    if (interimTranscript.length == 0) {
      setCommandRequests((current) => [...current, transcript]);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interimTranscript]);

  const clear = () => {
    resetTranscript();
    setCommandResults([]);
    setCommandRequests([]);
  };

  const startListening = () =>
    SpeechRecognition.startListening({ continuous: true });

  return (
    <Stack height="100%" width="100%">
      <Typography variant="h3" role="title">
        Hey Moby 👋
      </Typography>
      <Stack direction="row" justifyContent="space-between" mt={2}>
        <Typography variant="body1" color="text.secondary">
          🐳 Tell me what you want me to add in you dockerfiles or compose stack
        </Typography>
        {listening && (
          <Stack direction="row" justifyContent="flex-end" alignItems="center">
            <Tooltip title="Moby is listening" placement="right">
              <MicRoundedIcon
                color="success"
                alignmentBaseline="central"
                sx={{ verticalAlign: "bottom" }}
              />
            </Tooltip>
            <Button variant="contained" size="small" onClick={clear}>
              Clear
            </Button>
          </Stack>
        )}
      </Stack>
      {!listening && (
        <Grid
          container
          flex={1}
          sx={{ width: "100%" }}
          justifyContent="center"
          alignItems="center"
        >
          <Grid item>
            <Button
              variant="contained"
              startIcon={<MicRoundedIcon />}
              size="large"
              onClick={startListening}
            >
              Click to
            </Button>
          </Grid>
        </Grid>
      )}
      {listening && (
        <Commands
          requests={commandRequests}
          responses={commandResults}
          currentRequest={interimTranscript}
          isWorking={isExecutingCommand}
          isSpeaking={interimTranscript.length > 0}
        />
      )}
    </Stack>
  );
}
