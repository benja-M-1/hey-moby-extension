import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import { Box, IconButton, Link, Stack, Typography } from "@mui/material";
import { createSpeechlySpeechRecognition } from "@speechly/speech-recognition-polyfill";
import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { AutoScrollable } from "./AutoScrollable";
import { Conversation } from "./Conversation";
import { Header } from "./Header";
import { HelpDialog } from "./HelpDialog";
import { useCodeContext } from "./hooks/useCodeContext";
import { useIntents } from "./hooks/useIntents";
import { Message, useMessagesContext } from "./hooks/useMessagesContext";
import { EditResponse, ErrorResponse, useOpenai } from "./hooks/useOpenai";
import { MessageEditor } from "./MessageEditor";
import { NoConversation } from "./NoConversation";

const appId = import.meta.env.VITE_SPEECHLY_APP_ID as string;
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

export function App() {
  const {
    messages,
    addUserMessage,
    addMobyMessage,
    setMobyIsWriting,
    resetCurrentlyWriting,
  } = useMessagesContext();
  // @ts-expect-error This is an experimental but that is supported in Electron (see
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
  const isMacOS = navigator.userAgentData?.platform === "macOS" || true;

  const [currentMessage, setCurrentMessage] = useState<string>();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const { transcript, interimTranscript, listening, resetTranscript } =
    useSpeechRecognition();
  const { match, commands } = useIntents();
  const { edits } = useOpenai();
  const { code, setCode } = useCodeContext();

  const matchCommands = async (input: string) => {
    setMobyIsWriting();

    resetTranscript();

    try {
      await match(input.toLowerCase());
      resetCurrentlyWriting();

      return;
    } catch (error) {
      console.log(error);
    }

    try {
      const response = await edits(code, input);

      if ((response as ErrorResponse).name === "Error") {
        const error = JSON.parse((response as ErrorResponse).message);
        switch (error.type) {
          case "insufficient_quota":
            addMobyMessage(
              "I am sorry, it seems there is no more quota left to use the Openai Codex API."
            );
            break;
          case "invalid_edit":
            addMobyMessage(
              "I am sorry, I couldn't edit the code. Can you reformulate your request?"
            );
            break;
          default:
            addMobyMessage("Something went wrong: " + error.message);
            break;
        }

        console.error(error);

        return;
      }

      const output = (response as EditResponse).choices[0].text;
      addMobyMessage(output);
      setCode(output);
    } catch (e) {
      console.log("something went wrong", e);
    } finally {
      resetCurrentlyWriting();
    }
  };

  // By default, the transcript contains the entire conversation
  // This effect allows us to reset the transcript when the user stops speaking.
  useEffect(() => {
    if (interimTranscript.length == 0 && transcript.length > 0) {
      addUserMessage(transcript.toLowerCase());
      setIsSpeaking(false);
      resetTranscript();
    } else if (interimTranscript.length >= 1) {
      setIsSpeaking(true);
      setCurrentMessage(interimTranscript.toLowerCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interimTranscript]);

  const startListening = () =>
    SpeechRecognition.startListening({ continuous: true });
  const stopListening = () => SpeechRecognition.stopListening();

  return (
    <Stack height="100%" width="100%">
      <Header />
      <Box flex={1} minHeight={0}>
        <Box
          height="100%"
          display="grid"
          gridTemplateColumns="1fr"
          gridTemplateRows="1fr auto"
          gridTemplateAreas="'content' 'footer'"
        >
          {messages.length === 0 && (
            <NoConversation
              listening={listening}
              startListening={startListening}
            />
          )}
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
          <Box gridArea="footer" marginTop={2} paddingRight={1}>
            <MessageEditor
              message={currentMessage}
              autoSave={isSpeaking}
              onSend={async (message: Message) => {
                addUserMessage(message);
                await matchCommands(message.content);
              }}
            />
            <Stack
              mt={1}
              direction="row"
              justifyContent={!isMacOS ? "space-between" : "flex-end"}
              alignItems="center"
            >
              {!isMacOS && (
                <Stack direction="row" alignItems="center">
                  <IconButton
                    onClick={!listening ? startListening : stopListening}
                  >
                    <MicRoundedIcon
                      fontSize="small"
                      color="disabled"
                      alignmentBaseline="central"
                    />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {!listening ? "Click to speak" : "Click to mute"}
                  </Typography>
                </Stack>
              )}
              {code.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Send{" "}
                  <Link
                    href="#"
                    underline="always"
                    onClick={() => setCurrentMessage("save")}
                  >
                    "save"
                  </Link>{" "}
                  to save the code generated in a file
                </Typography>
              )}
              <IconButton onClick={() => setOpenHelpDialog(true)}>
                <HelpRoundedIcon />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Box>
      <HelpDialog
        commands={commands}
        open={openHelpDialog}
        onClose={() => setOpenHelpDialog(false)}
      />
    </Stack>
  );
}
