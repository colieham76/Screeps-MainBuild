"use strict";

/**
 *
 * @param {object} dest
 * @param {object} source
 * @returns {object}
 */
module.exports = function(dest, source)
{
    for(var k in source)
    {
        if(!dest.hasOwnProperty(k))
            dest[k] = source[k];
    }

    return dest;
};