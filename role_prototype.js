"use strict";

let role_prototype = {
    /**
     * @type {Creep}
     */
    creep: null,

    renewAt: 100,
    renewTo: 1000,

    setCreep: function(creep)
    {
        this.creep = creep;
    },

    onSpawn: function() { },

    /**
     * @param {Creep} creep
     */
    onRun: function(creep)
    {
        this.setCreep(creep);

        if(creep.spawning)
            return;

        if(creep.memory.hasSpawned == undefined)
        {
            this.onSpawn();
            creep.memory.hasSpawned = true;
        }
        else if(creep.ticksToLive <= 1 && creep.memory != undefined)
        {
            this.onDeath();
            creep.memory = undefined;
            return;
        }
        else if(creep.memory != undefined && ((creep.ticksToLive < this.renewAt && creep.ticksToLive > 2) || creep.memory.renewing == true))
        {
            if(creep.memory.renewing == undefined)
            {
                this.onRenew();
                creep.say("RECHARGE");
            }
            if(this.renewCreep() != "DONE")
                return;
        }

        creep.memory.renewTarget = undefined;
        this.run();
    },

    run: function() { },

    onDeath: function() { },

    onRenew: function() { },

    getWho: function()
    {
        return this.creep.memory.role;
    },

    renewCreep: function()
    {

        if(this.creep.ticksToLive >= this.renewTo)
        {
            this.creep.memory.renewing = undefined;
            return "DONE";
        }

        /** @type {Spawn} **/
        let target = null;
        this.creep.memory.renewing = true;
        if(this.creep.memory.renewTarget == undefined)
        {
            target = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {filter: s => s.energy >= 100});
            if(target != null && target != undefined)
                this.creep.memory.renewTarget = target.id;
        }
        else
            target = Game.getObjectById(this.creep.memory.renewTarget);

        if(target == null || target == undefined)
            this.creep.memory.renewTarget = undefined;
        else
        {
            if(!this.creep.pos.isNearTo(target))
            {
                this.creep.gotoTarget(target.pos);
                return ERR_NOT_IN_RANGE;
            }
            /*else if(target.spawning == null && target.energy >= 50)
                return target.renewCreep(this.creep);*/

            return ERR_BUSY;
        }
    }
};

module.exports = role_prototype;