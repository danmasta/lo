import { EOL, isWin32, env } from '../qjs/core.js';
import './process.js';

function homedir () {
    if (isWin32) {
        return env.USERPROFILE;
    }
    return env.HOME;
}

var os = {
    EOL,
    homedir
};

export { EOL, os as default, homedir };
