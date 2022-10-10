import { createDockerDesktopClient } from "@docker/extension-api-client";

const ddClient = createDockerDesktopClient();

type CompletionChoice = {
  text: string;
  index: number;
  logprobs: number | null;
  finish_reason: string;
};

interface Response<T> {
  object: T;
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ErrorResponse {
  message: string;
  name: string;
  statusCode: number;
}

export type CompletionResponse = Response<"text_completion">;
export type EditResponse = Response<"edit">;

export function useOpenai() {
  const completions = async (prompt: string) => {
    return (await ddClient.extension?.vm?.service?.post("/openai/completions", {
      model: "code-davinci-002",
      prompt: `# ${prompt}`,
      temperature: 0,
      max_tokens: 64,
    })) as CompletionResponse | ErrorResponse;
  };

  const edits = async (input: string, instruction: string) => {
    return (await ddClient.extension?.vm?.service?.post("/openai/edits", {
      model: "code-davinci-edit-001", // Only this model supports edits, seehttps://beta.openai.com/docs/guides/code/editing-code
      input,
      instruction,
    })) as EditResponse | ErrorResponse;
  };

  return {
    completions,
    edits,
  };
}
