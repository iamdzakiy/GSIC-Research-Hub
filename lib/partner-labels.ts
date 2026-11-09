// Roles used to be ids from PREFERRED_ROLES; new posts store free text. Show either nicely.
import { PREFERRED_ROLES, labelOf } from "@/lib/profile-options";

export const roleText = (r: string) => labelOf(PREFERRED_ROLES, r);
export const KIND_LABEL = { team_needs_member: "Team needs members", looking_for_team: "Looking for a team" } as const;
