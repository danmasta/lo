var constants = require('./constants.cjs');
var types = require('./types.cjs');

function isNodeList (obj) {
    return types.getType(obj) === constants.TYPES.NodeList;
}
function isElement (obj) {
    return obj instanceof constants.TYPES.Element.ctor;
}

exports.isElement = isElement;
exports.isNodeList = isNodeList;
