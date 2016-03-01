"use strict";
/**
 * @class
 * @constructor
 */
var RoomController =
{
    /** @type {Room} **/
    room: null,

    /**
     *
     * @param {Room} room
     */
    setRoom: function(room)
    {
        this.room = room;
    },


    initRoom: function()
    {
        if(this.room.memory.roomCheck == undefined)
            this.room.memory.roomCheck = 0;
    },

    checkRoom: function()
    {
        this.initRoom();
        let room = this.room;

        if(room.memory.roomCheck <= 0)
        {
            room.memory.roomCheck = 500;

            var spawn = room.find(FIND_MY_SPAWNS)[0];
            if(spawn == null || spawn == undefined)
            {
                room.memory.roomCheck = 50;
                return;
            }

            if(room.find(FIND_MY_CONSTRUCTION_SITES).length > 0)
            {
                room.memory.roomCheck = 100;
                return;
            }

            if(room.energyCapacityAvailable == 300)
                return;

            var activeSourcesId = {};
            _.forEach(room.find(FIND_MY_CREEPS, {

                filter: function(creep)
                {
                    return creep.memory.role == "harvester" && creep.memory.source != undefined;
                }
            }),
                function(creep)
                {
                    activeSourcesId[creep.memory.source] = {id: creep.memory.source};
                }
            );

            let activeSources = [];

            for(let k in activeSourcesId)
            {
                let source = Game.getObjectById(k);
                activeSources.push({ pos: source.pos, range: 1 });
            }

            PathFinder.use(true);

            let roomCallback = function(roomName)
            {
                let r = Game.rooms[roomName];
                if(!r)
                    return;

                let costs = new PathFinder.CostMatrix();
                r.find(FIND_STRUCTURES).forEach(function(structure)
                {
                    if(structure.structureType == STRUCTURE_ROAD)
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    else if(structure.structureType !== STRUCTURE_RAMPART || !structure.my)
                        costs.set(structure.pos.x, structure.pos.y, 255);
                });

                return costs;
            };

            let ret = PathFinder.search(spawn.pos, activeSources,
                {
                    plainCost: 2,
                    swampCost: 10,
                    maxRooms: 1,

                    roomCallback: roomCallback
                });

            ret.path.forEach(/** @param {RoomPosition} pos **/function(pos)
            {
                pos.createConstructionSite(STRUCTURE_ROAD);
            });

            ret = PathFinder.search(spawn.pos, room.controller.pos,
                {
                    plainCost: 2,
                    swampCost: 10,
                    maxRooms: 1,

                    roomCallback: roomCallback
                });

            PathFinder.use(false);


            ret.path.forEach(/** @param {RoomPosition} pos **/function(pos)
            {
                pos.createConstructionSite(STRUCTURE_ROAD);
            });

            room.find(FIND_FLAGS,
                {
                    filter: function(flag)
                    {
                        return flag.memory.type == "guardpost";
                    }
                }).forEach(function(flag)
                {
                    if(flag.memory.assigned != undefined)
                    {
                        var nArr = [];
                        for(let k in flag.memory.assigned)
                        {
                            let id = flag.memory.assigned[k];
                            if(Game.getObjectById(id) != null)
                                nArr.push(id);
                        }
                        flag.memory.assigned = nArr;
                    }
                });



        }
        else
            room.memory.roomCheck--;
    }
};

module.exports = RoomController;