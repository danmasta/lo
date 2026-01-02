import { inspect } from '#lib/inspect';
import { formatter, formatWithOpts } from '#lib/util';

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
