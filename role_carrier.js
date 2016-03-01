"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_carrier =
{

    _dropOff: function()
    {
        let creep = this.creep;

        let dropOff = null;
        if(creep.memory.dropOff == undefined)
        {
            let enemies = creep.room.find(FIND_HOSTILE_CREEPS).length;

            require("Stat").set("Carrier", "Looking for structures");
            dropOff = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                /** @param {Structure} struct **/
                filter: function(struct)
                {
                    return (struct.structureType == STRUCTURE_EXTENSION && struct.energy < struct.energyCapacity) ||
                        (struct.structureType == STRUCTURE_SPAWN && struct.energy < struct.energyCapacity)
                }
            });
            require("Stat").set("Carrier", "structures done");

            if(((dropOff == null || dropOff == undefined) && creep.room.controller.level > 2) || enemies > 0)
            {
                dropOff = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                    /** @param {Structure_Tower} struct **/
                    filter: function(struct)
                    {
                        return (struct.structureType == STRUCTURE_TOWER && struct.energyCapacity - struct.energy >= 500);
                    }
                });
            }

            if((dropOff == null || dropOff == undefined) && creep.room.storage != undefined && creep.room.storage.store.energy < creep.room.storage.storeCapacity)
                dropOff = creep.room.storage;

            if(dropOff == null || dropOff == undefined)
            {
                require("Stat").set("Carrier", "looking for builder/maintainer");
                dropOff = creep.pos.findClosestByPath(FIND_MY_CREEPS,
                    {
                        filter: function(c)
                        {
                            return (c.memory.role == "builder" && c.carry.energy < c.carryCapacity / 2) ||
                                (c.memory.role == "controller") ||
                                (c.memory.role == "maintainer" && c.carry.energy < c.carryCapacity / 2);
                        }
                    });
                require("Stat").set("Carrier", "builder/maintainer searched one");
            }

            if(dropOff == null || dropOff == undefined)
            {
                require("Stat").set("Carrier", "looking for controller");
                dropOff = creep.room.find(FIND_MY_CREEPS, {
                    filter: function(c){
                        return c.memory.role == "controller";
                    }
                });

                if(dropOff.length)
                    dropOff = dropOff[0];
                require("Stat").set("Carrier", "controller search done");
            }

            if(dropOff != null && dropOff != undefined)
                creep.memory.dropOff = dropOff.id;
            require("Stat").set("Carrier", "Searched Dropoff");
        }
        else
        {
            dropOff = Game.getObjectById(creep.memory.dropOff);
            require("Stat").set("Carrier", "Got Dropoff");
        }

        if(dropOff != null && dropOff != undefined)
        {
            if((dropOff.energy != undefined && dropOff.energy == dropOff.energyCapacity) ||
                (dropOff.carry != undefined && dropOff.carry.energy == dropOff.carryCapacity) ||
                (dropOff.store != undefined && dropOff.store.energy == dropOff.storeCapacity))
            {
                creep.memory.sameTarget = {id: 0, times: 0};
                creep.memory.dropOff = undefined;
            }

            let res = creep.transfer(dropOff, RESOURCE_ENERGY);
            if(res == ERR_NOT_IN_RANGE)
            {
                if(creep.memory.timesMoved == undefined)
                    creep.memory.timesMoved = 0;

                if(creep.memory.timesMoved > 10)
                {
                    creep.memory.timesMoved = undefined;
                    creep.memory.dropOff = undefined;
                }
                else
                    creep.memory.timesMoved++;

                creep.gotoTarget(dropOff);
            }
            else if(res == ERR_FULL && dropOff.memory != undefined && dropOff.memory.role == "controller" && dropOff.memory.nearController == true)
                creep.drop(RESOURCE_ENERGY);
            else if(res == ERR_FULL)
                creep.memory.dropOff = undefined;
            else if(res == ERR_INVALID_TARGET)
                creep.memory.dropOff = undefined;
            else if(res == OK && creep.carry.energy > 0 && dropOff.memory != undefined && dropOff.memory.role == "controller" && dropOff.memory.nearController == true)
                creep.drop(RESOURCE_ENERGY);

            require("Stat").set("Carrier", "Did Dropoff");
            require("CarrierController").hasEnergy(creep, creep.carry.energy);

            if(creep.memory.sameTarget == undefined || creep.memory.sameTarget.id != dropOff.id)
                creep.memory.sameTarget = {id: dropOff.id, times: 0};
            else
                creep.memory.sameTarget.times++;

            if(creep.memory.sameTarget.times > 10)
            {
                creep.memory.sameTarget = {id: 0, times: 0};
                creep.memory.dropOff = undefined;
            }
            require("Stat").set("Carrier", "Same target check");

        }
        else
            creep.memory.dropOff = undefined;

        if(creep.carry.energy == 0)
            creep.memory.mode = undefined;
    },

    onSpawn: function()
    {
        let creep = this.creep;
        creep.memory.wait = 0;

        if(creep.memory.miner != undefined)
        {
            let miner = Game.getObjectById(creep.memory.miner);
            if(miner != undefined && miner != null)
            {
                miner.memory.carriers.push(creep.id);
                miner.memory.carrierSpawning = undefined;
            }
        }

    },

    run: function()
    {
        let creep = this.creep;

        /*if(creep.carry.energy == creep.carryCapacity)
        {

        }*/
        if(creep.memory.wait > 0 && creep.memory.mode != "dropOff")
        {
            creep.memory.wait--;
            return;
        }

        if(creep.memory.miner == undefined)
        {
            /** @type {Resource} **/
            let target = null;

            if(creep.memory.target == undefined)
            {
                let controllerCreep = creep.room.find(FIND_MY_CREEPS, {filter: function(c) { return c.memory.role == "controller"; }});
                if(controllerCreep.length)
                    controllerCreep = controllerCreep[0];
                else
                    controllerCreep = null;

                target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: function(res)
                    {
                        return res.resourceType == RESOURCE_ENERGY && res.amount > 10 && (controllerCreep == null || controllerCreep == undefined || !controllerCreep.pos.inRangeTo(res, 3));
                    }
                });

                if(target != null && target != undefined)
                    creep.memory.target = target.id;
            }
            else
                target = Game.getObjectById(creep.memory.target);


            if(target == undefined || target == null)
            {
                creep.memory.target = undefined;
                creep.memory.wait = 10;
            }
            else
            {
                let res = creep.pickup(target);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target.pos);
                else if(res == ERR_INVALID_TARGET)
                    creep.memory.target = undefined;
            }


            if(creep.carry.energy >= creep.carryCapacity / 2)
            {
                creep.memory.mode = "dropOff";
                this._dropOff();
            }
            else
                creep.memory.dropOff = undefined;
        }
        else
        {
            require("Stat").set("Carrier", "Start");
            let miner = Game.getObjectById(creep.memory.miner);
            if(miner == null || miner == undefined)
                creep.memory.miner = undefined;
            else
            {
                require("Stat").set("Carrier", "Got Miner");
                if(creep.memory.mode == "dropOff")
                {
                    this._dropOff();
                }
                else if(miner.memory.isNearSource)
                {
                    creep.memory.dropOff = undefined;
                    if(!creep.pos.inRangeTo(miner.pos, 2)) {
                        require("Stat").set("Carrier", "Going to miner");
                        creep.gotoTarget(miner.pos);
                        require("Stat").set("Carrier", "Went to miner");
                    }
                    else
                    {
                        creep.memory.goto = undefined;

                        require("Stat").set("Carrier", "Looking for resource");
                        /** @type {Resource[]} **/
                        let resource = creep.room.lookForAt("resource", miner.pos.x, miner.pos.y);
                        if(resource.length && resource[0].resourceType == RESOURCE_ENERGY)
                        {
                            let res = creep.pickup(resource[0]);
                            if(res == ERR_NOT_IN_RANGE)
                                creep.gotoTarget(resource[0].pos);
                        }
                        else
                            creep.memory.wait = 5;
                        require("Stat").set("Carrier", "Got resource");

                        if(creep.carry.energy >= creep.carryCapacity)
                            creep.memory.mode = "dropOff";

                    }
                }
            }
        }
    },

    onDeath: function()
    {
        let creep = this.creep;

        if(creep.memory == undefined)
            return;

        if(creep.memory.miner != undefined)
        {
            let miner = Game.getObjectById(creep.memory.miner);
            if(miner != undefined && miner != null)
            {
                var nArr = [];
                miner.memory.carriers.forEach(function(carrier)
                {
                    if(carrier != creep.id)
                        nArr.push(carrier);
                });
                miner.memory.carriers = nArr;
            }
        }

        creep.memory = undefined;
    },

    getWho: function()
    {
        if(this.creep.memory.miner == undefined)
            return "carrier(E)";
        else
            return "carrier";
    }
};

module.exports = role_carrier;