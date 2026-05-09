import { authd } from "@ojapaddi/auth";

export type HonoEnv = {
  Variables: {
    user: typeof authd.$Infer.Session.user;
    session: typeof authd.$Infer.Session.session;
  };
};
