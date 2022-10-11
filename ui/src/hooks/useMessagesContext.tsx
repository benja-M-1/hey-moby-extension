import { createContext, useContext, useState } from "react";

type IMessageContext = {
  addMobyMessage: (message: string | Omit<Message, "author">) => void;
  addUserMessage: (message: string | Omit<Message, "author">) => void;
  messages: TimestampedMessage[];
  currentlyWriting?: string;
  setMobyIsWriting: () => void;
  setUserIsWriting: () => void;
  resetCurrentlyWriting: () => void;
};

export interface MessageAction {
  text: string;
  onClick: (
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => void;
}

export interface Message {
  author: string;
  content: string;
  action?: MessageAction;
}

export interface TimestampedMessage extends Message {
  createdAt: Date;
}

const MessagesContext = createContext<IMessageContext>({
  addMobyMessage: (_) => undefined,
  addUserMessage: (_) => undefined,
  messages: [],
  currentlyWriting: undefined,
  setUserIsWriting: () => undefined,
  setMobyIsWriting: () => undefined,
  resetCurrentlyWriting: () => undefined,
});

const MOBY = "Moby 🐳";
const USER = "You";

export function MessageContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<TimestampedMessage[]>([]);
  const [currentlyWriting, setCurrentlyWriting] = useState<string>();

  const addMessage = (message: Message) => {
    setMessages((current) => [
      ...current,
      {
        ...message,
        createdAt: new Date(),
      },
    ]);
  };

  const addMobyMessage = (message: string | Omit<Message, "author">) => {
    if (typeof message === "string") {
      message = {
        content: message,
      };
    }

    addMessage({ ...message, author: MOBY });
  };

  const addUserMessage = (message: string | Omit<Message, "author">) => {
    if (typeof message === "string") {
      message = {
        content: message,
      };
    }

    addMessage({ ...message, author: USER });
  };

  const setMobyIsWriting = () => setCurrentlyWriting(MOBY);
  const setUserIsWriting = () => setCurrentlyWriting(USER);
  const resetCurrentlyWriting = () => setCurrentlyWriting(undefined);

  return (
    <MessagesContext.Provider
      value={{
        messages,
        currentlyWriting,
        addMobyMessage,
        addUserMessage,
        setMobyIsWriting,
        setUserIsWriting,
        resetCurrentlyWriting,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessagesContext() {
  return useContext(MessagesContext);
}
