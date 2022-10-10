export function escape(s: string) {
  return s.replace(/(["'$`\\])/g, "\\$1");
}
