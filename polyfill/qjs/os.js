import { EOL } from './core.js';
import { env } from './process.js';

export function homedir () {
    return env.HOME;
}

export {
    EOL
};

export default {
    homedir,
    EOL
};
