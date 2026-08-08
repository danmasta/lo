// Essential DOM types: node root, element, and iterable collections
// Note: Registered by default in the browser entry
export const supplemental = [
    {
        // DOM node root: Element, Text, Comment, Document, DocumentFragment all extend
        n: 'Node',
        x: [0, 0, 0],
        a: 1
    },
    {
        n: 'Element',
        x: [0, 0, 0],
        a: 1
    },
    {
        n: 'NodeList',
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        n: 'HTMLCollection',
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        // classList: iterable with forEach, entries, keys, values
        n: 'DOMTokenList',
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        n: 'FileList',
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        n: 'NamedNodeMap',
        x: [0, 0, 0, 1],
        a: 1
    }
];

// DOM node subtypes: completes the tree hierarchy under Node
export const nodes = [
    {
        n: 'HTMLElement',
        x: [0, 0, 0],
        a: 1
    },
    {
        n: 'Document',
        x: [1, 0, 2]
    },
    {
        n: 'DocumentFragment',
        x: [1, 0, 2]
    },
    {
        n: 'Text',
        x: [1, 0, 2]
    },
    {
        n: 'Comment',
        x: [1, 0, 2]
    },
    {
        // Not constructable (created via Element.attachShadow)
        n: 'ShadowRoot',
        x: [0, 0, 0],
        a: 1
    },
    {
        // Not constructable (created via Document.createAttribute)
        n: 'Attr',
        x: [0, 0, 0],
        a: 1
    }
];

// Browser API classes
export const apis = [
    {
        n: 'WebSocket',
        x: [1, 0, 2]
    },
    {
        n: 'FileReader',
        x: [1, 0, 2]
    },
    {
        n: 'XMLHttpRequest',
        x: [1, 0, 2]
    },
    {
        n: 'MutationObserver',
        x: [1, 0, 2]
    },
    {
        n: 'DOMParser',
        x: [1, 0, 2]
    },
    {
        n: 'Worker',
        x: [1, 0, 2]
    }
];

export default supplemental;
