import { getenv, getenviron, setenv } from 'qjs:std';
import { createEnv } from './env.js';

function getEnv (key) {
    return key ? getenv(key) : getenviron();
}

function setEnv (key, val) {
    return setenv(key, val);
}

export const env = createEnv(getEnv, setEnv);
