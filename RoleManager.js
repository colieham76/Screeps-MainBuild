"use strict";

/**
 * @class
 * @constructor
 */
let RoleManager =
{
    work: function()
    {
        var mgr = this;
        var gottenRoles = {};

        _.forEach(Game.creeps,/** @param {Creep} creep **/function(creep)
        {
            if(!creep.spawning)
            {
                if(creep.memory.role != undefined)
                {
                    let role = null;
                    if(gottenRoles[creep.memory.role] == undefined)
                    {
                        role = mgr.getRole(creep.memory.role);
                        if(role == null)
                            return true;
                        role = Object.create(role);
                        gottenRoles[creep.memory.role] = role;
                    }
                    else
                        role = gottenRoles[creep.memory.role];

                    if(role != null)
                    {

                        try
                        {
                            let ticksBefore = Game.cpu.getUsed();
                            role.onRun(creep);
                            let ticksRan = Game.cpu.getUsed() - ticksBefore;

                            if(Memory.stats == undefined)
                                Memory.stats = {};

                            if(Memory.stats.emailTimer == undefined)
                                Memory.stats.emailTimer = 500;

                            if(Memory.stats.ticks == undefined)
                                Memory.stats.ticks = {};

                            if(Memory.stats.ticks[creep.memory.role] == undefined)
                                Memory.stats.ticks[creep.memory.role] = [];

                            Memory.stats.ticks[creep.memory.role].push(ticksRan);

                            if(Memory.stats.emailTimer == 0)
                            {
                                Memory.stats.emailTimer = 500;
                                let str = "";

                                for(let k in Memory.stats.ticks)
                                {
                                    let arr = Memory.stats.ticks[k];
                                    let all = 0;
                                    let min = 1000;
                                    let max = 0;
                                    for(let i = 1; i < arr.length; i++)
                                    {
                                        let j = arr[i] - arr[i - 1];
                                        if (j < min)
                                            min = j;
                                        if(j > max)
                                            max = j;
                                        all += j;
                                    }

                                    let padding = "";
                                    if(k.length < 11)
                                    {
                                        for(let j = 0; j < 11 - k.length; j++)
                                            padding += " ";
                                    }

                                    let avg = all / arr.length;
                                    str += padding + k + "{ min: " + min.toFixed(2) + ", max: " + max.toFixed(2) + ", avg: " + avg.toFixed(2) + ", num: " + arr.length + " }\n";
                                }

                                Game.notify(str, 60);
                                Memory.stats.ticks = undefined;
                            }
                            else
                                Memory.stats.emailTimer--;
                        }

                        catch(e)
                        {
                            console.log("Error in role " + creep.memory.role, e, " ", JSON.stringify(e));
                        }
                    }
                }
            }
        });
    },

    /**
     *
     * @param {string} role
     * @returns {role_prototype|null}
     */
    getRole: function(role)
    {
        try
        {
            let roleObj = require("role_" + role);
            /** @type {role_prototype} **/
            let proto = require("role_prototype");

            roleObj = require("extend")(roleObj, proto);

            return roleObj;
        }
        catch(e)
        {
            return null;
        }
    }
};

module.exports = RoleManager;