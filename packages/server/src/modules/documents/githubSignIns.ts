interface IGithubSignIn {
  // the InkVisitor user the entry was created for
  userId: string;
  // epoch ms
  expiresAt: number;
  // set while the user has yet to confirm the code on github.com
  deviceCode?: string;
  intervalSec?: number;
  // the token of a confirmed code, while its GitHub login is not known yet
  heldToken?: IHeldToken;
  // set once the sign-in is complete
  accessToken?: string;
  login?: string;
}

interface IHeldToken {
  accessToken: string;
  // GitHub's own lifetime of the token, when it names one
  expiresInSec?: number;
}

const TOKEN_LIFETIME_SEC = 8 * 3600;

// ponytail: sign-ins live in this process only, so a restart forgets them and
// a deployment with more than one server process would lose them between
// requests; a shared store (or the web redirect flow) is the upgrade path.
// The session row is not used because it is stored in the database, which is
// backed up.
const signIns = new Map<string, IGithubSignIn>();

const sweep = (): void => {
  const now = Date.now();
  for (const [sessionId, entry] of signIns) {
    if (entry.expiresAt <= now) {
      signIns.delete(sessionId);
    }
  }
};

/**
 * The entry of this session, when it is still valid and belongs to the user.
 * A session id is not trusted to identify a person on its own: an entry made
 * for another user is removed.
 */
const read = (sessionId: string, userId: string): IGithubSignIn | undefined => {
  const entry = signIns.get(sessionId);
  if (!entry) {
    return undefined;
  }
  if (entry.userId !== userId || entry.expiresAt <= Date.now()) {
    signIns.delete(sessionId);
    return undefined;
  }
  return entry;
};

/** GitHub sign-ins of the logged-in users, keyed by session id. */
export const githubSignIns = {
  setPending(sessionId: string, userId: string, deviceCode: string, expiresInSec: number, intervalSec: number): void {
    sweep();
    signIns.set(sessionId, { userId, deviceCode, intervalSec, expiresAt: Date.now() + expiresInSec * 1000 });
  },

  pending(
    sessionId: string,
    userId: string
  ): { deviceCode: string; intervalSec: number; heldToken?: IHeldToken } | undefined {
    const entry = read(sessionId, userId);
    return entry?.deviceCode
      ? { deviceCode: entry.deviceCode, intervalSec: entry.intervalSec ?? 5, heldToken: entry.heldToken }
      : undefined;
  },

  /**
   * Keeps a token with the pending sign-in it came from. GitHub hands a token
   * over once per device code, so the token has to outlive a failed read of
   * its login. It expires with the device code and `token` does not return it.
   */
  holdToken(sessionId: string, userId: string, heldToken: IHeldToken): void {
    const entry = read(sessionId, userId);
    if (entry?.deviceCode) {
      entry.heldToken = heldToken;
    }
  },

  setToken(
    sessionId: string,
    userId: string,
    accessToken: string,
    expiresInSec: number | undefined,
    login: string
  ): void {
    sweep();
    signIns.set(sessionId, {
      userId,
      accessToken,
      login,
      expiresAt: Date.now() + (expiresInSec ?? TOKEN_LIFETIME_SEC) * 1000,
    });
  },

  token(sessionId: string, userId: string): { accessToken: string; login: string } | undefined {
    const entry = read(sessionId, userId);
    return entry?.accessToken ? { accessToken: entry.accessToken, login: entry.login ?? "" } : undefined;
  },

  drop(sessionId: string): void {
    signIns.delete(sessionId);
  },

  clear(): void {
    signIns.clear();
  },

  size(): number {
    return signIns.size;
  },
};
