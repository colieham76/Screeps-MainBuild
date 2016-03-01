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
        var loggedRoles = {};

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

                            if(loggedRoles[creep.memory.role] == undefined)
                            {
                                if(Memory.stats == undefined)
                                    Memory.stats = {};

                                if(Memory.stats.emailTimer == undefined)
                                    Memory.stats.emailTimer = 500;

                                if(Memory.stats.ticks == undefined)
                                    Memory.stats.ticks = {};

                                if(Memory.stats.ticks[creep.memory.role] == undefined)
                                    Memory.stats.ticks[creep.memory.role] = [];

                                Memory.stats.ticks[creep.memory.role].push({time: Game.time, val: ticksRan});

                                if(Memory.stats.emailTimer == 0)
                                {
                                    let roleLen = 0;
                                    let controllerLen = 0;
                                    let messageLen = 0;

                                    Memory.stats.emailTimer = 500;
                                    let str = "Roles:\n";

                                    for(let k in Memory.stats.ticks)
                                    {
                                        let tick = "unknown";

                                        let arr = [];
                                        if(Memory.stats.ticks[k].val == undefined)
                                            arr = Memory.stats.ticks[k];
                                        else
                                        {
                                            arr = Memory.stats.ticks[k].val;
                                            tick = Memory.stats.ticks[k].time;
                                        }
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
                                        str += padding + k + "{ tick: " + tick + ", min: " + min.toFixed(2) + ", max: " + max.toFixed(2) + ", avg: " + avg.toFixed(2) + ", num: " + arr.length + " }\n";
                                    }
                                    Game.notify(str, 1);
                                    roleLen = str.length;

                                    if(Memory.stats.controllers != undefined)
                                    {
                                        str = "Controllers:\n";

                                        for(let k in Memory.stats.controllers)
                                        {
                                            let tick = "unknown";

                                            let arr = [];
                                            if(Memory.stats.controllers[k].val == undefined)
                                                arr = Memory.stats.controllers[k];
                                            else
                                            {
                                                arr = Memory.stats.controllers[k].val;
                                                tick = Memory.stats.controllers[k].time;
                                            }
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
                                            if(k.length < 18)
                                            {
                                                for(let j = 0; j < 18 - k.length; j++)
                                                    padding += " ";
                                            }

                                            let avg = all / arr.length;
                                            str += padding + k + "{ tick: " + tick + ", min: " + min.toFixed(2) + ", max: " + max.toFixed(2) + ", avg: " + avg.toFixed(2) + ", num: " + arr.length + " }\n";
                                        }
                                        Game.notify(str, 1);
                                        controllerLen = str.length;
                                    }

                                    if(Memory.messages != undefined)
                                    {
                                        str = "Messages:\n";

                                        for(let i in Memory.messages)
                                            str += Memory.messages[i].replace("\\\"", "\"") + "\n";
                                        Game.notify(str, 1);
                                        messageLen = str.length;
                                    }

                                    console.log("Statistics sent: " + roleLen + ", " + controllerLen + ", " + messageLen);

                                    Memory.stats.ticks = undefined;
                                    Memory.messages = undefined;
                                    Memory.stats.controllers = undefined;
                                }
                                else
                                    Memory.stats.emailTimer--;
                                loggedRoles[creep.memory.role] = true;
                            }
                        }

                        catch(e)
                        {
                            creep.log("Error in role " + creep.memory.role, e, " ", JSON.stringify(e));
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
            console.log("Error: Unable to find role " + role);
            return null;
        }
    }
};

module.exports = RoleManager;