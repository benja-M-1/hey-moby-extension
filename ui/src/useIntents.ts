import { createDockerDesktopClient } from "@docker/extension-api-client";
import { ExecResult } from "@docker/extension-api-client-types/dist/v1/exec";
import { useCallback, useMemo } from "react";
import { escape } from "./strings";
import { useCodeContext } from "./useCodeContext";
import { MessageAction, useMessagesContext } from "./useMessagesContext";
import { FuzzyMatch, Match, testFuzzyMatch, testMatch } from "./utils";

const ddClient = createDockerDesktopClient();

export interface Command {
  command: string | string[] | RegExp;
  callback: (...args: any[]) => void;
  isFuzzyMatch?: boolean | undefined;
  matchInterim?: boolean | undefined;
  fuzzyMatchingThreshold?: number | undefined;
  bestMatchOnly?: boolean | undefined;
  example: string;
}

export function useIntents() {
  const { addMobyMessage } = useMessagesContext();
  const { code } = useCodeContext();

  const commands: Command[] = useMemo(
    () => [
      {
        command: "*how are you*",
        callback: () => addMobyMessage("I am doing whale!"),
        matchInterim: true,
        example: "Hey Moby, how are you today?",
      },
      {
        command: ["wow", "whoa", "whoah"],
        callback: () => addMobyMessage("See? I am krilling it! 🦐"),
        matchInterim: true,
        example: "Wow, Moby, you are so cool!",
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
              return addMobyMessage(`I am sorry I can't open the ${tab} tab`);
          }
        },
        bestMatchOnly: true,
        example: "Hey Moby, open the containers tab please?",
      },
      {
        command: "*save*",
        callback: async () => {
          const result = await ddClient.desktopUI.dialog.showOpenDialog({
            properties: ["openDirectory"],
          });
          if (!result.canceled) {
            const directory = result.filePaths.shift();
            if (directory === undefined) {
              return;
            }
            try {
              await ddClient.docker.cli.exec("run", [
                "-v",
                `${directory}:/data`,
                "--rm",
                "alpine",
                "/bin/sh",
                "-c",
                `'echo "${escape(code)}" > /data/Dockerfile'`,
              ]);
              return addMobyMessage(`I saved the file in ${directory}`);
            } catch (e) {
              console.error(e);
              return addMobyMessage(
                `I am sorry I can't save the file in ${directory}`
              );
            }
          }
        },
        example: "Ok, save this",
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
            return addMobyMessage({
              content: `I understood "${container}" but I don't know how to run a container for this image`,
            });
          }

          let output: ExecResult;
          try {
            output = await ddClient.docker.cli.exec("run", [
              "--rm",
              "-d",
              image,
            ]);

            let action: MessageAction | undefined = undefined;
            if (output.stdout?.toString()) {
              action = {
                text: "Container details",
                onClick: () => {
                  ddClient.desktopUI.navigate.viewContainer(
                    output.stdout?.toString().replace(/\n/g, "")
                  );
                },
              };
            }

            return addMobyMessage({
              content: `There you go, I ran a ${container} container for you`,
              action,
            });
          } catch (e) {
            console.error(e);

            return addMobyMessage({
              content: `I couldn't create a ${container} container. Here is what happened:\n${e}`,
            });
          }
        },
        matchInterim: true,
        example: "Hey Moby, run a node container please?",
      },
    ],
    [addMobyMessage]
  );

  const match = (input: string) => {
    let match: Match | FuzzyMatch | undefined;
    let matchedCommand: Command | undefined;

    for (const command of commands) {
      const {
        command: cmd,
        isFuzzyMatch,
        fuzzyMatchingThreshold,
        bestMatchOnly,
      } = command;
      const subcommands = Array.isArray(cmd) ? cmd : [cmd];
      const results = subcommands
        .map((subcommand) => {
          if (isFuzzyMatch && fuzzyMatchingThreshold) {
            return testFuzzyMatch(subcommand, input, fuzzyMatchingThreshold);
          }
          return testMatch(subcommand, input);
        })
        .filter((x) => x);

      if (results.length === 0) {
        continue;
      }

      if (isFuzzyMatch && bestMatchOnly && results.length >= 2) {
        results.sort((a, b) => {
          if (isFuzzyMatch && a && b) {
            return (b as FuzzyMatch).howSimilar - (a as FuzzyMatch).howSimilar;
          }

          return 0;
        });

        match = results[0] as FuzzyMatch;
        matchedCommand = command;
        break;
      }

      if (results.length > 0) {
        match = results[0] as Match;
        matchedCommand = command;
        break;
      }
    }

    if (!match || !matchedCommand) {
      throw new Error(`No command matches input "${input}"`);
    }

    const { callback, isFuzzyMatch, bestMatchOnly } = matchedCommand;

    if (isFuzzyMatch && bestMatchOnly) {
      const { command, commandWithoutSpecials, howSimilar } =
        match as FuzzyMatch;
      callback(commandWithoutSpecials, input, howSimilar, {
        command,
      });
    } else {
      const { command, parameters } = match as Match;
      callback(...parameters, { command });
    }
  };

  return { match, commands };
}
