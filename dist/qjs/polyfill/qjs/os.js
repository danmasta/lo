import { env } from './process.js';

function homedir () {
    return env.HOME;
}

export { homedir };
