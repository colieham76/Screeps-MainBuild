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

        let mgrTicksBefore = Game.cpu.getUsed();
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
                        /*if(role == null)
                            return true;
                        role = Object.create(role);*/
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
                                loggedRoles[creep.memory.role] = ticksRan;
                                if(Memory.showCPU == true)
                                    console.log(creep.memory.role + ": CPU Usage: " + ticksRan);
                            }
                            else
                                loggedRoles[creep.memory.role] += ticksRan;
                        }

                        catch(e)
                        {
                            creep.log("Error in role " + creep.memory.role, e, " ", JSON.stringify(e));
                        }
                    }
                }
            }
        });

        if(Memory.showCPU == true)
        {
            console.log("RoleManager: " + (Game.cpu.getUsed() - mgrTicksBefore));
            for(let k in loggedRoles)
                console.log(k + " Total: " + loggedRoles[k]);
        }

    },

    extend: null,

    gottenRoles: {},

    definedRoles: require('AllRoles'),

    role_prototype: null,

    /**
     *
     * @param {string} role
     * @returns {role_prototype|null}
     */
    getRole: function(role)
    {
        try
        {
            if(this.definedRoles["role_" + role] != undefined)
                return this.definedRoles["role_" + role];

            if(this.role_prototype == null)
                this.role_prototype = require('role_prototype');

            if(this.gottenRoles[role] == undefined)
                this.gottenRoles[role] = require('role_' + role);

            let roleObj = require("role_" + role);
            let proto = require("role_prototype");

            if(this.extend == null)
                this.extend = require('extend');

            roleObj = this.extend(this.gottenRoles[role], this.role_prototype);

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