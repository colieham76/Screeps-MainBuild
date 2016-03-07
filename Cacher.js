"use strict";

var Cacher =
{
    rooms: {},

    /**
     *
     * @param {Room|string} room
     * @param {number} type
     * @param {function} [filter]
     */
    find: function(room, type, filter)
    {
        if (typeof(room) == "string")
            room = Game.rooms[room];

        if (this.rooms[room.name] == undefined)
            this.rooms[room.name] = {};

        if (this.rooms[room.name][type] == undefined)
        {
            //console.log("[" + Game.time + "] Cacher: New type for " + room.name + ": " + type);
            this.rooms[room.name][type] = room.find(type);
        }

        let res = this.rooms[room.name][type];

        if(filter != undefined && filter != null)
        {
            res = _.filter(res, filter);
            /*res = [];
            this.rooms[room.name][type].forEach(function(x)
            {
                if(filter(x))
                    res.push(x);
            });*/
        }


        return this.rooms[room.name][type];
    },


    /**
     *
     * @param {RoomPosition} pos
     * @param {number} type
     * @param {function|string} [filter]
     */
    findClosestByPath: function(pos, type, filter)
    {
        try
        {
            if (this.rooms[pos.roomName] == undefined)
                this.rooms[pos.roomName] = {};

            if (this.rooms[pos.roomName][type] == undefined)
            {
                //console.log("[" + Game.time + "] Cacher: New type for " + pos.roomName + ": " + type);
                this.rooms[pos.roomName][type] = Game.rooms[pos.roomName].find(type);
            }

            let res = this.rooms[pos.roomName][type];

            if(filter != undefined && filter != null)
            {
                res = _.filter(res, filter);
                /*res = [];
                this.rooms[pos.roomName][type].forEach(function(s)
                {
                    if(filter(s))
                        res.push(s);
                });*/
            }

            return pos.findClosestByPath(res);
        }
        catch(ex)
        {
            console.log(ex);
            return undefined;
        }

    }
};

module.exports = Cacher;