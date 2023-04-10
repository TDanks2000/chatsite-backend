import * as colors from "colorette";
import { utils } from ".";

const defaultLog = (message: string, prepend?: string, ...args: any) => {
  const now = new Date();

  const date = utils.formatDate(now);

  if (prepend) message = `${colors.greenBright(`[${prepend}]`)} ${message}`;

  console.log(`${colors.green(`[${date}]`)} ${message}`, ...args);
};

export const log = (message: string, ...args: any) => {
  defaultLog(colors.magenta(message), ...args);
};

export const error = (message: string, ...args: any) => {
  defaultLog(colors.redBright(message), ...args);
};
