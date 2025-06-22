import { EOL, isWin32 } from './core.js';
import { env } from './process.js';

export function homedir () {
    if (isWin32) {
        return env.USERPROFILE;
    }
    return env.HOME;
}

export {
    EOL
};

export default {
    EOL,
    homedir
};
