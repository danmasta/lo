import { inspect } from '../../lib/inspect.js';
import { formatter, formatWithOpts } from '../../lib/util.js';

const format = formatter({ inspectArgs: true, inspect });

function formatWithOptions (opts, ...args) {
    return formatWithOpts({ inspectArgs: true, inspect, ...opts }, ...args);
}

var util = {
    format,
    formatWithOptions,
    inspect
};

export { util as default, format, formatWithOptions, inspect };
