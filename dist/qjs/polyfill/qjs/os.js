import { EOL, env } from './core.js';
import './process.js';

function homedir () {
    return env.HOME;
}

var os = {
    homedir,
    EOL
};

export { EOL, os as default, homedir };
