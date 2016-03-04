"use strict";

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 *
 * @todo WIP
 */
var CarrierController =
{
    initController: function()
    {

    },

    runController: function()
    {
        let structurePriority = {
            STRUCTURE_SPAWN: 100,
            STRUCTURE_EXTENSION: 90,
            STRUCTURE_TOWER: 80,
            STRUCTURE_STORAGE: 0
        };

        let creepPriority = {
            builder: 100,
            controller: 90,
            maintainer: 80
        };

        let room = this.room;
        let structures = room.find(FIND_MY_STRUCTURES);
        let creeps = room.find(FIND_MY_CREEPS, {filter: c => { return c.memory != undefined; }});
        let carriers = [];

        /** @type {Structure[]|Structure_Tower[]|Structure_Extension[]|Spawn[]|Creep[]} **/
        let needEnergy = [];
        /** @type {Structure[]|Structure_Storage[]|Structure_Extension[]|Spawn[]|Creep[]} **/
        let hasEnergy = [];

        let energyNeeded = 0;
        let energyHas = 0;

        structures.forEach(
            /** @param {Structure|Structure_Storage|Spawn} struct **/
            function(struct)
            {
                if(Memory.structures[struct.id] != undefined && Memory.structures[struct.id].carrierEnroute != undefined)
                {
                    let carrier = Game.getObjectById(Memory.structures[struct.id].carrierEnroute);
                    if(carrier == null || carrier == undefined) //Carrier has died
                        Memory.structures[struct.id].carrierEnroute = undefined;
                }

                switch(struct.structureType)
                {

                    case STRUCTURE_EXTENSION:
                        if(struct.energy > 0)
                        {
                            hasEnergy.push(struct);
                            energyHas += struct.energy;
                        }
                        break;
                    case STRUCTURE_STORAGE:
                        if(struct.store.energy > 0)
                        {
                            hasEnergy.push(struct);
                            energyHas += struct.store.energy;
                        }
                        break;
                    case STRUCTURE_SPAWN:
                        if(struct.energy > struct.energyCapacity / 2)
                        {
                            hasEnergy.push(struct);
                            energyHas += struct.energy;
                        }
                        else if(Memory.structures[struct.id] != undefined && Memory.structures[struct.id].carrierEnroute == undefined)
                        {
                            needEnergy.push(struct);
                            energyNeeded += struct.energyCapacity - struct.energy;
                        }
                        break;
                    case STRUCTURE_TOWER:
                        if(struct.energy < struct.energyCapacity / 2 && Memory.structures[struct.id] != undefined && Memory.structures[struct.id].carrierEnroute == undefined)
                        {
                            needEnergy.push(struct);
                            energyNeeded += struct.energyCapacity - struct.energy;
                        }
                }
            }
        );

        creeps.forEach(
            /** @param {Creep} c **/
            function(c)
            {
                switch(c.memory.role)
                {
                    case "builder":
                    case "controller":
                    case "maintainer":
                        if(c.carryCapacity > 0 && c.carry.energy < c.carryCapacity / 2)
                        {
                            needEnergy.push(c);
                            energyNeeded += c.carryCapacity - c.carry.energy;
                        }
                        break;
                    case "carrier":
                        carriers.push(c);
                        break;
                }
            }
        );

        if(energyHas < energyNeeded)
        {
            needEnergy.sort(
                function(a, b)
                {
                    if(a.structureType != undefined && b.structureType != undefined)
                    {
                        if(a.structureType == b.structureType)
                        {
                            if(a.store != undefined)
                                return (a.store.energy / a.storeCapacity) - (b.store.energy / b.storeCapacity);
                            else
                                return (a.energy / a.energyCapacity) - (b.energy / b.energyCapacity);
                        }

                        if(a.structureType == STRUCTURE_SPAWN)
                            return -1;
                        else if(b.structureType == STRUCTURE_SPAWN)
                            return 1;

                        if(a.structureType == STRUCTURE_EXTENSION)
                            return -1;
                        else if(b.structureType == STRUCTURE_EXTENSION)
                            return 1;

                        if(a.structureType == STRUCTURE_TOWER)
                            return -1;
                        else if(b.structureType == STRUCTURE_TOWER)
                            return 1;
                    }
                    else
                    {
                        if(a.memory.role == b.memory.role)
                        {
                            if(a.carryCapacity > 0 && b.carryCapacity > 0)
                                return (a.carry.energy / a.carryCapacity) - (b.carry.energy / b.carryCapacity);
                            else
                                return 0;
                        }

                        if(a.memory.role == "builder")
                            return -1;
                        else if(b.memory.role == "builder")
                            return 1;

                        if(a.memory.role == "controller")
                            return -1;
                        else if(b.memory.role == "controller")
                            return 1;

                        if(a.memory.role == "maintainer")
                            return -1;
                        else if(b.memory.role == "maintainer")
                            return 1;
                    }

                    return 0;
                }
            );
        }

        let structIndex = 0;
        carriers.forEach(
            /** @param {Creep} creep **/
            function(creep)
            {
                let target = needEnergy[structIndex];
                let cTarget = null;
                if(creep.memory.target != undefined)
                    cTarget = Game.getObjectById(creep.memory.target);

                if(cTarget != null && cTarget != undefined)
                {
                    if(target.structureType != undefined && cTarget.structureType != undefined)
                    {
                        //Both are structures
                        if(structurePriority[target.structureType] > structurePriority[cTarget.structureType])
                            cTarget = target;
                    }
                    else if(target.structureType == undefined && cTarget.structureType == undefined)
                    {
                        //Both are creeps
                        if(creepPriority[target.memory.role] > creepPriority[cTarget.memory.role])
                            cTarget = target;
                    }
                    else if(target.structureType != undefined && cTarget.structureType == undefined) //Structures have higher priority than creeps
                        cTarget = target;
                }

                if(cTarget != null && cTarget != undefined)
                {
                    creep.memory.target = cTarget.id;
                }

            }
        );


    },

    getName: function()
    {
        return "CarrierController";
    }
};

let proto = require('Controller_prototype');
let out = require("extend")(CarrierController, proto);
out = Object.create(out);

module.exports = out;