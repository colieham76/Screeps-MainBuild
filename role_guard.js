"use strict";

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
let role_guard =
{
    _assignGuardpost: function()
    {
        var creep = this.creep;
        let flags = creep.room.find(FIND_FLAGS, {

            /** @param {Flag} flag **/
            filter: function(flag)
            {
                return flag.memory.type == "guardpost";
            }
        });


        flags = flags.sort(function(a, b){

            if(a.memory.assigned == undefined)
                a.memory.assigned = [];

            if(b.memory.assigned == undefined)
                b.memory.assigned = [];

            return a.memory.assigned.length - b.memory.assigned.length;
        });

        if(flags.length)
        {
            creep.memory.guardpost = flags[0].id;

            if(flags[0].memory.assigned == undefined)
                flags[0].memory.assigned = [];

            flags[0].memory.assigned.push(creep.id);
        }
    },

    onSpawn: function()
    {
        let creep = this.creep;
        creep.memory.wait = 0;
        this._assignGuardpost();
    },

    run: function()
    {
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        /** @type {Creep[]} **/
        let enemies = creep.room.find(FIND_HOSTILE_CREEPS);

        if(enemies.length == 0)
        {
            if(creep.memory.guardpost == undefined)
            {
                this._assignGuardpost();
                creep.memory.wait = 5;
            }
            else
            {
                var gp = Game.getObjectById(creep.memory.guardpost);
                if(gp == null || gp == undefined)
                    creep.memory.guardpost = undefined;
                else if(!creep.pos.inRangeTo(gp.pos, 1))
                    creep.gotoTarget(gp);
                else
                {
                    creep.memory.goto = undefined;
                    creep.memory.wait = 5;
                }
            }
        }
        else
        {
            let closest = creep.pos.findClosestByPath(enemies,
                {
                    /** @param {Creep} enemy **/
                    filter: function(enemy)
                    {
                        return enemy.getActiveBodyparts(ATTACK) > 0 || enemy.getActiveBodyparts(RANGED_ATTACK) > 0;
                    }
                });

            if(closest == null || closest == undefined)
            {
                closest = creep.pos.findClosestByPath(enemies,
                    {
                        /** @param {Creep} enemy **/
                        filter: function(enemy)
                        {
                            return enemy.getActiveBodyparts(HEAL) > 0;
                        }
                    });
            }

            if(closest == null || closest == undefined)
                closest = enemies[0];

            if(closest != null && closest != undefined)
            {
                if(creep.getActiveBodyparts(RANGED_ATTACK) > 0 && creep.pos.inRangeTo(closest.pos, 3))
                {
                    creep.rangedAttack(closest);
                    return;
                }

                if(!creep.pos.isNearTo(closest))
                {
                    if(closest.getActiveBodyparts(RANGED_ATTACK) > 0 && creep.pos.inRangeTo(closest.pos, 3))
                        creep.moveTo(closest);
                }
                else
                    creep.attack(closest);
            }
        }
    },

    onDeath: function()
    {
        if(this.creep.memory.guardpost != undefined)
        {
            let gp = Game.getObjectById(this.creep.memory.guardpost);
            if(gp != undefined && gp != null)
            {
                let nArr = [];
                for(let i = 0; i < gp.memory.assigned.length; i++)
                {
                    if(gp.memory.assigned[i] != this.creep.id)
                        nArr.push(gp.memory.assigned[i]);
                }
                gp.memory.assigned = nArr;
            }
        }
        this.creep.memory = undefined;
    }
};

module.exports = role_guard;