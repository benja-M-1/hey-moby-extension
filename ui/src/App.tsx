import { createDockerDesktopClient } from "@docker/extension-api-client";
import { ExecResult } from "@docker/extension-api-client-types/dist/v1/exec";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Button from "@mui/material/Button";
import { createSpeechlySpeechRecognition } from "@speechly/speech-recognition-polyfill";
import { useCallback, useEffect, useMemo, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { AutoScrollable } from "./AutoScrollable";
import { Conversation, Message } from "./Conversation";
import { MessageEditor } from "./MessageEditor";
import { FuzzyMatch, Match, testFuzzyMatch, testMatch } from "./utils";

const appId = import.meta.env.VITE_SPEECHLY_APP_ID as string;
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

const ddClient = createDockerDesktopClient();

interface Command {
  command: string | string[] | RegExp;
  callback: (...args: any[]) => unknown;
  isFuzzyMatch?: boolean | undefined;
  matchInterim?: boolean | undefined;
  fuzzyMatchingThreshold?: number | undefined;
  bestMatchOnly?: boolean | undefined;
  example: string;
}

export function App() {
  const isDarkTheme = useMediaQuery("(prefers-color-scheme: dark)");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);

  const commands: Command[] = useMemo(
    () => [
      {
        command: "*how are you*",
        callback: () => {
          setMessages((current) => [
            ...current,
            {
              author: "Moby 🐳",
              content: "I am doing whale!",
              createdAt: new Date(),
              isSent: true,
            },
          ]);
        },
        matchInterim: true,
        example: "Hey Moby, how are you today?",
      },
      {
        command: ["wow", "whoa", "whoah"],
        callback: () => {
          setMessages((current) => [
            ...current,
            {
              author: "Moby 🐳",
              content: "See? I am krilling it! 🦐",
              createdAt: new Date(),
              isSent: true,
            },
          ]);
        },
        matchInterim: true,
        example: "Wow, Moby, you are so cool!",
      },
      {
        command: "*create a (dockerfile)(docker file)*",
        callback: () => {
          setMessages((current) => [
            ...current,
            {
              author: "Moby 🐳",
              content: "touch Dockerfile",
              createdAt: new Date(),
              isSent: true,
            },
          ]);
        },
        bestMatchOnly: true,
        example: "Hey Moby, create a dockerfile please?",
      },
      {
        command: "*open the * tab*",
        callback: (pre: string, tab: string, _rest: string) => {
          switch (tab) {
            case "containers":
              ddClient.desktopUI.navigate.viewContainers();
              break;
            case "images":
              ddClient.desktopUI.navigate.viewImages();
              break;
            case "volumes":
              ddClient.desktopUI.navigate.viewVolumes();
              break;
            default:
              setMessages((current) => [
                ...current,
                {
                  author: "Moby 🐳",
                  content: `I am sorry I can't open the ${tab} tab`,
                  createdAt: new Date(),
                  isSent: true,
                },
              ]);
          }
        },
        bestMatchOnly: true,
        example: "Hey Moby, open the containers tab please?",
      },
      {
        command: "*run (a)(an) :container container*",
        callback: async (pre: string, container: string, _rest: string) => {
          const containers = [
            {
              image: "nginx:latest",
              text: ["nginx", "engine x"],
            },
            {
              image: "node:latest",
              text: ["node", "note"],
            },
            {
              image: "postgres:latest",
              text: ["postgresql", "postgres", "postgres ql"],
            },
          ];

          const image = containers.find((c) =>
            c.text.includes(container)
          )?.image;

          if (!image) {
            setMessages((current) => [
              ...current,
              {
                author: "Moby 🐳",
                content: `I understood "${container}" and I don't know how to run a container for this image`,
                createdAt: new Date(),
                isSent: true,
              },
            ]);

            return;
          }

          setMessages((current) => [
            ...current,
            {
              author: "Moby 🐳",
              content: `Ok, I am starting a new container for the image "${image}"`,
              createdAt: new Date(),
              isSent: true,
            },
          ]);

          let output: ExecResult;
          try {
            output = await ddClient.docker.cli.exec("run", [
              "--rm",
              "-d",
              image,
            ]);
            console.log(output);
            setMessages((current) => [
              ...current,
              {
                author: "Moby 🐳",
                content: output.stdout
                  ? output.stdout?.toString()
                  : output.stderr?.toString(),
                createdAt: new Date(),
                isSent: true,
              },
              {
                author: "Moby 🐳",
                content: `There you go, I ran a ${container} container for you 🐳`,
                createdAt: new Date(),
                isSent: true,
                action: output.stdout?.toString()
                  ? {
                      text: "Container details",
                      onClick: () => {
                        console.log(
                          output.stdout?.toString().replace(/\n/g, "")
                        );
                        ddClient.desktopUI.navigate.viewContainer(
                          output.stdout?.toString().replace(/\n/g, "")
                        );
                      },
                    }
                  : undefined,
              },
            ]);
          } catch (e) {
            console.log(e);
            setMessages((current) => [
              ...current,
              {
                author: "Moby 🐳",
                content: e as string,
                createdAt: new Date(),
                isSent: true,
              },
            ]);
          }
        },
        matchInterim: true,
        example: "Hey Moby, run a node container please?",
      },
    ],
    []
  );

  const matchCommands = useCallback((input: string) => {
    const lowerCaseInput = input.toLowerCase();
    commands.forEach(
      ({
        command,
        callback,
        isFuzzyMatch = false,
        fuzzyMatchingThreshold = 0.8,
        bestMatchOnly = false,
      }) => {
        const subcommands = Array.isArray(command) ? command : [command];
        const results = subcommands
          .map((subcommand) => {
            if (isFuzzyMatch) {
              return testFuzzyMatch(
                subcommand,
                lowerCaseInput,
                fuzzyMatchingThreshold
              );
            }
            return testMatch(subcommand, lowerCaseInput);
          })
          .filter((x) => x);
        if (isFuzzyMatch && bestMatchOnly && results.length >= 2) {
          results.sort((a, b) => {
            if (isFuzzyMatch && a && b) {
              return (
                (b as FuzzyMatch).howSimilar - (a as FuzzyMatch).howSimilar
              );
            }

            return 0;
          });
          const { command, commandWithoutSpecials, howSimilar } =
            results[0] as FuzzyMatch;
          callback(commandWithoutSpecials, lowerCaseInput, howSimilar, {
            command,
            resetTranscript,
          });
        } else {
          results.forEach((result) => {
            if (result?.isFuzzyMatch) {
              const { command, commandWithoutSpecials, howSimilar } =
                result as FuzzyMatch;
              callback(commandWithoutSpecials, lowerCaseInput, howSimilar, {
                command,
                resetTranscript,
              });
            } else {
              const { command, parameters } = result as Match;
              callback(...parameters, { command, resetTranscript });
            }
          });
        }
      }
    );
  }, []);

  const { transcript, interimTranscript, listening, resetTranscript } =
    useSpeechRecognition();

  // By default, the transcript contains the entire conversation
  // This effect allows us to reset the transcript when the user stops speaking.
  useEffect(() => {
    if (interimTranscript.length == 0 && transcript.length > 0) {
      setCurrentMessage({
        author: "You",
        content: transcript.toLowerCase(),
        createdAt: new Date(),
        isSent: true,
      });
      setIsSpeaking(false);
      resetTranscript();
    } else if (interimTranscript.length >= 1) {
      setIsSpeaking(true);
      setCurrentMessage({
        author: "You",
        content: interimTranscript.toLowerCase(),
        createdAt: new Date(),
        isSent: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interimTranscript]);

  const startListening = () =>
    SpeechRecognition.startListening({ continuous: true });
  const stopListening = () => SpeechRecognition.stopListening();

  return (
    <Stack height="100%" width="100%">
      <Typography variant="h3" role="title">
        Hey Moby 👋
      </Typography>
      <Stack direction="row" justifyContent="space-between" mt={2}>
        <Typography variant="body1" color="text.secondary">
          🐳 Tell me what you want me to add in you dockerfiles or compose stack
        </Typography>
      </Stack>
      <Box flex={1} minHeight={0}>
        <Box
          height="100%"
          display="grid"
          gridTemplateColumns="1fr"
          gridTemplateRows="1fr auto"
          gridTemplateAreas="'content' 'footer'"
        >
          {messages.length > 0 && (
            <AutoScrollable
              gridArea="content"
              marginTop={2}
              paddingRight={1}
              width="100%"
            >
              <Conversation messages={messages} />
            </AutoScrollable>
          )}
          {messages.length === 0 && (
            <Grid
              container
              flex={1}
              sx={{ width: "100%" }}
              justifyContent="center"
              alignItems="center"
              direction="column"
            >
              <Grid
                item
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Avatar
                  variant="circular"
                  sx={{
                    width: 56,
                    height: 56,
                    // FIXME: the theme mode and the colors should come from the theme but it is not currently
                    //bgcolor: (theme) => useDarkTheme ? theme.palette.grey[400] : theme.palette.grey[200],
                    bgcolor: isDarkTheme ? "#465C6E" : "#E1E2E6",
                  }}
                >
                  <TipsAndUpdatesRoundedIcon />
                </Avatar>
                <Typography variant="body1" marginTop={2}>
                  {`Try something like "Hey Moby, how are you?"`}
                </Typography>
                <Typography variant="body1">
                  {`Or "Hey Moby, run a node container"`}
                </Typography>
                {!listening && (
                  <>
                    <Typography variant="body1" mt={2}>
                      You can even say it to me!
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<MicRoundedIcon />}
                      size="large"
                      onClick={startListening}
                    >
                      Click to talk
                    </Button>
                  </>
                )}
              </Grid>
            </Grid>
          )}
          <Box gridArea="footer" marginTop={2} paddingRight={1}>
            <MessageEditor
              message={currentMessage}
              autoSave={isSpeaking}
              onSend={(message: Message) => {
                setMessages((current) => [...current, message]);
                matchCommands(message.content);
              }}
            />
            <Stack
              mt={1}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              {listening ? (
                <Box display="flex" alignItems="center">
                  <IconButton onClick={stopListening}>
                    <MicRoundedIcon
                      fontSize="small"
                      color="disabled"
                      alignmentBaseline="central"
                    />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    Click to mute
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" alignItems="center">
                  <IconButton onClick={startListening}>
                    <MicOffRoundedIcon
                      fontSize="small"
                      color="disabled"
                      alignmentBaseline="central"
                    />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    Click to speak
                  </Typography>
                </Box>
              )}
              <IconButton onClick={() => setOpenHelpDialog(true)}>
                <HelpRoundedIcon />
              </IconButton>
              {openHelpDialog && (
                <Dialog
                  fullWidth
                  maxWidth="sm"
                  open={openHelpDialog}
                  onClose={() => setOpenHelpDialog(false)}
                >
                  <DialogTitle>🛟 Hey Moby Help center</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Here is the list of commands you can use to interact with
                      Moby.
                      <ul>
                        {commands.map((cmd, key) => (
                          <li key={key}>{cmd.example}</li>
                        ))}
                      </ul>
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      variant="contained"
                      onClick={() => setOpenHelpDialog(false)}
                    >
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
