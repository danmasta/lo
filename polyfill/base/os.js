import { EOL, isWin32 } from '#polyfill/core';
import { env } from '#polyfill/process';

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
