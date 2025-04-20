import { inspect } from '../../lib/inspect.js';
import { formatter, formatWithOpts } from '../../lib/util.js';

export const format = formatter({ inspectArgs: true, inspect });

export function formatWithOptions (opts, ...args) {
    return formatWithOpts({ inspectArgs: true, inspect, ...opts }, ...args);
}

export {
    inspect
};

export default {
    format,
    formatWithOptions,
    inspect
};
