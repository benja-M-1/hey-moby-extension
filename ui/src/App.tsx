import { createDockerDesktopClient } from "@docker/extension-api-client";
import { ExecResult } from "@docker/extension-api-client-types/dist/v1/exec";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import {
  Avatar,
  Box,
  Grid,
  Stack,
  Tooltip,
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
}

export function App() {
  const isDarkTheme = useMediaQuery("(prefers-color-scheme: dark)");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      },
      {
        command: "*create a docker file*",
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
            c.text.includes(container.toLowerCase())
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
              content: `Ok, I am starting a new container for the image "${container}"`,
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
      },
    ],
    []
  );

  const matchCommands = useCallback((input: string) => {
    let commandMatched = false;
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
              return testFuzzyMatch(subcommand, input, fuzzyMatchingThreshold);
            }
            return testMatch(subcommand, input);
          })
          .filter((x) => x);
        if (results.length > 0) {
          commandMatched = true;
        }
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
          callback(commandWithoutSpecials, input, howSimilar, {
            command,
            resetTranscript,
          });
        } else {
          results.forEach((result) => {
            if (result?.isFuzzyMatch) {
              const { command, commandWithoutSpecials, howSimilar } =
                result as FuzzyMatch;
              callback(commandWithoutSpecials, input, howSimilar, {
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

    if (!commandMatched) {
      setMessages((current) => [
        ...current,
        {
          author: "Moby 🐳",
          content: `I am sorry but I don't understand "${input}"`,
          createdAt: new Date(),
          isSent: true,
        },
      ]);
    }
  }, []);

  const { transcript, interimTranscript, listening, resetTranscript } =
    useSpeechRecognition();

  // By default, the transcript contains the entire conversation
  // This effect allows us to reset the transcript when the user stops speaking.
  useEffect(() => {
    if (interimTranscript.length == 0) {
      setCurrentMessage({
        author: "You",
        content: transcript,
        createdAt: new Date(),
        isSent: true,
      });
      setIsSpeaking(false);
      matchCommands(transcript);
      resetTranscript();
    } else if (interimTranscript.length >= 1) {
      setIsSpeaking(true);
      setCurrentMessage({
        author: "You",
        content: interimTranscript,
        createdAt: new Date(),
        isSent: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interimTranscript]);

  const clear = () => {
    resetTranscript();
    setMessages([]);
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
              Click to talk
            </Button>
          </Grid>
        </Grid>
      )}
      {listening && (
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
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    marginTop={2}
                  >
                    {`Try something like "Hey Moby, how are you?"`}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {`Or "Hey Moby, run a node container"`}
                  </Typography>
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
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
