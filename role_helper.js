"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_helper =
{

    _getEnergy: function()
    {
        let creep = this.creep;

        let target = null;
        if(creep.memory.target == undefined)
        {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                /** @param {Structure|Spawn|Structure_Storage|Structure_Extension} struct **/
                filter: function(struct)
                {
                    return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0) ||
                        (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0) ||
                        (struct.structureType == STRUCTURE_STORAGE && struct.store.energy > 0);
                }
            });

            if(target != null && target != undefined)
                creep.memory.target = target.id;
        }
        else
            target = Game.getObjectById(creep.memory.target);

        if(target == null || target == undefined)
            creep.memory.target = undefined;
        else if(((target.structureType == STRUCTURE_SPAWN || target.structureType == STRUCTURE_EXTENSION) && target.energy == 0) ||
            (target.structureType == STRUCTURE_STORAGE && target.store.energy == 0))
            creep.memory.target = undefined;
        else
        {
            let res = ERR_INVALID_TARGET;
            if(target.transferEnergy() != undefined)
                res = target.transferEnergy(creep);
            else
                res = target.transfer(creep, RESOURCE_ENERGY);

            if(res == ERR_NOT_IN_RANGE)
                creep.gotoTarget(target.pos);
            else if(res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_INVALID_TARGET)
                creep.memory.target = undefined;
        }

        if(creep.carry.energy == creep.carryCapacity)
        {
            creep.memory.mode = "run";
            creep.memory.goto = undefined;
            creep.memory.target = undefined;
            this._giveTower();
        }
    },

    _giveTower: function()
    {
        let creep = this.creep;

        /** @type {Structure_Tower} **/
        let tower = Game.getObjectById(creep.memory.help_id);
        if(tower == null || tower == undefined)
        {
            console.log("Tower seems to have exploded...");
            this.creep.suicide();
            this.onDeath();
            return;
        }
        else
        {
            if(tower.energyCapacity - tower.energy > creep.carry.energy)
            {
                if(!creep.pos.isNearTo(tower))
                    creep.gotoTarget(tower.pos);
                return;
            }

            let res = creep.transfer(tower, RESOURCE_ENERGY);
            if(res == ERR_NOT_IN_RANGE)
                creep.gotoTarget(tower.pos);
            else if(res == ERR_INVALID_TARGET)
                creep.memory.help_id = undefined;
            else if(res == ERR_FULL)
                creep.memory.wait = 10;
        }

        if(creep.carry.energy == 0)
        {
            creep.memory.mode = undefined;
            this._getEnergy();
        }
    },

    onSpawn: function()
    {
        this.creep.memory.wait = 0;
        if(this.creep.memory.type == undefined)
        {
            this.creep.log("Helper spawned without a type!");
            this.creep.suicide();
            this.onDeath();
        }
        else
        {
            switch(this.creep.memory.type)
            {
                case "tower":
                    Memory.structures[this.creep.memory.help_id].helperComing = undefined;
                    Memory.structures[this.creep.memory.help_id].helper = this.creep.id;
                    break;
            }
        }
    },

    run: function()
    {
        if(this.creep.memory.wait > 0)
        {
            this.creep.memory.wait--;
            return;
        }

        if(this.creep.mode == undefined)
            this._getEnergy();
        else if(this.creep.type == "tower")
            this._giveTower();
    },

    onDeath: function()
    {

    },

    getWho: function()
    {
       return "H-" + this.creep.memory.type;
    }
};

module.exports = role_helper;