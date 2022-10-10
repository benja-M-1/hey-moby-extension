import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { createSpeechlySpeechRecognition } from "@speechly/speech-recognition-polyfill";
import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { AutoScrollable } from "./AutoScrollable";
import { Conversation } from "./Conversation";
import { Header } from "./Header";
import { HelpDialog } from "./HelpDialog";
import { MessageEditor } from "./MessageEditor";
import { NoConversation } from "./NoConversation";
import { useCodeContext } from "./useCodeContext";
import { useIntents } from "./useIntents";
import { Message, useMessagesContext } from "./useMessagesContext";
import { EditResponse, ErrorResponse, useOpenai } from "./useOpenai";

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
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" gap={2}>
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
              </Stack>
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
