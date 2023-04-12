import dayjs from "dayjs";

const formatDate = (date: Date) => {
  return dayjs(date).format("HH:mm:ss");
};

const wordCount = (string: string) => {
  return string.replace(/-/g, " ").trim().split(/\s+/g).length;
};

const isUsernameTaken = (names: any, username: string) => {
  return Object.values(names).includes(username);
};

const generateMessageId = () => {
  return Math.random().toString(17).substr(2, 9);
};

const checkToken = (token: string) => {
  return token === (process.env.TOKEN as string);
};

export {
  formatDate,
  wordCount,
  isUsernameTaken,
  generateMessageId,
  checkToken,
};
