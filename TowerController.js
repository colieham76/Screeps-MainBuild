"use strict";


var TowerController =
{
    /** @type {Room} **/
    room: null,

    /**
     *
     * @param {Structure_Tower} tower
     * @private
     */
    _assignHelper: function(tower)
    {
        /** @type {Spawner} **/
        let Spawner = require('Spawner');

        if(!Spawner.inQueue("helper", {type: "tower", help_id: tower.id}))
        {
            Spawner.addToQueue("helper", [MOVE, CARRY, CARRY, MOVE, CARRY, MOVE], false, false, {type: "tower", help_id: tower.id});
            Memory.structures[tower.id].helperComing = true;
        }
    },

    setRoom: function(room)
    {
        this.room = room;
    },

    initController: function()
    {
        if(Memory.structures == undefined)
            Memory.structures = {};
    },

    runController: function()
    {
        let room = this.room;

        if(room.controller.level < 3)
            return;

        let towers = room.find(FIND_MY_STRUCTURES,
            {
                filter: function(struct)
                {
                    return struct.structureType == STRUCTURE_TOWER;
                }
            });

        if(towers.length == 0)
            return;

        let enemies = room.find(FIND_HOSTILE_CREEPS);
        let damaged = room.find(FIND_MY_CREEPS, {filter: function(creep) { return creep.hits < creep.hitsMax; }});
        let structures = room.find(FIND_STRUCTURES, {filter: function(struct) { return struct.hits < (struct.hitsMax / 2); }});

        structures.sort(function(a, b)
        {
            if(a.structureType == b.structureType && a.structureType == STRUCTURE_ROAD)
                return a.hits - b.hits;

            let aX = a.hits / a.hitsMax;
            let bX = b.hits / b.hitsMax;
            if(a.structureType == b.structureType)
            {
                return aX - bX;
            }

            if(a.structureType == STRUCTURE_ROAD)
                return -1;
            else if(b.structureType == STRUCTURE_ROAD)
                return 1;

            return bX - aX;
        });

        var ctrl = this;
        towers.forEach(
            /** @param {Structure_Tower} tower **/
            function(tower)
            {
                if(Memory.structures[tower.id] == undefined)
                    Memory.structures[tower.id] = {};

                /*if((Memory.structures[tower.id].helper == undefined && Memory.structures[tower.id].helperComing == undefined) ||
                    (Game.getObjectById(Memory.structures[tower.id].helper) == null))
                    ctrl._assignHelper(tower);*/

                let target = null;
                let type = "";
                if(Memory.structures[tower.id].target == undefined)
                {
                    if(enemies.length > 0)
                    {
                        target = tower.pos.findClosestByRange(enemies);
                        type = "damage";
                    }
                    else if(damaged.length > 0)
                    {
                        target = tower.pos.findClosestByRange(damaged);
                        type = "heal";
                    }
                    else if(structures.length > 0)
                    {
                        target = structures[0];
                        type = "repair";
                    }

                    if(target != null && target != undefined)
                    {
                        Memory.structures[tower.id].target = target.id;
                        Memory.structures[tower.id].type = type;
                    }
                }
                else
                {
                    target = Game.getObjectById(Memory.structures[tower.id].target);
                    type = Memory.structures[tower.id].type;
                }

                if(target == null || target == undefined)
                {
                    Memory.structures[tower.id].target = undefined;
                    Memory.structures[tower.id].type = undefined;
                }
                else if(tower.energy >= 10)
                {
                    if(tower.energy < 210 && (type == "heal" || type == "repair"))
                        return;

                    switch(type)
                    {
                        case "damage":
                            console.log("Tower attacking " + target.name);
                            tower.attack(target);
                            break;
                        case "heal":
                            console.log("Tower healing " + target.name);
                            tower.heal(target);

                            if(target.hits == target.hitsMax)
                            {
                                Memory.structures[tower.id].target = undefined;
                                Memory.structures[tower.id].type = undefined;
                            }

                            break;
                        case "repair":
                            tower.repair(target);

                            if(target.hits == target.hitsMax)
                            {
                                Memory.structures[tower.id].target = undefined;
                                Memory.structures[tower.id].type = undefined;
                            }
                            break;
                    }

                    if(type == "heal" || type == "repair")
                    {
                        if(Memory.structures[tower.id].sameTarget == undefined)
                            Memory.structures[tower.id].sameTarget = {id: target.id, times: 0};

                        if(Memory.structures[tower.id].sameTarget.id == target.id)
                            Memory.structures[tower.id].sameTarget.times++;
                        else
                            Memory.structures[tower.id].sameTarget = {id: target.id, times: 0};

                        if(Memory.structures[tower.id].sameTarget.times >= 10)
                        {
                            Memory.structures[tower.id].target = undefined;
                            Memory.structures[tower.id].type = undefined;
                        }
                    }

                }
            }
        );
    }

};

module.exports = TowerController;