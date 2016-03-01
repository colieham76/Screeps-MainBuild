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
        for(let i = 0; i < Memory.attacks.length; i++)
        {
            if(Memory.attacks[i].id == id)
                return Memory.attacks[i];
        }

        return null;
    },

    removeAttack: function(id)
    {
        let attacks = [];
        for(let i = 0; i < Memory.attacks.length; i++)
        {
            if(Memory.attacks[i].id != id)
                attacks.push(Memory.attacks[i]);
        }
        if(Memory.attacks.length < attacks.length)
            console.log("Attack " + id + " has finished!");
        Memory.attacks = attacks;
    },

    initController: function()
    {
        if(Memory.attacks == undefined)
            Memory.attacks = [];
    },

    runController: function()
    {
        this.initController();

        if(Memory.attacks.length == 0)
            return;

        for(let i = 0; i < Memory.attacks.length; i++)
        {
            /**
             * @type {{id: number, from: RoomPosition, to: RoomPosition, attackers: [], neededAttackers: number}}
             */
            let attack = Memory.attacks[i];

            if(attack.attackers == undefined)
                attack.attackers = [];

            if(attack.attackers.length < attack.neededAttackers && attack.waitingForAttacker == undefined)
            {
                let attackers = this._getAttackers(attack.neededAttackers - attack.attackers.length);
                for(let id in attackers.found)
                {
                    let creep = Game.getObjectById(attackers.found[id]);
                    if(creep != null && creep.memory != undefined)
                    {
                        creep.memory.attack_id = attack.id;
                        attack.attackers.push(creep.id);
                    }
                }

                if(attackers.spawn > 0)
                {
                    let room = Game.rooms[attack.from.roomName];

                    if(room != null && room != undefined)
                    {
                        /** @type {Spawner} **/
                        let Spawner = require('Spawner');
                        for(let j = 0; j < attackers.spawn; j++)
                        {
                            Spawner.setRoom(room);
                            Spawner.addToQueue("attacker", [MOVE, ATTACK], true, false, {role: "attacker", attack_id: attack.id});
                        }
                        attack.waitingForAttacker = true;
                    }
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