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

export { formatDate, wordCount, isUsernameTaken };
