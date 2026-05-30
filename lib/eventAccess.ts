import { GameEvent } from "./types";

export type EventVisibility = "open" | "private";

export function getEventVisibility(event: GameEvent): EventVisibility {
  return event.visibility ?? "open";
}

export function isPrivateEvent(event: GameEvent): boolean {
  return getEventVisibility(event) === "private";
}

export function canUserJoinEvent(
  userId: string,
  event: GameEvent,
): { ok: boolean; reason?: string } {
  if (event.participantIds.includes(userId)) {
    return { ok: true };
  }

  if (event.participantIds.length >= event.maxPlayers) {
    return { ok: false, reason: "This game is full." };
  }

  if (!isPrivateEvent(event)) {
    return { ok: true };
  }

  if (event.createdBy === userId) {
    return { ok: true };
  }

  const invited = event.invitedMemberIds ?? [];
  if (invited.includes(userId)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: "This is a private game. Only invited members can join.",
  };
}
