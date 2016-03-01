"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_carrier2 =
{
    /** @type {CarrierController} **/
    commander: null,

    onSpawn: function()
    {
        this.commander = require('CarrierController');
        this.commander.hasEnergy(this.creep, this.creep.carry.energy);
    },

    run: function()
    {
        this.commander = require('CarrierController');

        let creep = this.creep;
        if(creep.memory.target != undefined)
        {
            /** @type {Creep|Structure|Resource} **/
            let target = Game.getObjectById(creep.memory.target);
            if(target == null || target == undefined)
                creep.memory.target = undefined;
            else
            {
                if(!creep.pos.isNearTo(target.pos))
                    creep.gotoTarget(target.pos);
                else
                {
                    if(creep.memory.amount == -1)
                        creep.memory.amount = undefined;

                    creep.memory.goto = undefined;
                    if(creep.memory.type == "transfer")
                    {
                        let res = ERR_BUSY;
                        if(target.transferEnergy != undefined)
                            res = target.transferEnergy(creep);
                        else
                            res = target.transfer(creep, RESOURCE_ENERGY);

                        if(res == OK)
                            this.commander.hasEnergy(creep, creep.carry.energy);

                        if(creep.carry.energy == creep.carryCapacity)
                            creep.memory.target = undefined;
                    }
                    else if(creep.memory.type == "pickup")
                    {
                        let res = creep.pickup(target);
                        if(res == OK)
                            this.commander.hasEnergy(creep, creep.carry.energy);

                        if(creep.carry.energy == creep.carryCapacity)
                            creep.memory.target = undefined;
                    }
                    else if(creep.memory.type == "drop")
                    {
                        let res = creep.drop(RESOURCE_ENERGY, creep.memory.amount);
                        if(res == OK)
                        {
                            this.commander.hasEnergy(creep, creep.carry.energy);
                            creep.memory.target = undefined;
                        }
                    }
                    else if(creep.memory.type == "give" || creep.memory.type == undefined)
                    {
                        let res = creep.transfer(target, RESOURCE_ENERGY, creep.memory.amount);
                        if(res == OK)
                        {
                            this.commander.hasEnergy(creep, creep.carry.energy);
                            creep.memory.target = undefined;
                        }
                    }
                }
            }
        }
        this.commander.hasEnergy(this.creep, this.creep.carry.energy);
    },

    onDeath: function()
    {
        if(this.creep.memory == undefined)
            return;
        this.commander = require('CarrierController');

        this.commander.removeMe(this.creep);
        this.creep.memory = undefined;
    }
};

module.exports = role_carrier2;