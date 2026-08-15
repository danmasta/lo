import { defaults, formatter } from './util.js';

const defs = {
    inspect: undefined,
    eol: '\n',
    stdout: { write: undefined, colors: false },
    stderr: { write: undefined, colors: false }
};

// Create console interface with inspect, fmt, and color support (via pluggable inspect)
export function createConsole (opts) {
    let { inspect, eol, stdout, stderr } = defaults(opts, defs);
    const fmtOut = formatter({ inspectArgs: true, inspect, colors: stdout.colors });
    const fmtErr = formatter({ inspectArgs: true, inspect, colors: stderr.colors });
    const out = (...args) => stdout.write(fmtOut(...args) + eol);
    const err = (...args) => stderr.write(fmtErr(...args) + eol);
    return {
        log: out,
        info: out,
        debug: out,
        warn: err,
        error: err,
        dir: (obj, o) => stdout.write(inspect(obj, { colors: stdout.colors, ...o }) + eol)
    };
}
