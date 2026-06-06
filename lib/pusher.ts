import PusherServer from "pusher";
import PusherClient from "pusher-js";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "mock_pusher_app_id",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_pusher_key",
  secret: process.env.PUSHER_SECRET || "mock_pusher_secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  useTLS: true,
});

export const getPusherClient = () => {
  if (typeof window === "undefined") return null;
  return new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_pusher_key",
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      forceTLS: true,
      authEndpoint: "/api/pusher/auth",
    }
  );
};
