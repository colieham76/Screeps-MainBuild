"use strict";

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_attacker =
{
    renewAt: 0,

    /**
     *
     * @returns {Creep|Structure|null}
     * @private
     */
    _getTarget: function()
    {
        let creep = this.creep;

        let enemies = creep.room.find(FIND_HOSTILE_CREEPS, {filter: c => { return c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0 }});

        let target = null;
        if(creep.memory.target == undefined || enemies.length > 0)
        {
            target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: c => { return c.getActiveBodyparts(RANGED_ATTACK); }});
            let closeTarget = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {filter: c => { return c.getActiveBodyparts(ATTACK); }});

            if(target != null && closeTarget != null)
            {
                let targetRange = creep.pos.getRangeTo(target);
                let closeRange = creep.pos.getRangeTo(closeTarget);
                if(targetRange > 3 || closeRange < targetRange)
                    closeTarget = target;
            }

            if(target == null && closeTarget != null)
                target = closeTarget;

            if(target == null || target == undefined)
                target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {filter: s => { return s.structureType ==  STRUCTURE_TOWER; }});

            if(target == null || target == undefined)
                target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);

            if(target == null || target == undefined)
                target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {filter: s => { return s.structureType != STRUCTURE_CONTROLLER; }});

            if(target == null || target == undefined)
                target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);

            if(target != null && target != undefined)
                creep.memory.target = target.id;
            else
            {
                creep.memory.target = undefined;
                return null;
            }
        }
        else
        {
            target = Game.getObjectById(creep.memory.target);
            if(target == null || target == undefined)
            {
                creep.memory.target = undefined;
                return this._getTarget();
            }
            else
            {
                if(creep.memory.sameTarget == undefined || creep.memory.sameTarget.id != target.id)
                    creep.memory.sameTarget = {id: target.id, times: 0};
                else
                    creep.memory.sameTarget.times++;

                if(creep.memory.sameTarget >= 20)
                {
                    creep.memory.target = undefined;
                    return this._getTarget();
                }
            }
        }

        return target;
    },

    _invertDir: function(dir)
    {
        switch(dir)
        {
            case TOP:
                return BOTTOM;
            case TOP_LEFT:
                return BOTTOM_RIGHT;
            case LEFT:
                return RIGHT;
            case BOTTOM_LEFT:
                return TOP_RIGHT;
            case BOTTOM:
                return TOP;
            case BOTTOM_RIGHT:
                return TOP_LEFT;
            case RIGHT:
                return LEFT;
            case TOP_RIGHT:
                return BOTTOM_LEFT;
        }

        return TOP;
    },

    onSpawn: function()
    {
        if(this.creep.memory.attack_id == undefined)
        {
            this.creep.log("ERROR: I DONT HAVE A TARGET TO ATTACK");
            this.onDeath();
            this.creep.suicide();
        }
    },

    run: function()
    {
        var creep = this.creep;

        if(creep.memory != undefined)
        {
            //Memory: role, attack_id, waitPoint, attack

            let attack_flag = Game.getObjectById(creep.memory.attack_id);
            let waitFlag = Game.getObjectById(creep.memory.wait_id);

            if(attack_flag == null || waitFlag == null)
            {
                return;
            }

            /*if(attack_flag == null || waitFlag == null)
            {
                this.creep.log("Nooo, did we fail the attack? :(");
                this.onDeath();
                this.creep.suicide();
                return;
            }*/

            if(creep.memory.attack == undefined)
            {
                if(!creep.pos.inRangeTo(waitFlag.pos, 3))
                    creep.gotoTarget(waitFlag.pos);
            }
            else
            {
                if(creep.pos.roomName != attack_flag.pos.roomName)
                    creep.gotoTarget(attack_flag.pos);
                else
                {
                    if(creep.pos.x == 0)
                        creep.move(RIGHT);
                    else if(creep.pos.x == 49)
                        creep.move(LEFT);
                    else if(creep.pos.y == 0)
                        creep.move(BOTTOM);
                    else if(creep.pos.y == 49)
                        creep.move(TOP);

                    /** @type {Creep|Structure} **/
                    let target = this._getTarget();

                    if(target == null)
                    {
                        creep.memory.attack = undefined;
                        /** @type {AttackController} **/
                        var AttackController = require('AttackController');
                        AttackController.removeAttack(creep.memory.attack_id);
                        return;
                    }

                    if(target.carryCapacity != undefined) //Target is a creep
                    {
                        if(creep.getActiveBodyparts(RANGED_ATTACK) > 0)
                        {
                            if(creep.pos.inRangeTo(target.pos, 3))
                                creep.rangedAttack(target);
                            else
                                creep.gotoTarget(target.pos);

                            if(target.getActiveBodyparts(ATTACK) > 0 && creep.pos.inRangeTo(target.pos, 2))
                            {
                                let dir = creep.pos.getDirectionTo(target.pos);
                                //dir = HelperFuns.GetOppositeDir(dir);
                                dir = this._invertDir(dir);
                                creep.move(dir);
                            }
                        }
                        else if(creep.getActiveBodyparts(ATTACK) > 0)
                        {
                            if(creep.attack(target) == ERR_NOT_IN_RANGE)
                            {
                                let ret = creep.gotoTarget(target);
                                if(ret == ERR_NO_PATH || ret == ERR_INVALID_TARGET)
                                    creep.memory.target = undefined;
                            }
                        }
                        else if(creep.getActiveBodyparts(MOVE) > 0)
                        {
                            if(!creep.pos.inRangeTo(target.pos, 4))
                                creep.gotoTarget(target.pos);
                            else if(creep.pos.inRangeTo(target.pos, 2))
                            {
                                let dir = creep.pos.getDirectionTo(target.pos);
                                dir =  this._invertDir(dir);
                                creep.move(dir);
                            }
                        }
                    }
                    else if(target.structureType != undefined) //Target is a structure
                    {
                        if(creep.getActiveBodyparts(ATTACK) > 0)
                        {
                            if(creep.attack(target) == ERR_NOT_IN_RANGE)
                            {
                                let ret = creep.gotoTarget(target);
                                if(ret == ERR_NO_PATH || ret == ERR_INVALID_TARGET)
                                    creep.memory.target = undefined;
                            }
                        }

                        if(creep.getActiveBodyparts(RANGED_ATTACK) > 0)
                        {
                            if(creep.pos.inRangeTo(target.pos, 3))
                                creep.rangedAttack(target);
                            else
                            {
                                let ret = creep.gotoTarget(target.pos);
                                if(ret == ERR_NO_PATH || ret == ERR_INVALID_TARGET)
                                    creep.memory.target = undefined;
                            }
                        }
                    }
                }
            }

        }
    },

    onDeath: function()
    {
        this.creep.memory = undefined;
    }

};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_builder =
{

    _assignTarget: function()
    {
        var creep = this.creep;
        var sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);

        if(sites.length == 0)
        {
            sites = creep.room.find(FIND_STRUCTURES, {
                /**
                 *
                 * @param {Structure} struct
                 */
                filter: function(struct)
                {
                    return struct.hits < struct.hitsMax && struct.isActive();
                }
            });

            if(sites.length == 0)
                creep.memory.wait = 20;



            sites.sort(
                /**
                 *
                 * @param {Structure} a
                 * @param {Structure} b
                 */
                function(a, b)
                {
                    var aHits = a.hitsMax / a.hits;
                    var bHits = b.hitsMax / b.hits;

                    return bHits - aHits;
                }
            );
        }
        else
        {
            sites.sort(
                /**
                 *
                 * @param {ConstructionSite} a
                 * @param {ConstructionSite} b
                 */
                function(a, b)
                {
                    if(a.structureType == b.structureType)
                        return b.progress - a.progress;

                    var cArray = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_EXTENSION, STRUCTURE_STORAGE];

                    for(let i = 0; i < cArray.length; i++)
                    {
                        if(a.structureType == cArray[i])
                            return -1;
                        else if(b.structureType == cArray[i])
                            return 1;
                    }

                    return 1;
                }
            );
        }

        if(sites.length == 0)
            return null;

        creep.memory.target = sites[0].id;
        return sites[0];
    },


    onSpawn: function()
    {
        this.creep.memory.wait = 0;
    },

    run: function()
    {
        var creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        var target = undefined;

        if(creep.memory.target == undefined)
            target = this._assignTarget();
        else
            target = Game.getObjectById(creep.memory.target);

        if(target == null || target == undefined)
            creep.memory.target = undefined;
        else
        {
            if(creep.memory.mode == undefined)
            {
                let res = creep.build(target);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target);
                else if(res == OK)
                    this.renewAt = 100;
                else if(res == ERR_NOT_ENOUGH_RESOURCES)
                {
                    creep.memory.goto = undefined;
                    creep.memory.mode = "fill";
                }
                else if(res == ERR_INVALID_TARGET)
                {
                    if(target.hits == target.hitsMax)
                    {
                        creep.memory.target = undefined;
                        this.renewAt = 0;
                        return;
                    }
                    res = creep.repair(target);

                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(target);
                    else if(res == OK)
                        this.renewAt = 0;
                    else if(res == ERR_NOT_ENOUGH_RESOURCES)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.mode = "fill";
                    }
                }
            }
            else
            {

                creep.memory.target = undefined; //Reset the target, in case we want to build something with higher priority

                let reload = undefined;
                if(creep.memory.reloadTarget == undefined)
                {

                    if(creep.room.storage != null && creep.room.storage != undefined && creep.room.storage.store.energy > 0)
                        reload = creep.room.storage;

                    if((creep.room.energyAvailable < 250 && creep.carry.energy == 0) || creep.room.memory.prioSpawnQueue.length > 0)
                    {
                        if(reload == null || reload == undefined)
                        {
                            console.log("waiting...");
                            creep.memory.wait = 10;
                            return;
                        }
                    }

                    if(reload == null || reload == undefined)
                    {
                        reload = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                            filter: function(struct)
                            {
                                return (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0) ||
                                    (struct.structureType == STRUCTURE_LINK && struct.energy > 0) ||
                                    (struct.structureType == STRUCTURE_STORAGE && struct.store.energy > 0);
                            }
                        });
                    }

                    if(reload == null || reload == undefined)
                    {
                        reload = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
                            filter: function(struct)
                            {
                                return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0);
                            }
                        });
                    }

                    if(reload != null && reload != undefined)
                    {
                        creep.memory.reloadTarget = reload.id;
                    }
                    else
                        creep.memory.wait = 10;
                }
                else
                    reload = Game.getObjectById(creep.memory.reloadTarget);

                if(reload == null || reload == undefined)
                    creep.memory.reloadTarget = undefined;
                else
                {
                    var res = ERR_INVALID_TARGET;
                    if(reload.transferEnergy != undefined)
                        res = reload.transferEnergy(creep);
                    else
                        res = reload.transfer(creep, RESOURCE_ENERGY);

                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(reload);
                    else if(res == ERR_NOT_ENOUGH_RESOURCES)
                        creep.memory.reloadTarget = undefined;
                }

                if(creep.carry.energy > creep.carryCapacity / 2)
                {
                    creep.memory.goto = undefined;
                    creep.memory.reloadTarget = undefined;
                    creep.memory.mode = undefined;
                }
            }
        }
    },

    onDeath: function()
    {
        this.creep.memory = undefined;
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_carrier =
{

    /** @param {Creep} controller **/
    _controllerHasEnergy: function(controller)
    {
        if(controller.carry.energy > 0)
            return true;

        return controller.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {filter: r => { return r.resourceType == RESOURCE_ENERGY; }}).length > 0;
    },

    _dropOff: function()
    {
        let creep = this.creep;

        if(creep.carry.energy == 0)
        {
            creep.memory.mode = undefined;
            return ERR_INVALID_TARGET;
        }

        let dropOff = null;

        let r = this;
        if(creep.memory.dropOff == undefined)
        {
            let enemies = creep.room.find(FIND_HOSTILE_CREEPS).length;

            if(dropOff == null || dropOff == undefined)
            {
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
            }

            if(dropOff == null || dropOff == undefined)
            {
                require("Stat").set("Carrier", "Looking for structures");
                dropOff = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                    /** @param {Structure_Tower} struct **/
                    filter: function(struct)
                    {
                        return (struct.structureType == STRUCTURE_TOWER && struct.energy < struct.energyCapacity / 2);
                    }
                });
                require("Stat").set("Carrier", "structures done");
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
                        return c.memory.role == "controller" && !r._controllerHasEnergy(c);
                    }
                });

                if(dropOff.length)
                    dropOff = dropOff[0];
                require("Stat").set("Carrier", "controller search done");
            }

            if((dropOff == null || dropOff == undefined) && creep.room.storage != null && creep.room.storage != undefined)
            {
                dropOff = creep.room.storage;
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

            if(creep.memory.sameTarget.times > 5)
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

        return OK;
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

        if(creep.memory.mode == "dropOff")
        {
            if(this._dropOff() == OK)
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
                else if(creep.carry.energy > 0)
                    creep.memory.mode = "dropOff";
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

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_controller =
{
    renewAt: 150,

    onSpawn: function()
    {

    },

    run: function()
    {
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.carry.energy > 0)
        {
            let res = creep.upgradeController(creep.room.controller);
            if(res == ERR_NOT_IN_RANGE)
                creep.gotoTarget(creep.room.controller);
        }
        else
        {
            let refill = null;
            if(creep.memory.refill == undefined)
            {
                if(!creep.pos.isNearTo(creep.room.controller))
                {
                    creep.memory.nearController = undefined;
                    creep.gotoTarget(creep.room.controller);
                    return;
                }
                creep.memory.nearController = true;

                refill = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 5, {filter: function(res) { return res.resourceType == RESOURCE_ENERGY; }});

                if(refill != undefined && refill.length)
                {
                    refill = refill[0];
                    creep.memory.refill = refill.id;
                }
            }
            else
                refill = Game.getObjectById(creep.memory.refill);

            if(refill != null && refill != undefined)
            {
                if((refill.energy != undefined && refill.energy > 0) || (refill.store != undefined && refill.store.energy > 0))
                {
                    var res = ERR_INVALID_TARGET;
                    res = creep.pickup(refill);
                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(refill, {range: 1});
                    else if(res == ERR_INVALID_TARGET)
                        creep.memory.refill = undefined;
                }
            }
            else
            {
                creep.memory.wait = 10;
                creep.memory.refill = undefined;
            }
        }
    },

    onRenew: function()
    {
        this.creep.memory.nearController = false;
        if(this.creep.carry.energy > 0)
            this.creep.drop(RESOURCE_ENERGY);
    },

    onDeath: function()
    {
        if(this.creep.memory == undefined)
            return;

        this.creep.room.memory.lastCreepCheck = 5;
        this.creep.memory = undefined;
    }
};

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

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
let role_harvester = {
    /**
     *
     * @param {Source} source
     *
     * @returns {RoomPosition[]}
     * @private
     */
    _getPathToSource: function(source)
    {
        let creep = this.creep;

        let sources = _.map(creep.room.find(FIND_SOURCES), function(source)
        {
            return {pos: source.pos, range: 1};
        });

        let ret = PathFinder.search(creep.pos, source.pos,
            {
                plainCost: 2,
                swampCost: 4,

                maxRooms: 1,

                roomCallback: function(roomName)
                {
                    let room = Game.rooms[roomName];
                    if(!room)
                        return;

                    let costs = new PathFinder.CostMatrix();
                    room.find(FIND_STRUCTURES).forEach(/** @param {Structure} struct **/function(struct)
                    {
                        if(struct.structureType === STRUCTURE_ROAD)
                            costs.set(struct.pos.x, struct.pos.y, 255);
                        else if(struct.structureType !== STRUCTURE_RAMPART || !struct.my)
                            costs.set(struct.pos.x, struct.pos.y, 255);
                    });

                    room.find(FIND_CREEPS).forEach(/** @param {Creep} c **/function(c)
                    {
                        costs.set(c.pos.x, c.pos.y, 255);
                    });

                    return costs;
                }
            });

        return ret.path;
    },

    onSpawn: function()
    {
        let creep = this.creep;
        if(creep.memory.source == undefined)
        {
            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            creep.memory.source = source.id;
        }
    },

    run: function()
    {
        let creep = this.creep;

        if(this.creep.getActiveBodyparts(MOVE) == 0)
        {
            this.onDeath();
            creep.suicide();
            return;
        }

        if(creep.memory.source)
        {
            if(creep.memory.mode == "empty")
            {
                /** @type {Structure|Spawn|Structure_Controller|Structure_Extension|Structure_Storage} **/
                let target = null;

                if(creep.memory.target == undefined)
                {
                    target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: function(struct)
                        {
                            if((struct.structureType == STRUCTURE_SPAWN && struct.energy < struct.energyCapacity) ||
                                (struct.structureType == STRUCTURE_EXTENSION && struct.energy < struct.energyCapacity))
                                return true;

                            return false;
                        }
                    });

                    if(target == null && creep.room.storage != null && creep.room.storage.store.energy < creep.room.storage.storeCapacity)
                        target = creep.room.storage;


                    if(target == null && creep.room.controller !== null && creep.room.controller.my)
                        target = creep.room.controller;

                    if(target != null)
                    {
                        creep.memory.target = target.id;
                    }
                }

                if(target == null && creep.memory.target != undefined)
                {
                    target = Game.getObjectById(creep.memory.target);
                }

                if(target != null && target != undefined)
                {
                    var res = ERR_NOT_IN_RANGE;
                    if(target.structureType == STRUCTURE_CONTROLLER)
                    {
                        if(creep.memory.timesOnTarget == undefined)
                            creep.memory.timesOnTarget = 0;

                        res = creep.upgradeController(target);

                        if(res == OK)
                        {
                            if(creep.memory.timesOnTarget >= 20)
                            {
                                creep.memory.timesOnTarget = undefined;
                                creep.memory.target = undefined;
                            }
                            else
                                creep.memory.timesOnTarget++;
                        }
                    }
                    else
                        res = creep.transfer(target, RESOURCE_ENERGY);

                    if(res == ERR_NOT_IN_RANGE)
                    {
                        creep.gotoTarget(target.pos);
                    }
                    else if(res == ERR_NOT_ENOUGH_RESOURCES)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.mode = undefined;
                        creep.memory.target = undefined;
                        creep.memory.lastPos = undefined;
                        creep.memory.timesOnTarget = undefined;
                    }

                    if((target.structureType == STRUCTURE_EXTENSION && target.energy == target.energyCapacity) ||
                        (target.structureType == STRUCTURE_SPAWN && target.energy == target.energyCapacity) ||
                        (target.structureType == STRUCTURE_STORAGE && target.store.energy == target.storeCapacity))
                    {
                        creep.memory.goto = undefined;
                        creep.memory.target = undefined;
                        creep.memory.lastPos = undefined;
                        creep.memory.timesOnTarget = undefined;
                    }
                    else if(creep.carry.energy == 0)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.mode = undefined;
                        creep.memory.target = undefined;
                        creep.memory.lastPos = undefined;
                        creep.memory.timesOnTarget = undefined;
                    }
                }
            }
            else if(creep.memory.mode == undefined)
            {
                /** @type {Source} **/
                let target = Game.getObjectById(creep.memory.source);

                if(target.energy == 0 && target.ticksToRegeneration >= 100)
                {
                    creep.memory.source = undefined;
                    return;
                }

                if(creep.harvest(target) == ERR_NOT_IN_RANGE)
                {
                    creep.gotoTarget(target.pos);
                }
                else
                    creep.memory.goto = undefined;

                if(creep.carry.energy == creep.carryCapacity)
                {
                    creep.memory.mode = "empty";
                    creep.memory.lastPos = undefined;
                }
            }
        }
    },

    onDeath: function()
    {
        if(this.creep.memory != undefined)
        {
            /*let RoleBodyDefinitions = require('RoleBodyDefinitions');
             var Spawner = require('Spawner');
             Spawner.addToQueue("harvester", RoleBodyDefinitions.get("harvester", this.creep.room.energyCapacityAvailable), true);*/
            this.creep.memory = undefined;
        }
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_healer =
{

    onSpawn: function()
    {
        this.creep.memory.wait = 0;
    },

    run: function()
    {
        var creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.memory.target == undefined)
        {
            /** @type {Creep[]} **/
            var targets = creep.room.find(FIND_MY_CREEPS, {

                /** @param {Creep} c **/
                filter: function(c)
                {
                    return c.hits < c.hitsMax;
                }
            });

            if(targets.length == 0)
                creep.memory.wait = 10;
            else
            {
                targets.sort(
                    /**
                     * @param {Creep} a
                     * @param {Creep} b
                     */
                    function(a, b)
                    {
                        if(a.memory.role == b.memory.role)
                        {
                            let aDist = creep.pos.getRangeTo(a);
                            let bDist = creep.pos.getRangeTo(b);
                            return aDist - bDist;
                        }

                        var cArr = ["guard", "healer", "builder", "harvester"];

                        for(let k in cArr)
                        {
                            if(a.memory.role == k)
                                return 1;
                            else if(b.memory.role == k)
                                return -1;
                        }

                        return 0;
                    }
                );

                creep.memory.target = targets[0].id;
            }
        }

        let target = Game.getObjectById(creep.memory.target);
        if(target == undefined || target == null)
            creep.memory.target = undefined;
        else
        {
            if(target.hits == target.hitsMax)
                creep.memory.target = undefined;

            let res = creep.heal(target);
            if(res == ERR_NOT_IN_RANGE)
                creep.moveTo(target);
            else if(res == ERR_INVALID_TARGET)
                creep.memory.target = undefined;
        }
    },

    onDeath: function()
    {
        this.creep.room.lastCreepCheck = 0;
        this.creep.memory = undefined;
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_maintainer =
{

    onSpawn: function()
    {

    },

    _refillMode: function()
    {
        var creep = this.creep;

        if(creep.memory.target == undefined)
        {
            let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: function(struct)
                {
                    return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0) ||
                        (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0);
                }
            });

            if(target == undefined || target == null)
                target = creep.room.storage;

            if(target != undefined && target != null)
                creep.memory.target = target.id;
        }

        if(creep.memory.target != undefined)
        {
            let target = Game.getObjectById(creep.memory.target);
            if(target == null || target == undefined)
                creep.memory.target = undefined;
            else
            {
                let res = target.transferEnergy(creep);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target);
                else if(res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_NOT_ENOUGH_ENERGY)
                    creep.memory.target = undefined;
            }
        }

        if(creep.carry.energy == creep.carryCapacity)
        {
            creep.memory.goto = undefined;
            creep.memory.target = undefined;
            creep.memory.mode = "repair";
            this._repairMode();
        }
    },

    _repairMode: function()
    {
        let creep = this.creep;

        if(creep.memory.target == undefined)
        {
            let targets = creep.room.find(FIND_STRUCTURES, {

                /** @param {Structure} struct **/
                filter: function(struct)
                {
                    if(struct.my != undefined)
                    {
                        if(!struct.my)
                            return false;
                    }

                    return struct.hits < struct.hitsMax;
                }
            });

            targets.sort(
                /**
                 * @param {Structure} a
                 * @param {Structure} b
                 */
                function(a, b)
                {
                    if(a.structureType == b.structureType)
                    {
                        let aX = a.hits / a.hitsMax;
                        let bX = b.hits / b.hitsMax;

                        return aX - bX;
                    }

                    if(a.structureType == STRUCTURE_ROAD && a.hits > 2000)


                        var cArray = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_EXTENSION, STRUCTURE_STORAGE];

                    for(let i = 0; i < cArray.length; i++)
                    {
                        if(a.structureType == cArray[i])
                            return -1;
                        else if(b.structureType == cArray[i])
                            return 1;
                    }

                    return 1;
                }
            );

            if(targets.length)
                creep.memory.target = targets[0].id;
        }

        if(creep.memory.target != undefined)
        {
            let target = Game.getObjectById(creep.memory.target);
            if(target == null || target == undefined)
                creep.memory.target = undefined;
            else
            {
                target.pos.createFlag("maintainer target", COLOR_BLUE, COLOR_CYAN);

                if(creep.memory.sameTarget == undefined)
                    creep.memory.sameTarget = {id: target.id, times: 0};
                else if(creep.memory.sameTarget.id == target.id)
                    creep.memory.sameTarget.times++;
                else
                    creep.memory.sameTarget = {id: target.id, times: 0};

                if(creep.memory.sameTarget.times > 10)
                {
                    creep.memory.target = undefined;
                    creep.memory.sameTarget = {id: target.id, times: 0};
                }

                let res = creep.repair(target);
                if(res == ERR_NOT_IN_RANGE)
                    creep.gotoTarget(target);
                else if(res == ERR_INVALID_TARGET)
                    creep.memory.target = undefined;

                if(target.hits == target.hitsMax)
                    creep.memory.target = undefined;

                if(creep.memory.target == undefined)
                    creep.room.find(FIND_FLAGS, { filter: function(f) { return f.name == "maintainer target" } }).forEach(function(f) { f.remove(); });

                if(creep.carry.energy < creep.carryCapacity / 2)
                {
                    require('CarrierController').requestEnergy(creep, creep.carryCapacity - creep.carry.energy, "give");
                }
                else
                    require("CarrierController").removeMe(creep);

                if(creep.carry.energy == 0)
                {
                    creep.memory.goto = undefined;
                    creep.memory.target = undefined;
                    creep.memory.mode = undefined;
                    creep.room.find(FIND_FLAGS, { filter: function(f) { return f.name == "maintainer target" } }).forEach(function(f) { f.remove(); });
                    this._refillMode();
                }
            }
        }

    },

    run: function()
    {
        var creep = this.creep;

        if(creep.memory.mode == undefined)
            this._refillMode();
        else
            this._repairMode();
    },

    onDeath: function()
    {
        this.creep.memory = undefined;
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_miner =
{
    /**
     * @param {Creep} [creep]
     * @returns {Source}
     */
    FindSource: function(creep)
    {
        if(creep == undefined)
            creep = this.creep;

        /** @type {Source[]} **/
        var sources = creep.room.find(FIND_SOURCES, {

            /** @param {Source} source **/
            filter: function(source)
            {
                return Memory.sources[source.id] == undefined || Memory.sources[source.id].miners.length < Memory.sources[source.id].minersMax;
            }
        });

        if(sources.length == 0)
            return null;

        var m = this;
        sources.forEach(
            /** @param {Source} source **/
            function(source)
            {
                if(Memory.sources[source.id] == undefined)
                {
                    let freeSpaces = m.GetMineEntries(source);
                    Memory.sources[source.id] = {
                        miners: [],
                        minersMax: freeSpaces.length
                    };
                }
            }
        );

        sources.sort(function(a, b)
        {
            return Memory.sources[a.id].miners.length - Memory.sources[b.id].miners.length;
        });

        return sources[0];
    },

    /**
     *
     * @param {Source} source
     *
     * @return {object[]}
     */
    GetMineEntries: function(source)
    {
        let top = source.pos.y - 1;
        let left = source.pos.x - 1;
        let bottom = source.pos.y + 1;
        let right = source.pos.x + 1;

        let pos = source.room.lookAtArea(top, left, bottom, right);

        let freePositions = [];

        for(let y = top; y <= bottom; y++)
        {
            for(let x = left; x <= right; x++)
            {
                let isFree = true;
                for(let i in pos[y][x])
                {
                    let t = pos[y][x][i];
                    if(t.type == "structure")
                    {
                        if(t.structure.structureType == STRUCTURE_ROAD || (t.structure.structureType == STRUCTURE_RAMPART && t.structure.my))
                            continue;

                        isFree = false;
                    }
                    else if(t.type == "terrain")
                    {
                        if(t.terrain == "wall")
                            isFree = false;
                    }
                }
                if(isFree)
                    freePositions.push({x: x, y: y});
            }
        }

        return freePositions;
    },

    /**
     *
     * @returns {Creep[]}
     * @private
     */
    _findIdleCarrier: function()
    {
        return this.creep.room.find(FIND_MY_CREEPS, {
            /** @param {Creep} creep **/
            filter: function(creep)
            {
                return !creep.spawning && creep.memory.role == "carrier" && (creep.memory.miner == undefined || Game.getObjectById(creep.memory.miner) == null);
            }
        });
    },

    _findAndSetCarrier()
    {
        let creep = this.creep;

        let carriers = this._findIdleCarrier();
        if(carriers.length > 0)
        {
            creep.memory.carriers.push(carriers[0].id);
            carriers[0].memory.miner = creep.id;
        }
        else
        {
            /** @type {Spawner} **/
            let Spawner = require('Spawner');
            /** @type {RoleBodyDefinitions} **/
            let RoleBodyDefinitions = require('RoleBodyDefinitions');
            Spawner.setRoom(creep.room);
            Spawner.addToQueue("carrier", RoleBodyDefinitions.get("carrier", creep.room.energyCapacityAvailable), true, true, { miner: creep.id });
            creep.memory.carrierSpawning = true;
        }
    },

    onSpawn: function()
    {
        var creep = this.creep;

        let source = this.FindSource();
        let closestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
        if(source != null && source != undefined)
        {
            if(Memory.sources[source.id] == undefined)
                Memory.sources[source.id] = {miners: [], minersMax: this.GetMineEntries(source).length};

            Memory.sources[source.id].miners.push(creep.id);
            creep.memory.source = source.id;
            creep.memory.carriers = [];

            let steps = source.pos.findPathTo(closestSpawn, {ignoreCreeps: true}).length;
            let parts = 0;
            let RoleBodyDefinitions = require('RoleBodyDefinitions');
            let body = RoleBodyDefinitions.get("carrier", creep.room.energyCapacityAvailable);
            body.forEach(function(part){ if(part == CARRY) parts++; });


            creep.memory.carriersNeeded = Math.max( 1, Math.ceil( ( 10 * ( 2 * steps ) ) / ( 50 * parts ) ) );
            creep.memory.isNearSource = false;
        }
    },

    run: function()
    {
        var creep = this.creep;
        if(creep == null)
            return;

        if(creep.memory.wait == undefined)
            creep.memory.wait = 0;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.memory.carriersNeeded == undefined)
        {
            let closestSpawn = creep.room.controller.pos.findClosestByPath(FIND_MY_SPAWNS);
            if(closestSpawn == null || closestSpawn == undefined)
                closestSpawn = creep.room.controller.pos.findClosestByRange(FIND_MY_SPAWNS);
            if(closestSpawn == null || closestSpawn == undefined)
            {
                creep.memory.wait = 10;
                return;
            }
            creep.memory.carriersNeeded = Math.max(1, Math.ceil(creep.pos.findPathTo(closestSpawn).length / 20));
        }

        if(creep.memory.carriers == undefined)
            creep.memory.carriers = [];

        if(creep.memory.carriers.length < creep.memory.carriersNeeded && creep.memory.carrierSpawning == undefined)
            this._findAndSetCarrier();

        if(creep.memory.source != undefined)
        {
            /** @type {Source} **/
            let source = Game.getObjectById(creep.memory.source);
            if(source == undefined || source == null)
            {
                creep.log("My source doesn't exist!");
                this.onDeath();
                creep.suicide();
            }

            if(!creep.pos.isNearTo(source.pos))
            {
                creep.memory.isNearSource = false;
                creep.gotoTarget(source.pos);
            }
            else
            {
                creep.memory.isNearSource = true;
                creep.memory.goto = undefined;

                if(source.energy == 0)
                    creep.memory.wait = source.ticksToRegeneration;

                creep.harvest(source);
                if(creep.carryCapacity > 0)
                    creep.drop(RESOURCE_ENERGY);
            }
        }
        else
        {
            let source = this.FindSource();
            let closestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
            if(source != null && source != undefined)
            {
                Memory.sources[source.id].miners.push(creep.id);
                creep.memory.source = source.id;
                creep.memory.carriers = [];
                creep.memory.carriersNeeded = Math.max(1, Math.ceil(creep.pos.findPathTo(closestSpawn).length / 20));
                creep.memory.isNearSource = false;
            }
        }
    },

    onDeath: function()
    {
        var creep = this.creep;
        if(creep == null || creep == undefined || creep.memory == undefined)
            return;

        if(creep.memory.carriers.length > 0)
        {
            creep.memory.carriers.forEach(function(id)
            {
                let carrier = Game.getObjectById(id);
                if(carrier == null)
                    return true;
                if(carrier.memory.miner == creep.id)
                    carrier.memory.miner = undefined;
            });
        }

        if(creep.memory.source != undefined && Memory.sources[creep.memory.source] != undefined)
        {
            var nArr = [];
            Memory.sources[creep.memory.source].miners.forEach(function(miner)
            {
                if(miner != creep.id)
                    nArr.push(miner);
            });
            Memory.sources[creep.memory.source].miners = nArr;
        }

        creep.memory = undefined;
    },

    onRenew: function()
    {
        this.creep.memory.isNearSource = false;
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_remote_miner =
{
    renewAt: 0,
    renewTo: 1000,

    /** @param {Creep} controller **/
    _controllerHasEnergy: function(controller)
    {
        if(controller.carry.energy > 0)
            return true;

        return controller.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {filter: r => { return r.resourceType == RESOURCE_ENERGY; }}).length > 0;
    },

    _drop: function()
    {
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.room.name != creep.memory.dropPos.roomName)
            creep.gotoTarget(new RoomPosition(creep.memory.dropPos.x, creep.memory.dropPos.y, creep.memory.dropPos.roomName));
        else
        {
            this.renewAt = 250;
            if(creep.pos.x == 0)
                creep.move(RIGHT);
            else if(creep.pos.x == 49)
                creep.move(LEFT);
            else if(creep.pos.y == 0)
                creep.move(BOTTOM);
            else if(creep.pos.y == 49)
                creep.move(TOP);
            else
            {
                /** @type {Structure|Spawn|Structure_Extension|Structure_Storage|Structure_Tower|Creep} **/
                let target = null;

                let rm = this;
                if(creep.memory.target == undefined)
                {
                    if((target == null || target == undefined) && creep.room.storage != null && creep.room.storage != undefined && creep.room.storage.store.energy < creep.room.storage.storeCapacity)
                        target = creep.room.storage;

                    if(target == null || target == undefined)
                    {
                        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                            /** @param {Spawn|Structure_Extension|Structure_Tower} struct **/
                            filter: function(struct)
                            {
                                return (struct.structureType == STRUCTURE_EXTENSION && struct.energy < struct.energyCapacity) ||
                                    (struct.structureType == STRUCTURE_SPAWN && struct.energy < struct.energyCapacity);
                            }
                        });
                    }

                    if(target == null || target == undefined)
                    {
                        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                            /** @param {Spawn|Structure_Extension|Structure_Tower} struct **/
                            filter: function(struct)
                            {
                                return (struct.structureType == STRUCTURE_TOWER && struct.energy < struct.energyCapacity);
                            }
                        });
                    }

                    if(target == null || target == undefined)
                    {
                        target = creep.room.find(FIND_MY_CREEPS, {
                            filter: function(c)
                            {
                                return c.memory.role == "controller" && c.memory.nearController != undefined && !rm._controllerHasEnergy(c);
                            }
                        });

                        if(target.length)
                            target = target[0];
                        else
                            target = null;
                    }

                    if(target != null && target != undefined)
                        creep.memory.target = target.id;
                }
                else
                    target = Game.getObjectById(creep.memory.target);

                if(target == null || target == undefined)
                    creep.memory.target = undefined;
                else
                {
                    let res = ERR_BUSY;

                    if(!creep.pos.isNearTo(target.pos))
                        creep.gotoTarget(target.pos);
                    else
                    {
                        if(target.memory != undefined && target.memory.role == "controller")
                            creep.drop(RESOURCE_ENERGY);
                        else
                        {
                            let res = creep.transfer(target, RESOURCE_ENERGY);

                            if(res == ERR_FULL)
                                creep.memory.target = undefined;
                            else if(res == ERR_NOT_IN_RANGE)
                                creep.gotoTarget(target.pos);
                        }
                    }

                    if(creep.carry.energy == 0)
                    {
                        creep.memory.goto = undefined;
                        creep.memory.target = undefined;
                        creep.memory.mode = undefined
                        creep.memory.wait = 0;
                    }
                }
            }
        }

    },

    _mine: function()
    {
        this.renewAt = 0;
        let creep = this.creep;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.room.name != creep.memory.targetPos.roomName)
            creep.gotoTarget(new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName));
        else
        {
            if(creep.pos.x == 0)
                creep.move(RIGHT);
            else if(creep.pos.x == 49)
                creep.move(LEFT);
            else if(creep.pos.y == 0)
                creep.move(BOTTOM);
            else if(creep.pos.y == 49)
                creep.move(TOP);
            else
            {
                /** @type {Source} **/
                let target = null;
                if(creep.memory.target == undefined)
                {
                    target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                    if(target != null && target != undefined)
                        creep.memory.target = target.id;
                }
                else
                    target = Game.getObjectById(creep.memory.target);

                if(target == null || target == undefined)
                    creep.memory.target = undefined;
                else
                {
                    if(target.energy == 0)
                        creep.memory.wait = target.ticksToRegeneration;
                    else
                    {
                        let res = creep.harvest(target);
                        if(res == ERR_NOT_IN_RANGE)
                            creep.gotoTarget(target.pos);
                    }
                }
            }

            if(creep.carry.energy >= creep.carryCapacity)
            {
                creep.memory.goto = undefined;
                creep.memory.target = undefined;
                creep.memory.mode = "dropOff";
                creep.memory.wait = 0;
            }
        }
    },


    onSpawn: function()
    {
        if(this.creep.memory.targetPos == undefined)
            Game.notify("Remote Miner " + this.creep.name + ": MISSING TARGET POSITION");

        if(this.creep.memory.dropPos == undefined)
            Game.notify("Remote Miner " + this.creep.name + ": MISSING DROP POSITION");

        this.creep.memory.wait = 0;
    },

    run: function()
    {
        let creep = this.creep;
        if(creep.memory.mode == undefined)
            this._mine();
        else
            this._drop();
    },

    onRenew: function()
    {
        return "NO";
    },

    onDeath: function()
    {
        Memory.mapCheckTimer = 20;
        this.creep.memory = undefined;
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_helper =
{

    _getEnergy: function()
    {
        let creep = this.creep;

        let target = null;
        if(creep.memory.target == undefined)
        {

            target = creep.room.storage;

            if(target == null || target == undefined || target.store.energy == 0)
            {
                target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                    /** @param {Structure|Spawn|Structure_Storage|Structure_Extension} struct **/
                    filter: function(struct)
                    {
                        return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0) ||
                            (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0);
                    }
                });
            }


            if(target != null && target != undefined)
                creep.memory.target = target.id;
        }
        else
            target = Game.getObjectById(creep.memory.target);

        if(target == null || target == undefined)
            creep.memory.target = undefined;
        else if(((target.structureType == STRUCTURE_SPAWN || target.structureType == STRUCTURE_EXTENSION) && target.energy == 0) ||
            (target.structureType == STRUCTURE_STORAGE && target.store.energy == 0))
            creep.memory.target = undefined;
        else
        {
            let res = ERR_INVALID_TARGET;
            if(target.transferEnergy != undefined)
                res = target.transferEnergy(creep);
            else
                res = target.transfer(creep, RESOURCE_ENERGY);

            if(res == ERR_NOT_IN_RANGE)
                creep.gotoTarget(target.pos);
            else if(res == ERR_NOT_ENOUGH_RESOURCES || res == ERR_INVALID_TARGET)
                creep.memory.target = undefined;
        }

        if(creep.carry.energy == creep.carryCapacity)
        {
            creep.memory.goto = undefined;
            creep.memory.target = undefined;
            creep.memory.mode = "run";
            this._giveController();
        }
    },

    _giveController: function()
    {
        let creep = this.creep;

        /** @type {Creep} **/
        let target = null;

        if(creep.memory.help_id == undefined)
        {
            target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {filter: c => { return c.memory.role == "controller"; } });
            if(target != null && target != undefined)
                creep.memory.help_id = target.id;
        }
        else
            target = Game.getObjectById(creep.memory.help_id);

        if(target != null && target != undefined && target.memory.nearController == true)
        {
            let res = creep.transfer(target, RESOURCE_ENERGY);
            if(res == ERR_NOT_IN_RANGE)
                creep.gotoTarget(target.pos);
            else if(res == ERR_INVALID_TARGET)
                creep.memory.help_id = undefined;
            else if(res == ERR_FULL)
                creep.memory.wait = 10;
        }
        else if(target == null || target == undefined)
            creep.memory.help_id = undefined;

        if(creep.carry.energy == 0)
        {
            creep.memory.mode = undefined;
            this._getEnergy();
        }
    },

    onSpawn: function()
    {
        this.creep.memory.wait = 0;
    },

    run: function()
    {
        if(this.creep.memory.wait > 0)
        {
            this.creep.memory.wait--;
            return;
        }

        if(this.creep.memory.mode == undefined)
            this._getEnergy();
        else
        {
            switch(this.creep.memory.type)
            {
                case "controller":
                    this._giveController();
                    break;
            }
        }
    },

    onDeath: function()
    {

    },

    getWho: function()
    {
        return "H-" + this.creep.memory.type;
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_storage_handler =
{
    renewAt: 0,

    onSpawn: function()
    {

    },

    run: function()
    {
        let creep = this.creep;

        if(creep.room.storage == undefined || creep.room.storage == null)
            creep.memory.role = "carrier";
        else if(creep.room.storage.store.energy > 100 || creep.carry.energy > 0)
        {
            let target = null;
            if(creep.memory.target == undefined)
            {
                target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, { filter: s => { return s.energy < s.energyCapacity; } });

                if(target == null || target == undefined)
                {
                    target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {

                        filter: function(struct)
                        {
                            return struct.structureType == STRUCTURE_EXTENSION && struct.energy < struct.energyCapacity;
                        }
                    });
                }

                if(target != null && target != undefined)
                    creep.memory.target = target.id;
            }
            else
                target = Game.getObjectById(creep.memory.target);

            if(target == null || target == undefined)
                creep.memory.target = undefined;
            else
            {
                if(creep.carry.energy == 0)
                {
                    creep.memory.target = undefined;
                    if(creep.room.storage.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(creep.room.storage);
                }
                else
                {
                    let res = creep.transfer(target, RESOURCE_ENERGY);
                    if(res == ERR_NOT_IN_RANGE)
                        creep.gotoTarget(target);
                    else if(res == ERR_FULL || res == ERR_INVALID_TARGET)
                        creep.memory.target = undefined;
                }
            }
        }

        if(creep.room.storage.store.energy > 100 && (creep.carry.energy == 0 || creep.carry.energy < creep.carryCapacity) && creep.memory.target == undefined)
        {
            creep.memory.target = undefined;
            if(creep.room.storage.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.gotoTarget(creep.room.storage);
        }
    }
};

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_claimer =
{
    renewAt: 0,

    _getController: function()
    {
        let creep = this.creep;

        for(let k in Game.rooms)
        {
            let room = Game.rooms[k];
            if(room.controller != undefined && !room.controller.my && (room.reservation == undefined || room.reservation.username != "Zinal001"))
            {
                creep.memory.target = room.controller.id;
                return room.controller;
            }
        }

        return null;
    },

    onSpawn: function()
    {
        let creep = this.creep;
        if(creep.memory.target == undefined)
            this._getController();
    },

    run: function()
    {
        let creep = this.creep;

        let target = null;
        if(creep.memory.target != undefined)
            target = Game.getObjectById(creep.memory.target);

        if(target == null || target == undefined)
            target = this._getController();

        if(target != null && target != undefined)
        {
            if(creep.reserveController(target) == ERR_NOT_IN_RANGE)
                creep.gotoTarget(target);
        }
    },

    onDeath: function()
    {
        Memory.mapCheckTimer = 25;
    }
};

let extend = require('extend');
let proto = require('role_prototype');

let out_role_attacker = extend(role_attacker, proto);
let out_role_builder = extend(role_builder, proto);
let out_role_carrier = extend(role_carrier, proto);
let out_role_controller = extend(role_controller, proto);
let out_role_guard = extend(role_guard, proto);
let out_role_harvester = extend(role_harvester, proto);
let out_role_healer = extend(role_healer, proto);
let out_role_maintainer = extend(role_maintainer, proto);
let out_role_miner = extend(role_miner, proto);
let out_role_remote_miner = extend(role_remote_miner, proto);
let out_role_helper = extend(role_helper, proto);
let out_role_storage_handler =  extend(role_storage_handler, proto);
let out_role_claimer = extend(role_claimer, proto);

out_role_attacker =	Object.create(out_role_attacker);
out_role_builder = Object.create(out_role_builder);
out_role_carrier = Object.create(out_role_carrier);
out_role_controller = Object.create(out_role_controller);
out_role_guard = Object.create(out_role_guard);
out_role_harvester = Object.create(out_role_harvester);
out_role_healer = Object.create(out_role_healer);
out_role_maintainer = Object.create(out_role_maintainer);
out_role_miner = Object.create(out_role_miner);
out_role_remote_miner =	Object.create(out_role_remote_miner);
out_role_helper = Object.create(out_role_helper);
out_role_storage_handler = Object.create(out_role_storage_handler);
out_role_claimer = Object.create(out_role_claimer);

let out =
{
    role_attacker: out_role_attacker,
    role_builder: out_role_builder,
    role_carrier: out_role_carrier,
    role_controller: out_role_controller,
    role_guard: out_role_guard,
    role_harvester: out_role_harvester,
    role_healer: out_role_healer,
    role_maintainer: out_role_maintainer,
    role_miner: out_role_miner,
    role_remote_miner: out_role_remote_miner,
    role_helper: out_role_helper,
    role_storage_handler: out_role_storage_handler,
    role_claimer: out_role_claimer
};

module.exports = out;

