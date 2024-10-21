import { env } from '#node:process';

export function homedir () {
    return env.HOME;
}
