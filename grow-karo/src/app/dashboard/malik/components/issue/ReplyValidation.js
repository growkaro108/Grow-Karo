// utils/replyValidation.js

const MAX_REPLY_LENGTH = 2000;
const MIN_REPLY_LENGTH = 1;

// Strip tags/scripts and neutralize anything that could execute as HTML.
// This is defense-in-depth — React already escapes text in JSX — but you
// still want this because the text may later be rendered elsewhere
// (emails, exports, another app reading the same API) where escaping
// isn't guaranteed.
export function sanitizeReply(rawText) {
  if (typeof rawText !== "string") return "";

  return (
    rawText
      // collapse CR/LF variants and trim
      .replace(/\r\n/g, "\n")
      .trim()
      // strip any HTML tags entirely (plain-text field, no rich formatting)
      .replace(/<[^>]*>/g, "")
      // remove control chars except newline/tab
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      // collapse excessive whitespace/newlines
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .slice(0, MAX_REPLY_LENGTH)
  );
}

export function validateReply(text) {
  const sanitized = sanitizeReply(text);

  if (sanitized.length < MIN_REPLY_LENGTH) {
    return { valid: false, error: "Reply can't be empty.", sanitized };
  }
  if (rawTextLooksLikeOnlyPunctuation(sanitized)) {
    return { valid: false, error: "Reply must contain some text.", sanitized };
  }
  if (text.length > MAX_REPLY_LENGTH) {
    return {
      valid: false,
      error: `Reply is too long (max ${MAX_REPLY_LENGTH} characters).`,
      sanitized,
    };
  }
  return { valid: true, error: null, sanitized };
}

function rawTextLooksLikeOnlyPunctuation(text) {
  return /^[\W_]+$/.test(text);
}
