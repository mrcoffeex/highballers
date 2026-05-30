import { removePlayerFromCourtGames } from "./eventRoster";
import { Club, ClubBan, ClubJoinRequest, GameEvent } from "./types";

/** Local state update when kicking, banning, or leaving a club. */
export function buildMemberRemovalUpdate(
  clubs: Club[],
  events: GameEvent[],
  joinRequests: ClubJoinRequest[],
  clubBans: ClubBan[],
  clubId: string,
  userId: string,
  ban?: ClubBan,
) {
  const pendingRequests = joinRequests.filter(
    (request) => request.clubId === clubId && request.userId === userId,
  );

  return {
    clubs: clubs.map((club) =>
      club.id === clubId
        ? {
            ...club,
            memberIds: club.memberIds.filter((memberId) => memberId !== userId),
            subCaptainIds: (club.subCaptainIds ?? []).filter(
              (id) => id !== userId,
            ),
          }
        : club,
    ),
    events: events.map((event) => {
      if (event.clubId !== clubId || !event.participantIds.includes(userId)) {
        return event;
      }

      const participantIds = event.participantIds.filter((id) => id !== userId);
      const courtGames = removePlayerFromCourtGames(
        event.courtGames,
        userId,
        participantIds,
      );

      return {
        ...event,
        participantIds,
        courtGames,
        shuffled: Boolean(courtGames?.length),
      };
    }),
    joinRequests: joinRequests.filter(
      (request) => request.clubId !== clubId || request.userId !== userId,
    ),
    clubBans: ban
      ? [
          ...clubBans.filter(
            (entry) => !(entry.clubId === clubId && entry.userId === userId),
          ),
          ban,
        ]
      : clubBans,
    pendingRequests,
  };
}
