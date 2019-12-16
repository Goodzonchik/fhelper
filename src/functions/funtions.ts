export function checkDeprecated(
  date: string,
  deprecatedDate: number = 365
): boolean {
  const diffDays = new Date().getTime() - new Date(date).getTime();
  return Math.floor(diffDays / (1000 * 86400)) > deprecatedDate;
}

export function getVersion(version: string): string {
  return Number.isInteger(+version[0]) ? version : version.substr(1);
}

export function isBadVersion(version: string): boolean {
  return (
    getVersion(version).split(".")[0] === "0" ||
    Boolean(getVersion(version).match(/^[A-Za-z]+$/))
  );
}

export async function addHuskyHook(data: any) {
  const husky = {
    husky: {
      hooks: {
        "pre-commit": "pretty-quick --staged --bail"
      }
    }
  };
  return Object.assign(data, husky);
}
