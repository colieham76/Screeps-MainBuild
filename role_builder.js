"use strict";

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_builder =
{

    _assignTarget: function()
    {
        var creep = this.creep;
        var sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);

        if(sites.length == 0)
        {
            sites = creep.room.find(FIND_STRUCTURES, {
                /**
                 *
                 * @param {Structure} struct
                 */
                filter: function(struct)
                {
                    return struct.hits < struct.hitsMax && struct.isActive();
                }
            });

            if(sites.length == 0)
                creep.memory.wait = 20;



            sites.sort(
                /**
                 *
                 * @param {Structure} a
                 * @param {Structure} b
                 */
                function(a, b)
                {
                    var aHits = a.hitsMax / a.hits;
                    var bHits = b.hitsMax / b.hits;

                    return bHits - aHits;
                }
            );
        }
        else
        {
            sites.sort(
                /**
                 *
                 * @param {ConstructionSite} a
                 * @param {ConstructionSite} b
                 */
                function(a, b)
                {
                    if(a.structureType == b.structureType)
                        return b.progress - a.progress;

                    var cArray = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_EXTENSION, STRUCTURE_STORAGE];

                    for(let i = 0; i < cArray.length; i++)
                    {
                        if(a.structureType == cArray[i])
                            return -1;
                        else if(b.structureType == cArray[i])
                            return 1;
                    }

                    return 1;
                }
            );
        }

        if(sites.length == 0)
            return null;

        creep.memory.target = sites[0].id;
        return sites[0];
    },


    onSpawn: function()
    {
        this.creep.memory.wait = 0;
    },

    run: function()
    {
        var creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        var target = undefined;

        if(creep.memory.target == undefined)
            target = this._assignTarget();
        else
            target = Game.getObjectById(creep.memory.target);

        if(target == null || target == undefined)
            creep.memory.target = undefined;
        else
        {
            if(creep.memory.mode == undefined)
            {
                let res = creep.build(target);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target);
                else if(res == ERR_NOT_ENOUGH_RESOURCES)
                {
                    creep.memory.goto = undefined;
                    creep.memory.mode = "fill";
                }
                else if(res == ERR_INVALID_TARGET)
                {
                    if(target.hits == target.hitsMax)
                    {
                        creep.memory.target = undefined;
                        return;
                    }
                    res = creep.repair(target);

                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(target);
                    else if(res == ERR_NOT_ENOUGH_RESOURCES)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.mode = "fill";
                    }
                }

                if(creep.carry.energy < creep.carryCapacity / 2)
                {
                    require('CarrierController').requestEnergy(creep, creep.carryCapacity - creep.carry.energy, "give");
                }
                else
                    require("CarrierController").removeMe(creep);

            }
            else
            {
                if((creep.room.energyAvailable < 250 && creep.carry.energy == 0) || creep.room.memory.prioSpawnQueue.length > 0)
                {
                    creep.memory.wait = 10;
                    return;
                }

                creep.memory.target = undefined; //Reset the target, in case we want to build something with higher priority

                let reload = undefined;
                if(creep.memory.reloadTarget == undefined)
                {
                    reload = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: function(struct)
                        {
                            return (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0) ||
                                (struct.structureType == STRUCTURE_LINK && struct.energy > 0) ||
                                (struct.structureType == STRUCTURE_STORAGE && struct.store.energy > 0);
                        }
                    });

                    if(reload == null || reload == undefined)
                    {
                        reload = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
                            filter: function(struct)
                            {
                                return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0);
                            }
                        });
                    }

                    if(reload != null && reload != undefined)
                    {
                        creep.memory.reloadTarget = reload.id;
                    }
                    else
                        creep.memory.wait = 10;
                }
                else
                    reload = Game.getObjectById(creep.memory.reloadTarget);

                if(reload == null || reload == undefined)
                    creep.memory.reloadTarget = undefined;
                else
                {
                    var res = ERR_INVALID_TARGET;
                    if(reload.transferEnergy != undefined)
                        res = reload.transferEnergy(creep);
                    else
                        res = reload.transfer(creep, RESOURCE_ENERGY);

                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(reload);
                    else if(res == ERR_NOT_ENOUGH_RESOURCES)
                        creep.memory.reloadTarget = undefined;
                }

                if(creep.carry.energy > creep.carryCapacity / 2)
                {
                    creep.memory.goto = undefined;
                    creep.memory.reloadTarget = undefined;
                    creep.memory.mode = undefined;
                }
            }
        }
    },

    onDeath: function()
    {
        this.creep.memory = undefined;
    }
};

module.exports = role_builder;