import { each, forOwn } from '../../lib/iterate.js';
import { isFunction } from '../../lib/types.js';

class EventEmitter {

    events = {};

    addListener (name, fn) {
        let event = this.events[name];
        if (!event && name) {
            event = this.events[name] = new Set;
        }
        if (event && isFunction(fn)) {
            this.emit('newListener', name, fn);
            event.add(fn);
        }
        return this;
    }

    removeListener (name, fn) {
        let event = this.events[name];
        if (event && isFunction(fn)) {
            event.delete(fn);
            this.emit('removeListener', name, fn);
        }
        return this;
    }

    on (...args) {
        return this.addListener(...args);
    }

    off (...args) {
        return this.removeListener(...args);
    }

    once (name, fn) {
        let once = (...args) => {
            fn.apply(this, args);
            this.removeListener(name, once);
        };
        return this.addListener(name, once);
    }

    emit (name, ...args) {
        let event = this.events[name];
        each(event, fn => {
            fn.apply(this, args);
        });
        return !!event?.size;
    }

    removeAllListeners (name) {
        if (name) {
            let event = this.events[name];
            if (event) {
                event.clear();
            }
        } else {
            forOwn(this.events, event => {
                event.clear();
            });
        }
        return this;
    }

}

export { EventEmitter };
