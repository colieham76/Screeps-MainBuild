module.exports = {

   
 run: function(creep) {


"use strict";

/**
 * @class
 * @constructor
 * @extends {role_prototype}
 */
var role_attacker =
{

    /**
     *
     * @returns {Creep|Structure|null}
     * @private
     */
    _getTarget: function()
    {
        let creep = this.creep;

        let target = null;
        if(creep.memory.target == undefined)
        {
            target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: c => { 
                return c.getActiveBodyparts(RANGED_ATTACK); 
            }});
            let closeTarget = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {filter: c => {
                return c.getActiveBodyparts(ATTACK);
            }});

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

            if(creep.memory.attack == undefined)
            {
                if(!creep.pos.inRangeTo(waitFlag.pos, 3))
                    creep.gotoTarget2(waitFlag.pos);
            }
            else
            {
                if(creep.pos.roomName != attack_flag.pos.roomName)
                    creep.gotoTarget2(attack_flag.pos);
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
                    }
                    else if(target.structureType != undefined) //Target is a structure
                    {
                        if(creep.getActiveBodyparts(RANGED_ATTACK) > 0)
                        {
                            if(creep.pos.inRangeTo(target.pos, 3))
                                creep.rangedAttack(target);
                            else
                            {
                                let ret = creep.gotoTarget(target.pos)
                                if(ret == ERR_NO_PATH || ret == ERR_INVALID_TARGET)
                                    creep.memory.target = undefined;
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

module.exports = role_attacker;
