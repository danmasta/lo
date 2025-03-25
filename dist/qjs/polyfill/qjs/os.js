import { env } from './process.js';

function homedir () {
    return env.HOME;
}

var os = {
    homedir
};

export { os as default, homedir };
