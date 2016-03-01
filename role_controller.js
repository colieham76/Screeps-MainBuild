"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_controller =
{
    renewAt: 150,

    onSpawn: function()
    {

    },

    run: function()
    {
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.carry.energy > 0)
        {
            let res = creep.upgradeController(creep.room.controller);
            if(res == ERR_NOT_IN_RANGE)
                creep.gotoTarget(creep.room.controller);
        }
        else
        {
            let refill = null;
            if(creep.memory.refill == undefined)
            {
                if(!creep.pos.isNearTo(creep.room.controller))
                {
                    creep.memory.nearController = undefined;
                    creep.gotoTarget(creep.room.controller);
                    return;
                }
                creep.memory.nearController = true;

                refill = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 5, {filter: function(res) { return res.resourceType == RESOURCE_ENERGY; }});

                if(refill.length)
                {
                    refill = refill[0];
                    creep.memory.refill = refill.id;
                }
            }
            else
                refill = Game.getObjectById(creep.memory.refill);

            if(refill != null && refill != undefined)
            {
                if((refill.energy != undefined && refill.energy > 0) || (refill.store != undefined && refill.store.energy > 0))
                {
                    var res = ERR_INVALID_TARGET;
                    res = creep.pickup(refill);
                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(refill, {range: 1});
                    else if(res == ERR_INVALID_TARGET)
                        creep.memory.refill = undefined;
                }
            }
            else
            {
                creep.memory.wait = 10;
                creep.memory.refill = undefined;
            }
        }
    },

    onRenew: function()
    {
        this.creep.memory.nearController = false;
    },

    onDeath: function()
    {
        if(this.creep.memory == undefined)
            return;

        this.creep.room.memory.lastCreepCheck = 5;
        this.creep.memory = undefined;
    }
};

module.exports = role_controller;