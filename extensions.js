"use strict";


/**
 *
 * @param {RoomPosition} origin
 * @param {RoomPosition|RoomPosition[]|object|object[]} goals
 * @param {object} [opts]
 */
function findPathTo(origin, goals, opts)
{
    if(opts == undefined)
        opts = {};


    let goalRoom = goals.roomName;
    if(goals.length)
    {
        if(goals[0].roomName != undefined)
            goalRoom =  goals[0].roomName;
    }

    if(goalRoom == undefined && goals.pos != undefined)
        goalRoom = goals.pos.roomName;

    if(goals.length == undefined && origin.roomName != goalRoom)
        return origin.findPathTo(goals, opts);
    else if(goals.length && origin.roomName != goals[0].roomName)
        return origin.findPathTo(goals[0], opts);

    let ret = PathFinder.search(origin, goals,
        {
            plainCost: (opts.plainCost == undefined ? 2 : opts.plainCost),
            swampCost: (opts.swampCost == undefined ? 5 : opts.swampCost),
            maxRooms: (opts.maxRooms == undefined ? 1 : opts.maxRooms),

            roomCallback: function(roomName)
            {
                var room = Game.rooms[roomName];
                if(!room)
                    return;

                let costs = new PathFinder.CostMatrix();

                room.find(FIND_STRUCTURES).forEach(function(structure)
                {
                    if(structure.structureType == STRUCTURE_ROAD)
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    else if(structure.progress)
                        costs.set(structure.pos.x, structure.pos.y, 4);
                    else if(structure.structureType !== STRUCTURE_RAMPART || !structure.my)
                        costs.set(structure.pos.x, structure.pos.y, 255);
                });

                /*room.find(FIND_CONSTRUCTION_SITES).forEach(function(site){
                    costs.set(site.pos.x, site.pos.y, 255);
                });*/

                room.find(FIND_CREEPS).forEach(function(creep)
                {
                    costs.set(creep.pos.x, creep.pos.y, 30); //Creeps usually moves around, so the position should still be possible
                });

                return costs;
            }
        });

    let path = [];

    ret.path.unshift(origin);


    var goal = goals.pos;
    if(goals.length)
        goal = goals[0].pos;

    ret.path.push(new RoomPosition(goal.x, goal.y, goal.roomName));

    for(let i = 0; i < ret.path.length; i++)
    {
        let j = i + 1;
        if(j >= ret.path.length)
            break;

        let dir = ret.path[i].getDirectionTo(ret.path[j]);
        let dx = ret.path[j].x - ret.path[i].x;
        let dy = ret.path[j].y - ret.path[i].y;

        path.push({
            x: ret.path[j].x,
            y: ret.path[j].y,
            dx: dx,
            dy: dy,
            direction: dir,
            roomName : ret.path[j].roomName
        });
    }

    return path;
}

/**
 *
 * @param {RoomPosition|Structure|Creep} origin
 * @param {RoomPosition|Structure|Creep} goal
 * @param {object} [opts]
 * @returns {Object[]}
 */
function findPathTo2(origin, goal, opts)
{

    PathFinder.use(true);
    if(opts == undefined)
        opts = {};

    if(origin.pos != undefined)
        origin = origin.pos;

    if(goal.pos != undefined)
        goal = goal.pos;

    if(opts.costCallback == undefined)
    {
        opts.costCallback = function(roomName, costMatrix)
        {
            var room = Game.rooms[roomName];
            if(!room)
                return;

            room.find(FIND_STRUCTURES).forEach(
                /** @param {Structure} structure **/
                function(structure)
                {
                    if(structure.structureType == STRUCTURE_ROAD)
                        costMatrix.set(structure.pos.x, structure.pos.y, 1);
                    else if(structure.structureType !== STRUCTURE_RAMPART || !structure.my)
                        costMatrix.set(structure.pos.x, structure.pos.y, 255);
                }
            );

            room.find(FIND_CONSTRUCTION_SITES).forEach(
                /** @param {ConstructionSite} site **/
                function(site)
                {
                    if(site.structureType !== STRUCTURE_ROAD && site.structureType != STRUCTURE_RAMPART)
                        costMatrix.set(site.pos.x, site.pos.y, 255);
                }
            );

            room.find(FIND_CREEPS).forEach(

                /** @param {Creep} creep **/
                function(creep)
                {
                    costMatrix.set(creep.pos.x, creep.pos.y, 30); //Creeps usually moves around, so the position should still be possible
                }
            );
        }
    }

    return origin.findPathTo(goal, opts);
}

/**
 *
 * @param {[{type, filter}]} targets
 * @param {object} [opts]
 * @returns {object|null}
 */
RoomPosition.prototype.findClosestByPathX = function(targets, opts)
{
    let res = [];

    let pos = this;
    targets.forEach(
        /**
         *
         * @param {{type, filter}} target
         * @param {number|object} target.type
         * @param {string|function|undefined} target.filter
         */
        function(target)
        {
            let found = null;
            if(target.filter != undefined)
                found = pos.findClosestByPath(target.type, {filter: target.filter}, opts);
            else
                found = pos.findClosestByPath(target.type, {}, opts);

            if(found != null && found != undefined)
                res.push(found);
        }
    );

    return this.findClosestByPath(res, {}, opts);
};


/**
 *
 * @param {RoomPosition|Structure|Creep} target
 * @param {object} [opts]
 */
Creep.prototype.gotoTarget = function(target, opts)
{
    PathFinder.use(true);

    let pos = target;
    if(target.pos != undefined)
        pos = target.pos;

    var path = null;

    if(this.memory.goto == undefined || this.memory.goto.goal.x == undefined || this.memory.goto.goal.y == undefined || this.memory.goto.goal.roomName == undefined)
    {
        path = findPathTo2(this.pos, pos, opts);

        if(path.length)
            this.memory.goto = {goal: {x: pos.x, y: pos.y, roomName: pos.roomName}, path: Room.serializePath(path), opts: opts};
    }
    else
    {
        if(pos.x != this.memory.goto.goal.x || pos.y != this.memory.goto.goal.y || pos.roomName != this.memory.goto.goal.roomName || this.memory.goto.path == undefined)
        {
            path = findPathTo2(this.pos, pos, opts);
            if(path.length)
                this.memory.goto = {goal: {x: pos.x, y: pos.y, roomName: pos.roomName}, path: Room.serializePath(path), opts: opts};
        }
        else
        {
            path = this.memory.goto.path;
            if(path == null || path == undefined)
            {
                path = findPathTo2(this.pos, pos, opts);
                if(path.length)
                    this.memory.goto = {goal: {x: pos.x, y: pos.y, roomName: pos.roomName}, path: Room.serializePath(path), opts: opts};
            }
        }

    }

    PathFinder.use(false);

    let goal = this.memory.goto.goal;

    if(goal.x == this.pos.x && goal.y == this.pos.y && goal.roomName == this.pos.roomName)
    {
        this.memory.goto = undefined;
        return "GOAL";
    }

    if(this.fatigue > 0)
        return ERR_TIRED;

    let moveRes = ERR_TIRED;
    /*if(this.memory.goto.lastPos != undefined && this.memory.goto.lastPos.roomName != this.pos.roomName)
    {
        if(this.pos.x == 0)
            moveRes = this.move(RIGHT);
        else if(this.pos.x == 49)
            moveRes = this.move(LEFT);
        else if(this.pos.y == 0)
            moveRes = this.move(BOTTOM);
        else if(this.pos.y == 49)
            moveRes = this.move(TOP);
    }*/

    moveRes = this.moveByPath(path);
    if(moveRes == OK)
    {
        if(this.memory.goto.lastPos == undefined)
            this.memory.goto.lastPos = {pos: {x: this.pos.x, y: this.pos.y, roomName: this.pos.roomName}, times: 0};
        else if(this.pos.x == this.memory.goto.lastPos.pos.x && this.pos.y == this.memory.goto.lastPos.pos.y && this.pos.roomName == this.memory.goto.lastPos.pos.roomName)
        {
            this.memory.goto.lastPos.times++;

            if(this.memory.goto.lastPos.times > 1)
            {
                this.memory.goto.path = undefined;
            }

            if(this.memory.goto.lastPos.times >= 20)
            {
                this.log("HELP, I'm stuck!");
                Game.notify(this.name + " is stuck!");
            }
        }
        else
            this.memory.goto.lastPos = {pos: {x: this.pos.x, y: this.pos.y, roomName: this.pos.roomName}, times: 0};
    }
    else if(moveRes == ERR_NOT_FOUND || moveRes == ERR_NO_PATH)
    {
        this.log("No Path!");
        this.memory.goto = undefined;
    }

    return moveRes;
};

/**
 *
 * @param {RoomPosition|Structure|Creep} target
 * @param {object} [opts] see Room.findPath
 */
Creep.prototype.gotoTarget2 = function(target, opts)
{
    this.log("Using old gotoTarget!");
    return this.gotoTarget(target, opts);

    PathFinder.use(true);
    /** @type {object[]} **/
    var path = null;

    /** * @type {RoomPosition} **/
    var goal = null;

    var xOpts = opts == undefined ? {} : opts;

    if(xOpts == undefined)
        xOpts = {};

    var range = (xOpts.range == undefined ? 1 : xOpts.range);

    if(target.pos != undefined)
        target = target.pos;

    /*if(this.memory.goto != undefined && (this.memory.goto.x == undefined || this.memory.goto.y == undefined))
        this.memory.goto = undefined;*/

    if(this.memory.goto != undefined && this.memory.goto.goal != undefined)
    {
        if(this.memory.goto.goal.x != target.x || this.memory.goto.goal.y != target.y || this.memory.goto.goal.roomName != target.roomName)
            this.memory.goto = undefined;
    }

    if(this.memory.goto == undefined)
    {
        goal = target;

        path = findPathTo(this.pos, {pos: target, range: range });
        this.memory.goto = {goal: target, path: path, opts: opts};
    }

    if(this.memory.goto.path == undefined)
    {
        goal = this.memory.goto.goal;
        opts = this.memory.goto.opts;
        path = findPathTo(this.pos, {pos: new RoomPosition(goal.x, goal.y, goal.roomName), range: 1 });
        this.memory.goto.path = path;
    }


    PathFinder.use(false);
    goal = this.memory.goto.goal;
    path = this.memory.goto.path;

    if(goal.x == this.pos.x && goal.y == this.pos.y && goal.roomName == this.pos.roomName)
    {
        this.memory.goto = undefined;
        return "GOAL";
    }

    if(this.fatigue > 0)
        return ERR_TIRED;

    let moveRes = this.moveByPath(path);
    if(moveRes == OK)
    {
        if(this.memory.goto.lastPos == undefined || this.memory.goto.lastPos == null)
            this.memory.goto.lastPos = {x: this.pos.x, y: this.pos.y, times: 0};
        else
        {
            if(this.memory.goto.lastPos.x == this.pos.x && this.memory.goto.lastPos.y == this.pos.y)
            {
                this.memory.goto.lastPos.times++;

                if(this.memory.goto.lastPos.times >= 2)
                    this.memory.goto = undefined;
            }
            else
                this.memory.goto.lastPos = {x: this.pos.x, y: this.pos.y, times: 0};
        }
    }
    else if(moveRes == ERR_NOT_FOUND)
        this.memory.goto = undefined;


    return moveRes;
};

Creep.prototype.log = function()
{
    Log(this, arguments);
};

Structure.prototype.log = function()
{
    Log(this, arguments);
};

Spawn.prototype.log = function()
{
    Log(this, arguments);
};

/**
 *
 * @param {Creep|Structure|Spawn|undefined|null} obj
 * @param {object[]} args
 */
function Log(obj, args)
{
    let name = "Console";
    if(obj != undefined && obj != null)
    {
        if(obj.name != undefined)
            name = obj.name;
        else if(obj.id != undefined)
            name = obj.id;
    }

    if(name != "" && name != undefined && name != null)
        name += ": ";

    if(args.length == 1)
        console.log(name + args[0]);
    else
    {
        let xArgs = [];
        for(let i in args)
        {
            let arg = args[i];
            let val = _parseIntoString(arg);
            xArgs.push(val);
        }
        console.log(name + xArgs.join(" "));
    }
}

function _parseIntoString(val)
{
    //return JSON.stringify(val);
     let line = [];
    switch (typeof(val)) {
        case "string":
            return "\"" + val + "\"";
            break;
        case "number":
            return val;
            break;
        case "array":
            line = [];
            for (let i = 0; i < val.length; i++)
                line.push(_parseIntoString(val[i]));
            return "[ " + line.join(", ") + " ]";
            break;
        case "object":
            line = [];
            for (let k in val)
                line.push(k + ": " + _parseIntoString(val[k]));
            return "{ " + line.join(", ") + " }";
            break;
        default:
            return "" + val + "";
            break;
    }
}