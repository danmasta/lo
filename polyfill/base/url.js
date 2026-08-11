import { isWin32 } from '#polyfill/core';

// Convert a file:// URL to a path (otherwise return the input unchanged)
export function fileURLToPath (url) {
    if (typeof url === 'string' && url.startsWith('file://')) {
        url = decodeURIComponent(url.slice('file://'.length));
        // Note: Strip leading slash from win32 drive paths
        if (isWin32 && url[0] === '/' && url[2] === ':') {
            url = url.slice(1);
        }
    }
    return url;
}

export default {
    fileURLToPath
};
