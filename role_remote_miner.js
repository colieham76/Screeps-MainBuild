"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_remote_miner =
{
    renewAt: 0,

    _drop: function()
    {
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.room.name != creep.memory.dropPos.roomName)
            creep.gotoTarget(new RoomPosition(creep.memory.dropPos.x, creep.memory.dropPos.y, creep.memory.dropPos.roomName));
        else
        {
            if(creep.pos.x == 0)
                creep.move(RIGHT);
            else if(creep.pos.x == 49)
                creep.move(LEFT);
            else if(creep.pos.y == 0)
                creep.move(BOTTOM);
            else if(creep.pos.y == 49)
                creep.move(TOP);
            else
            {
                /** @type {Structure|Spawn|Structure_Extension|Structure_Storage|Structure_Tower|Creep} **/
                let target = null;

                if(creep.memory.target == undefined)
                {
                    target = creep.room.find(FIND_MY_CREEPS, {
                        filter: function(c)
                        {
                            return c.memory.role == "controller" && c.memory.nearController != undefined && c.carry.energy == 0;
                        }
                    });


                    if(target.length)
                        target = target[0];
                    else
                        target = null;

                    if(target == null || target == undefined)
                    {
                        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                            /** @param {Spawn|Structure_Extension|Structure_Tower} struct **/
                            filter: function(struct)
                            {
                                return (struct.structureType == STRUCTURE_EXTENSION && struct.energy < struct.energyCapacity) ||
                                    (struct.structureType == STRUCTURE_SPAWN && struct.energy < struct.energyCapacity) ||
                                    (struct.structureType == STRUCTURE_TOWER && struct.energy < struct.energyCapacity);
                            }
                        });
                    }

                    if((target == null || target == undefined) && creep.room.storage != null && creep.room.storage != undefined && creep.room.storage.store.energy > creep.room.storage.storeCapacity)
                        target = creep.room.storage;

                    if(target != null && target != undefined)
                        creep.memory.target = target.id;
                }
                else
                    target = Game.getObjectById(creep.memory.target);

                if(target == null || target == undefined)
                    creep.memory.target = undefined;
                else
                {
                    let res = ERR_BUSY;

                    if(!creep.pos.isNearTo(target.pos))
                        creep.gotoTarget(target.pos);
                    else
                    {
                        if(target.memory != undefined && target.memory.role == "controller")
                            creep.drop(RESOURCE_ENERGY);
                        else
                        {
                            let res = creep.transfer(target, RESOURCE_ENERGY);

                            if(res == ERR_FULL)
                                creep.memory.target = undefined;
                            else if(res == ERR_NOT_IN_RANGE)
                                creep.gotoTarget(target.pos);
                        }
                    }

                    if(creep.carry.energy == 0)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.target = undefined;
                        creep.memory.mode = undefined
                        creep.memory.wait = 0;
                    }
                }
            }
        }

    },

    _mine: function()
    {
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.room.name != creep.memory.targetPos.roomName)
            creep.gotoTarget(new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName));
        else
        {
            if(creep.pos.x == 0)
                creep.move(RIGHT);
            else if(creep.pos.x == 49)
                creep.move(LEFT);
            else if(creep.pos.y == 0)
                creep.move(BOTTOM);
            else if(creep.pos.y == 49)
                creep.move(TOP);
            else
            {
                /** @type {Source} **/
                let target = null;
                if(creep.memory.target == undefined)
                {
                    target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                    if(target != null && target != undefined)
                        creep.memory.target = target.id;
                }
                else
                    target = Game.getObjectById(creep.memory.target);

                if(target == null || target == undefined)
                    creep.memory.target = undefined;
                else
                {
                    if(target.energy == 0)
                        creep.memory.wait = target.ticksToRegeneration;
                    else
                    {
                        let res = creep.harvest(target);
                        if(res == ERR_NOT_IN_RANGE)
                            creep.gotoTarget(target.pos);
                    }
                }
            }

            if(creep.carry.energy >= creep.carryCapacity)
            {
                creep.memory.goto = undefined;
                creep.memory.target = undefined;
                creep.memory.mode = "dropOff";
                creep.memory.wait = 0;
            }
        }
    },


    onSpawn: function()
    {
        if(this.creep.memory.targetPos == undefined)
            Game.notify("Remote Miner " + this.creep.name + ": MISSING TARGET POSITION");

        if(this.creep.memory.dropPos == undefined)
            Game.notify("Remote Miner " + this.creep.name + ": MISSING DROP POSITION");

        this.creep.memory.wait = 0;
    },

    run: function()
    {
        let creep = this.creep;
        if(creep.memory.mode == undefined)
            this._mine();
        else
            this._drop();
    },

    onDeath: function()
    {

    }
};

module.exports = role_remote_miner;