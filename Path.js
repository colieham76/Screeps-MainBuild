"use strict";
/**
 * @class
 * @constructor
 */
var Path = function(start, path)
{
    if(start == undefined && path == undefined)
    {
        return;
    }

    let nPath = [];

    nPath.push({
        dir: start.getDirectionTo(path[0]),
        x: start.x,
        y: start.y
    });

    for(let i = 0; i < path.length; i++)
    {
        let j = i + 1;
        if(j >= path.length)
            break;

        console.log(path[i]);

        let obj = {
            dir: path[i].getDirectionTo(path[j]),
            x: path[i].x,
            y: path[i].y
        };
        nPath.push(obj);
    }
    this.pathIndex = 0;
    this.path = nPath;
    this.roomName = start.roomName;
};

Path.prototype =
{
    /**
     * @type {number}
     */
    pathIndex: 0,

    /**
     * @type {object[]}
     */
    path: [],

    /**
     * @type {string}
     */
    roomName: "",

    /**
     *
     * @param {Creep} creep
     */
    move: function(creep)
    {
        console.log(creep.pos, this.path[this.pathIndex].x + "_" + this.path[this.pathIndex].y);

        while(creep.pos.x != this.path[this.pathIndex].x || creep.pos.y != this.path[this.pathIndex].y)
        {
            this.pathIndex--;
            if(this.pathIndex < 0)
            {
                this.pathIndex = 0;
                return ERR_INVALID_TARGET;
            }
        }

        let res = creep.move(this.path[this.pathIndex].dir);
        console.log("MOVE: " + res);
        if(res === OK)
        {
            this.pathIndex++;
            return OK;
        }

        return res;
    },

    /**
     *
     * @param {Creep} creep
     *
     * @return {boolean}
     */
    atGoal: function(creep)
    {
        return (creep.pos.x == this.path[this.path.length - 1].x && creep.pos.y == this.path[this.path.length - 1].y);
    },

    /**
     * Reverse this Path object
     */
    reverse: function()
    {
        let nPath = this.path.reverse();

        for(let i = 0; i < nPath.length; i++)
        {
            switch(nPath[i].dir)
            {
                case TOP:
                    nPath[i].dir = BOTTOM;
                    break;
                case TOP_RIGHT:
                    nPath[i].dir = BOTTOM_LEFT;
                    break;
                case RIGHT:
                    nPath[i].dir = LEFT;
                    break;
                case BOTTOM_RIGHT:
                    nPath[i].dir = TOP_LEFT;
                    break;
                case BOTTOM:
                    nPath[i].dir = TOP;
                    break;
                case BOTTOM_LEFT:
                    nPath[i].dir = TOP_RIGHT;
                    break;
                case LEFT:
                    nPath[i].dir = RIGHT;
                    break;
                case TOP_LEFT:
                    nPath[i].dir = BOTTOM_RIGHT;
                    break;
            }
        }

        this.path = nPath;
    },

    serialize: function()
    {
        return JSON.stringify({path: this.path, pathIndex: this.pathIndex, roomName: this.roomName});
    },

    /**
     * @static
     * @param obj
     * @returns {Path}
     */
    deserialize: function(obj)
    {
        var x = JSON.parse(obj);
        if(x.path == undefined || x.pathIndex == undefined)
            return null;

        let P = new Path();
        P.path = x.path;
        P.pathIndex = x.pathIndex;
        P.roomName = x.roomName;

        return P;
    }
};

module.exports = Path;