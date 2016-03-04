"use strict";

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var AttackController =
{

    /**
     *
     * @param num
     * @returns {{found: Array, spawn: number}}
     * @private
     */
    _getAttackers: function(num)
    {
        let ret = {found: [], spawn: 0};
        for(let k in Game.creeps)
        {
            if(Game.creeps[k].memory != undefined && Game.creeps[k].memory.role == "attacker" && Game.creeps[k].memory.attack_id == undefined)
                ret.found.push(Game.creeps[k].id);

            if(ret.found.length >= num)
                break;
        }

        if(ret.found.length < num)
        {
            for(let i = ret.found.length; i < num; i++)
                ret.spawn++;
        }

        return ret;
    },

    /**
     *
     * @param {number} id
     * @returns {*}
     */
    getAttack: function(id)
    {

    },

    initController: function()
    {

    },

    removeAttack: function(id)
    {
        let flag = Game.getObjectById(id);
        if(flag != null)
        {
            let waitFlag = Game.flags[flag.name + "_wait"];
            if(waitFlag != null)
            {
                waitFlag.memory = undefined;
                waitFlag.remove();
            }

            console.log(flag.name + ": ATTACK FINISHED");
            flag.memory = undefined;
            flag.remove();
        }
    },

    runController: function()
    {
        this.initController();

        /** @type {Flag[]} **/
        let attackFlags = [];
        for(let k in Game.flags)
        {
            if(Game.flags[k].memory.type == "attack" && Game.flags[k].memory.attackBegun == undefined)
                attackFlags.push(Game.flags[k]);
        }

        let attacks = [];

        for(let i = 0; i < attackFlags.length; i++)
        {
            let flag = attackFlags[i];
            let wait = Game.flags[flag.name + "_wait"];

            //flag Memory: { type: "attack", attackBegun: undefined }
            //wait Memory: { type: "wait", spawning: undefined, needed: { attackers: 0 } }

            if(wait != undefined && flag.memory.attackBegun == undefined && flag.memory.dontAttack == undefined)
            {
                let creeps = wait.pos.findInRange(FIND_MY_CREEPS, 5, {filter: c => { return c.memory.attack_id == flag.id; }});

                let roles = {};
                creeps.forEach(function(c)
                {
                    if(roles[c.memory.role] == undefined)
                        roles[c.memory.role] = [];

                    roles[c.memory.role].push(c);
                });

                let allFound = true;
                let creepsNeeded = [];

                if(wait.memory.spawning == undefined && wait.memory.needed != undefined)
                {
                    for(let role in wait.memory.needed)
                    {
                        if(roles[role] == undefined || roles[role].length < wait.memory.needed[role])
                        {
                            allFound = false;
                            let count = 0;
                            if(roles[role] != undefined)
                                count = roles[role].length;
                            for(let x = 0; x < wait.memory.needed[role] - count; x++)
                                creepsNeeded.push(role);
                        }
                    }
                }

                if(creeps.length > 0 && allFound)
                {
                    console.log(flag.name + ": ATTACK!!");
                    for(let role in roles)
                    {
                        roles[role].forEach(
                            /** @param {Creep} c **/
                            function(c)
                            {
                                c.memory.attack = true;
                                c.log("Attacking!");
                            }
                        );
                    }
                    flag.memory.attackBegun = true;
                    wait.memory.spawning = undefined;
                }
                else
                {
                    /** @type {Spawner} **/
                    let Spawner = require('Spawner');
                    /** @type {RoleBodyDefinitions} **/
                    let RBD = require('RoleBodyDefinitions');
                    //todo: Create at the closest spawn
                    Spawner.setRoom(Game.rooms["W15N8"]);

                    for(let x in creepsNeeded)
                    {
                        let role = creepsNeeded[x];
                        Spawner.addToQueue(role, RBD.getLevel(role, 0), true, false,
                            {
                                role: role, wait_id: wait.id, attack_id: flag.id
                            }
                        );
                    }
                    wait.memory.spawning = true;
                }
            }
        }


    },

    getName: function()
    {
        return "AttackController";
    }

};

let proto = require('Controller_prototype');
let out = require("extend")(AttackController, proto);
out = Object.create(out);

module.exports = out;