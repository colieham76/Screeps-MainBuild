"use strict";

var RoleBodyDefinitions =
{
    bodies: {
        "harvester": {
            "0": [MOVE, CARRY, WORK], //200
            "1": [MOVE, MOVE, CARRY, CARRY, WORK], //300
            "2": [MOVE, MOVE, CARRY, CARRY, WORK, WORK], //400
            "3": [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK], //500
            "4": [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK], //600
            "5": [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK], //700
            "6": [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK] //800
        },
        "builder":  {
            "0": [MOVE, CARRY, WORK], //200,
            "1": [MOVE, CARRY, CARRY, MOVE, WORK], //300
            "2": [MOVE, MOVE, CARRY, CARRY, WORK, WORK], //400
            "3": [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK], //500
            "4": [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK], //600
            "5": [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK], //700
            "6": [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK] //800
        },
        "guard": {
            "0": [TOUGH, TOUGH, MOVE, MOVE, ATTACK], //200
            "1": [TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, ATTACK, ATTACK], //300
            "2": [TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK], //400
            "3": [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK], //500
            "4": [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, ATTACK, ATTACK, ATTACK, RANGED_ATTACK], //600
            "5": [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK], //700
            "6": [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, ATTACK, ATTACK]  //800
        },
        "healer": {
            "0": null, //200,
            "1": [MOVE, HEAL], //300
            "2": [MOVE, MOVE, MOVE, HEAL], //400
            "3": [MOVE, MOVE, MOVE, MOVE, MOVE, HEAL], //500
            "4": [MOVE, MOVE, HEAL, HEAL], //600
            "5": [MOVE, MOVE, MOVE, MOVE, HEAL, HEAL], //700
            "6": [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL]  //800
        },
        "miner": {
            "0": [MOVE, MOVE, WORK], //200
            "1": [MOVE, MOVE, WORK, WORK], //300
            "2": [MOVE, MOVE, WORK, WORK, WORK], //400
            "3": [MOVE, MOVE, WORK, WORK, WORK, WORK], //500
            "4": [MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], //600
            "5": [MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK], //700
            "6": [MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK]  //800
        },
        "carrier": {
            "0": [MOVE, MOVE, CARRY, CARRY], //200
            "1": [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], //300
            "2": [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], //400
            "3": [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], //500
            "4": [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], //600
            "5": [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], //700
            "6": [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]  //800
        },
        "controller": {
            "0": [MOVE, CARRY, WORK], //200
            "1": [MOVE, CARRY, WORK, WORK], //300
            "2": [MOVE, CARRY, WORK, WORK, WORK], //400,
            "3": [MOVE, CARRY, WORK, WORK, WORK, WORK], //500
            "4": [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK], //600
            "5": [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK, WORK], //700
            "6": [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, WORK]  //800
        },
        "maintainer": {
            "0": [MOVE, CARRY, WORK], //200
            "1": [MOVE, CARRY, WORK, WORK], //300
            "2": [MOVE, CARRY, WORK, WORK, WORK], //400
            "3": [MOVE, CARRY, WORK, WORK, WORK, WORK], //500
            "4": [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK], //600
            "5": [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK], //700
            "6": [MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK]  //800
        }
    },

    /**
     *
     * @param {string} role
     * @param {number} energyLevel
     *
     * @return {number[]|null}
     */
    get: function(role, energyLevel)
    {
        var body = null;

        if(energyLevel >= 200) //405
        {
            let hundred = this.roundHundred(energyLevel); //400
            if(hundred > energyLevel)
                hundred -= 100;
            hundred /= 100; //4
            if(this.bodies[role]["" + hundred + ""] != undefined)
                return this.bodies[role]["" + hundred + ""];
        }

        if(this.bodies[role] !== undefined)
        {
            if(energyLevel >= 200 && energyLevel < 300)
                body = this.bodies[role]["0"];
            else if(energyLevel >= 300 && energyLevel < 400)
                body = this.bodies[role]["1"];
            else if(energyLevel >= 400 && energyLevel < 500)
                body = this.bodies[role]["2"];
            else if(energyLevel >= 500 && energyLevel < 600)
                body = this.bodies[role]["3"];
            else if(energyLevel >= 600 && energyLevel < 700)
                body = this.bodies[role]["4"];
            else if(energyLevel >= 700 && energyLevel < 800)
                body = this.bodies[role]["5"];
            else if(energyLevel >= 800)
                body = this.bodies[role]["6"];
        }

        if(body == null)
            body = [MOVE, CARRY, WORK];

        return body;
    },

    getLevel: function(role, level)
    {
        if (this.bodies[role] != undefined)
            return this.bodies[role]["" + level + ""];

        return null;
    },

    /**
     *
     * @param {number} value
     * @returns {number}
     */
    roundHundred: function(value)
    {
        return Math.ceil(value/100)*100
    }
};

module.exports = RoleBodyDefinitions;