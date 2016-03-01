"use strict";

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_maintainer =
{

    onSpawn: function()
    {

    },

    _refillMode: function()
    {
        var creep = this.creep;

        if(creep.memory.target == undefined)
        {
            let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: function(struct)
                {
                    return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0) ||
                        (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0);
                }
            });

            if(target == undefined || target == null)
                target = creep.room.storage;

            if(target != undefined && target != null)
                creep.memory.target = target.id;
        }

        if(creep.memory.target != undefined)
        {
            let target = Game.getObjectById(creep.memory.target);
            if(target == null || target == undefined)
                creep.memory.target = undefined;
            else
            {
                let res = target.transferEnergy(creep);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target);
                else if(res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_NOT_ENOUGH_ENERGY)
                    creep.memory.target = undefined;
            }
        }

        if(creep.carry.energy == creep.carryCapacity)
        {
            creep.memory.goto = undefined;
            creep.memory.target = undefined;
            creep.memory.mode = "repair";
            this._repairMode();
        }
    },

    _repairMode: function()
    {
        let creep = this.creep;

        if(creep.memory.target == undefined)
        {
            let targets = creep.room.find(FIND_STRUCTURES, {

                /** @param {Structure} struct **/
                filter: function(struct)
                {
                    if(struct.my != undefined)
                    {
                        if(!struct.my)
                            return false;
                    }

                    return struct.hits < struct.hitsMax;
                }
            });

            targets.sort(
                /**
                 * @param {Structure} a
                 * @param {Structure} b
                 */
                function(a, b)
                {
                    if(a.structureType == b.structureType)
                    {
                        let aX = a.hits / a.hitsMax;
                        let bX = b.hits / b.hitsMax;

                        return aX - bX;
                    }

                    if(a.structureType == STRUCTURE_ROAD && a.hits > 2000)


                    var cArray = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_EXTENSION, STRUCTURE_STORAGE];

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

            if(targets.length)
                creep.memory.target = targets[0].id;
        }

        if(creep.memory.target != undefined)
        {
            let target = Game.getObjectById(creep.memory.target);
            if(target == null || target == undefined)
                creep.memory.target = undefined;
            else
            {
                target.pos.createFlag("maintainer target", COLOR_BLUE, COLOR_CYAN);

                if(creep.memory.sameTarget == undefined)
                    creep.memory.sameTarget = {id: target.id, times: 0};
                else if(creep.memory.sameTarget.id == target.id)
                    creep.memory.sameTarget.times++;
                else
                    creep.memory.sameTarget = {id: target.id, times: 0};

                if(creep.memory.sameTarget.times > 10)
                {
                    creep.memory.target = undefined;
                    creep.memory.sameTarget = {id: target.id, times: 0};
                }

                let res = creep.repair(target);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target);
                else if(res == ERR_INVALID_TARGET)
                    creep.memory.target = undefined;

                if(target.hits == target.hitsMax)
                    creep.memory.target = undefined;

                if(creep.memory.target == undefined)
                    creep.room.find(FIND_FLAGS, { filter: function(f) { return f.name == "maintainer target" } }).forEach(function(f) { f.remove(); });

                if(creep.carry.energy < creep.carryCapacity / 2)
                {
                    require('CarrierController').requestEnergy(creep, creep.carryCapacity - creep.carry.energy, "give");
                }
                else
                    require("CarrierController").removeMe(creep);

                if(creep.carry.energy == 0)
                {
                    creep.memory.goto = undefined;
                    creep.memory.target = undefined;
                    creep.memory.mode = undefined;
                    creep.room.find(FIND_FLAGS, { filter: function(f) { return f.name == "maintainer target" } }).forEach(function(f) { f.remove(); });
                    this._refillMode();
                }
            }
        }

    },

    run: function()
    {
        var creep = this.creep;

        if(creep.memory.mode == undefined)
            this._refillMode();
        else
            this._repairMode();
    },

    onDeath: function()
    {
        this.creep.memory = undefined;
    }
};

module.exports = role_maintainer;