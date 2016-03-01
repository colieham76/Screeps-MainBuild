"use strict";

var CarrierController =
{
    /** @type {Room} **/
    room: null,

    initController: function()
    {
        if(Memory.carrierController == undefined)
            Memory.carrierController = {};

        if(Memory.carrierController.carriersWithEnergy == undefined)
            Memory.carrierController.carriersWithEnergy = [];

        if(Memory.carrierController.needEnergy == undefined)
            Memory.carrierController.needEnergy = [];
    },

    /**
     * @param {Room} room
     */
    setRoom(room)
    {
        this.room = room;
    },

    runController: function()
    {
        /*let structures = this.room.find(FIND_MY_STRUCTURES, {


            filter: function(struct)
            {
                return (struct.energy != undefined && struct.energy < struct.energyCapacity) || (struct.store != undefined && struct.store.energy < struct.storeCapacity);
            }
        });*/

        let refillStructs = this.room.find(FIND_MY_STRUCTURES, {
            filter: function(struct)
            {
                return (struct.structureType == STRUCTURE_SPAWN && struct.energy > 0) ||
                    (struct.structureType == STRUCTURE_EXTENSION && struct.energy > 0)
            }
        });

        let availableCarriers = [];
        for(let i = 0; i < Memory.carrierController.carriersWithEnergy.length; i++)
        {
            let carrier = Game.getObjectById(Memory.carrierController.carriersWithEnergy[i].id);
            if(carrier == null || carrier == undefined)
                continue;
            if(carrier.carry.energy > 0)
            {
                if(carrier == undefined || carrier == null)
                    continue;
                if(carrier.memory.target == undefined)
                    availableCarriers.push(carrier);
            }
            else
            {
                let target = carrier.pos.findClosestByPath(refillStructs);
                if(target != null && target != undefined)
                {
                    carrier.memory.target = target.id;
                    carrier.memory.amount = -1;
                    carrier.memory.type = "transfer";
                }
            }
        }


        let ctrl = this;
        Memory.carrierController.needEnergy.forEach(/** @param {{id:string, amount:number, type:string}} obj **/function(obj)
        {
            let target = Game.getObjectById(obj.id);
            if(target != null && target != undefined)
            {
                let carrier = target.pos.findClosestByPath(availableCarriers, {
                    filter: function(c)
                    {
                        return c.memory.target == undefined;
                    }
                });
                if(carrier != null && carrier != undefined)
                {
                    carrier.memory.target = target.id;
                    carrier.memory.type = target.type;
                    if(target.amount > 0)
                        carrier.memory.amount = target.amount;
                }
            }
        });
    },

    /**
     *
     * @param {Structure|Creep} target
     * @param {number} [amount]
     * @param {string} [type]
     */
    requestEnergy: function(target, amount, type)
    {
        this.initController();

        if(type == undefined)
            type = "give";

        let index = this._findIdInArray(Memory.carrierController.needEnergy, target.id);
        if(index == -1)
        {
            Memory.carrierController.needEnergy.push({
                id: target.id,
                amount: (amount == undefined ? -1 : amount),
                type: type
            });
        }
        else if(amount != undefined)
            Memory.carrierController.needEnergy[index].amount = amount;
    },

    /**
     *
     * @param {Structure|Creep} me
     * @param {number} [amount]
     */
    hasEnergy: function(me, amount)
    {
        this.initController();

        if(amount == undefined)
            amount = -1;

        if(me.memory != undefined && (me.memory.role == "carrier" || me.memory.role == "carrier2"))
        {
            let index = this._findIdInArray(Memory.carrierController.carriersWithEnergy, me.id);
            if(index == -1)
                Memory.carrierController.carriersWithEnergy.push({id: me.id, amount});
            else
                Memory.carrierController.carriersWithEnergy[index].amount = amount;
        }
        else
        {
            let index = this._findIdInArray(Memory.carrierController.needEnergy, me.id);
            if(index != -1)
                Memory.carrierController.needEnergy = Memory.carrierController.needEnergy.splice(index, 1);
        }
    },

    /**
     * @param {Structure|Creep} me
     */
    removeMe: function(me)
    {
        let index1 = this._findIdInArray(Memory.carrierController.needEnergy, me.id);
        if(index1 != -1)
            Memory.carrierController.needEnergy = Memory.carrierController.needEnergy.splice(index1, 1);
        let index2 = this._findIdInArray(Memory.carrierController.carriersWithEnergy, me.id);
        if(index2 != -1)
            Memory.carrierController.carriersWithEnergy = Memory.carrierController.carriersWithEnergy.splice(index2, 1);
    },

    _findIdInArray: function(arr, id)
    {
        for(let i in arr)
        {
            if(arr[i].id == id)
                return i;
        }

        return -1;
    }
};

module.exports = CarrierController;