"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
let role_harvester = {
    /**
     *
     * @param {Source} source
     *
     * @returns {RoomPosition[]}
     * @private
     */
    _getPathToSource: function(source)
    {
        let creep = this.creep;

        let sources = _.map(creep.room.find(FIND_SOURCES), function(source)
        {
            return {pos: source.pos, range: 1};
        });

        let ret = PathFinder.search(creep.pos, source.pos,
            {
                plainCost: 2,
                swampCost: 4,

                maxRooms: 1,

                roomCallback: function(roomName)
                {
                    let room = Game.rooms[roomName];
                    if(!room)
                        return;

                    let costs = new PathFinder.CostMatrix();
                    room.find(FIND_STRUCTURES).forEach(/** @param {Structure} struct **/function(struct)
                    {
                        if(struct.structureType === STRUCTURE_ROAD)
                            costs.set(struct.pos.x, struct.pos.y, 255);
                        else if(struct.structureType !== STRUCTURE_RAMPART || !struct.my)
                            costs.set(struct.pos.x, struct.pos.y, 255);
                    });

                    room.find(FIND_CREEPS).forEach(/** @param {Creep} c **/function(c)
                    {
                        costs.set(c.pos.x, c.pos.y, 255);
                    });

                    return costs;
                }
            });

        return ret.path;
    },

    onSpawn: function()
    {
        let creep = this.creep;
        if(creep.memory.source == undefined)
        {
            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            creep.memory.source = source.id;
        }
    },

    run: function()
    {
        let creep = this.creep;

        if(this.creep.getActiveBodyparts(MOVE) == 0)
        {
            this.onDeath();
            creep.suicide();
            return;
        }

        if(creep.memory.source)
        {
            if(creep.memory.mode == "empty")
            {
                /** @type {Structure|Spawn|Structure_Controller|Structure_Extension|Structure_Storage} **/
                let target = null;

                if(creep.memory.target == undefined)
                {
                    target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: function(struct)
                        {
                            if((struct.structureType == STRUCTURE_SPAWN && struct.energy < struct.energyCapacity) ||
                                (struct.structureType == STRUCTURE_EXTENSION && struct.energy < struct.energyCapacity))
                                return true;

                            return false;
                        }
                    });

                    if(target == null && creep.room.storage != null && creep.room.storage.store.energy < creep.room.storage.storeCapacity)
                        target = creep.room.storage;


                    if(target == null && creep.room.controller !== null && creep.room.controller.my)
                        target = creep.room.controller;

                    if(target != null)
                    {
                        creep.memory.target = target.id;
                    }
                }

                if(target == null && creep.memory.target != undefined)
                {
                    target = Game.getObjectById(creep.memory.target);
                }

                if(target != null && target != undefined)
                {
                    var res = ERR_NOT_IN_RANGE;
                    if(target.structureType == STRUCTURE_CONTROLLER)
                    {
                        if(creep.memory.timesOnTarget == undefined)
                            creep.memory.timesOnTarget = 0;

                        res = creep.upgradeController(target);

                        if(res == OK)
                        {
                            if(creep.memory.timesOnTarget >= 20)
                            {
                                creep.memory.timesOnTarget = undefined;
                                creep.memory.target = undefined;
                            }
                            else
                                creep.memory.timesOnTarget++;
                        }
                    }
                    else
                        res = creep.transfer(target, RESOURCE_ENERGY);

                    if(res == ERR_NOT_IN_RANGE)
                    {
                        creep.gotoTarget(target.pos);
                    }
                    else if(res == ERR_NOT_ENOUGH_RESOURCES)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.mode = undefined;
                        creep.memory.target = undefined;
                        creep.memory.lastPos = undefined;
                        creep.memory.timesOnTarget = undefined;
                    }

                    if((target.structureType == STRUCTURE_EXTENSION && target.energy == target.energyCapacity) ||
                        (target.structureType == STRUCTURE_SPAWN && target.energy == target.energyCapacity) ||
                        (target.structureType == STRUCTURE_STORAGE && target.store.energy == target.storeCapacity))
                    {
                        creep.memory.goto = undefined;
                        creep.memory.target = undefined;
                        creep.memory.lastPos = undefined;
                        creep.memory.timesOnTarget = undefined;
                    }
                    else if(creep.carry.energy == 0)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.mode = undefined;
                        creep.memory.target = undefined;
                        creep.memory.lastPos = undefined;
                        creep.memory.timesOnTarget = undefined;
                    }
                }
            }
            else if(creep.memory.mode == undefined)
            {
                /** @type {Source} **/
                let target = Game.getObjectById(creep.memory.source);

                if(target.energy == 0 && target.tickToRegeneration >= 100)
                {
                    creep.memory.source = undefined;
                    return;
                }

                if(creep.harvest(target) == ERR_NOT_IN_RANGE)
                {
                    creep.gotoTarget(target.pos);
                }
                else
                    creep.memory.goto = undefined;

                if(creep.carry.energy == creep.carryCapacity)
                {
                    creep.memory.mode = "empty";
                    creep.memory.lastPos = undefined;
                }
            }
        }
    },

    onDeath: function()
    {
        if(this.creep.memory != undefined)
        {
            /*let RoleBodyDefinitions = require('RoleBodyDefinitions');
            var Spawner = require('Spawner');
            Spawner.addToQueue("harvester", RoleBodyDefinitions.get("harvester", this.creep.room.energyCapacityAvailable), true);*/
            this.creep.memory = undefined;
        }
    }
};


module.exports = role_harvester;