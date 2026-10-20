export function isAccessAuthMode() {
  return process.env.AUTH_MODE === "access";
}

export function getAccessConfig() {
  if (!isAccessAuthMode()) return null;

  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim();
  const audience = process.env.CF_ACCESS_AUD?.trim();
  if (
    !teamDomain ||
    !audience ||
    !/^[a-z0-9.-]+(?::\d+)?$/i.test(teamDomain)
  ) {
    return null;
  }

  return { teamDomain, audience };
}
