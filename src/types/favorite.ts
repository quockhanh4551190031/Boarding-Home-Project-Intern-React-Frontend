import type { Room } from "./room";

export interface Favorite {
  favoriteId: number;
  room: Room;
  savedAt: string;
}