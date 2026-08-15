export interface WaitlistEntry {
  name: string;
  email: string;
  createdAt: string;
}

export interface WaitlistBackend {
  /** Returns true if the email is already registered. */
  hasEmail(email: string): Promise<boolean>;
  /** Persist a new entry. */
  append(entry: WaitlistEntry): Promise<void>;
}
