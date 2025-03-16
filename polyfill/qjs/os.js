import { env } from './process.js';

export function homedir () {
    return env.HOME;
}

export default {
    homedir
};
