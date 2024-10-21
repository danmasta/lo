export const env = std.getenviron();

export const argv = [argv0, ...scriptArgs];

export function cwd () {
    return env.PWD;
}
