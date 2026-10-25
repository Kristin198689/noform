import de from "@/messages/de.json";
import en from "@/messages/en.json";
import uk from "@/messages/uk.json";
import type { Locale } from "./config";

export type Messages = typeof en;
export type MessageKey = keyof Messages;

const dictionaries: Record<Locale, Messages> = { de, en, uk };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

/** Picks a subset of keys so client islands only receive the strings they render. */
export function pick<K extends MessageKey>(messages: Messages, keys: readonly K[]): Pick<Messages, K> {
  const out = {} as Pick<Messages, K>;
  for (const key of keys) out[key] = messages[key];
  return out;
}
