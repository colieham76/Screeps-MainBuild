"use strict";

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_healer =
{

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

        if(creep.memory.target == undefined)
        {
            /** @type {Creep[]} **/
            var targets = creep.room.find(FIND_MY_CREEPS, {

                /** @param {Creep} c **/
                filter: function(c)
                {
                    return c.hits < c.hitsMax;
                }
            });

            if(targets.length == 0)
                creep.memory.wait = 10;
            else
            {
                targets.sort(
                    /**
                     * @param {Creep} a
                     * @param {Creep} b
                     */
                    function(a, b)
                    {
                        if(a.memory.role == b.memory.role)
                        {
                            let aDist = creep.pos.getRangeTo(a);
                            let bDist = creep.pos.getRangeTo(b);
                            return aDist - bDist;
                        }

                        var cArr = ["guard", "healer", "builder", "harvester"];

                        for(let k in cArr)
                        {
                            if(a.memory.role == k)
                                return 1;
                            else if(b.memory.role == k)
                                return -1;
                        }

                        return 0;
                    }
                );

                creep.memory.target = targets[0].id;
            }
        }

        let target = Game.getObjectById(creep.memory.target);
        if(target == undefined || target == null)
            creep.memory.target = undefined;
        else
        {
            if(target.hits == target.hitsMax)
                creep.memory.target = undefined;

            let res = creep.heal(target);
            if(res == ERR_NOT_IN_RANGE)
                creep.moveTo(target);
            else if(res == ERR_INVALID_TARGET)
                creep.memory.target = undefined;
        }
    },

    onDeath: function()
    {
        this.creep.room.lastCreepCheck = 0;
        this.creep.memory = undefined;
    }
};

module.exports = role_healer;