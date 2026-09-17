;(function () {
    const actual = "0.87.0-ra650aef-d3634901c";
    const url = new URL(import.meta.url);
    const requested = url.searchParams.get('v');
    const page = typeof window !== 'undefined' && window.__ra2webStartupDiagnostic?.snapshot().assetVersion;
    if (requested !== actual || (page && page !== actual)) {
      const detail = { expected: page || requested, actual, url: url.href };
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ra2web:runtime-build-mismatch', { detail }));
      const error = new Error('客户端构建不一致，请重新加载');
      error.name = 'ClientBuildMismatchError';
      Object.assign(error, detail);
      throw error;
    }
  })();
import { V, a, G, Q, c, e, M, B, L, T, O, S, Z, A, F, b, _, d } from './app.js?v=0.87.0-ra650aef-d3634901c';

var Countries;
(function (Countries) {
    Countries["USA"] = "Americans";
    Countries["KOREA"] = "Alliance";
    Countries["FRANCE"] = "French";
    Countries["GERMANY"] = "Germans";
    Countries["GREAT_BRITAIN"] = "British";
    Countries["LIBYA"] = "Africans";
    Countries["IRAQ"] = "Arabs";
    Countries["CUBA"] = "Confederation";
    Countries["RUSSIA"] = "Russians";
})(Countries || (Countries = {}));
const isOwnedByNeutral = (unitData) => unitData?.owner === "@@NEUTRAL@@";
// Return if the given unit would have .isSelectableCombatant = true.
// Usable on GameObjectData (which is faster to get than TechnoRules)
const isSelectableCombatant = (rules) => !!rules?.rules?.isSelectableCombatant;
// Thanks use-strict!
function formatTimeDuration(timeSeconds, skipZeroHours = false) {
    let h = Math.floor(timeSeconds / 3600);
    timeSeconds -= h * 3600;
    let m = Math.floor(timeSeconds / 60);
    timeSeconds -= m * 60;
    let s = Math.floor(timeSeconds);
    return [...(h || !skipZeroHours ? [h] : []), pad(m, "00"), pad(s, "00")].join(":");
}
function pad(n, format = "0000") {
    let str = "" + n;
    return format.substring(0, format.length - str.length) + str;
}
// So we don't need lodash
function minBy(array, predicate) {
    if (array.length === 0) {
        return null;
    }
    let minIdx = 0;
    let minVal = predicate(array[0]);
    for (let i = 1; i < array.length; ++i) {
        const newVal = predicate(array[i]);
        if (minVal === null || (newVal !== null && newVal < minVal)) {
            minIdx = i;
            minVal = newVal;
        }
    }
    return array[minIdx];
}
function maxBy(array, predicate) {
    if (array.length === 0) {
        return null;
    }
    let maxIdx = 0;
    let maxVal = predicate(array[0]);
    for (let i = 1; i < array.length; ++i) {
        const newVal = predicate(array[i]);
        if (maxVal === null || (newVal !== null && newVal > maxVal)) {
            maxIdx = i;
            maxVal = newVal;
        }
    }
    return array[maxIdx];
}
function uniqBy(array, predicate) {
    return Object.values(array.reduce((prev, newVal) => {
        const val = predicate(newVal);
        if (!prev[val]) {
            prev[val] = newVal;
        }
        return prev;
    }, {}));
}
function countBy(array, predicate) {
    return array.reduce((prev, newVal) => {
        const val = predicate(newVal);
        if (val === undefined) {
            return prev;
        }
        if (!prev[val]) {
            prev[val] = 0;
        }
        prev[val] = prev[val] + 1;
        return prev;
    }, {});
}
function groupBy(array, predicate) {
    return array.reduce((prev, newVal) => {
        const val = predicate(newVal);
        if (val === undefined) {
            return prev;
        }
        if (!prev.hasOwnProperty(val)) {
            prev[val] = [];
        }
        prev[val].push(newVal);
        return prev;
    }, {});
}
function toPathNode(tile, onBridge) {
    return { tile, onBridge };
}
function toVector2(tile) {
    return new V(tile.rx, tile.ry);
}
function isTechnoRulesObject(obj) {
    return (!!obj &&
        (obj.rules.type === a.Building ||
            obj.rules.type === a.Aircraft ||
            obj.rules.type === a.Vehicle ||
            obj.rules.type === a.Infantry));
}

function calculateAreaVisibility(mapApi, playerData, startPoint, endPoint) {
    let validTiles = 0, visibleTiles = 0, clearTiles = 0;
    for (let xx = startPoint.x; xx < endPoint.x; ++xx) {
        for (let yy = startPoint.y; yy < endPoint.y; ++yy) {
            let tile = mapApi.getTile(xx, yy);
            if (tile) {
                ++validTiles;
                if (mapApi.isVisibleTile(tile, playerData.name)) {
                    ++visibleTiles;
                }
                if (tile.rampType === 0) {
                    ++clearTiles;
                }
            }
        }
    }
    return { visibleTiles, validTiles, clearTiles };
}
function getPointTowardsOtherPoint(gameApi, startLocation, endLocation, minRadius, maxRadius, randomAngle) {
    // TODO: Use proper vector maths here.
    let radius = minRadius + Math.round(gameApi.generateRandom() * (maxRadius - minRadius));
    let directionToEndLocation = G.atan2(endLocation.y - startLocation.y, endLocation.x - startLocation.x);
    let randomisedDirection = directionToEndLocation -
        (randomAngle * (Math.PI / 12) + 2 * randomAngle * gameApi.generateRandom() * (Math.PI / 12));
    let candidatePointX = Math.round(startLocation.x + G.cos(randomisedDirection) * radius);
    let candidatePointY = Math.round(startLocation.y + G.sin(randomisedDirection) * radius);
    return new V(candidatePointX, candidatePointY);
}
function getDistanceBetweenPoints(startLocation, endLocation) {
    // TODO: Remove this now we have Vector2s.
    return startLocation.distanceTo(endLocation);
}
function getDistanceBetweenTileAndPoint(tile, vector) {
    // TODO: Remove this now we have Vector2s.
    return new V(tile.rx, tile.ry).distanceTo(vector);
}
function getDistanceBetweenUnits(unit1, unit2) {
    return new V(unit1.tile.rx, unit1.tile.ry).distanceTo(new V(unit2.tile.rx, unit2.tile.ry));
}

// checking technorules directly reduces the amount of calls to getUnitData(), which is a relatively expensive function.
// A null value indicates an object that does not have TechnoRules.
const technoRulesCache = {};
const getCachedTechnoRules = (gameApi, unitId) => {
    const gameObject = gameApi.getGameObjectData(unitId);
    if (!gameObject) {
        return null;
    }
    const { rulesApi } = gameApi;
    const { name } = gameObject;
    if (technoRulesCache[name]) {
        // object is present in cache, either with TechnoRules or null (indicating that it does not have TechnoRules)
        return technoRulesCache[name];
    }
    const aircraftRules = rulesApi.aircraftRules.get(name);
    if (aircraftRules) {
        technoRulesCache[name] = aircraftRules;
        return aircraftRules;
    }
    const buildingRules = rulesApi.buildingRules.get(name);
    if (buildingRules) {
        technoRulesCache[name] = buildingRules;
        return buildingRules;
    }
    const infantryRules = rulesApi.infantryRules.get(name);
    if (infantryRules) {
        technoRulesCache[name] = infantryRules;
        return infantryRules;
    }
    const vehicleRules = rulesApi.vehicleRules.get(name);
    if (vehicleRules) {
        technoRulesCache[name] = vehicleRules;
        return vehicleRules;
    }
    technoRulesCache[name] = null;
    return null;
};

const calculateCenterOfMass = (unitTiles) => {
    if (unitTiles.length === 0) {
        return null;
    }
    // TODO: use median here
    const sums = unitTiles.reduce(({ x, y }, tile) => {
        return {
            x: x + (tile?.rx || 0),
            y: y + (tile?.ry || 0),
        };
    }, { x: 0, y: 0 });
    const centerOfMass = new V(Math.round(sums.x / unitTiles.length), Math.round(sums.y / unitTiles.length));
    // max distance of units to the center of mass
    const distances = unitTiles.map((tile) => getDistanceBetweenTileAndPoint(tile, centerOfMass));
    const maxDistance = Math.max(...distances);
    return { centerOfMass, maxDistance };
};
// AI starts Missions based on heuristics.
class Mission {
    constructor(uniqueName, logger) {
        this.uniqueName = uniqueName;
        this.logger = logger;
        this.active = true;
        this.unitIds = [];
        this.centerOfMass = null;
        this.maxDistanceToCenterOfMass = null;
        this.onFinish = () => { };
    }
    // TODO call this
    updateCenterOfMass(gameApi) {
        const unitTiles = this.unitIds
            .map((unitId) => gameApi.getGameObjectData(unitId))
            .map((unit) => unit?.tile)
            .filter((tile) => !!tile);
        const tileMetrics = calculateCenterOfMass(unitTiles);
        if (tileMetrics) {
            this.centerOfMass = tileMetrics.centerOfMass;
            this.maxDistanceToCenterOfMass = tileMetrics.maxDistance;
        }
        else {
            this.centerOfMass = null;
            this.maxDistanceToCenterOfMass = null;
        }
    }
    onAiUpdate(context) {
        this.updateCenterOfMass(context.game);
        return this._onAiUpdate(context);
    }
    isActive() {
        return this.active;
    }
    getUnitIds() {
        return this.unitIds;
    }
    removeUnit(unitIdToRemove) {
        this.unitIds = this.unitIds.filter((unitId) => unitId != unitIdToRemove);
    }
    addUnit(unitIdToAdd) {
        this.unitIds.push(unitIdToAdd);
    }
    // Note: don't call this unless you REALLY need the UnitData instead of the GameObjectData.
    getUnits(gameApi) {
        return this.unitIds
            .map((unitId) => gameApi.getUnitData(unitId))
            .filter((unit) => unit != null)
            .map((unit) => unit);
    }
    // returns GameObjectData, which is significantly faster to retrieve.
    getUnitsGameObjectData(gameApi) {
        return this.unitIds
            .map((unitId) => gameApi.getGameObjectData(unitId))
            .filter((unit) => unit != null)
            .map((unit) => unit);
    }
    getUnitsOfTypes(gameApi, ...names) {
        return this.unitIds
            .map((unitId) => gameApi.getUnitData(unitId))
            .filter((unit) => !!unit && names.includes(unit.name))
            .map((unit) => unit);
    }
    getUnitsMatchingByRule(gameApi, filter) {
        return this.unitIds
            .map((unitId) => ({
            unitId,
            rules: getCachedTechnoRules(gameApi, unitId),
        }))
            .filter((entry) => entry.rules !== null)
            .filter(({ rules }) => filter(rules))
            .map(({ unitId }) => unitId);
    }
    getMissingUnits(gameApi, targetComposition) {
        const currentComposition = countBy(this.getUnitsGameObjectData(gameApi), (unit) => unit.name);
        return Object.entries(targetComposition)
            .filter(([unitType, targetAmount]) => {
            return !currentComposition[unitType] || currentComposition[unitType] < targetAmount;
        })
            .filter(([unitType, targetAmount]) => targetAmount > 0);
    }
    getCenterOfMass() {
        return this.centerOfMass;
    }
    getMaxDistanceToCenterOfMass() {
        return this.maxDistanceToCenterOfMass;
    }
    getUniqueName() {
        return this.uniqueName;
    }
    // Don't call this from the mission itself
    endMission(reason) {
        this.onFinish(this.unitIds, reason);
        this.active = false;
    }
    /**
     * Declare a callback that is executed when the mission is disbanded for whatever reason.
     */
    withOnFinish(onFinish) {
        this.onFinish = onFinish;
        return this;
    }
    /**
     * Determines whether units can be stolen from this mission by other missions with higher priority.
     */
    isUnitsLocked() {
        return true;
    }
}
const noop = () => ({
    type: "noop",
});
const disbandMission = (reason) => ({ type: "disband", reason });
const isDisbandMission = (a) => a.action.type === "disband";
const requestUnits = (unitNameToPriority) => ({ type: "request", unitNameToPriority });
const requestUnitsWithSamePriority = (unitNames, priority) => ({
    type: "request",
    unitNameToPriority: Object.fromEntries(unitNames.map((name) => [name, priority])),
});
const isRequestUnits = (a) => a.action.type === "request";
const requestSpecificUnits = (unitIds, priority) => ({ type: "requestSpecific", unitIds, priority });
const isRequestSpecificUnits = (a) => a.action.type === "requestSpecific";
const grabCombatants = (point, radius) => ({ type: "requestCombatants", point, radius });
const isGrabCombatants = (a) => a.action.type === "requestCombatants";
const releaseUnits = (unitIds) => ({ type: "releaseUnits", unitIds });
const isReleaseUnits = (a) => a.action.type === "releaseUnits";
const buildStructureAtLocation = (rulesName, priority, rx, ry) => ({ type: "buildStructureAtLocation", rulesName, priority, rx, ry });
const isBuildStructureAtLocation = (a) => a.action.type === "buildStructureAtLocation";

// Used to group related actions together to minimise actionApi calls. For example, if multiple units
// are ordered to move to the same location, all of them will be ordered to move in a single action.
class BatchableAction {
    constructor(_unitId, _orderType, _point, _targetId, 
    // If you don't want this action to be swallowed by dedupe, provide a unique nonce
    _nonce = 0) {
        this._unitId = _unitId;
        this._orderType = _orderType;
        this._point = _point;
        this._targetId = _targetId;
        this._nonce = _nonce;
    }
    static noTarget(unitId, orderType, nonce = 0) {
        return new BatchableAction(unitId, orderType, undefined, undefined, nonce);
    }
    static toPoint(unitId, orderType, point, nonce = 0) {
        return new BatchableAction(unitId, orderType, point, undefined);
    }
    static toTargetId(unitId, orderType, targetId, nonce = 0) {
        return new BatchableAction(unitId, orderType, undefined, targetId, nonce);
    }
    get unitId() {
        return this._unitId;
    }
    get orderType() {
        return this._orderType;
    }
    get point() {
        return this._point;
    }
    get targetId() {
        return this._targetId;
    }
    isSameAs(other) {
        if (this._unitId !== other._unitId) {
            return false;
        }
        if (this._orderType !== other._orderType) {
            return false;
        }
        if (this._point !== other._point) {
            return false;
        }
        if (this._targetId !== other._targetId) {
            return false;
        }
        if (this._nonce !== other._nonce) {
            return false;
        }
        return true;
    }
}
class ActionBatcher {
    constructor() {
        this.actions = [];
    }
    push(action) {
        this.actions.push(action);
    }
    resolve(actionsApi) {
        const groupedCommands = groupBy(this.actions, (action) => action.orderType.valueOf().toString());
        const vectorToStr = (v) => v.x + "," + v.y;
        const strToVector = (str) => {
            const [x, y] = str.split(",");
            return new V(parseInt(x), parseInt(y));
        };
        // Group by command type.
        Object.entries(groupedCommands).forEach(([commandValue, commands]) => {
            // i hate this
            const commandType = parseInt(commandValue);
            // Group by command target ID.
            const byTarget = groupBy(commands.filter((command) => !!command.targetId), (command) => command.targetId?.toString());
            Object.entries(byTarget).forEach(([targetId, unitCommands]) => {
                actionsApi.orderUnits(unitCommands.map((command) => command.unitId), commandType, parseInt(targetId));
            });
            // Group by position (the vector is encoded as a string of the form "x,y")
            const byPosition = groupBy(commands.filter((command) => !!command.point), (command) => vectorToStr(command.point));
            Object.entries(byPosition).forEach(([point, unitCommands]) => {
                const vector = strToVector(point);
                actionsApi.orderUnits(unitCommands.map((command) => command.unitId), commandType, vector.x, vector.y);
            });
            // Actions with no targets
            const noTargets = commands.filter((command) => !command.targetId && !command.point);
            if (noTargets.length > 0) {
                actionsApi.orderUnits(noTargets.map((action) => action.unitId), commandType);
            }
        });
    }
}

// Meta-controller for forming and controlling missions.
// Missions are groups of zero or more units that aim to accomplish a particular goal.
// `missingUnitTypes` priority decays by this much every update loop.
const MISSING_UNIT_TYPE_REQUEST_DECAY_MULT_RATE = 0.75;
const MISSING_UNIT_TYPE_REQUEST_DECAY_FLAT_RATE = 1;
class MissionController {
    constructor(logger) {
        this.logger = logger;
        this.missions = [];
        // A mapping of unit IDs to the missions they are assigned to. This may contain units that are dead, but
        // is periodically cleaned in the update loop.
        this.unitIdToMission = new Map();
        // A mapping of unit types to the highest priority requested for a mission.
        // This decays over time if requests are not 'refreshed' by mission.
        this.requestedUnitTypes = new Map();
        // Tracks missions to be externally disbanded the next time the mission update loop occurs.
        this.forceDisbandedMissions = [];
    }
    updateUnitIds(botContext) {
        // Check for units in multiple missions, this shouldn't happen.
        this.unitIdToMission = new Map();
        this.missions.forEach((mission) => {
            const toRemove = [];
            mission.getUnitIds().forEach((unitId) => {
                if (this.unitIdToMission.has(unitId)) {
                    this.logger(`WARNING: unit ${unitId} is in multiple missions, please debug.`);
                }
                else if (!botContext.game.getGameObjectData(unitId)) {
                    // say, if a unit was killed
                    toRemove.push(unitId);
                }
                else {
                    this.unitIdToMission.set(unitId, mission);
                }
            });
            toRemove.forEach((unitId) => mission.removeUnit(unitId));
        });
    }
    onAiUpdate(context) {
        // Remove inactive missions.
        this.missions = this.missions.filter((missions) => missions.isActive());
        this.updateUnitIds(context);
        // Batch actions to reduce spamming of actions for larger armies.
        const actionBatcher = new ActionBatcher();
        const missionContext = {
            ...context,
            actionBatcher,
        };
        // Poll missions for requested actions.
        const missionActions = this.missions.map((mission) => ({
            mission,
            action: mission.onAiUpdate(missionContext),
        }));
        // Handle disbands and merges.
        const disbandedMissions = new Map();
        this.forceDisbandedMissions.forEach((name) => disbandedMissions.set(name, null));
        this.forceDisbandedMissions = [];
        missionActions.filter(isDisbandMission).forEach((a) => {
            this.logger(`Mission ${a.mission.getUniqueName()} disbanding as requested.`);
            a.mission.getUnitIds().forEach((unitId) => {
                this.unitIdToMission.delete(unitId);
                context.player.actions.setUnitDebugText(unitId, undefined);
            });
            disbandedMissions.set(a.mission.getUniqueName(), a.action.reason);
        });
        // Handle unit requests.
        // Release units
        missionActions.filter(isReleaseUnits).forEach((a) => {
            a.action.unitIds.forEach((unitId) => {
                if (this.unitIdToMission.get(unitId)?.getUniqueName() === a.mission.getUniqueName()) {
                    this.removeUnitFromMission(a.mission, unitId, context.player.actions);
                }
            });
        });
        // Request specific units by ID
        const unitIdToHighestRequest = missionActions.filter(isRequestSpecificUnits).reduce((prev, missionWithAction) => {
            const { unitIds } = missionWithAction.action;
            unitIds.forEach((unitId) => {
                if (prev.hasOwnProperty(unitId)) {
                    if (missionWithAction.action.priority > prev[unitId].action.priority) {
                        prev[unitId] = missionWithAction;
                    }
                }
                else {
                    prev[unitId] = missionWithAction;
                }
            });
            return prev;
        }, {});
        // Map of Mission ID to Unit Type to Count.
        const newMissionAssignments = Object.entries(unitIdToHighestRequest)
            .flatMap(([id, request]) => {
            const unitId = Number.parseInt(id);
            const unit = context.game.getGameObjectData(unitId);
            const { mission: requestingMission } = request;
            const missionName = requestingMission.getUniqueName();
            if (!unit) {
                this.logger(`mission ${missionName} requested non-existent unit ${unitId}`);
                return [];
            }
            if (!this.unitIdToMission.has(unitId)) {
                this.addUnitToMission(requestingMission, unit, context.player.actions);
                return [{ unitName: unit?.name, mission: requestingMission.getUniqueName() }];
            }
            return [];
        })
            .reduce((acc, curr) => {
            if (!acc[curr.mission]) {
                acc[curr.mission] = {};
            }
            if (!acc[curr.mission][curr.unitName]) {
                acc[curr.mission][curr.unitName] = 0;
            }
            acc[curr.mission][curr.unitName] = acc[curr.mission][curr.unitName] + 1;
            return acc;
        }, {});
        Object.entries(newMissionAssignments).forEach(([mission, assignments]) => {
            this.logger(`Mission ${mission} received: ${Object.entries(assignments)
                .map(([unitType, count]) => unitType + " x " + count)
                .join(", ")}`);
        });
        // Request units by type - store the highest priority mission for each unit type.
        const unitTypeToHighestRequest = missionActions.filter(isRequestUnits).reduce((prev, missionWithAction) => {
            const { unitNameToPriority } = missionWithAction.action;
            Object.entries(unitNameToPriority).forEach(([unitName, requestedPriority]) => {
                if (prev.hasOwnProperty(unitName)) {
                    if (requestedPriority > prev[unitName].priority) {
                        prev[unitName] = {
                            mission: missionWithAction.mission,
                            priority: requestedPriority,
                            specificLocation: null,
                        };
                    }
                }
                else {
                    prev[unitName] = {
                        mission: missionWithAction.mission,
                        priority: requestedPriority,
                        specificLocation: null,
                    };
                }
            });
            return prev;
        }, {});
        // Request combat-capable units in an area
        const grabRequests = missionActions.filter(isGrabCombatants);
        // Find un-assigned units and distribute them among all the requesting missions.
        const unitIds = context.game.getVisibleUnits(context.player.name, "self");
        // List of units that are unassigned or not in a locked mission.
        const freeUnits = unitIds
            .map((unitId) => context.game.getGameObjectData(unitId))
            .filter((unit) => !!unit)
            .map((unit) => ({
            unit,
            mission: this.unitIdToMission.get(unit.id),
        }))
            .filter((unitWithMission) => !unitWithMission.mission || unitWithMission.mission.isUnitsLocked() === false);
        // Sort free units so that unassigned units get chosen before assigned (but unlocked) units.
        freeUnits.sort((u1, u2) => (u1.mission?.getPriority() ?? 0) - (u2.mission?.getPriority() ?? 0));
        const newAssignmentsByType = freeUnits
            .flatMap(({ unit: freeUnit, mission: donatingMission }) => {
            if (unitTypeToHighestRequest.hasOwnProperty(freeUnit.name)) {
                const { mission: requestingMission, priority: requestedPriority } = unitTypeToHighestRequest[freeUnit.name];
                if (donatingMission) {
                    if (donatingMission === requestingMission ||
                        donatingMission.getPriority() > requestedPriority) {
                        return [];
                    }
                    this.removeUnitFromMission(donatingMission, freeUnit.id, context.player.actions);
                }
                this.logger(`granting unit ${freeUnit.id}#${freeUnit.name} to mission ${requestingMission.getUniqueName()}`);
                this.addUnitToMission(requestingMission, freeUnit, context.player.actions);
                delete unitTypeToHighestRequest[freeUnit.name];
                return [
                    { unitName: freeUnit.name, missionName: requestingMission.getUniqueName(), method: "type" },
                ];
            }
            else if (grabRequests.length > 0) {
                const grantedMission = grabRequests.find((request) => {
                    const canGrabUnit = isSelectableCombatant(freeUnit);
                    return (canGrabUnit &&
                        request.action.point.distanceTo(new V(freeUnit.tile.rx, freeUnit.tile.ry)) <=
                            request.action.radius);
                });
                if (grantedMission) {
                    if (donatingMission) {
                        if (donatingMission === grantedMission.mission ||
                            donatingMission.getPriority() > grantedMission.mission.getPriority()) {
                            return [];
                        }
                        this.removeUnitFromMission(donatingMission, freeUnit.id, context.player.actions);
                    }
                    this.addUnitToMission(grantedMission.mission, freeUnit, context.player.actions);
                    return [
                        {
                            unitName: freeUnit.name,
                            missionName: grantedMission.mission.getUniqueName(),
                            method: "grab",
                        },
                    ];
                }
            }
            return [];
        })
            .reduce((acc, curr) => {
            if (!acc[curr.missionName]) {
                acc[curr.missionName] = {};
            }
            if (!acc[curr.missionName][curr.unitName]) {
                acc[curr.missionName][curr.unitName] = { grab: 0, type: 0 };
            }
            acc[curr.missionName][curr.unitName][curr.method] =
                acc[curr.missionName][curr.unitName][curr.method] + 1;
            return acc;
        }, {});
        Object.entries(newAssignmentsByType).forEach(([mission, assignments]) => {
            this.logger(`Mission ${mission} received: ${Object.entries(assignments)
                .flatMap(([unitType, methodToCount]) => Object.entries(methodToCount)
                .filter(([, count]) => count > 0)
                .map(([method, count]) => unitType + " x " + count + " (by " + method + ")"))
                .join(", ")}`);
        });
        // Handle structure requests.
        missionActions.filter(isBuildStructureAtLocation).forEach((a) => {
            const { rulesName, rx, ry } = a.action;
            if (rulesName in unitTypeToHighestRequest) {
                const currentPriority = unitTypeToHighestRequest[rulesName].priority;
                if (a.mission.getPriority() > currentPriority) {
                    unitTypeToHighestRequest[rulesName] = {
                        mission: a.mission,
                        priority: a.action.priority,
                        specificLocation: new V(rx, ry),
                    };
                }
            }
            else {
                unitTypeToHighestRequest[rulesName] = {
                    mission: a.mission,
                    priority: a.action.priority,
                    specificLocation: new V(rx, ry),
                };
            }
        });
        this.updateRequestedUnitTypes(unitTypeToHighestRequest);
        // Send all actions that can be batched together.
        actionBatcher.resolve(context.player.actions);
        // Remove disbanded and merged missions.
        this.missions
            .filter((missions) => disbandedMissions.has(missions.getUniqueName()))
            .forEach((disbandedMission) => {
            const reason = disbandedMissions.get(disbandedMission.getUniqueName());
            this.logger(`mission disbanded: ${disbandedMission.getUniqueName()}, reason: ${reason}`);
            disbandedMission.endMission(disbandedMissions.get(disbandedMission.getUniqueName()));
        });
        this.missions = this.missions.filter((missions) => !disbandedMissions.has(missions.getUniqueName()));
    }
    updateRequestedUnitTypes(missingUnitTypeToHighestRequest) {
        // Decay the priority over time.
        for (const [unitType, currentRequest] of this.requestedUnitTypes.entries()) {
            const newPriority = currentRequest.priority * MISSING_UNIT_TYPE_REQUEST_DECAY_MULT_RATE -
                MISSING_UNIT_TYPE_REQUEST_DECAY_FLAT_RATE;
            if (newPriority > 0.5) {
                this.requestedUnitTypes.set(unitType, {
                    ...currentRequest,
                    priority: newPriority,
                });
            }
            else {
                this.requestedUnitTypes.delete(unitType);
            }
        }
        // Add the new missing units to the priority set, if the request is higher than the existing value.
        Object.entries(missingUnitTypeToHighestRequest).forEach(([unitType, request]) => {
            const currentRequest = this.requestedUnitTypes.get(unitType);
            if (!currentRequest) {
                this.requestedUnitTypes.set(unitType, request);
                return;
            }
            this.requestedUnitTypes.set(unitType, request.priority > currentRequest.priority ? request : currentRequest);
        });
    }
    /**
     * Returns the set of units that have been requested for production by the missions.
     *
     * @returns A map of unit type to the highest priority for that unit type.
     */
    getRequestedUnitTypes() {
        return this.requestedUnitTypes;
    }
    addUnitToMission(mission, unit, actionsApi) {
        mission.addUnit(unit.id);
        this.unitIdToMission.set(unit.id, mission);
        actionsApi.setUnitDebugText(unit.id, mission.getUniqueName() + "_" + unit.id);
    }
    removeUnitFromMission(mission, unitId, actionsApi) {
        mission.removeUnit(unitId);
        this.unitIdToMission.delete(unitId);
        actionsApi.setUnitDebugText(unitId, undefined);
    }
    /**
     * Attempts to add a mission to the active set.
     * @param mission
     * @returns The mission if it was accepted, or null if it was not.
     */
    addMission(mission) {
        if (this.missions.some((m) => m.getUniqueName() === mission.getUniqueName())) {
            // reject non-unique mission names
            return null;
        }
        this.logger(`Added mission: ${mission.getUniqueName()}`);
        this.missions.push(mission);
        return mission;
    }
    /**
     * Disband the provided mission on the next possible opportunity.
     */
    disbandMission(missionName) {
        this.forceDisbandedMissions.push(missionName);
    }
    // return text to display for global debug
    getGlobalDebugText(gameApi) {
        const unitsInMission = (unitIds) => countBy(unitIds, (unitId) => gameApi.getGameObjectData(unitId)?.name);
        let globalDebugText = "";
        this.missions.forEach((mission) => {
            this.logger(`Mission ${mission.getUniqueName()}: ${Object.entries(unitsInMission(mission.getUnitIds()))
                .map(([unitName, count]) => `${unitName} x ${count}`)
                .join(", ")}`);
            const missionDebugText = mission.getGlobalDebugText();
            if (missionDebugText) {
                globalDebugText += mission.getUniqueName() + ": " + missionDebugText + "\n";
            }
        });
        return globalDebugText;
    }
    updateDebugText(actionsApi) {
        this.missions.forEach((mission) => {
            mission
                .getUnitIds()
                .forEach((unitId) => actionsApi.setUnitDebugText(unitId, `${unitId}: ${mission.getUniqueName()}`));
        });
    }
    getMissions() {
        return this.missions;
    }
}

const QUEUES = [
    Q.Structures,
    Q.Armory,
    Q.Infantry,
    Q.Vehicles,
    Q.Aircrafts,
    Q.Ships,
];
function isBuildingQueue(queueType) {
    return queueType === Q.Structures || queueType === Q.Armory;
}
const queueTypeToName = (queue) => {
    switch (queue) {
        case Q.Structures:
            return "Structures";
        case Q.Armory:
            return "Armory";
        case Q.Infantry:
            return "Infantry";
        case Q.Vehicles:
            return "Vehicles";
        case Q.Aircrafts:
            return "Aircrafts";
        case Q.Ships:
            return "Ships";
        default:
            return "Unknown";
    }
};
const REPAIR_CHECK_INTERVAL = 30;
class QueueController {
    constructor() {
        this.queueStates = [];
        this.lastRepairCheckAt = 0;
    }
    onAiUpdate(context, threatCache, unitTypeRequests, logger) {
        const { game, player } = context;
        const { production: productionApi, actions: actionsApi } = player;
        const playerData = game.getPlayerData(player.name);
        this.queueStates = QUEUES.map((queueType) => {
            const options = productionApi.getAvailableObjects(queueType);
            const items = QueueController.getPrioritiesForBuildingOptions(options, unitTypeRequests);
            const topItem = items.length > 0 ? items[items.length - 1] : undefined;
            return {
                queue: queueType,
                items,
                // only if the top item has a  priority above zero
                topItem: topItem && topItem.priority > 0 ? topItem : undefined,
            };
        });
        const totalWeightAcrossQueues = this.queueStates
            .map((decision) => decision.topItem?.priority)
            .reduce((pV, cV) => pV + cV, 0);
        const totalCostAcrossQueues = this.queueStates
            .map((decision) => decision.topItem?.unit.cost)
            .reduce((pV, cV) => pV + cV, 0);
        this.queueStates.forEach((decision) => {
            this.updateBuildQueue(game, productionApi, actionsApi, playerData, threatCache, unitTypeRequests, decision.queue, decision.topItem, totalWeightAcrossQueues, totalCostAcrossQueues, logger);
        });
        // Repair is simple - just repair everything that's damaged.
        if (playerData.credits > 0 && game.getCurrentTick() > this.lastRepairCheckAt + REPAIR_CHECK_INTERVAL) {
            game.getVisibleUnits(playerData.name, "self", (r) => r.repairable).forEach((unitId) => {
                const unit = game.getUnitData(unitId);
                if (!unit || !unit.hitPoints || !unit.maxHitPoints || unit.hasWrenchRepair) {
                    return;
                }
                if (unit.hitPoints < unit.maxHitPoints) {
                    actionsApi.toggleRepairWrench(unitId);
                }
            });
            this.lastRepairCheckAt = game.getCurrentTick();
        }
    }
    updateBuildQueue(game, productionApi, actionsApi, playerData, threatCache, unitTypeRequests, queueType, decision, totalWeightAcrossQueues, totalCostAcrossQueues, logger) {
        const myCredits = playerData.credits;
        const queueData = productionApi.getQueueData(queueType);
        if (queueData.status == c.Idle) {
            // Start building the decided item.
            if (decision !== undefined) {
                logger(`Decision (${queueTypeToName(queueType)}): ${decision.unit.name}`);
                actionsApi.queueForProduction(queueType, decision.unit.name, decision.unit.type, 1);
            }
        }
        else if (queueData.status == c.Ready && queueData.items.length > 0) {
            if (isBuildingQueue(queueType)) {
                const readyUnit = queueData.items[0].rules;
                const currentRequest = unitTypeRequests.get(readyUnit.name);
                if (!currentRequest) {
                    // No one is requesting this anymore, cancel
                    logger(`Cancelling ready ${readyUnit.name} because no one is requesting anymore`);
                    actionsApi.unqueueFromProduction(queueType, readyUnit.name, readyUnit.type, 1);
                    return;
                }
                if (!currentRequest.specificLocation) {
                    // No one is requesting this anymore, cancel
                    logger(`Cancelling ready ${readyUnit.name} because location is unspecified`);
                    actionsApi.unqueueFromProduction(queueType, readyUnit.name, readyUnit.type, 1);
                    return;
                }
                actionsApi.placeBuilding(readyUnit.name, currentRequest.specificLocation.x, currentRequest.specificLocation.y);
            }
        }
        else if (queueData.status == c.Active && queueData.items.length > 0 && decision != null) {
            // Consider cancelling if something else is significantly higher priority than what is currently being produced.
            const currentProduction = queueData.items[0].rules;
            if (decision.unit != currentProduction) {
                // Changing our mind.
                const currentRequest = unitTypeRequests.get(currentProduction.name);
                const currentItemPriority = currentRequest ? currentRequest.priority : 0;
                const newItemPriority = decision.priority;
                if (newItemPriority > currentItemPriority * 2) {
                    logger(`Dequeueing queue ${queueTypeToName(queueData.type)} unit ${currentProduction.name} because ${decision.unit.name} has 2x higher priority.`);
                    actionsApi.unqueueFromProduction(queueData.type, currentProduction.name, currentProduction.type, 1);
                }
            }
            else {
                // Not changing our mind, but maybe other queues are more important for now.
                if (totalCostAcrossQueues > myCredits && decision.priority < totalWeightAcrossQueues * 0.25) {
                    logger(`Pausing queue ${queueTypeToName(queueData.type)} because weight is low (${decision.priority}/${totalWeightAcrossQueues})`);
                    actionsApi.pauseProduction(queueData.type);
                }
            }
        }
        else if (queueData.status == c.OnHold) {
            // Consider resuming queue if priority is high relative to other queues.
            if (myCredits >= totalCostAcrossQueues) {
                logger(`Resuming queue ${queueTypeToName(queueData.type)} because credits are high`);
                actionsApi.resumeProduction(queueData.type);
            }
            else if (decision && decision.priority >= totalWeightAcrossQueues * 0.25) {
                logger(`Resuming queue ${queueTypeToName(queueData.type)} because weight is high (${decision.priority}/${totalWeightAcrossQueues})`);
                actionsApi.resumeProduction(queueData.type);
            }
        }
    }
    static getPrioritiesForBuildingOptions(options, unitTypeRequests) {
        let priorityQueue = [];
        options.forEach((option) => {
            const priority = unitTypeRequests.get(option.name)?.priority ?? 0;
            if (priority > 0) {
                priorityQueue.push({ unit: option, priority });
            }
        });
        priorityQueue = priorityQueue.sort((a, b) => a.priority - b.priority);
        return priorityQueue;
    }
    getGlobalDebugText(gameApi, productionApi) {
        const productionState = QUEUES.reduce((prev, queueType) => {
            if (productionApi.getQueueData(queueType).size === 0) {
                return prev;
            }
            const paused = productionApi.getQueueData(queueType).status === c.OnHold;
            return (prev +
                " [" +
                queueTypeToName(queueType) +
                (paused ? " PAUSED" : "") +
                ": " +
                productionApi
                    .getQueueData(queueType)
                    .items.map((item) => item.rules.name + (item.quantity > 1 ? "x" + item.quantity : "")) +
                "]");
        }, "");
        const queueStates = this.queueStates
            .filter((queueState) => queueState.items.length > 0)
            .map((queueState) => {
            const queueString = queueState.items
                .map((item) => item.unit.name + "(" + Math.round(item.priority * 10) / 10 + ")")
                .join(", ");
            return `${queueTypeToName(queueState.queue)} Prios: ${queueString}\n`;
        })
            .join("");
        return `Production: ${productionState}\n${queueStates}`;
    }
}

function toHeatmapColor(value, minScale = 0, maxScale = 1) {
    if (value === undefined || value === null) {
        return 0;
    }
    const ratio = 2 * (value - minScale) / (maxScale - minScale);
    const b = Math.max(0, 255 * (1 - ratio));
    const r = Math.max(0, 255 * (ratio - 1));
    const g = 255 - b - r;
    return toRGBNum(r, g, b);
}
function toRGBNum(red, green, blue) {
    return red << 16 | green << 8 | blue;
}
/**
 * A class that allows spatial information to be updated lazily as needed, meaning some (or many) grid locations may be stale.
 *
 * Because the game maps are rotated by 45 degrees, we only scan for valid tiles.
 *
 * In game terms, a grid may be a cell for high-resolution information, or multiple cells for low resolution information (e.g. scouting sectors).
 *
 * @param T value type of each cell
 * @param V argument type passed from the scan strategy to the updater (e.g. the number of passes done so far)
 */
class BasicIncrementalGridCache {
    constructor(width, height, initCellFn, updateCellFn, scanStrategy, valueToDebugColor) {
        this.width = width;
        this.height = height;
        this.updateCellFn = updateCellFn;
        this.scanStrategy = scanStrategy;
        this.valueToDebugColor = valueToDebugColor;
        // cells, stored in column-major order
        this.cells = [];
        for (let x = 0; x < width; ++x) {
            this.cells[x] = new Array(height);
            for (let y = 0; y < height; ++y) {
                this.cells[x][y] = {
                    lastUpdatedTick: null,
                    value: initCellFn(x, y)
                };
            }
        }
    }
    getSize() {
        return { width: this.width, height: this.height };
    }
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.cells[x][y];
    }
    _getCellDebug(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        const cell = this.cells[x][y];
        return {
            ...cell,
            color: this.valueToDebugColor(cell.value)
        };
    }
    /**
     * Using the IncrementalGridCacheUpdateStrategy provided at construction time, update a certain number of cells with new values.
     *
     * @param numCellsToUpdate Number of cells to update
     */
    updateCells(numCellsToUpdate, gameTick) {
        for (let i = 0; i < numCellsToUpdate; ++i) {
            const nextCell = this.scanStrategy.getNextCellToUpdate(this.width, this.height);
            if (!nextCell) {
                break;
            }
            const { x, y, arg } = nextCell;
            const newValue = this.updateCellFn(x, y, this.cells[x][y].value, arg);
            this.cells[x][y] = {
                lastUpdatedTick: gameTick,
                value: newValue,
            };
        }
    }
    /**
     * Using a clone of the ScanStrategy, iterates over all cells in the grid and calls the provided callback function on each one.
     */
    forEach(fn) {
        const scanStrategy = this.scanStrategy.clone();
        let next = null;
        while ((next = scanStrategy.getNextCellToUpdate(this.width, this.height)) !== null) {
            const { x, y } = next;
            fn(x, y, this.cells[x][y]);
        }
    }
    forEachInRadius(startX, startY, dist, fn) {
        this.scanStrategy.getNeighbours(startX, startY, this.width, this.height, dist).forEach(({ x, y, dist }) => fn(x, y, this.getCell(x, y), dist));
    }
    _renderScale() {
        return 1;
    }
}
function getDiagonalMapBounds(mapApi) {
    const { width, height } = mapApi.getRealMapSize();
    const xStarts = new Array(height).fill(width);
    const xEnds = new Array(height).fill(0);
    const allTiles = mapApi.getTilesInRect({ x: 0, y: 0, width, height });
    let yStart = height;
    let yEnd = 0;
    for (const tile of allTiles) {
        if (tile.rx < xStarts[tile.ry]) {
            xStarts[tile.ry] = tile.rx;
        }
        if (tile.rx >= xEnds[tile.ry]) {
            xEnds[tile.ry] = tile.rx + 1;
        }
        if (tile.ry < yStart) {
            yStart = tile.ry;
        }
        if (tile.ry >= yEnd) {
            yEnd = tile.ry + 1;
        }
    }
    return { xStarts, xEnds, yStart, yEnd };
}
// Dumb scan strategy: top-left to bottom-right (or reverse).
class SequentialScanStrategy {
    /**
     *
     * @param maxPasses null if infinite, otherwise step through a certain number of times
     * @param diagonalMapBounds optional diagonal bounds to prevent scanning over blank tiles
     * You should provide this, otherwise, when scanning from 0,0 to width,height, you end up scanning about 50% of unnecessary tiles.
     */
    constructor(maxPasses = null, diagonalMapBounds = null, reverse = false) {
        this.maxPasses = maxPasses;
        this.diagonalMapBounds = diagonalMapBounds;
        this.reverse = reverse;
        this.passCount = 0;
    }
    ;
    setReverse() {
        this.reverse = true;
        return this;
    }
    getStartY(height) {
        if (this.reverse) {
            return (this.diagonalMapBounds?.yEnd ?? height) - 1;
        }
        return this.diagonalMapBounds?.yStart ?? 0;
    }
    getEndY(height) {
        if (this.reverse) {
            return (this.diagonalMapBounds?.yStart ?? 0) - 1;
        }
        return this.diagonalMapBounds?.yEnd ?? height;
    }
    getStartX(y, width) {
        if (this.reverse) {
            if (this.diagonalMapBounds) {
                return this.diagonalMapBounds.xEnds[y] - 1;
            }
            return width - 1;
        }
        if (this.diagonalMapBounds) {
            return this.diagonalMapBounds.xStarts[y];
        }
        return 0;
    }
    getEndX(y, width) {
        if (this.reverse) {
            if (this.diagonalMapBounds) {
                return this.diagonalMapBounds.xStarts[y] - 1;
            }
            return width - 1;
        }
        if (this.diagonalMapBounds) {
            return this.diagonalMapBounds.xEnds[y];
        }
        return width;
    }
    getNextCellToUpdate(width, height) {
        // First scan, or the last scan reached the end
        if (this.lastUpdatedSectorX === undefined || this.lastUpdatedSectorY === undefined) {
            this.lastUpdatedSectorY = this.getStartY(height);
            this.lastUpdatedSectorX = this.getStartX(this.lastUpdatedSectorY, width);
            return { x: this.lastUpdatedSectorX, y: this.lastUpdatedSectorY, arg: this.passCount };
        }
        const endX = this.getEndX(this.lastUpdatedSectorY, width);
        const endY = this.getEndY(height);
        if (this.reverse) {
            if (this.lastUpdatedSectorX - 1 > endX) {
                return { x: --this.lastUpdatedSectorX, y: this.lastUpdatedSectorY, arg: this.passCount };
            }
            if (this.lastUpdatedSectorY - 1 > endY) {
                this.lastUpdatedSectorX = this.getStartX(this.lastUpdatedSectorY - 1, width);
                return { x: this.lastUpdatedSectorX, y: --this.lastUpdatedSectorY, arg: this.passCount };
            }
        }
        else {
            if (this.lastUpdatedSectorX + 1 < endX) {
                return { x: ++this.lastUpdatedSectorX, y: this.lastUpdatedSectorY, arg: this.passCount };
            }
            if (this.lastUpdatedSectorY + 1 < endY) {
                this.lastUpdatedSectorX = this.getStartX(this.lastUpdatedSectorY + 1, width);
                return { x: this.lastUpdatedSectorX, y: ++this.lastUpdatedSectorY, arg: this.passCount };
            }
        }
        ++this.passCount;
        if (this.maxPasses === null || this.passCount < this.maxPasses) {
            this.lastUpdatedSectorX = undefined;
            this.lastUpdatedSectorY = undefined;
        }
        return null;
    }
    getNeighbours(baseX, baseY, width, height, dist) {
        const neighbours = [];
        const startY = this.getStartY(height);
        const endY = this.getEndY(height);
        if (this.reverse) {
            for (let y = Math.min(startY, baseY + dist); y > Math.max(endY, baseY - dist - 1); --y) {
                const startX = this.getStartX(y, width);
                const endX = this.getEndX(y, width);
                for (let x = Math.min(startX, baseX + dist); x > Math.max(endX, baseX - dist - 1); --x) {
                    const dist = G.sqrt(G.pow(x - baseX, 2) + G.pow(y - baseY, 2));
                    neighbours.push({ x, y, dist });
                }
            }
        }
        else {
            for (let y = Math.max(startY, baseY - dist); y < Math.min(endY, baseY + dist + 1); ++y) {
                const startX = this.getStartX(y, width);
                const endX = this.getEndX(y, width);
                for (let x = Math.max(startX, baseX - dist); x < Math.min(endX, baseX + dist + 1); ++x) {
                    const dist = G.sqrt(G.pow(x - baseX, 2) + G.pow(y - baseY, 2));
                    neighbours.push({ x, y, dist });
                }
            }
        }
        return neighbours;
    }
    clone() {
        return new SequentialScanStrategy(this.maxPasses, this.diagonalMapBounds, this.reverse);
    }
    isRepeatable() {
        return this.maxPasses === null;
    }
    isFinished() {
        return this.passCount > 0 && this.maxPasses === null;
    }
}
/**
 * Scan that composes other scan strategies in stages.
 */
class StagedScanStrategy {
    constructor(stages, isRepeating = false) {
        this.stages = stages;
        this.isRepeating = isRepeating;
        this.hasFinishedAtLeastOnce = false;
        this.originalStages = [...stages];
        this.stageIndex = 0;
    }
    setRepeating() {
        this.isRepeating = true;
        return this;
    }
    getNextCellToUpdate(width, height) {
        if (this.stages.length === 0) {
            return null;
        }
        const head = this.stages[0];
        const headValue = head.getNextCellToUpdate(width, height);
        if (headValue !== null) {
            return {
                ...headValue,
                // override arg with our own stage index
                arg: this.stageIndex
            };
        }
        if (head.isRepeatable()) {
            // come back to it next time
            return null;
        }
        // head returned null, move to next and try again
        this.stages.shift();
        const next = this.stages[0];
        ++this.stageIndex;
        if (!next) {
            if (this.isRepeating) {
                this.hasFinishedAtLeastOnce = true;
                this.reset();
            }
            return null;
        }
        const nextValue = next.getNextCellToUpdate(width, height);
        if (!nextValue) {
            return null;
        }
        return {
            ...nextValue,
            // override arg with our own stage index
            arg: this.stageIndex
        };
    }
    reset() {
        this.stageIndex = 0;
        this.stages = [...this.originalStages.map((s) => s.clone())];
    }
    getNeighbours(x, y, width, height, dist) {
        if (this.stages.length === 0) {
            return [];
        }
        return this.stages[0].getNeighbours(x, y, width, height, dist);
    }
    isRepeatable() {
        return this.isRepeating || this.originalStages.some((s) => s.isRepeatable());
    }
    isFinished() {
        return this.hasFinishedAtLeastOnce;
    }
    clone() {
        return new StagedScanStrategy(this.originalStages.map((s) => s.clone()), this.isRepeating);
    }
}

const SECTOR_SIZE = 8;
function getSectorId(x, y) {
    // 16 bits for number x 8 tiles = max tile size of 524280 :)
    return x | y << 16;
}
const OPPOSITE_DIRECTION = {
    "NW": "SE",
    "N": "S",
    "NE": "SW",
    "W": "E",
    "E": "W",
    "SW": "NE",
    "S": "N",
    "SE": "NW",
};
function getDirectionToSector(tileX, tileY, neighbour) {
    // in tiles
    const nX = neighbour.x * SECTOR_SIZE;
    const nY = neighbour.y * SECTOR_SIZE;
    if (nX === tileX - SECTOR_SIZE && nY === tileY - SECTOR_SIZE) {
        return 'NW';
    }
    else if (nX === tileX && nY === tileY - SECTOR_SIZE) {
        return 'N';
    }
    else if (nX === tileX + SECTOR_SIZE && nY === tileY - SECTOR_SIZE) {
        return 'NE';
    }
    else if (nX === tileX - SECTOR_SIZE && nY === tileY) {
        return 'W';
    }
    else if (nX === tileX + SECTOR_SIZE && nY === tileY) {
        return 'E';
    }
    else if (nX === tileX - SECTOR_SIZE && nY === tileY + SECTOR_SIZE) {
        return 'SW';
    }
    else if (nX === tileX && nY === tileY + SECTOR_SIZE) {
        return 'S';
    }
    else if (nX === tileX + SECTOR_SIZE && nY === tileY + SECTOR_SIZE) {
        return 'SE';
    }
    else {
        throw new Error(`unable to determine sector direction from ${tileX},${tileY} to ${nX},${nY}`);
    }
}
function getSectorTilesInDirection(tileX, tileY, tiles, direction) {
    const edgeX = tileX + SECTOR_SIZE - 1;
    const edgeY = tileY + SECTOR_SIZE - 1;
    return tiles.filter((tile) => {
        switch (direction) {
            case "NW":
                return tile.rx === tileX && tile.ry === tileY;
            case "N":
                return tile.ry === tileY;
            case "NE":
                return tile.rx === edgeX && tile.ry === tileY;
            case "W":
                return tile.rx === tileX;
            case "E":
                return tile.rx === edgeX;
            case "SW":
                return tile.rx === tileX && tile.ry === edgeY;
            case "S":
                return tile.ry === edgeY;
            case "SE":
                return tile.rx === edgeX && tile.ry === edgeY;
        }
    });
}
function getNeighbourTiles(tileX, tileY, tiles) {
    return tiles.filter(({ rx, ry }) => {
        return (rx === tileX + 1 || rx === tileX - 1 || ry === tileY + 1 || ry === tileY - 1) && rx !== tileX && ry !== tileY;
    });
}

// A sector is a uniform-sized segment of the map.
/**
 * Wrapper around IncrementalGridCache that handles scaling from tile coordinates to sectors (could probably also be refactored out)
 */
class SectorCache {
    constructor(mapBounds, diagonalMapBounds, initFn, updateFn) {
        this.mapBounds = mapBounds;
        const sectorsX = Math.ceil(mapBounds.width / SECTOR_SIZE);
        const sectorsY = Math.ceil(mapBounds.height / SECTOR_SIZE);
        // diagonal map bounds is in terms of tiles, so needs to be scaled too. In this case we take the floor of the starts and ceil of the ends
        // so we "overscan"
        function scaleBoundsArray(bounds, isStart) {
            let result = [];
            function handleBatch(values) {
                if (isStart) {
                    // minimum, and floor
                    return values.map((v) => Math.floor(v / SECTOR_SIZE)).reduce((pV, v) => v < pV ? v : pV, sectorsX);
                }
                // maximum, and ceil
                return values.map((v) => Math.ceil(v / SECTOR_SIZE)).reduce((pV, v) => v > pV ? v : pV, 0);
            }
            let n = 0;
            for (; n < bounds.length; n += SECTOR_SIZE) {
                const values = bounds.slice(n, n + SECTOR_SIZE);
                result.push(handleBatch(values));
            }
            if (n < bounds.length) {
                const values = bounds.slice(n, n + SECTOR_SIZE);
                result.push(handleBatch(values));
            }
            return result;
        }
        const scaledDiagonalMapBounds = {
            yStart: Math.floor(diagonalMapBounds.yStart / SECTOR_SIZE),
            yEnd: Math.ceil(diagonalMapBounds.yEnd / SECTOR_SIZE),
            xStarts: scaleBoundsArray(diagonalMapBounds.xStarts, true),
            xEnds: scaleBoundsArray(diagonalMapBounds.xEnds, false),
        };
        let minThreatColored = Number.MAX_VALUE;
        let maxThreatColored = Number.MIN_VALUE;
        let lastScanStage = -1;
        this.gridCache = new BasicIncrementalGridCache(sectorsX, sectorsY, initFn, (sectorX, sectorY, currentValue, scanStage) => {
            const neighbours = [];
            // send the neighbours as well, to allow for diffuse sector threat
            this.gridCache.forEachInRadius(sectorX, sectorY, 1, (nX, nY, s) => {
                if (nX !== sectorX || nY !== sectorY) {
                    const dist = (sectorX === nX || sectorY === nY ? 1 : 0.707);
                    neighbours.push({ sector: s.value, x: nX, y: nY, dist });
                }
            });
            minThreatColored = Math.min(currentValue.diffuseThreatLevel ?? 0, minThreatColored);
            maxThreatColored = Math.max(currentValue.diffuseThreatLevel ?? 0, maxThreatColored);
            // decay the scale every full scan
            if (scanStage !== lastScanStage) {
                lastScanStage = scanStage;
                minThreatColored = minThreatColored * 0.95;
                maxThreatColored = maxThreatColored * 0.95;
            }
            return updateFn(sectorX * SECTOR_SIZE, sectorY * SECTOR_SIZE, SECTOR_SIZE, currentValue, neighbours);
        }, new StagedScanStrategy([
            new SequentialScanStrategy(1, scaledDiagonalMapBounds),
            new SequentialScanStrategy(1, scaledDiagonalMapBounds).setReverse()
        ]).setRepeating(), 
        // Function to determine what colour should be rendered in the debug grid for this heatmap.
        (sector) => {
            // debug diffuse threat level:
            return toHeatmapColor(sector.diffuseThreatLevel, minThreatColored, maxThreatColored);
            // debug scouting:
            //return toHeatmapColor(sector.sectorVisibilityRatio);
            // debug sector connectedness
            //return toHeatmapColor(sector.connectedSectorIds.length > 0 ? 1 : 0, 0, 1);
        });
    }
    getSize() {
        return this.gridCache.getSize();
    }
    getCell(tileX, tileY) {
        return this.gridCache.getCell(Math.floor(tileX / SECTOR_SIZE), Math.floor(tileY / SECTOR_SIZE));
    }
    forEach(fn) {
        this.gridCache.forEach((x, y, cell) => {
            fn(Math.floor(x * SECTOR_SIZE + SECTOR_SIZE / 2), Math.floor(y * SECTOR_SIZE + SECTOR_SIZE / 2), cell);
        });
    }
    updateSectors(currentGameTick, maxSectorsToUpdate) {
        this.gridCache.updateCells(maxSectorsToUpdate, currentGameTick);
    }
    // Return % of sectors that are updated since a certain time
    getSectorUpdateRatio(sectorsUpdatedSinceGameTick) {
        let updated = 0, total = 0;
        this.gridCache.forEach((_x, _y, cell) => {
            if (cell.lastUpdatedTick !== null &&
                cell.lastUpdatedTick >= sectorsUpdatedSinceGameTick) {
                ++updated;
            }
            ++total;
        });
        return updated / total;
    }
    /**
     * Return the ratio (0-1) of tiles that are visible.
     */
    getOverallVisibility() {
        let visible = 0, total = 0;
        this.gridCache.forEach((_x, _y, cell) => {
            const sector = cell.value;
            // Undefined visibility.
            if (sector.sectorVisibilityRatio != undefined) {
                visible += sector.sectorVisibilityRatio;
                total += 1.0;
            }
        });
        return visible / total;
    }
    forEachInRadius(tileX, tileY, radius, fn) {
        const startingSector = this.getSectorCoordinatesForWorldPosition(tileX, tileY);
        if (!startingSector) {
            return;
        }
        this.gridCache.forEachInRadius(startingSector.sectorX, startingSector.sectorY, Math.ceil(radius / SECTOR_SIZE), (x, y, cell, distance) => {
            fn(Math.floor(x * SECTOR_SIZE + SECTOR_SIZE / 2), Math.floor(y * SECTOR_SIZE + SECTOR_SIZE / 2), cell, distance);
        });
    }
    getSectorCoordinatesForWorldPosition(x, y) {
        if (x < 0 || x >= this.mapBounds.width || y < 0 || y >= this.mapBounds.height) {
            return undefined;
        }
        return {
            sectorX: Math.floor(x / SECTOR_SIZE),
            sectorY: Math.floor(y / SECTOR_SIZE),
        };
    }
    _renderScale() {
        return SECTOR_SIZE;
    }
    _getCellDebug(tileX, tileY) {
        return this.gridCache._getCellDebug(Math.floor(tileX / SECTOR_SIZE), Math.floor(tileY / SECTOR_SIZE));
    }
}
/**
 * Computes which neighbour sectors can be pathed to from the sector starting at tileX,tileY. This is expensive, and therefore only calculated
 * when the sector is dirty (the pathing is changed in some way).
 */
function calculateConnectedSectorIds(mapApi, tileX, tileY, neighbours, speedType = e.Track) {
    // Algorithm: If you can reach the edge towards another sector, from the opposite edge, that sector is connected.
    // For diagonal connectivity we just test the corners for now.
    const allTiles = mapApi.getTilesInRect({ x: tileX, y: tileY, width: SECTOR_SIZE, height: SECTOR_SIZE });
    const tiles = allTiles.filter((tile) => {
        return mapApi.isPassableTile(tile, speedType, tile.onBridgeLandType ? true : false, true);
    });
    if (tiles.length === 0) {
        return [];
    }
    const connectedSectors = neighbours.filter((neighbour) => {
        const direction = getDirectionToSector(tileX, tileY, neighbour);
        const goalTiles = new Set(getSectorTilesInDirection(tileX, tileY, tiles, OPPOSITE_DIRECTION[direction]));
        const openList = getSectorTilesInDirection(tileX, tileY, tiles, direction);
        const closedSet = new Set();
        let head;
        while (head = openList.shift()) {
            const neighbourTiles = getNeighbourTiles(head.rx, head.ry, tiles);
            for (const neighbour of neighbourTiles) {
                if (goalTiles.has(neighbour)) {
                    return true;
                }
                if (!closedSet.has(neighbour)) {
                    closedSet.add(neighbour);
                    openList.push(neighbour);
                }
            }
        }
        return false;
    });
    return connectedSectors.map((s) => s.sector.id);
}

// A periodically-refreshed cache of known threats to a bot so we can use it in decision making.
class GlobalThreat {
    constructor(certainty, // 0.0 - 1.0 based on approximate visibility around the map.
    totalOffensiveLandThreat, // a number that approximates how much land-based firepower our opponents have.
    totalOffensiveAirThreat, // a number that approximates how much airborne firepower our opponents have.
    totalOffensiveAntiAirThreat, // a number that approximates how much anti-air firepower our opponents have.
    totalDefensiveThreat, // a number that approximates how much defensive power our opponents have.
    totalDefensivePower, // a number that approximates how much defensive power we have.
    totalAvailableAntiGroundFirepower, // how much anti-ground power we have
    totalAvailableAntiAirFirepower, // how much anti-air power we have
    totalAvailableAirPower) {
        this.certainty = certainty;
        this.totalOffensiveLandThreat = totalOffensiveLandThreat;
        this.totalOffensiveAirThreat = totalOffensiveAirThreat;
        this.totalOffensiveAntiAirThreat = totalOffensiveAntiAirThreat;
        this.totalDefensiveThreat = totalDefensiveThreat;
        this.totalDefensivePower = totalDefensivePower;
        this.totalAvailableAntiGroundFirepower = totalAvailableAntiGroundFirepower;
        this.totalAvailableAntiAirFirepower = totalAvailableAntiAirFirepower;
        this.totalAvailableAirPower = totalAvailableAirPower;
    }
}

function calculateGlobalThreat(game, playerData, visibleAreaPercent) {
    let groundUnits = game.getVisibleUnits(playerData.name, "enemy", (r) => r.type == a.Vehicle || r.type == a.Infantry);
    let airUnits = game.getVisibleUnits(playerData.name, "enemy", (r) => r.movementZone == M.Fly);
    let groundDefence = game
        .getVisibleUnits(playerData.name, "enemy", (r) => r.type == a.Building)
        .filter((unitId) => isAntiGround(game, unitId));
    let antiAirPower = game
        .getVisibleUnits(playerData.name, "enemy", (r) => r.type != a.Building)
        .filter((unitId) => isAntiAir(game, unitId));
    let ourAntiGroundUnits = game
        .getVisibleUnits(playerData.name, "self", (r) => r.isSelectableCombatant)
        .filter((unitId) => isAntiGround(game, unitId));
    let ourAntiAirUnits = game
        .getVisibleUnits(playerData.name, "self", (r) => r.isSelectableCombatant || r.type === a.Building)
        .filter((unitId) => isAntiAir(game, unitId));
    let ourGroundDefence = game
        .getVisibleUnits(playerData.name, "self", (r) => r.type === a.Building)
        .filter((unitId) => isAntiGround(game, unitId));
    let ourAirUnits = game.getVisibleUnits(playerData.name, "self", (r) => r.movementZone == M.Fly && r.isSelectableCombatant);
    let observedGroundThreat = calculateFirepowerForUnits(game, groundUnits);
    let observedAirThreat = calculateFirepowerForUnits(game, airUnits);
    let observedAntiAirThreat = calculateFirepowerForUnits(game, antiAirPower);
    let observedGroundDefence = calculateFirepowerForUnits(game, groundDefence);
    let ourAntiGroundPower = calculateFirepowerForUnits(game, ourAntiGroundUnits);
    let ourAntiAirPower = calculateFirepowerForUnits(game, ourAntiAirUnits);
    let ourAirPower = calculateFirepowerForUnits(game, ourAirUnits);
    let ourGroundDefencePower = calculateFirepowerForUnits(game, ourGroundDefence);
    return new GlobalThreat(visibleAreaPercent, observedGroundThreat, observedAirThreat, observedAntiAirThreat, observedGroundDefence, ourGroundDefencePower, ourAntiGroundPower, ourAntiAirPower, ourAirPower);
}
// For the purposes of determining if units can target air/ground, we look purely at the technorules and only the base weapon (not elite)
// This excludes some special cases such as IFVs changing turrets, but we have to deal with it for now.
function isAntiGround(gameApi, unitId) {
    return testProjectile(gameApi, unitId, (p) => p.isAntiGround);
}
function isAntiAir(gameApi, unitId) {
    return testProjectile(gameApi, unitId, (p) => p.isAntiAir);
}
function testProjectile(gameApi, unitId, test) {
    const rules = getCachedTechnoRules(gameApi, unitId);
    if (!rules || !(rules.primary || rules.secondary)) {
        return false;
    }
    const primaryWeapon = rules.primary ? gameApi.rulesApi.getWeapon(rules.primary) : null;
    const primaryProjectile = getProjectileRules(gameApi, primaryWeapon);
    if (primaryProjectile && test(primaryProjectile)) {
        return true;
    }
    const secondaryWeapon = rules.secondary ? gameApi.rulesApi.getWeapon(rules.secondary) : null;
    const secondaryProjectile = getProjectileRules(gameApi, secondaryWeapon);
    if (secondaryProjectile && test(secondaryProjectile)) {
        return true;
    }
    return false;
}
function getProjectileRules(gameApi, weapon) {
    const primaryProjectile = weapon ? gameApi.rulesApi.getProjectile(weapon.projectile) : null;
    return primaryProjectile;
}
function calculateFirepowerForUnit(gameApi, gameObjectData) {
    const rules = getCachedTechnoRules(gameApi, gameObjectData.id);
    if (!rules) {
        return 0;
    }
    const currentHp = gameObjectData?.hitPoints || 0;
    const maxHp = gameObjectData?.maxHitPoints || 0;
    let threat = 0;
    const hpRatio = currentHp / Math.max(1, maxHp);
    if (rules.primary) {
        const weapon = gameApi.rulesApi.getWeapon(rules.primary);
        threat += (hpRatio * ((weapon.damage + 1) * G.sqrt(weapon.range + 1))) / Math.max(weapon.rof, 1);
    }
    if (rules.secondary) {
        const weapon = gameApi.rulesApi.getWeapon(rules.secondary);
        threat += (hpRatio * ((weapon.damage + 1) * G.sqrt(weapon.range + 1))) / Math.max(weapon.rof, 1);
    }
    return Math.min(800, threat);
}
function calculateFirepowerForUnits(game, unitIds) {
    let threat = 0;
    unitIds.forEach((unitId) => {
        const gameObjectData = game.getGameObjectData(unitId);
        if (gameObjectData) {
            threat += calculateFirepowerForUnit(game, gameObjectData);
        }
    });
    return threat;
}

/**
 * Class representing a Quadtree node.
 *
 * @example
 * ```typescript
 * const tree = new Quadtree({
 *   width: 100,
 *   height: 100,
 *   x: 0,           // optional, default:  0
 *   y: 0,           // optional, default:  0
 *   maxObjects: 10, // optional, default: 10
 *   maxLevels: 4,   // optional, default:  4
 * });
 * ```
 *
 * @example Typescript: If you like to be explicit, you optionally can pass in a generic type for objects to be stored in the Quadtree:
 * ```typescript
 * class GameEntity extends Rectangle {
 *   ...
 * }
 * const tree = new Quadtree<GameEntity>({
 *   width: 100,
 *   height: 100,
 * });
 * ```
 */
class Quadtree {
    /**
     * Quadtree Constructor
     * @param props - bounds and properties of the node
     * @param level - depth level (internal use only, required for subnodes)
     */
    constructor(props, level = 0) {
        this.bounds = {
            x: props.x || 0,
            y: props.y || 0,
            width: props.width,
            height: props.height,
        };
        this.maxObjects = (typeof props.maxObjects === 'number') ? props.maxObjects : 10;
        this.maxLevels = (typeof props.maxLevels === 'number') ? props.maxLevels : 4;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }
    /**
     * Get the quadrant (subnode indexes) an object belongs to.
     *
     * @example Mostly for internal use but you can call it like so:
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * const rectangle = new Rectangle({ x: 25, y: 25, width: 10, height: 10 });
     * const indexes = tree.getIndex(rectangle);
     * console.log(indexes); // [1]
     * ```
     *
     * @param obj - object to be checked
     * @returns Array containing indexes of intersecting subnodes (0-3 = top-right, top-left, bottom-left, bottom-right).
     */
    getIndex(obj) {
        return obj.qtIndex(this.bounds);
    }
    /**
     * Split the node into 4 subnodes.
     * @internal Mostly for internal use! You should only call this yourself if you know what you are doing.
     *
     * @example Manual split:
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.split();
     * console.log(tree); // now tree has four subnodes
     * ```
     */
    split() {
        const level = this.level + 1, width = this.bounds.width / 2, height = this.bounds.height / 2, x = this.bounds.x, y = this.bounds.y;
        const coords = [
            { x: x + width, y: y },
            { x: x, y: y },
            { x: x, y: y + height },
            { x: x + width, y: y + height },
        ];
        for (let i = 0; i < 4; i++) {
            this.nodes[i] = new Quadtree({
                x: coords[i].x,
                y: coords[i].y,
                width,
                height,
                maxObjects: this.maxObjects,
                maxLevels: this.maxLevels,
            }, level);
        }
    }
    /**
     * Insert an object into the node. If the node
     * exceeds the capacity, it will split and add all
     * objects to their corresponding subnodes.
     *
     * @example you can use any shape here (or object with a qtIndex method, see README):
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.insert(new Rectangle({ x: 25, y: 25, width: 10, height: 10, data: 'data' }));
     * tree.insert(new Circle({ x: 25, y: 25, r: 10, data: 512 }));
     * tree.insert(new Line({ x1: 25, y1: 25, x2: 60, y2: 40, data: { custom: 'property'} }));
     * ```
     *
     * @param obj - Object to be added.
     */
    insert(obj) {
        //if we have subnodes, call insert on matching subnodes
        if (this.nodes.length) {
            const indexes = this.getIndex(obj);
            for (let i = 0; i < indexes.length; i++) {
                this.nodes[indexes[i]].insert(obj);
            }
            return;
        }
        //otherwise, store object here
        this.objects.push(obj);
        //maxObjects reached
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            //split if we don't already have subnodes
            if (!this.nodes.length) {
                this.split();
            }
            //add all objects to their corresponding subnode
            for (let i = 0; i < this.objects.length; i++) {
                const indexes = this.getIndex(this.objects[i]);
                for (let k = 0; k < indexes.length; k++) {
                    this.nodes[indexes[k]].insert(this.objects[i]);
                }
            }
            //clean up this node
            this.objects = [];
        }
    }
    /**
     * Return all objects that could collide with the given geometry.
     *
     * @example Just like insert, you can use any shape here (or object with a qtIndex method, see README):
     * ```typescript
     * tree.retrieve(new Rectangle({ x: 25, y: 25, width: 10, height: 10, data: 'data' }));
     * tree.retrieve(new Circle({ x: 25, y: 25, r: 10, data: 512 }));
     * tree.retrieve(new Line({ x1: 25, y1: 25, x2: 60, y2: 40, data: { custom: 'property'} }));
     * ```
     *
     * @param obj - geometry to be checked
     * @returns Array containing all detected objects.
     */
    retrieve(obj) {
        const indexes = this.getIndex(obj);
        let returnObjects = this.objects;
        //if we have subnodes, retrieve their objects
        if (this.nodes.length) {
            for (let i = 0; i < indexes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(obj));
            }
        }
        // remove duplicates
        if (this.level === 0) {
            return Array.from(new Set(returnObjects));
        }
        return returnObjects;
    }
    /**
     * Remove an object from the tree.
     * If you have to remove many objects, consider clearing the entire tree and rebuilding it or use the `fast` flag to cleanup after the last removal.
     * @beta
     *
     * @example
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * const circle = new Circle({ x: 25, y: 25, r: 10, data: 512 });
     * tree.insert(circle);
     * tree.remove(circle);
     * ```
     *
     * @example Bulk fast removals and final cleanup:
     * ```javascript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * const rects = [];
     *  for(let i=0; i<20; i++) {
     *    rects[i] = new Rectangle({ x: 25, y: 25, width: 50, height: 50 });
     *    tree.insert(rects[i]);
     *  }
     *  for(let i=rects.length-1; i>0; i--) {
     *    //fast=true – just remove the object (may leaves vacant subnodes)
     *    //fast=false – cleanup empty subnodes (default)
     *    const fast = (i !== 0);
     *    tree.remove(rects[i], fast);
     *  }
     * ```
     *
     * @param obj - Object to be removed.
     * @param fast - Set to true to increase performance temporarily by preventing cleanup of empty subnodes (optional, default: false).
     * @returns Weather or not the object was removed from THIS node (no recursive check).
     */
    remove(obj, fast = false) {
        const indexOf = this.objects.indexOf(obj);
        // remove objects
        if (indexOf > -1) {
            this.objects.splice(indexOf, 1);
        }
        // remove from all subnodes
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].remove(obj);
        }
        // remove all empty subnodes
        if (this.level === 0 && !fast) {
            this.join();
        }
        return (indexOf !== -1);
    }
    /**
     * Update an object already in the tree (shorthand for remove and insert).
     * If you have to update many objects, consider clearing and rebuilding the
     * entire tree or use the `fast` flag to cleanup after the last update.
     * @beta
     *
     * @example
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100, maxObjects: 1 });
     * const rect1 = new Rectangle({ x: 25, y: 25, width: 10, height: 10 });
     * const rect2 = new Rectangle({ x: 25, y: 25, width: 10, height: 10 });
     * tree.insert(rect1);
     * tree.insert(rect2);
     * rect1.x = 75;
     * rect1.y = 75;
     * tree.update(rect1);
     * ```
     * @example Bulk fast update and final cleanup:
     * ```javascript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * const rects = [];
     *  for(let i=0; i<20; i++) {
     *    rects[i] = new Rectangle({ x: 20, y: 20, width: 20, height: 20 });
     *    tree.insert(rects[i]);
     *  }
     *  for(let i=rects.length-1; i>0; i--) {
     *    rects[i].x = 20 + Math.random()*60;
     *    rects[i].y = 20 + Math.random()*60;
     *    //fast=true – just re-insert the object (may leaves vacant subnodes)
     *    //fast=false – cleanup empty subnodes (default)
     *    const fast = (i !== 0);
     *    tree.update(rects[i], fast);
     *  }
     * ```
     *
     * @param obj - Object to be updated.
     * @param fast - Set to true to increase performance temporarily by preventing cleanup of empty subnodes (optional, default: false).
     */
    update(obj, fast = false) {
        this.remove(obj, fast);
        this.insert(obj);
    }
    /**
     * The opposite of a split: try to merge and dissolve subnodes.
     * @beta
     * @internal Mostly for internal use! You should only call this yourself if you know what you are doing.
     *
     * @example Manual join:
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.split();
     * console.log(tree.nodes.length); // 4
     * tree.join();
     * console.log(tree.nodes.length); // 0
     * ```
     *
     * @returns The objects from this node and all subnodes combined.
     */
    join() {
        // recursive join
        let allObjects = Array.from(this.objects);
        for (let i = 0; i < this.nodes.length; i++) {
            const bla = this.nodes[i].join();
            allObjects = allObjects.concat(bla);
        }
        // remove duplicates
        const uniqueObjects = Array.from(new Set(allObjects));
        if (uniqueObjects.length <= this.maxObjects) {
            this.objects = uniqueObjects;
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].objects = [];
            }
            this.nodes = [];
        }
        return allObjects;
    }
    /**
     * Clear the Quadtree.
     *
     * @example
     * ```typescript
     * const tree = new Quadtree({ width: 100, height: 100 });
     * tree.insert(new Circle({ x: 25, y: 25, r: 10 }));
     * tree.clear();
     * console.log(tree); // tree.objects and tree.nodes are empty
     * ```
     */
    clear() {
        this.objects = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes.length) {
                this.nodes[i].clear();
            }
        }
        this.nodes = [];
    }
}

/**
 * Class representing a Circle.
 * @typeParam CustomDataType - Type of the custom data property (optional, inferred automatically).
 *
 * @example Without custom data (JS/TS):
 * ```typescript
 * const circle = new Circle({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 * });
 * ```
 *
 * @example With custom data (JS/TS):
 * ```javascript
 * const circle = new Circle({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 *   data: {
 *     name: 'Jane',
 *     health: 100,
 *   },
 * });
 * ```
 *
 * @example With custom data (TS):
 * ```typescript
 * interface ObjectData {
 *   name: string
 *   health: number
 * }
 * const entity: ObjectData = {
 *   name: 'Jane',
 *   health: 100,
 * };
 *
 * // Typescript will infer the type of the data property
 * const circle1 = new Circle({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 *   data: entity,
 * });
 *
 * // You can also pass in a generic type for the data property
 * const circle2 = new Circle<ObjectData>({
 *   x: 100,
 *   y: 100,
 *   r: 32,
 * });
 * circle2.data = entity;
 * ```
 *
 * @example With custom class extending Circle (implements {@link CircleGeometry} (x, y, r)):
 * ```javascript
 * // extending inherits the qtIndex method
 * class Bomb extends Circle {
 *
 *   constructor(props) {
 *     // call super to set x, y, r (and data, if given)
 *     super(props);
 *     this.countdown = props.countdown;
 *   }
 * }
 *
 * const bomb = new Bomb({
 *   countdown: 5,
 *   x: 10,
 *   y: 20,
 *   r: 30,
 * });
 * ```
 *
 * @example With custom class and mapping {@link CircleGeometry}:
 * ```javascript
 * // no need to extend if you don't implement CircleGeometry
 * class Bomb {
 *
 *   constructor(countdown) {
 *     this.countdown = countdown;
 *     this.position = [10, 20];
 *     this.radius = 30;
 *   }
 *
 *   // add a qtIndex method to your class
 *   qtIndex(node) {
 *     // map your properties to CircleGeometry
 *     return Circle.prototype.qtIndex.call({
 *       x: this.position[0],
 *       y: this.position[1],
 *       r: this.radius,
 *     }, node);
 *   }
 * }
 *
 * const bomb = new Bomb(5);
 * ```
 *
 * @example With custom object that implements {@link CircleGeometry}:
 * ```javascript
 * const player = {
 *   name: 'Jane',
 *   health: 100,
 *   x: 10,
 *   y: 20,
 *   r: 30,
 *   qtIndex: Circle.prototype.qtIndex,
 * });
 * ```
 *
 * @example With custom object and mapping {@link CircleGeometry}:
 * ```javascript
 * // Note: this is not recommended but possible.
 * // Using this technique, each object would have it's own qtIndex method.
 * // Rather add qtIndex to your prototype, e.g. by using classes like shown above.
 * const player = {
 *   name: 'Jane',
 *   health: 100,
 *   position: [10, 20],
 *   radius: 30,
 *   qtIndex: function(node) {
 *     return Circle.prototype.qtIndex.call({
 *       x: this.position[0],
 *       y: this.position[1],
 *       r: this.radius,
 *     }, node);
 *   },
 * });
 * ```
 */
class Circle {
    /**
     * Circle Constructor
     * @param props - Circle properties
     * @typeParam CustomDataType - Type of the custom data property (optional, inferred automatically).
     */
    constructor(props) {
        this.x = props.x;
        this.y = props.y;
        this.r = props.r;
        this.data = props.data;
    }
    /**
     * Determine which quadrant this circle belongs to.
     * @param node - Quadtree node to be checked
     * @returns Array containing indexes of intersecting subnodes (0-3 = top-right, top-left, bottom-left, bottom-right)
     */
    qtIndex(node) {
        const indexes = [], w2 = node.width / 2, h2 = node.height / 2, x2 = node.x + w2, y2 = node.y + h2;
        //an array of node origins where the array index equals the node index
        const nodes = [
            [x2, node.y],
            [node.x, node.y],
            [node.x, y2],
            [x2, y2],
        ];
        //test all nodes for circle intersections
        for (let i = 0; i < nodes.length; i++) {
            if (Circle.intersectRect(this.x, this.y, this.r, nodes[i][0], nodes[i][1], nodes[i][0] + w2, nodes[i][1] + h2)) {
                indexes.push(i);
            }
        }
        return indexes;
    }
    /**
     * Check if a circle intersects an axis aligned rectangle.
     * @beta
     * @see https://yal.cc/rectangle-circle-intersection-test/
     * @param x - circle center X
     * @param y - circle center Y
     * @param r - circle radius
     * @param minX - rectangle start X
     * @param minY - rectangle start Y
     * @param maxX - rectangle end X
     * @param maxY - rectangle end Y
     * @returns true if circle intersects rectangle
     *
     * @example Check if a circle intersects a rectangle:
     * ```javascript
     * const circ = { x: 10, y: 20, r: 30 };
     * const rect = { x: 40, y: 50, width: 60, height: 70 };
     * const intersect = Circle.intersectRect(
     *   circ.x,
     *   circ.y,
     *   circ.r,
     *   rect.x,
     *   rect.y,
     *   rect.x + rect.width,
     *   rect.y + rect.height,
     * );
     * console.log(circle, rect, 'intersect?', intersect);
     * ```
     */
    static intersectRect(x, y, r, minX, minY, maxX, maxY) {
        const deltaX = x - Math.max(minX, Math.min(x, maxX));
        const deltaY = y - Math.max(minY, Math.min(y, maxY));
        return (deltaX * deltaX + deltaY * deltaY) < (r * r);
    }
}

var minPriorityQueue = {};

var heap$1 = {};

var heap = {};

/**
 * @license MIT
 * @copyright 2020 Eyas Ranjous <eyas.ranjous@gmail.com>
 *
 * @class
 */

var hasRequiredHeap$1;

function requireHeap$1 () {
	if (hasRequiredHeap$1) return heap;
	hasRequiredHeap$1 = 1;
	class Heap {
	  /**
	   * @param {function} compare
	   * @param {array} [_values]
	   * @param {number|string|object} [_leaf]
	   */
	  constructor(compare, _values, _leaf) {
	    if (typeof compare !== 'function') {
	      throw new Error('Heap constructor expects a compare function');
	    }
	    this._compare = compare;
	    this._nodes = Array.isArray(_values) ? _values : [];
	    this._leaf = _leaf || null;
	  }

	  /**
	   * Converts the heap to a cloned array without sorting.
	   * @public
	   * @returns {Array}
	   */
	  toArray() {
	    return Array.from(this._nodes);
	  }

	  /**
	   * Checks if a parent has a left child
	   * @private
	   */
	  _hasLeftChild(parentIndex) {
	    const leftChildIndex = (parentIndex * 2) + 1;
	    return leftChildIndex < this.size();
	  }

	  /**
	   * Checks if a parent has a right child
	   * @private
	   */
	  _hasRightChild(parentIndex) {
	    const rightChildIndex = (parentIndex * 2) + 2;
	    return rightChildIndex < this.size();
	  }

	  /**
	   * Compares two nodes
	   * @private
	   */
	  _compareAt(i, j) {
	    return this._compare(this._nodes[i], this._nodes[j]);
	  }

	  /**
	   * Swaps two nodes in the heap
	   * @private
	   */
	  _swap(i, j) {
	    const temp = this._nodes[i];
	    this._nodes[i] = this._nodes[j];
	    this._nodes[j] = temp;
	  }

	  /**
	   * Checks if parent and child should be swapped
	   * @private
	   */
	  _shouldSwap(parentIndex, childIndex) {
	    if (parentIndex < 0 || parentIndex >= this.size()) {
	      return false;
	    }

	    if (childIndex < 0 || childIndex >= this.size()) {
	      return false;
	    }

	    return this._compareAt(parentIndex, childIndex) > 0;
	  }

	  /**
	   * Compares children of a parent
	   * @private
	   */
	  _compareChildrenOf(parentIndex) {
	    if (!this._hasLeftChild(parentIndex) && !this._hasRightChild(parentIndex)) {
	      return -1;
	    }

	    const leftChildIndex = (parentIndex * 2) + 1;
	    const rightChildIndex = (parentIndex * 2) + 2;

	    if (!this._hasLeftChild(parentIndex)) {
	      return rightChildIndex;
	    }

	    if (!this._hasRightChild(parentIndex)) {
	      return leftChildIndex;
	    }

	    const compare = this._compareAt(leftChildIndex, rightChildIndex);
	    return compare > 0 ? rightChildIndex : leftChildIndex;
	  }

	  /**
	   * Compares two children before a position
	   * @private
	   */
	  _compareChildrenBefore(index, leftChildIndex, rightChildIndex) {
	    const compare = this._compareAt(rightChildIndex, leftChildIndex);

	    if (compare <= 0 && rightChildIndex < index) {
	      return rightChildIndex;
	    }

	    return leftChildIndex;
	  }

	  /**
	   * Recursively bubbles up a node if it's in a wrong position
	   * @private
	   */
	  _heapifyUp(startIndex) {
	    let childIndex = startIndex;
	    let parentIndex = Math.floor((childIndex - 1) / 2);

	    while (this._shouldSwap(parentIndex, childIndex)) {
	      this._swap(parentIndex, childIndex);
	      childIndex = parentIndex;
	      parentIndex = Math.floor((childIndex - 1) / 2);
	    }
	  }

	  /**
	   * Recursively bubbles down a node if it's in a wrong position
	   * @private
	   */
	  _heapifyDown(startIndex) {
	    let parentIndex = startIndex;
	    let childIndex = this._compareChildrenOf(parentIndex);

	    while (this._shouldSwap(parentIndex, childIndex)) {
	      this._swap(parentIndex, childIndex);
	      parentIndex = childIndex;
	      childIndex = this._compareChildrenOf(parentIndex);
	    }
	  }

	  /**
	   * Recursively bubbles down a node before a given index
	   * @private
	   */
	  _heapifyDownUntil(index) {
	    let parentIndex = 0;
	    let leftChildIndex = 1;
	    let rightChildIndex = 2;
	    let childIndex;

	    while (leftChildIndex < index) {
	      childIndex = this._compareChildrenBefore(
	        index,
	        leftChildIndex,
	        rightChildIndex
	      );

	      if (this._shouldSwap(parentIndex, childIndex)) {
	        this._swap(parentIndex, childIndex);
	      }

	      parentIndex = childIndex;
	      leftChildIndex = (parentIndex * 2) + 1;
	      rightChildIndex = (parentIndex * 2) + 2;
	    }
	  }

	  /**
	   * Inserts a new value into the heap
	   * @public
	   * @param {number|string|object} value
	   * @returns {Heap}
	   */
	  insert(value) {
	    this._nodes.push(value);
	    this._heapifyUp(this.size() - 1);
	    if (this._leaf === null || this._compare(value, this._leaf) > 0) {
	      this._leaf = value;
	    }
	    return this;
	  }

	  /**
	   * Inserts a new value into the heap
	   * @public
	   * @param {number|string|object} value
	   * @returns {Heap}
	   */
	  push(value) {
	    return this.insert(value);
	  }

	  /**
	   * Removes and returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  extractRoot() {
	    if (this.isEmpty()) {
	      return null;
	    }

	    const root = this.root();
	    this._nodes[0] = this._nodes[this.size() - 1];
	    this._nodes.pop();
	    this._heapifyDown(0);

	    if (root === this._leaf) {
	      this._leaf = this.root();
	    }

	    return root;
	  }

	  /**
	   * Removes and returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  pop() {
	    return this.extractRoot();
	  }

	  /**
	   * Applies heap sort and return the values sorted by priority
	   * @public
	   * @returns {array}
	   */
	  sort() {
	    for (let i = this.size() - 1; i > 0; i -= 1) {
	      this._swap(0, i);
	      this._heapifyDownUntil(i);
	    }
	    return this._nodes;
	  }

	  /**
	   * Fixes node positions in the heap
	   * @public
	   * @returns {Heap}
	   */
	  fix() {
	    // fix node positions
	    for (let i = Math.floor(this.size() / 2) - 1; i >= 0; i -= 1) {
	      this._heapifyDown(i);
	    }

	    // fix leaf value
	    for (let i = Math.floor(this.size() / 2); i < this.size(); i += 1) {
	      const value = this._nodes[i];
	      if (this._leaf === null || this._compare(value, this._leaf) > 0) {
	        this._leaf = value;
	      }
	    }

	    return this;
	  }

	  /**
	   * Verifies that all heap nodes are in the right position
	   * @public
	   * @returns {boolean}
	   */
	  isValid() {
	    const isValidRecursive = (parentIndex) => {
	      let isValidLeft = true;
	      let isValidRight = true;

	      if (this._hasLeftChild(parentIndex)) {
	        const leftChildIndex = (parentIndex * 2) + 1;
	        if (this._compareAt(parentIndex, leftChildIndex) > 0) {
	          return false;
	        }
	        isValidLeft = isValidRecursive(leftChildIndex);
	      }

	      if (this._hasRightChild(parentIndex)) {
	        const rightChildIndex = (parentIndex * 2) + 2;
	        if (this._compareAt(parentIndex, rightChildIndex) > 0) {
	          return false;
	        }
	        isValidRight = isValidRecursive(rightChildIndex);
	      }

	      return isValidLeft && isValidRight;
	    };

	    return isValidRecursive(0);
	  }

	  /**
	   * Returns a shallow copy of the heap
	   * @public
	   * @returns {Heap}
	   */
	  clone() {
	    return new Heap(this._compare, this._nodes.slice(), this._leaf);
	  }

	  /**
	   * Returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  root() {
	    if (this.isEmpty()) {
	      return null;
	    }

	    return this._nodes[0];
	  }

	  /**
	   * Returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  top() {
	    return this.root();
	  }

	  /**
	   * Returns a leaf node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  leaf() {
	    return this._leaf;
	  }

	  /**
	   * Returns the number of nodes in the heap
	   * @public
	   * @returns {number}
	   */
	  size() {
	    return this._nodes.length;
	  }

	  /**
	   * Checks if the heap is empty
	   * @public
	   * @returns {boolean}
	   */
	  isEmpty() {
	    return this.size() === 0;
	  }

	  /**
	   * Clears the heap
	   * @public
	   */
	  clear() {
	    this._nodes = [];
	    this._leaf = null;
	  }

	  /**
	   * Implements an iterable on the heap
	   * @public
	   */
	  [Symbol.iterator]() {
	    let size = this.size();
	    return {
	      next: () => {
	        size -= 1;
	        return {
	          value: this.pop(),
	          done: size === -1
	        };
	      }
	    };
	  }

	  /**
	   * Builds a heap from a array of values
	   * @public
	   * @static
	   * @param {array} values
	   * @param {function} compare
	   * @returns {Heap}
	   */
	  static heapify(values, compare) {
	    if (!Array.isArray(values)) {
	      throw new Error('Heap.heapify expects an array of values');
	    }

	    if (typeof compare !== 'function') {
	      throw new Error('Heap.heapify expects a compare function');
	    }

	    return new Heap(compare, values).fix();
	  }

	  /**
	   * Checks if a list of values is a valid heap
	   * @public
	   * @static
	   * @param {array} values
	   * @param {function} compare
	   * @returns {boolean}
	   */
	  static isHeapified(values, compare) {
	    return new Heap(compare, values).isValid();
	  }
	}

	heap.Heap = Heap;
	return heap;
}

var minHeap = {};

/**
 * @license MIT
 * @copyright 2020 Eyas Ranjous <eyas.ranjous@gmail.com>
 */

var hasRequiredMinHeap;

function requireMinHeap () {
	if (hasRequiredMinHeap) return minHeap;
	hasRequiredMinHeap = 1;
	const { Heap } = requireHeap$1();

	const getMinCompare = (getCompareValue) => (a, b) => {
	  const aVal = typeof getCompareValue === 'function' ? getCompareValue(a) : a;
	  const bVal = typeof getCompareValue === 'function' ? getCompareValue(b) : b;
	  return aVal < bVal ? -1 : 1;
	};

	/**
	 * @class MinHeap
	 * @extends Heap
	 */
	class MinHeap {
	  /**
	   * @param {function} [getCompareValue]
	   * @param {Heap} [_heap]
	   */
	  constructor(getCompareValue, _heap) {
	    this._getCompareValue = getCompareValue;
	    this._heap = _heap || new Heap(getMinCompare(getCompareValue));
	  }

	  /**
	   * Converts the heap to a cloned array without sorting.
	   * @public
	   * @returns {Array}
	   */
	  toArray() {
	    return Array.from(this._heap._nodes);
	  }

	  /**
	   * Inserts a new value into the heap
	   * @public
	   * @param {number|string|object} value
	   * @returns {MinHeap}
	   */
	  insert(value) {
	    return this._heap.insert(value);
	  }

	  /**
	   * Inserts a new value into the heap
	   * @public
	   * @param {number|string|object} value
	   * @returns {Heap}
	   */
	  push(value) {
	    return this.insert(value);
	  }

	  /**
	   * Removes and returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  extractRoot() {
	    return this._heap.extractRoot();
	  }

	  /**
	   * Removes and returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  pop() {
	    return this.extractRoot();
	  }

	  /**
	   * Applies heap sort and return the values sorted by priority
	   * @public
	   * @returns {array}
	   */
	  sort() {
	    return this._heap.sort();
	  }

	  /**
	   * Fixes node positions in the heap
	   * @public
	   * @returns {MinHeap}
	   */
	  fix() {
	    return this._heap.fix();
	  }

	  /**
	   * Verifies that all heap nodes are in the right position
	   * @public
	   * @returns {boolean}
	   */
	  isValid() {
	    return this._heap.isValid();
	  }

	  /**
	   * Returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  root() {
	    return this._heap.root();
	  }

	  /**
	   * Returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  top() {
	    return this.root();
	  }

	  /**
	   * Returns a leaf node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  leaf() {
	    return this._heap.leaf();
	  }

	  /**
	   * Returns the number of nodes in the heap
	   * @public
	   * @returns {number}
	   */
	  size() {
	    return this._heap.size();
	  }

	  /**
	   * Checks if the heap is empty
	   * @public
	   * @returns {boolean}
	   */
	  isEmpty() {
	    return this._heap.isEmpty();
	  }

	  /**
	   * Clears the heap
	   * @public
	   */
	  clear() {
	    this._heap.clear();
	  }

	  /**
	   * Returns a shallow copy of the MinHeap
	   * @public
	   * @returns {MinHeap}
	   */
	  clone() {
	    return new MinHeap(this._getCompareValue, this._heap.clone());
	  }

	  /**
	   * Implements an iterable on the heap
	   * @public
	   */
	  [Symbol.iterator]() {
	    let size = this.size();
	    return {
	      next: () => {
	        size -= 1;
	        return {
	          value: this.pop(),
	          done: size === -1
	        };
	      }
	    };
	  }

	  /**
	   * Builds a MinHeap from an array
	   * @public
	   * @static
	   * @param {array} values
	   * @param {function} [getCompareValue]
	   * @returns {MinHeap}
	   */
	  static heapify(values, getCompareValue) {
	    if (!Array.isArray(values)) {
	      throw new Error('MinHeap.heapify expects an array');
	    }
	    const heap = new Heap(getMinCompare(getCompareValue), values);
	    return new MinHeap(getCompareValue, heap).fix();
	  }

	  /**
	   * Checks if a list of values is a valid min heap
	   * @public
	   * @static
	   * @param {array} values
	   * @param {function} [getCompareValue]
	   * @returns {boolean}
	   */
	  static isHeapified(values, getCompareValue) {
	    const heap = new Heap(getMinCompare(getCompareValue), values);
	    return new MinHeap(getCompareValue, heap).isValid();
	  }
	}

	minHeap.MinHeap = MinHeap;
	return minHeap;
}

var maxHeap = {};

/**
 * @license MIT
 * @copyright 2020 Eyas Ranjous <eyas.ranjous@gmail.com>
 */

var hasRequiredMaxHeap;

function requireMaxHeap () {
	if (hasRequiredMaxHeap) return maxHeap;
	hasRequiredMaxHeap = 1;
	const { Heap } = requireHeap$1();

	const getMaxCompare = (getCompareValue) => (a, b) => {
	  const aVal = typeof getCompareValue === 'function' ? getCompareValue(a) : a;
	  const bVal = typeof getCompareValue === 'function' ? getCompareValue(b) : b;
	  return aVal < bVal ? 1 : -1;
	};

	/**
	 * @class MaxHeap
	 * @extends Heap
	 */
	class MaxHeap {
	  /**
	   * @param {function} [getCompareValue]
	   * @param {Heap} [_heap]
	   */
	  constructor(getCompareValue, _heap) {
	    this._getCompareValue = getCompareValue;
	    this._heap = _heap || new Heap(getMaxCompare(getCompareValue));
	  }

	  /**
	   * Inserts a new value into the heap
	   * @public
	   * @param {number|string|object} value
	   * @returns {MaxHeap}
	   */
	  insert(value) {
	    return this._heap.insert(value);
	  }

	  /**
	   * Inserts a new value into the heap
	   * @public
	   * @param {number|string|object} value
	   * @returns {Heap}
	   */
	  push(value) {
	    return this.insert(value);
	  }

	  /**
	   * Removes and returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  extractRoot() {
	    return this._heap.extractRoot();
	  }

	  /**
	   * Removes and returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  pop() {
	    return this.extractRoot();
	  }

	  /**
	   * Applies heap sort and return the values sorted by priority
	   * @public
	   * @returns {array}
	   */
	  sort() {
	    return this._heap.sort();
	  }

	  /**
	   * Converts the heap to a cloned array without sorting.
	   * @public
	   * @returns {Array}
	   */
	  toArray() {
	    return Array.from(this._heap._nodes);
	  }

	  /**
	   * Fixes node positions in the heap
	   * @public
	   * @returns {MaxHeap}
	   */
	  fix() {
	    return this._heap.fix();
	  }

	  /**
	   * Verifies that all heap nodes are in the right position
	   * @public
	   * @returns {boolean}
	   */
	  isValid() {
	    return this._heap.isValid();
	  }

	  /**
	   * Returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  root() {
	    return this._heap.root();
	  }

	  /**
	   * Returns the root node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  top() {
	    return this.root();
	  }

	  /**
	   * Returns a leaf node in the heap
	   * @public
	   * @returns {number|string|object}
	   */
	  leaf() {
	    return this._heap.leaf();
	  }

	  /**
	   * Returns the number of nodes in the heap
	   * @public
	   * @returns {number}
	   */
	  size() {
	    return this._heap.size();
	  }

	  /**
	   * Checks if the heap is empty
	   * @public
	   * @returns {boolean}
	   */
	  isEmpty() {
	    return this._heap.isEmpty();
	  }

	  /**
	   * Clears the heap
	   * @public
	   */
	  clear() {
	    this._heap.clear();
	  }

	  /**
	   * Returns a shallow copy of the MaxHeap
	   * @public
	   * @returns {MaxHeap}
	   */
	  clone() {
	    return new MaxHeap(this._getCompareValue, this._heap.clone());
	  }

	  /**
	   * Implements an iterable on the heap
	   * @public
	   */
	  [Symbol.iterator]() {
	    let size = this.size();
	    return {
	      next: () => {
	        size -= 1;
	        return {
	          value: this.pop(),
	          done: size === -1
	        };
	      }
	    };
	  }

	  /**
	   * Builds a MaxHeap from an array
	   * @public
	   * @static
	   * @param {array} values
	   * @param {function} [getCompareValue]
	   * @returns {MaxHeap}
	   */
	  static heapify(values, getCompareValue) {
	    if (!Array.isArray(values)) {
	      throw new Error('MaxHeap.heapify expects an array');
	    }
	    const heap = new Heap(getMaxCompare(getCompareValue), values);
	    return new MaxHeap(getCompareValue, heap).fix();
	  }

	  /**
	   * Checks if a list of values is a valid max heap
	   * @public
	   * @static
	   * @param {array} values
	   * @param {function} [getCompareValue]
	   * @returns {boolean}
	   */
	  static isHeapified(values, getCompareValue) {
	    const heap = new Heap(getMaxCompare(getCompareValue), values);
	    return new MaxHeap(getCompareValue, heap).isValid();
	  }
	}

	maxHeap.MaxHeap = MaxHeap;
	return maxHeap;
}

var hasRequiredHeap;

function requireHeap () {
	if (hasRequiredHeap) return heap$1;
	hasRequiredHeap = 1;
	const { Heap } = requireHeap$1();
	const { MinHeap } = requireMinHeap();
	const { MaxHeap } = requireMaxHeap();

	heap$1.Heap = Heap;
	heap$1.MinHeap = MinHeap;
	heap$1.MaxHeap = MaxHeap;
	return heap$1;
}

/**
 * @copyright 2020 Eyas Ranjous <eyas.ranjous@gmail.com>
 * @license MIT
 */

var hasRequiredMinPriorityQueue;

function requireMinPriorityQueue () {
	if (hasRequiredMinPriorityQueue) return minPriorityQueue;
	hasRequiredMinPriorityQueue = 1;
	const { Heap, MinHeap } = requireHeap();

	const getMinCompare = (getCompareValue) => (a, b) => {
	  const aVal = typeof getCompareValue === 'function' ? getCompareValue(a) : a;
	  const bVal = typeof getCompareValue === 'function' ? getCompareValue(b) : b;
	  return aVal < bVal ? -1 : 1;
	};

	/**
	 * @class MinPriorityQueue
	 */
	class MinPriorityQueue {
	  constructor(getCompareValue, _heap) {
	    if (getCompareValue && typeof getCompareValue !== 'function') {
	      throw new Error('MinPriorityQueue constructor requires a callback for object values');
	    }
	    this._heap = _heap || new MinHeap(getCompareValue);
	  }

	  /**
	   * Returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  front() {
	    return this._heap.root();
	  }

	  /**
	   * Returns an element with lowest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  back() {
	    return this._heap.leaf();
	  }

	  /**
	   * Adds a value to the queue
	   * @public
	   * @param {number|string|object} value
	   * @returns {MinPriorityQueue}
	   */
	  enqueue(value) {
	    return this._heap.insert(value);
	  }

	  /**
	   * Adds a value to the queue
	   * @public
	   * @param {number|string|object} value
	   * @returns {MinPriorityQueue}
	   */
	  push(value) {
	    return this.enqueue(value);
	  }

	  /**
	   * Removes and returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  dequeue() {
	    return this._heap.extractRoot();
	  }

	  /**
	   * Removes and returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  pop() {
	    return this.dequeue();
	  }

	  /**
	   * Removes all elements that match a criteria in the callback
	   * @public
	   * @param {function} cb
	   * @returns {array}
	   */
	  remove(cb) {
	    if (typeof cb !== 'function') {
	      throw new Error('MinPriorityQueue remove expects a callback');
	    }

	    const removed = [];
	    const dequeued = [];
	    while (!this.isEmpty()) {
	      const popped = this.pop();
	      if (cb(popped)) {
	        removed.push(popped);
	      } else {
	        dequeued.push(popped);
	      }
	    }

	    dequeued.forEach((val) => this.push(val));
	    return removed;
	  }

	  /**
	   * Returns the number of elements in the queue
	   * @public
	   * @returns {number}
	   */
	  size() {
	    return this._heap.size();
	  }

	  /**
	   * Checks if the queue is empty
	   * @public
	   * @returns {boolean}
	   */
	  isEmpty() {
	    return this._heap.isEmpty();
	  }

	  /**
	   * Clears the queue
	   * @public
	   */
	  clear() {
	    this._heap.clear();
	  }

	  /**
	   * Returns a sorted list of elements from highest to lowest priority
	   * @public
	   * @returns {array}
	   */
	  toArray() {
	    return this._heap.clone().sort().reverse();
	  }

	  /**
	   * Implements an iterable on the min priority queue
	   * @public
	   */
	  [Symbol.iterator]() {
	    let size = this.size();
	    return {
	      next: () => {
	        size -= 1;
	        return {
	          value: this.pop(),
	          done: size === -1
	        };
	      }
	    };
	  }

	  /**
	   * Creates a priority queue from an existing array
	   * @public
	   * @static
	   * @returns {MinPriorityQueue}
	   */
	  static fromArray(values, getCompareValue) {
	    const heap = new Heap(getMinCompare(getCompareValue), values);
	    return new MinPriorityQueue(
	      getCompareValue,
	      new MinHeap(getCompareValue, heap).fix()
	    );
	  }
	}

	minPriorityQueue.MinPriorityQueue = MinPriorityQueue;
	return minPriorityQueue;
}

var maxPriorityQueue = {};

/**
 * @copyright 2020 Eyas Ranjous <eyas.ranjous@gmail.com>
 * @license MIT
 */

var hasRequiredMaxPriorityQueue;

function requireMaxPriorityQueue () {
	if (hasRequiredMaxPriorityQueue) return maxPriorityQueue;
	hasRequiredMaxPriorityQueue = 1;
	const { Heap, MaxHeap } = requireHeap();

	const getMaxCompare = (getCompareValue) => (a, b) => {
	  const aVal = typeof getCompareValue === 'function' ? getCompareValue(a) : a;
	  const bVal = typeof getCompareValue === 'function' ? getCompareValue(b) : b;
	  return aVal < bVal ? 1 : -1;
	};

	/**
	 * @class MaxPriorityQueue
	 * @extends MaxHeap
	 */
	class MaxPriorityQueue {
	  constructor(getCompareValue, _heap) {
	    if (getCompareValue && typeof getCompareValue !== 'function') {
	      throw new Error('MaxPriorityQueue constructor requires a callback for object values');
	    }
	    this._heap = _heap || new MaxHeap(getCompareValue);
	  }

	  /**
	   * Returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  front() {
	    return this._heap.root();
	  }

	  /**
	   * Returns an element with lowest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  back() {
	    return this._heap.leaf();
	  }

	  /**
	   * Adds a value to the queue
	   * @public
	   * @param {number|string|object} value
	   * @returns {MaxPriorityQueue}
	   */
	  enqueue(value) {
	    return this._heap.insert(value);
	  }

	  /**
	   * Adds a value to the queue
	   * @public
	   * @param {number|string|object} value
	   * @returns {MaxPriorityQueue}
	   */
	  push(value) {
	    return this.enqueue(value);
	  }

	  /**
	   * Removes and returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  dequeue() {
	    return this._heap.extractRoot();
	  }

	  /**
	   * Removes and returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  pop() {
	    return this.dequeue();
	  }

	  /**
	   * Removes all elements that match a criteria in the callback
	   * @public
	   * @param {function} cb
	   * @returns {array}
	   */
	  remove(cb) {
	    if (typeof cb !== 'function') {
	      throw new Error('MaxPriorityQueue remove expects a callback');
	    }

	    const removed = [];
	    const dequeued = [];
	    while (!this.isEmpty()) {
	      const popped = this.pop();
	      if (cb(popped)) {
	        removed.push(popped);
	      } else {
	        dequeued.push(popped);
	      }
	    }

	    dequeued.forEach((val) => this.push(val));
	    return removed;
	  }

	  /**
	   * Returns the number of elements in the queue
	   * @public
	   * @returns {number}
	   */
	  size() {
	    return this._heap.size();
	  }

	  /**
	   * Checks if the queue is empty
	   * @public
	   * @returns {boolean}
	   */
	  isEmpty() {
	    return this._heap.isEmpty();
	  }

	  /**
	   * Clears the queue
	   * @public
	   */
	  clear() {
	    this._heap.clear();
	  }

	  /**
	   * Returns a sorted list of elements from highest to lowest priority
	   * @public
	   * @returns {array}
	   */
	  toArray() {
	    return this._heap.clone().sort().reverse();
	  }

	  /**
	   * Implements an iterable on the min priority queue
	   * @public
	   */
	  [Symbol.iterator]() {
	    let size = this.size();
	    return {
	      next: () => {
	        size -= 1;
	        return {
	          value: this.pop(),
	          done: size === -1
	        };
	      }
	    };
	  }

	  /**
	   * Creates a priority queue from an existing array
	   * @public
	   * @static
	   * @returns {MaxPriorityQueue}
	   */
	  static fromArray(values, getCompareValue) {
	    const heap = new Heap(getMaxCompare(getCompareValue), values);
	    return new MaxPriorityQueue(
	      getCompareValue,
	      new MaxHeap(getCompareValue, heap).fix()
	    );
	  }
	}

	maxPriorityQueue.MaxPriorityQueue = MaxPriorityQueue;
	return maxPriorityQueue;
}

var priorityQueue$1 = {};

/**
 * @copyright 2020 Eyas Ranjous <eyas.ranjous@gmail.com>
 * @license MIT
 */

var hasRequiredPriorityQueue$1;

function requirePriorityQueue$1 () {
	if (hasRequiredPriorityQueue$1) return priorityQueue$1;
	hasRequiredPriorityQueue$1 = 1;
	const { Heap } = requireHeap();

	/**
	 * @class PriorityQueue
	 */
	class PriorityQueue {
	  /**
	   * Creates a priority queue
	   * @params {function} compare
	   */
	  constructor(compare, _values) {
	    if (typeof compare !== 'function') {
	      throw new Error('PriorityQueue constructor expects a compare function');
	    }
	    this._heap = new Heap(compare, _values);
	    if (_values) {
	      this._heap.fix();
	    }
	  }

	  /**
	   * Returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  front() {
	    return this._heap.root();
	  }

	  /**
	   * Returns an element with lowest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  back() {
	    return this._heap.leaf();
	  }

	  /**
	   * Adds a value to the queue
	   * @public
	   * @param {number|string|object} value
	   * @returns {PriorityQueue}
	   */
	  enqueue(value) {
	    return this._heap.insert(value);
	  }

	  /**
	   * Adds a value to the queue
	   * @public
	   * @param {number|string|object} value
	   * @returns {PriorityQueue}
	   */
	  push(value) {
	    return this.enqueue(value);
	  }

	  /**
	   * Removes and returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  dequeue() {
	    return this._heap.extractRoot();
	  }

	  /**
	   * Removes and returns an element with highest priority in the queue
	   * @public
	   * @returns {number|string|object}
	   */
	  pop() {
	    return this.dequeue();
	  }

	  /**
	   * Removes all elements that match a criteria in the callback
	   * @public
	   * @param {function} cb
	   * @returns {array}
	   */
	  remove(cb) {
	    if (typeof cb !== 'function') {
	      throw new Error('PriorityQueue remove expects a callback');
	    }

	    const removed = [];
	    const dequeued = [];
	    while (!this.isEmpty()) {
	      const popped = this.pop();
	      if (cb(popped)) {
	        removed.push(popped);
	      } else {
	        dequeued.push(popped);
	      }
	    }

	    dequeued.forEach((val) => this.push(val));
	    return removed;
	  }

	  /**
	   * Returns the number of elements in the queue
	   * @public
	   * @returns {number}
	   */
	  size() {
	    return this._heap.size();
	  }

	  /**
	   * Checks if the queue is empty
	   * @public
	   * @returns {boolean}
	   */
	  isEmpty() {
	    return this._heap.isEmpty();
	  }

	  /**
	   * Clears the queue
	   * @public
	   */
	  clear() {
	    this._heap.clear();
	  }

	  /**
	   * Returns a sorted list of elements from highest to lowest priority
	   * @public
	   * @returns {array}
	   */
	  toArray() {
	    return this._heap.clone().sort().reverse();
	  }

	  /**
	   * Implements an iterable on the priority queue
	   * @public
	   */
	  [Symbol.iterator]() {
	    let size = this.size();
	    return {
	      next: () => {
	        size -= 1;
	        return {
	          value: this.pop(),
	          done: size === -1
	        };
	      }
	    };
	  }

	  /**
	   * Creates a priority queue from an existing array
	   * @public
	   * @static
	   * @returns {PriorityQueue}
	   */
	  static fromArray(values, compare) {
	    return new PriorityQueue(compare, values);
	  }
	}

	priorityQueue$1.PriorityQueue = PriorityQueue;
	return priorityQueue$1;
}

var priorityQueue;
var hasRequiredPriorityQueue;

function requirePriorityQueue () {
	if (hasRequiredPriorityQueue) return priorityQueue;
	hasRequiredPriorityQueue = 1;
	const { MinPriorityQueue } = requireMinPriorityQueue();
	const { MaxPriorityQueue } = requireMaxPriorityQueue();
	const { PriorityQueue } = requirePriorityQueue$1();

	priorityQueue = { MinPriorityQueue, MaxPriorityQueue, PriorityQueue };
	return priorityQueue;
}

var priorityQueueExports = requirePriorityQueue();

class PrioritisedScoutTarget {
    constructor(priority, target, permanent = false) {
        this.priority = priority;
        this.target = target;
        this.permanent = permanent;
    }
    toString() {
        const vector2 = this.target;
        return `${vector2?.x},${vector2?.y}`;
    }
}
const ENEMY_SPAWN_POINT_PRIORITY = 900;
// Distance around the starting area (in tiles) to scout first.
const NEARBY_SECTOR_STARTING_RADIUS = 16;
const NEARBY_SECTOR_BASE_PRIORITY = 900;
// Amount of ticks per 'radius' to expand for scouting.
const SCOUTING_RADIUS_EXPANSION_TICKS = 120;
// Don't actually queue the scouting until the radius increased by this much
const MIN_SCOUT_RADIUS_INCREASE = 16;
// Don't queue scouting for sectors with enough visibility.
const SCOUTING_MAX_VISIBILITY_RATIO = 0.8;
class ScoutingManager {
    constructor(logger) {
        this.logger = logger;
        this.queuedRadius = NEARBY_SECTOR_STARTING_RADIUS;
        // Order by descending priority.
        this.scoutingQueue = new priorityQueueExports.PriorityQueue((a, b) => b.priority - a.priority);
    }
    addRadiusToScout(gameApi, centerPoint, sectorCache, radius, startingPriority) {
        const { x: startX, y: startY } = centerPoint;
        sectorCache.forEachInRadius(startX, startY, radius, (x, y, sector, distance) => {
            if (!sector) {
                return;
            }
            // Make it scout closer sectors first.
            if (gameApi.mapApi.getTile(x, y)) {
                // Sector with high visility ratios are deprioritised.
                const ratio = sector.value.sectorVisibilityRatio ?? 0;
                // Do not scout sectors that are visible enough.
                if (ratio >= SCOUTING_MAX_VISIBILITY_RATIO) {
                    return;
                }
                // Sectors closer to the starting sector are prioritised.
                const priority = (startingPriority - distance) * (1 - ratio);
                if (priority > 0) {
                    this.scoutingQueue.enqueue(new PrioritisedScoutTarget(priority, new V(x, y)));
                }
            }
        });
    }
    onGameStart(gameApi, playerData, sectorCache) {
        // Queue hostile starting locations with high priority and as permanent scouting candidates.
        gameApi.mapApi
            .getStartingLocations()
            .filter((startingLocation) => {
            if (startingLocation == playerData.startLocation) {
                return false;
            }
            let tile = gameApi.mapApi.getTile(startingLocation.x, startingLocation.y);
            return tile ? !gameApi.mapApi.isVisibleTile(tile, playerData.name) : false;
        })
            .map((tile) => new PrioritisedScoutTarget(ENEMY_SPAWN_POINT_PRIORITY, tile, true))
            .forEach((target) => {
            this.logger(`Adding ${target} to initial scouting queue`);
            this.scoutingQueue.enqueue(target);
        });
        // Queue sectors near the spawn point.
        this.addRadiusToScout(gameApi, playerData.startLocation, sectorCache, NEARBY_SECTOR_STARTING_RADIUS, NEARBY_SECTOR_BASE_PRIORITY);
    }
    onAiUpdate(gameApi, playerData, sectorCache) {
        const currentHead = this.scoutingQueue.front();
        if (!currentHead) {
            return;
        }
        const headTarget = currentHead.target;
        if (!headTarget) {
            this.scoutingQueue.dequeue();
            return;
        }
        const { x, y } = headTarget;
        const tile = gameApi.mapApi.getTile(x, y);
        if (tile && gameApi.mapApi.isVisibleTile(tile, playerData.name)) {
            this.logger(`head point is visible, dequeueing`);
            this.scoutingQueue.dequeue();
        }
        const requiredRadius = Math.floor(gameApi.getCurrentTick() / SCOUTING_RADIUS_EXPANSION_TICKS);
        if (requiredRadius > this.queuedRadius + MIN_SCOUT_RADIUS_INCREASE) {
            this.logger(`expanding scouting radius from ${this.queuedRadius} to ${requiredRadius}`);
            this.addRadiusToScout(gameApi, playerData.startLocation, sectorCache, requiredRadius, NEARBY_SECTOR_BASE_PRIORITY);
            this.queuedRadius = requiredRadius;
        }
    }
    getNewScoutTarget() {
        return this.scoutingQueue.dequeue();
    }
    hasScoutTargets() {
        return !this.scoutingQueue.isEmpty();
    }
}

function calculateSectorThreat(startX, startY, sectorSize, gameApi, playerData) {
    const unitsInArea = gameApi.getUnitsInArea(new B(new V(startX, startY), new V(startX + sectorSize, startY + sectorSize)));
    let threat = 0;
    for (const unitId of unitsInArea) {
        const unit = gameApi.getGameObjectData(unitId);
        if (!unit || !unit.owner) {
            continue;
        }
        if (unit.owner === playerData.name) {
            threat -= unit.maxHitPoints ?? 1;
            continue;
        }
        if (gameApi.areAlliedPlayers(playerData.name, unit.owner)) {
            continue;
        }
        const owner = gameApi.getPlayerData(unit.owner);
        if (!owner.isCombatant) {
            continue;
        }
        threat += unit.maxHitPoints ?? 1;
    }
    return threat;
}
function calculateDiffuseSectorThreat(sector, neighbours) {
    // the objective is for a cell's threat to slowly spread (diffuse) into its neighbouring cells.
    const connectedSectorIds = new Set(sector.connectedSectorIds);
    const totalNeighbourThreat = (sector.threatLevel ?? 0) + neighbours.reduce((acc, cV) => acc + (cV.sector.threatLevel ?? 0), 0);
    // Based on the max of the closest _connected_ sectors
    const maxOfNeighboursThreat = neighbours
        .filter((n) => connectedSectorIds.has(n.sector.id))
        .reduce((pV, cV) => Math.max(pV, (cV.sector.diffuseThreatLevel ?? 0) * cV.dist), 0);
    return Math.max(totalNeighbourThreat, maxOfNeighboursThreat * 0.95);
}
function calculateMoney(startX, startY, size, mapApi) {
    return mapApi
        .getTilesInRect({ x: startX, y: startY, width: size, height: size })
        .map((t) => mapApi.getTileResourceData(t)).map((t) => t ? t.gems + t.ore : 0)
        .reduce((pV, cV) => pV + cV, 0);
}

const FLAT_RAMP_TYPE = 0;
/**
 * Return true if the given tile could be built on (not including other things being there already). This is purely based on static map information.
 */
function tileIsBuildable(tile) {
    return (tile.rampType === FLAT_RAMP_TYPE &&
        (tile.terrainType === T.Clear ||
            tile.terrainType === T.Pavement ||
            tile.terrainType === T.Default ||
            tile.terrainType === T.Shore ||
            tile.terrainType === T.Rock1 ||
            tile.terrainType === T.Rock2 ||
            tile.terrainType === T.Rough ||
            tile.terrainType === T.Railroad ||
            tile.terrainType === T.Dirt));
}
/**
 * As above, but consider if there is something on the tile.
 * @param tile
 */
function tileIsOccupied(tile, gameApi) {
    if (tile.landType === L.Tiberium) {
        return true;
    }
    // Proxy for "can I build something or is there something there"
    return !gameApi.map.isPassableTile(tile, e.Track, false, false);
}
function canBuildOnTile(tile, gameApi) {
    return tileIsBuildable(tile) && !tileIsOccupied(tile, gameApi);
}
/**
 * Computes a rect 'centered' around a structure of a certain size with an additional radius (`adjacent`).
 * The radius is optionally expanded by the size of the new building.
 *
 * This is essentially the candidate placement around a given structure.
 *
 * @param point Top-left location of the inner rect.
 * @param t Size of the inner rect.
 * @param adjacent Amount to expand the building's inner rect by (so buildings must be adjacent by this many tiles)
 * @param newBuildingSize? Size of the new building
 * @returns
 */
function computeAdjacentRect(point, t, adjacent, newBuildingSize) {
    return {
        x: point.x - adjacent - (newBuildingSize?.width || 0),
        y: point.y - adjacent - (newBuildingSize?.height || 0),
        width: t.width + 2 * adjacent + (newBuildingSize?.width || 0),
        height: t.height + 2 * adjacent + (newBuildingSize?.height || 0),
    };
}
function getAdjacentTiles(game, range, onWater) {
    // use the bulk API to get all tiles from the baseTile to the (baseTile + range)
    const adjacentTiles = game.mapApi
        .getTilesInRect(range)
        .filter((tile) => !onWater || tile.landType === L.Water);
    return adjacentTiles;
}

// distance transform to find flat, buildable areas.
// ref: https://github.com/Supalosa/supabot/blob/1ce77f3c3e210da738bf231bc6a94aa8bdf68cef/supabot-core/src/main/java/com/supalosa/bot/analysis/Analysis.java#L252
class BuildSpaceCache {
    constructor(mapSize, gameApi, diagonalMapBounds) {
        this.scanStrategy = new StagedScanStrategy([
            // The DT algorithm runs in 3 passes. The last pass needs to run in reverse.
            new SequentialScanStrategy(1, diagonalMapBounds),
            new SequentialScanStrategy(1, diagonalMapBounds),
            new SequentialScanStrategy(1, diagonalMapBounds).setReverse(),
        ]).setRepeating();
        this.distanceTransformCache = new BasicIncrementalGridCache(mapSize.width, mapSize.height, () => ({
            rawValue: Number.MAX_VALUE,
            liveValue: Number.MAX_VALUE,
        }), (x, y, currentValue, stageIndex) => {
            const passIndex = stageIndex % 3;
            if (passIndex === 0) {
                // First DT pass: set unbuildable tiles as distance 0
                const tile = gameApi.mapApi.getTile(x, y);
                if (!tile) {
                    return {
                        rawValue: 0,
                        liveValue: 0,
                    };
                }
                const initialValue = !canBuildOnTile(tile, gameApi) ? 0 : currentValue.rawValue;
                return {
                    rawValue: initialValue,
                    liveValue: initialValue,
                };
            }
            if (passIndex === 1) {
                // Second DT pass: all cells (except edges) update from top left
                if (x === 0 || y === 0) {
                    return currentValue;
                }
                const left = this.distanceTransformCache.getCell(x - 1, y);
                const top = this.distanceTransformCache.getCell(x, y - 1);
                const nextValue = Math.min(currentValue.rawValue, Math.min(left.value.rawValue + 1, top.value.rawValue + 1));
                return {
                    rawValue: nextValue,
                    // not necessary to set, but liveValue is the value visualised during debug
                    liveValue: nextValue,
                };
            }
            // Last DT pass: all cells update from bottom right
            if (x === mapSize.width - 1 || y === mapSize.height - 1) {
                return currentValue;
            }
            const right = this.distanceTransformCache.getCell(x + 1, y);
            const bottom = this.distanceTransformCache.getCell(x, y + 1);
            const rawValue = Math.min(currentValue.rawValue, Math.min(right.value.rawValue + 1, bottom.value.rawValue + 1));
            return {
                rawValue,
                // not necessary to set, but liveValue is the value visualised during debug
                liveValue: rawValue,
            };
        }, this.scanStrategy, (v) => toHeatmapColor(Math.min(15, v.liveValue ?? v.rawValue), 0, 15));
    }
    update(gameTick) {
        this.distanceTransformCache.updateCells(this.isFinished() ? 128 : 256, gameTick);
    }
    // visible for debugging
    get _cache() {
        return this.distanceTransformCache;
    }
    isFinished() {
        return this.scanStrategy.isFinished();
    }
    findSpace(tiles) {
        if (!this.isFinished()) {
            return [];
        }
        const candidates = [];
        this.distanceTransformCache.forEach((x, y, cell) => {
            if (cell.lastUpdatedTick === null) {
                return;
            }
            // we know it has a value if the scan is 'finished'
            const liveValue = cell.value.liveValue;
            if (liveValue >= tiles) {
                // if there's a candidate within `tiles` distance, use the higher of the two
                const vec = new V(x, y);
                const otherCandidateIdx = candidates.findIndex((c) => c.pos.distanceTo(vec) < tiles);
                if (otherCandidateIdx >= 0) {
                    if (candidates[otherCandidateIdx].value < liveValue) {
                        candidates[otherCandidateIdx] = { pos: vec, value: liveValue };
                    }
                }
                else {
                    candidates.push({ pos: vec, value: liveValue });
                }
            }
        });
        return candidates.map(({ pos }) => pos);
    }
}

const LITE_PROFILE = {
    name: "lite",
    displayName: "标准",
    attackCooldownTicks: 120,
    baseAttackCooldownTicks: 1800,
    attackCashGate: 500,
    maxConcurrentPreparingAttacks: 1,
    hysteresisEnter: 1.25,
    hysteresisExit: 0.75,
    maxHarvestersTotal: 12,
    idealHarvestersPerRefinery: 2,
    refineryHardLimit: 6,
    expansionMinMoney: 4000,
    expansionDelayTicks: 15 * 60 * 6,
    defenceCheckTicks: 30,
    defenceStartingRadius: 6,
    defenceInitialPriority: 10,
    openingBook: true,
    harvesterDefence: true,
    focusFire: false,
    retreatMicro: false,
    persistentScouting: false,
    harassment: false,
    apm: 300,
};
const STANDARD_PROFILE = {
    name: "standard",
    displayName: "困难",
    // [tuned r3] isolation tests on mp06t2: focusFire was catastrophic (2W/17L - units dive
    // after wounded targets), retreatMicro slightly negative (7W/9L), defence buffs mildly
    // positive (8W/7L). Standard = Lite + defence buffs ONLY.
    attackCooldownTicks: 120,
    baseAttackCooldownTicks: 1800,
    attackCashGate: 500,
    maxConcurrentPreparingAttacks: 1,
    hysteresisEnter: 1.25,
    hysteresisExit: 0.75,
    maxHarvestersTotal: 12,
    idealHarvestersPerRefinery: 2,
    refineryHardLimit: 6,
    expansionMinMoney: 4000,
    expansionDelayTicks: 15 * 60 * 6,
    defenceCheckTicks: 10,
    defenceStartingRadius: 10,
    defenceInitialPriority: 30,
    openingBook: true,
    harvesterDefence: true,
    focusFire: false,
    retreatMicro: false,
    persistentScouting: false,
    harassment: false,
    apm: 300,
};
const MAX_PROFILE = {
    name: "max",
    displayName: "噩梦",
    // [tuned r3] Standard + harassment (cash-gated so it can't steal tank production) +
    // persistent scouting + higher APM budget.
    attackCooldownTicks: 120,
    baseAttackCooldownTicks: 1800,
    attackCashGate: 500,
    // [tuned r4] 2-wave preparing tested 17W/13L (57%) vs 1-wave Max — modest but real gain.
    maxConcurrentPreparingAttacks: 2,
    hysteresisEnter: 1.25,
    hysteresisExit: 0.75,
    maxHarvestersTotal: 12,
    idealHarvestersPerRefinery: 2,
    refineryHardLimit: 6,
    expansionMinMoney: 4000,
    expansionDelayTicks: 15 * 60 * 6,
    defenceCheckTicks: 10,
    defenceStartingRadius: 10,
    defenceInitialPriority: 30,
    openingBook: true,
    harvesterDefence: true,
    focusFire: false,
    retreatMicro: false,
    persistentScouting: true,
    harassment: true,
    apm: 300, // [tuned r10] 450 tested 55% vs baseline (Lite=75%); 300 is the sweet spot
};
const PROFILES = {
    lite: LITE_PROFILE,
    standard: STANDARD_PROFILE,
    max: MAX_PROFILE,
};
function getProfileByName(name) {
    if (name in PROFILES) {
        return PROFILES[name];
    }
    return STANDARD_PROFILE;
}
function getBundleProfile() {
    const injected = "standard" ;
    return getProfileByName(injected);
}

const SECTORS_TO_UPDATE_PER_CYCLE = 12;
const RALLY_POINT_UPDATE_INTERVAL_TICKS = 90;
const THREAT_UPDATE_INTERVAL_TICKS = 30;
const EXPANSION_UPDATE_INTERVAL_TICKS = 240;
// [enhanced] expansion money threshold moved to DifficultyProfile.expansionMinMoney
const EXPANSION_MIN_DISTANCE_TO_BUILDABLE = 20;
const EXPANSION_MIN_CLEAR_SPACE_TILES = 9; // minimum "clear space" required to expand somewhere (should be large enough to fit conyard and refinery)
const rebuildQuadtree = (quadtree, units) => {
    quadtree.clear();
    units.forEach((unit) => {
        quadtree.insert(new Circle({ x: unit.tile.rx, y: unit.tile.ry, r: 1, data: unit.id }));
    });
};
class MatchAwarenessImpl {
    constructor(gameApi, playerData, threatCache, mainRallyPoint, logger, profile = STANDARD_PROFILE) {
        this.threatCache = threatCache;
        this.mainRallyPoint = mainRallyPoint;
        this.logger = logger;
        this.profile = profile;
        this._shouldAttack = false;
        this.expansionCandidates = [];
        const mapSize = gameApi.mapApi.getRealMapSize();
        const diagonalBounds = getDiagonalMapBounds(gameApi.mapApi);
        this.hostileQuadTree = new Quadtree(mapSize);
        this.scoutingManager = new ScoutingManager(logger);
        this.sectorCache = new SectorCache(mapSize, diagonalBounds, (x, y) => ({
            id: getSectorId(x, y),
            sectorVisibilityRatio: null,
            threatLevel: null,
            diffuseThreatLevel: null,
            totalMoney: null,
            connectedSectorsDirty: true,
            connectedSectorIds: [],
        }), (startX, startY, size, currentValue, neighbours) => {
            const sp = new V(startX, startY);
            const ep = new V(sp.x + size, sp.y + size);
            const visibility = calculateAreaVisibility(gameApi.mapApi, playerData, sp, ep);
            const threatLevel = calculateSectorThreat(startX, startY, size, gameApi, playerData);
            const diffuseThreatLevel = calculateDiffuseSectorThreat(currentValue, neighbours);
            const totalMoney = calculateMoney(startX, startY, size, gameApi.mapApi);
            const connectedSectorIds = currentValue.connectedSectorsDirty ? calculateConnectedSectorIds(gameApi.mapApi, startX, startY, neighbours) : currentValue.connectedSectorIds;
            return {
                ...currentValue,
                sectorVisibilityRatio: visibility.validTiles > 0 ?
                    visibility.visibleTiles / visibility.validTiles :
                    null,
                threatLevel,
                diffuseThreatLevel,
                totalMoney,
                connectedSectorsDirty: false,
                connectedSectorIds
            };
        });
        this.buildSpaceCache = new BuildSpaceCache(mapSize, gameApi, diagonalBounds);
    }
    getHostilesNearPoint2d(point, radius) {
        return this.getHostilesNearPoint(point.x, point.y, radius);
    }
    getHostilesNearPoint(searchX, searchY, radius) {
        const intersections = this.hostileQuadTree.retrieve(new Circle({ x: searchX, y: searchY, r: radius }));
        return intersections
            .map(({ x, y, data: unitId }) => ({ x, y, unitId: unitId }))
            .filter(({ x, y }) => new V(x, y).distanceTo(new V(searchX, searchY)) <= radius)
            .filter(({ unitId }) => !!unitId);
    }
    getThreatCache() {
        return this.threatCache;
    }
    getSectorCache() {
        return this.sectorCache;
    }
    getMainRallyPoint() {
        return this.mainRallyPoint;
    }
    getScoutingManager() {
        return this.scoutingManager;
    }
    getNextExpansionCandidates() {
        return this.expansionCandidates;
    }
    getBuildSpaceCache() {
        return this.buildSpaceCache;
    }
    shouldAttack() {
        return this._shouldAttack;
    }
    checkShouldAttack(threatCache, threatFactor) {
        let scaledGroundPower = threatCache.totalAvailableAntiGroundFirepower * 1.1;
        let scaledGroundThreat = (threatFactor * threatCache.totalOffensiveLandThreat + threatCache.totalDefensiveThreat) * 1.1;
        let scaledAirPower = threatCache.totalAvailableAirPower * 1.1;
        let scaledAirThreat = (threatFactor * threatCache.totalOffensiveAntiAirThreat + threatCache.totalDefensiveThreat) * 1.1;
        return scaledGroundPower > scaledGroundThreat || scaledAirPower > scaledAirThreat;
    }
    onGameStart(gameApi, playerData) {
        this.scoutingManager.onGameStart(gameApi, playerData, this.sectorCache);
    }
    onAiUpdate({ game, player }) {
        const sectorCache = this.sectorCache;
        const playerData = player.getPlayerData();
        sectorCache.updateSectors(game.getCurrentTick(), SECTORS_TO_UPDATE_PER_CYCLE);
        this.buildSpaceCache.update(game.getCurrentTick());
        this.scoutingManager.onAiUpdate(game, playerData, sectorCache);
        let updateRatio = sectorCache?.getSectorUpdateRatio(game.getCurrentTick() - game.getTickRate() * 60);
        if (updateRatio && updateRatio < 1.0) {
            this.logger(`${updateRatio * 100.0}% of sectors updated in last 60 seconds.`);
        }
        // Build the quadtree, if this is too slow we should consider doing this periodically.
        const hostileUnitIds = game.getVisibleUnits(playerData.name, "enemy");
        try {
            const hostileUnits = hostileUnitIds
                .map((id) => game.getGameObjectData(id))
                .filter((gameObjectData) => gameObjectData !== undefined);
            rebuildQuadtree(this.hostileQuadTree, hostileUnits);
        }
        catch (err) {
            // Hack. Will be fixed soon.
            console.error(`caught error`, hostileUnitIds);
        }
        if (game.getCurrentTick() % THREAT_UPDATE_INTERVAL_TICKS == 0) {
            let visibility = sectorCache?.getOverallVisibility();
            if (visibility) {
                this.logger(`${Math.round(visibility * 1000.0) / 10}% of tiles visible. Calculating threat.`);
                // Update the global threat cache
                this.threatCache = calculateGlobalThreat(game, playerData, visibility);
                // As the game approaches 2 hours, be more willing to attack. (15 ticks per second)
                const gameLengthFactor = Math.max(0, 1.0 - game.getCurrentTick() / (15 * 7200.0));
                this.logger(`Game length multiplier: ${gameLengthFactor}`);
                if (!this._shouldAttack) {
                    // If not attacking, make it harder to switch to attack mode by multiplying the opponent's threat.
                    // [enhanced] thresholds from difficulty profile (1.05 for standard/max, 1.25 for lite)
                    this._shouldAttack = this.checkShouldAttack(this.threatCache, this.profile.hysteresisEnter * gameLengthFactor);
                    if (this._shouldAttack) {
                        this.logger(`Globally switched to attack mode.`);
                    }
                }
                else {
                    // If currently attacking, make it harder to switch to defence mode my dampening the opponent's threat.
                    // [enhanced] thresholds from difficulty profile (0.6 for standard/max, 0.75 for lite)
                    this._shouldAttack = this.checkShouldAttack(this.threatCache, this.profile.hysteresisExit * gameLengthFactor);
                    if (!this._shouldAttack) {
                        this.logger(`Globally switched to defence mode.`);
                    }
                }
            }
        }
        // Update rally point every few ticks.
        if (game.getCurrentTick() % RALLY_POINT_UPDATE_INTERVAL_TICKS === 0) {
            const enemyPlayers = game
                .getPlayers()
                .filter((p) => p !== playerData.name && !game.areAlliedPlayers(playerData.name, p));
            const enemy = game.getPlayerData(enemyPlayers[0]);
            this.mainRallyPoint = getPointTowardsOtherPoint(game, playerData.startLocation, enemy.startLocation, 10, 10, 0);
        }
        // Decide to expand or not
        if (this.buildSpaceCache.isFinished() && game.getCurrentTick() % EXPANSION_UPDATE_INTERVAL_TICKS === 0) {
            // don't expand somewhere near where we can already build
            const ownBuildingVectors = game
                .getVisibleUnits(playerData.name, "self", (r) => r.baseNormal)
                .map((id) => game.getGameObjectData(id)).filter((o) => !!o)
                .map((r) => new V(r.tile.rx, r.tile.ry));
            const rawCandidates = this.buildSpaceCache.findSpace(EXPANSION_MIN_CLEAR_SPACE_TILES);
            this.expansionCandidates = rawCandidates.filter((candidate) => {
                const cell = this.sectorCache.getCell(candidate.x, candidate.y);
                if (!cell) {
                    return false;
                }
                if (cell.value.totalMoney && cell.value.totalMoney < this.profile.expansionMinMoney) {
                    return false;
                }
                if (ownBuildingVectors.some((ref) => ref.distanceTo(candidate) < EXPANSION_MIN_DISTANCE_TO_BUILDABLE)) {
                    return false;
                }
                if (ownBuildingVectors.some((ref) => ref.distanceTo(candidate) < EXPANSION_MIN_DISTANCE_TO_BUILDABLE)) {
                    return false;
                }
                const tile = game.map.getTile(candidate.x, candidate.y);
                if (!tile) {
                    return false;
                }
                return true;
            });
        }
    }
    getGlobalDebugText() {
        if (!this.threatCache) {
            return undefined;
        }
        return (`Threat LAND: Them ${Math.round(this.threatCache.totalOffensiveLandThreat)}, us: ${Math.round(this.threatCache.totalAvailableAntiGroundFirepower)}.\n` +
            `Threat DEFENSIVE: Them ${Math.round(this.threatCache.totalDefensiveThreat)}, us: ${Math.round(this.threatCache.totalDefensivePower)}.\n` +
            `Threat AIR: Them ${Math.round(this.threatCache.totalOffensiveAirThreat)}, us: ${Math.round(this.threatCache.totalAvailableAntiAirFirepower)}.`);
    }
}

const ORDER_COOLDOWN_TICKS = 60;
// [enhanced] MCV detection is rule-driven (general rules' baseUnit list), not hardcoded
// unit names — mods (e.g. 共和国之辉's China faction) use different MCV unit names.
const isMcv = (game, name) => game.getGeneralRules().baseUnit.includes(name);
const CONYARD_SCAN_DISTANCE = 15; // distance to check a conyard is already in place
const CONYARD_DEPLOY_SCAN_DISTANCE = 10; // distance to check for a deployable location
const CONYARD_DEPLOY_DISTANCE = 5;
/**
 * A mission that tries to create an MCV (if it doesn't exist) and deploy it somewhere it can be deployed.
 */
class ExpansionMission extends Mission {
    constructor(uniqueName, priority, selectedMcvId, candidates, logger) {
        super(uniqueName, logger);
        this.priority = priority;
        this.selectedMcvId = selectedMcvId;
        this.candidates = candidates;
        this.destination = null;
        this.lastOrderAt = null;
        this.lastOrderDeploy = false;
        if (candidates.length === 1) {
            this.destination = candidates[0];
        }
        else if (candidates.length === 0) {
            throw new Error("ExpansionMission requires at least one candidate location");
        }
    }
    _onAiUpdate(context) {
        const { game, matchAwareness, actionBatcher } = context;
        const actionsApi = context.player.actions;
        const playerData = context.game.getPlayerData(context.player.name);
        const mcvs = this.getUnitsMatchingByRule(game, (r) => isMcv(game, r.name))
            .map((id) => game.getUnitData(id))
            .filter((u) => !!u);
        if (mcvs.length === 0) {
            // Perhaps we deployed already (or the unit was destroyed), end the mission.
            if (this.lastOrderAt !== null) {
                return disbandMission();
            }
            // We need an mcv!
            if (this.selectedMcvId && !!game.getUnitData(this.selectedMcvId)) {
                return requestSpecificUnits([this.selectedMcvId], this.priority);
            }
            return requestUnitsWithSamePriority(game.getGeneralRules().baseUnit, this.priority);
        }
        // use the highest-hp MCV
        const selectedMcvUnit = maxBy(mcvs, (mcv) => mcv.hitPoints);
        this.selectedMcvId = selectedMcvUnit?.id ?? null;
        if (this.destination) {
            return this.moveMcvToDestination(game, actionsApi, playerData, matchAwareness, actionBatcher, selectedMcvUnit);
        }
        else {
            const reachabilityMap = game.map.getReachabilityMap(selectedMcvUnit.rules.speedType, false);
            const reachableCandidates = this.candidates
                .map((candidate) => game.mapApi.getTile(candidate.x, candidate.y))
                .filter((t) => !!t)
                .filter((t) => reachabilityMap.isReachable(toPathNode(selectedMcvUnit.tile, false), toPathNode(t, false)));
            const closestReachableCandidate = minBy(reachableCandidates, (candidate) => {
                return toVector2(selectedMcvUnit.tile).distanceTo(toVector2(candidate));
            });
            if (!closestReachableCandidate) {
                // can't reach any candidates yet, return to start location
                this.destination = playerData.startLocation;
            }
            else {
                this.destination = toVector2(closestReachableCandidate);
            }
            return noop();
        }
    }
    moveMcvToDestination(gameApi, actionsApi, playerData, matchAwareness, actionBatcher, mcv) {
        if (!this.destination) {
            return noop();
        }
        // if there's a conyard near the destination, we're done.
        const conYards = gameApi
            .getUnitsInArea(new B(this.destination.clone().subScalar(CONYARD_SCAN_DISTANCE), this.destination.clone().addScalar(CONYARD_SCAN_DISTANCE)))
            .map((id) => getCachedTechnoRules(gameApi, id))
            .filter((r) => r?.constructionYard);
        if (conYards.length > 0) {
            return disbandMission();
        }
        const isClose = toVector2(mcv.tile).distanceTo(this.destination) <= CONYARD_DEPLOY_DISTANCE;
        const canOrder = !this.lastOrderAt || gameApi.getCurrentTick() > this.lastOrderAt + ORDER_COOLDOWN_TICKS;
        if (!canOrder) {
            return noop();
        }
        if (isClose) {
            if (!this.lastOrderDeploy) {
                actionsApi.orderUnits([mcv.id], O.DeploySelected);
                this.lastOrderDeploy = true;
            }
            else {
                // find a 4x4 area near the mcv that is clear
                const deployableLocations = findDeployableLocations(playerData.name, gameApi, {
                    x: mcv.tile.rx - CONYARD_DEPLOY_SCAN_DISTANCE,
                    y: mcv.tile.ry - CONYARD_DEPLOY_SCAN_DISTANCE,
                    width: CONYARD_DEPLOY_SCAN_DISTANCE * 2,
                    height: CONYARD_DEPLOY_SCAN_DISTANCE * 2,
                }, mcv.rules.deploysInto);
                const bestLocation = minBy(deployableLocations, (d) => toVector2(mcv.tile).distanceToSquared(d));
                if (bestLocation) {
                    actionsApi.orderUnits([mcv.id], O.Move, bestLocation.x, bestLocation.y);
                }
                else {
                    actionsApi.orderUnits([mcv.id], O.Scatter);
                }
                this.lastOrderDeploy = false;
            }
            this.lastOrderAt = gameApi.getCurrentTick();
        }
        else if (!isClose) {
            // find a 4x4 area near the destination that is clear.
            const rx = this.destination.x;
            const ry = this.destination.y;
            actionsApi.orderUnits([mcv.id], O.Move, rx, ry);
            this.lastOrderAt = gameApi.getCurrentTick();
        }
        return noop();
    }
    getGlobalDebugText() {
        return `Expand with MCV ${this.selectedMcvId}`;
    }
    getPriority() {
        return this.priority;
    }
}
function findDeployableLocations(playerName, gameApi, rectangle, rules) {
    const tiles = gameApi.map.getTilesInRect(rectangle);
    const { foundation, foundationCenter } = gameApi.getBuildingPlacementData(rules);
    if (foundation.width !== foundation.height) {
        throw new Error("only implemented for square foundations");
    }
    const grid = new Array(rectangle.width).fill(() => 0).map(() => new Array(rectangle.height).fill(0));
    // fill tiles that are not buildable
    for (const tile of tiles) {
        const gridX = tile.rx - rectangle.x;
        const gridY = tile.ry - rectangle.y;
        if (canBuildOnTile(tile, gameApi)) {
            grid[gridX][gridY] = 1;
        }
    }
    // we have to start from the bottom-right and calculate backwards
    for (let x = rectangle.width - 2; x >= 0; --x) {
        for (let y = rectangle.height - 2; y >= 0; --y) {
            if (grid[x][y] === 0) {
                continue;
            }
            const right = x < rectangle.width - 1 ? grid[x + 1][y] : 0;
            const bottom = y < rectangle.height - 1 ? grid[y][y + 1] : 0;
            grid[x][y] = Math.min(right + 1, bottom + 1);
        }
    }
    const locations = [];
    for (const tile of tiles) {
        const gridX = tile.rx - rectangle.x;
        const gridY = tile.ry - rectangle.y;
        if (grid[gridX][gridY] >= foundation.width && grid[gridX][gridY] >= foundation.height) {
            locations.push(toVector2(tile).add(foundationCenter));
        }
    }
    return locations;
}
class PackConyardMission extends Mission {
    constructor(uniqueName, conyardId, logger) {
        super(uniqueName, logger);
        this.conyardId = conyardId;
    }
    _onAiUpdate(context) {
        const { game } = context;
        const actionsApi = context.player.actions;
        const conyardOrMcv = game.getGameObjectData(this.conyardId);
        if (!conyardOrMcv) {
            // maybe it died, or unpacked already
            return disbandMission();
        }
        actionsApi.orderUnits([this.conyardId], O.Move, conyardOrMcv.tile.rx, conyardOrMcv.tile.ry);
        return noop();
    }
    getGlobalDebugText() {
        return `Pack conyard ${this.conyardId}`;
    }
    getPriority() {
        return 10000;
    }
}
const CONYARD_PACK_COOLDOWN = 15 * 60 * 4; // [enhanced] was 6 mins -> 4 mins
// [enhanced] expansion start delay moved to DifficultyProfile.expansionDelayTicks
class ExpansionMissionFactory {
    constructor(lastConyardPackAt = Number.MIN_VALUE) {
        this.lastConyardPackAt = lastConyardPackAt;
    }
    getName() {
        return "ExpansionMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger) {
        const { game, player, matchAwareness, profile } = context;
        const playerData = game.getPlayerData(player.name);
        const mcvs = game.getVisibleUnits(player.name, "self", (r) => game.getGeneralRules().baseUnit.includes(r.name));
        const expandToCandidates = matchAwareness.getNextExpansionCandidates();
        const expansionDelayTicks = profile.expansionDelayTicks; // [enhanced]
        // This is used for deploying the initial MCV.
        if (game.getCurrentTick() < expansionDelayTicks) {
            mcvs.forEach((mcv) => {
                missionController.addMission(new ExpansionMission("initial-deploy-mcv-" + mcv, 100, mcv, [playerData.startLocation], logger));
            });
        }
        else if (expandToCandidates.length > 0) {
            mcvs.forEach((mcv) => {
                missionController.addMission(new ExpansionMission("expansion-mcv-" + mcv, 100, mcv, expandToCandidates, logger));
            });
        }
        const threatCache = matchAwareness.getThreatCache();
        if (!expandToCandidates[0] || !threatCache) {
            return;
        }
        if (game.getCurrentTick() < expansionDelayTicks ||
            game.getCurrentTick() < this.lastConyardPackAt + CONYARD_PACK_COOLDOWN) {
            return;
        }
        // TODO: do not pack up if currently producing something from the conyard
        // if we have a war factory and at least 1 refinery, try expand
        const conYards = game.getVisibleUnits(player.name, "self", (r) => r.constructionYard);
        const warFactories = game.getVisibleUnits(player.name, "self", (r) => r.weaponsFactory);
        const isSafeToExpand = threatCache.totalAvailableAntiGroundFirepower > threatCache.totalOffensiveLandThreat;
        const refineries = game.getVisibleUnits(player.name, "self", (r) => r.refinery);
        if (conYards.length === 0 || warFactories.length === 0 || refineries.length === 0 || !isSafeToExpand) {
            return;
        }
        const selectedConyard = game.getGameObjectData(conYards[0]);
        const refineryNearconyard = game
            .getUnitsInArea(new B(toVector2(selectedConyard.tile).subScalar(10), toVector2(selectedConyard.tile).addScalar(14)))
            .map((id) => game.getGameObjectData(id))
            .filter(isTechnoRulesObject)
            .filter((obj) => obj.rules.refinery);
        if (refineryNearconyard.length > 0) {
            missionController.addMission(new PackConyardMission("pack-up-" + selectedConyard.id, selectedConyard.id, logger));
            logger("Time to pack the conyard and expand", false);
            this.lastConyardPackAt = game.getCurrentTick();
        }
        else {
            logger("Not time to pack up, no refinery yet");
        }
    }
}

const SCOUT_MOVE_COOLDOWN_TICKS = 30;
// Max units to spend on a particular scout target.
const MAX_ATTEMPTS_PER_TARGET = 5;
// Maximum ticks to spend trying to scout a target *without making progress towards it*.
// Every time a unit gets closer to the target, the timer refreshes.
const MAX_TICKS_PER_TARGET = 600;
/**
 * A mission that tries to scout around the map with a cheap, fast unit (usually attack dogs)
 */
class ScoutingMission extends Mission {
    constructor(uniqueName, priority, logger) {
        super(uniqueName, logger);
        this.priority = priority;
        this.scoutTarget = null;
        this.attemptsOnCurrentTarget = 0;
        this.scoutTargetRefreshedAt = 0;
        this.lastMoveCommandTick = 0;
        this.scoutTargetIsPermanent = false;
        this.hadUnit = false;
    }
    _onAiUpdate(context) {
        const { game, matchAwareness } = context;
        const actionsApi = context.player.actions;
        const playerData = game.getPlayerData(context.player.name);
        // [enhanced] scout = any cheap fast ground unit the faction has (mod-safe, no hardcoded names)
        const scouts = this.getUnitsMatchingByRule(game, (r) => r.isSelectableCombatant && !r.harvester)
            .map((id) => game.getUnitData(id))
            .filter((u) => !!u);
        if ((matchAwareness.getSectorCache().getOverallVisibility() || 0) > 0.9) {
            return disbandMission();
        }
        if (scouts.length === 0) {
            // Count the number of times the scout dies trying to uncover the current scoutTarget.
            if (this.scoutTarget && this.hadUnit) {
                this.attemptsOnCurrentTarget++;
                this.hadUnit = false;
            }
            return requestUnitsWithSamePriority(this.getScoutTypes(context), this.priority);
        }
        else if (this.scoutTarget) {
            this.hadUnit = true;
            if (!this.scoutTargetIsPermanent) {
                if (this.attemptsOnCurrentTarget > MAX_ATTEMPTS_PER_TARGET) {
                    this.logger(`Scout target ${this.scoutTarget.x},${this.scoutTarget.y} took too many attempts, moving to next`);
                    this.setScoutTarget(null, 0);
                    return noop();
                }
                if (game.getCurrentTick() > this.scoutTargetRefreshedAt + MAX_TICKS_PER_TARGET) {
                    this.logger(`Scout target ${this.scoutTarget.x},${this.scoutTarget.y} took too long, moving to next`);
                    this.setScoutTarget(null, 0);
                    return noop();
                }
            }
            const targetTile = game.mapApi.getTile(this.scoutTarget.x, this.scoutTarget.y);
            if (!targetTile) {
                throw new Error(`target tile ${this.scoutTarget.x},${this.scoutTarget.y} does not exist`);
            }
            if (game.getCurrentTick() > this.lastMoveCommandTick + SCOUT_MOVE_COOLDOWN_TICKS) {
                this.lastMoveCommandTick = game.getCurrentTick();
                scouts.forEach((unit) => {
                    if (this.scoutTarget) {
                        actionsApi.orderUnits([unit.id], O.AttackMove, this.scoutTarget.x, this.scoutTarget.y);
                    }
                });
                // Check that a scout is actually moving closer to the target.
                const distances = scouts.map((unit) => getDistanceBetweenTileAndPoint(unit.tile, this.scoutTarget));
                const newMinDistance = Math.min(...distances);
                if (!this.scoutMinDistance || newMinDistance < this.scoutMinDistance) {
                    this.logger(`Scout timeout refreshed because unit moved closer to point (${newMinDistance} < ${this.scoutMinDistance})`);
                    this.scoutTargetRefreshedAt = game.getCurrentTick();
                    this.scoutMinDistance = newMinDistance;
                }
            }
            if (game.mapApi.isVisibleTile(targetTile, playerData.name)) {
                this.logger(`Scout target ${this.scoutTarget.x},${this.scoutTarget.y} successfully scouted, moving to next`);
                this.setScoutTarget(null, game.getCurrentTick());
            }
        }
        else {
            const nextScoutTarget = matchAwareness.getScoutingManager().getNewScoutTarget();
            if (!nextScoutTarget) {
                this.logger(`No more scouting targets available, disbanding.`);
                return disbandMission();
            }
            this.setScoutTarget(nextScoutTarget, game.getCurrentTick());
        }
        return noop();
    }
    // [enhanced] Scout candidates by rules: cheap combat infantry/vehicles (dogs, GIs, flak tracks...),
    // any faction. Falls back to the cheapest combatant available.
    getScoutTypes(context) {
        const { player } = context;
        const available = [
            ...player.production.getAvailableObjects(Q.Infantry),
            ...player.production.getAvailableObjects(Q.Vehicles),
        ].filter((r) => r.isSelectableCombatant && !r.harvester && !r.engineer);
        const cheap = available.filter((r) => r.cost <= 600).sort((a, b) => a.cost - b.cost);
        const pool = cheap.length > 0 ? cheap : available.sort((a, b) => a.cost - b.cost);
        return pool.slice(0, 3).map((r) => r.name);
    }
    setScoutTarget(target, currentTick) {
        this.attemptsOnCurrentTarget = 0;
        this.scoutTargetRefreshedAt = currentTick;
        this.scoutTarget = target?.target ?? null;
        this.scoutMinDistance = undefined;
        this.scoutTargetIsPermanent = target?.permanent ?? false;
    }
    getGlobalDebugText() {
        return "scouting";
    }
    getPriority() {
        return this.priority;
    }
}
const SCOUT_COOLDOWN_TICKS = 300;
class ScoutingMissionFactory {
    constructor(lastScoutAt = -SCOUT_COOLDOWN_TICKS) {
        this.lastScoutAt = lastScoutAt;
    }
    getName() {
        return "ScoutingMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger) {
        const { game, matchAwareness } = context;
        // [enhanced] max tier scouts more aggressively to keep target selection fed.
        const cooldown = context.profile.persistentScouting ? SCOUT_COOLDOWN_TICKS / 2 : SCOUT_COOLDOWN_TICKS;
        if (game.getCurrentTick() < this.lastScoutAt + cooldown) {
            return;
        }
        if (!matchAwareness.getScoutingManager().hasScoutTargets()) {
            return;
        }
        if (!missionController.addMission(new ScoutingMission("globalScout", 10, logger))) {
            this.lastScoutAt = game.getCurrentTick();
        }
    }
}

const NONCE_GI_DEPLOY = 0;
const NONCE_GI_UNDEPLOY = 1;
// Micro methods
function manageMoveMicro(attacker, attackPoint) {
    // [enhanced] deployable infantry (rules.deployer: GI etc.), not just hardcoded "E1"
    if (attacker.rules.deployer) {
        const isDeployed = attacker.stance === S.Deployed;
        if (isDeployed) {
            return BatchableAction.noTarget(attacker.id, O.DeploySelected, NONCE_GI_UNDEPLOY);
        }
    }
    return BatchableAction.toPoint(attacker.id, O.AttackMove, attackPoint);
}
function manageAttackMicro(attacker, target) {
    const distance = getDistanceBetweenUnits(attacker, target);
    // [enhanced] deployable infantry (rules.deployer), not just hardcoded "E1"
    if (attacker.rules.deployer) {
        // Para (deployed weapon) range is 5.
        const deployedWeaponRange = attacker.secondaryWeapon?.maxRange || 5;
        const isDeployed = attacker.stance === S.Deployed;
        if (!isDeployed && (distance <= deployedWeaponRange || attacker.attackState === A.JustFired)) {
            return BatchableAction.noTarget(attacker.id, O.DeploySelected, NONCE_GI_DEPLOY);
        }
        else if (isDeployed && distance > deployedWeaponRange) {
            return BatchableAction.noTarget(attacker.id, O.DeploySelected, NONCE_GI_UNDEPLOY);
        }
    }
    let targetData = target;
    let orderType = O.Attack;
    const primaryWeaponRange = attacker.primaryWeapon?.maxRange || 5;
    if (targetData?.type == a.Building && distance < primaryWeaponRange * 0.8) {
        orderType = O.Attack;
    }
    else if (targetData?.rules.canDisguise) {
        // Special case for mirage tank/spy as otherwise they just sit next to it.
        orderType = O.Attack;
    }
    return BatchableAction.toTargetId(attacker.id, orderType, target.id);
}
/**
 *
 * @param attacker
 * @param target
 * @returns A number describing the weight of the given target for the attacker, or null if it should not attack it.
 */
function getAttackWeight(attacker, target, profile) {
    const { rx: x, ry: y } = attacker.tile;
    const { rx: hX, ry: hY } = target.tile;
    if (!attacker.primaryWeapon?.projectileRules.isAntiAir && target.zone === Z.Air) {
        return null;
    }
    if (!attacker.primaryWeapon?.projectileRules.isAntiGround && target.zone === Z.Ground) {
        return null;
    }
    // [enhanced] focus fire: prefer finishing off damaged enemies, so firepower isn't
    // spread across many half-dead targets that all keep shooting back.
    // Enabled by the difficulty profile (standard/max).
    const focusBonus = profile?.focusFire && target.maxHitPoints > 0
        ? (1 - target.hitPoints / target.maxHitPoints) * FOCUS_FIRE_BONUS
        : 0;
    return 1000000 - getDistanceBetweenPoints(new V(x, y), new V(hX, hY)) + focusBonus;
}
// [enhanced] How much a fully-damaged target is preferred over a full-hp one (in tile-distance-equivalents).
const FOCUS_FIRE_BONUS = 150;

// [enhanced] was 10: retarget more often for tighter micro.
const TARGET_UPDATE_INTERVAL_TICKS = 6;
// [enhanced] Units below this HP ratio pull back toward the rally point instead of trading.
const RETREAT_HP_RATIO = 0.3;
// Units must be in a certain radius of the center of mass before attacking.
// This scales for number of units in the squad though.
const MIN_GATHER_RADIUS = 5;
// If the radius expands beyond this amount then we should switch back to gathering mode.
const MAX_GATHER_RADIUS = 15;
const GATHER_RATIO = 10;
const ATTACK_SCAN_AREA = 15;
var SquadState;
(function (SquadState) {
    SquadState[SquadState["Gathering"] = 0] = "Gathering";
    SquadState[SquadState["Attacking"] = 1] = "Attacking";
})(SquadState || (SquadState = {}));
class CombatSquad {
    /**
     *
     * @param rallyArea the initial location to grab combatants
     * @param targetArea
     * @param radius
     */
    constructor(rallyArea, targetArea, radius) {
        this.rallyArea = rallyArea;
        this.targetArea = targetArea;
        this.radius = radius;
        this.lastCommand = null;
        this.state = SquadState.Gathering;
        this.lastOrderGiven = {};
    }
    getGlobalDebugText() {
        return this.debugLastTarget ?? "<none>";
    }
    setAttackArea(targetArea) {
        this.targetArea = targetArea;
    }
    onAiUpdate(context, mission, logger) {
        const { game, actionBatcher, matchAwareness } = context;
        const playerData = game.getPlayerData(context.player.name);
        if (mission.getUnitIds().length > 0 &&
            (!this.lastCommand || game.getCurrentTick() > this.lastCommand + TARGET_UPDATE_INTERVAL_TICKS)) {
            this.lastCommand = game.getCurrentTick();
            const centerOfMass = mission.getCenterOfMass();
            const maxDistance = mission.getMaxDistanceToCenterOfMass();
            const unitIds = mission.getUnitsMatchingByRule(game, (r) => r.isSelectableCombatant);
            const units = unitIds.map((unitId) => game.getUnitData(unitId)).filter((unit) => !!unit);
            // Only use ground units for center of mass.
            const groundUnitIds = mission.getUnitsMatchingByRule(game, (r) => r.isSelectableCombatant &&
                (r.movementZone === M.Infantry ||
                    r.movementZone === M.Normal ||
                    r.movementZone === M.InfantryDestroyer));
            if (this.state === SquadState.Gathering) {
                const requiredGatherRadius = G.sqrt(groundUnitIds.length) * GATHER_RATIO + MIN_GATHER_RADIUS;
                if (centerOfMass &&
                    maxDistance &&
                    game.mapApi.getTile(centerOfMass.x, centerOfMass.y) !== undefined &&
                    maxDistance > requiredGatherRadius) {
                    units.forEach((unit) => {
                        this.submitActionIfNew(actionBatcher, manageMoveMicro(unit, centerOfMass));
                    });
                }
                else {
                    logger(`CombatSquad ${mission.getUniqueName()} switching back to attack mode (${maxDistance})`);
                    this.state = SquadState.Attacking;
                }
            }
            else {
                const targetPoint = this.targetArea || playerData.startLocation;
                const requiredGatherRadius = G.sqrt(groundUnitIds.length) * GATHER_RATIO + MAX_GATHER_RADIUS;
                if (centerOfMass &&
                    maxDistance &&
                    game.mapApi.getTile(centerOfMass.x, centerOfMass.y) !== undefined &&
                    maxDistance > requiredGatherRadius) {
                    // Switch back to gather mode
                    logger(`CombatSquad ${mission.getUniqueName()} switching back to gather (${maxDistance})`);
                    this.state = SquadState.Gathering;
                    return noop();
                }
                // The unit with the shortest range chooses the target. Otherwise, a base range of 5 is chosen.
                const getRangeForUnit = (unit) => unit.primaryWeapon?.maxRange ?? unit.secondaryWeapon?.maxRange ?? 5;
                const attackLeader = minBy(units, getRangeForUnit);
                if (!attackLeader) {
                    return noop();
                }
                // Find units within double the range of the leader.
                const nearbyHostiles = matchAwareness
                    .getHostilesNearPoint(attackLeader.tile.rx, attackLeader.tile.ry, ATTACK_SCAN_AREA)
                    .map(({ unitId }) => game.getUnitData(unitId))
                    .filter((unit) => !isOwnedByNeutral(unit));
                for (const unit of units) {
                    // [enhanced] pull critically damaged units out of the fight (per difficulty profile).
                    if (context.profile.retreatMicro &&
                        unit.hitPoints > 0 &&
                        unit.hitPoints < unit.maxHitPoints * RETREAT_HP_RATIO) {
                        this.submitActionIfNew(actionBatcher, manageMoveMicro(unit, this.rallyArea));
                        continue;
                    }
                    const bestUnit = maxBy(nearbyHostiles, (target) => getAttackWeight(unit, target, context.profile));
                    if (bestUnit) {
                        this.submitActionIfNew(actionBatcher, manageAttackMicro(unit, bestUnit));
                        this.debugLastTarget = `Unit ${bestUnit.id.toString()}`;
                    }
                    else {
                        this.submitActionIfNew(actionBatcher, manageMoveMicro(unit, targetPoint));
                        this.debugLastTarget = `@${targetPoint.x},${targetPoint.y}`;
                    }
                }
            }
        }
        return noop();
    }
    /**
     * Sends an action to the actionBatcher if and only if the action is different from the last action we submitted to it.
     * Prevents spamming redundant orders, which affects performance and can also cause the unit to sit around doing nothing.
     */
    submitActionIfNew(actionBatcher, action) {
        const lastAction = this.lastOrderGiven[action.unitId];
        if (!lastAction || !lastAction.isSameAs(action)) {
            actionBatcher.push(action);
            this.lastOrderGiven[action.unitId] = action;
        }
    }
}

class RetreatMission extends Mission {
    constructor(uniqueName, retreatToPoint, withUnitIds, logger) {
        super(uniqueName, logger);
        this.retreatToPoint = retreatToPoint;
        this.withUnitIds = withUnitIds;
        this.createdAt = null;
    }
    _onAiUpdate(context) {
        const { game } = context;
        const actionsApi = context.player.actions;
        if (!this.createdAt) {
            this.createdAt = game.getCurrentTick();
        }
        if (this.getUnitIds().length > 0) {
            // Only send the order once we have managed to claim some units.
            actionsApi.orderUnits(this.getUnitIds(), O.AttackMove, this.retreatToPoint.x, this.retreatToPoint.y);
            return disbandMission();
        }
        if (this.createdAt && game.getCurrentTick() > this.createdAt + 240) {
            // Disband automatically after 240 ticks in case we couldn't actually claim any units.
            return disbandMission();
        }
        else {
            return requestSpecificUnits(this.withUnitIds, 1000);
        }
    }
    getGlobalDebugText() {
        return `retreat with ${this.withUnitIds.length} units`;
    }
    getPriority() {
        return 100;
    }
}

var AttackFailReason;
(function (AttackFailReason) {
    AttackFailReason["NoTargets"] = "NoTargets";
    AttackFailReason["DefenceTooStrong"] = "DefenceTooStrong";
    AttackFailReason["UnableToAcquireUnits"] = "UnableToAcquireUnits";
    AttackFailReason["OutOfUnits"] = "OutOfUnits";
})(AttackFailReason || (AttackFailReason = {}));
var AttackMissionState;
(function (AttackMissionState) {
    AttackMissionState[AttackMissionState["Preparing"] = 0] = "Preparing";
    AttackMissionState[AttackMissionState["Attacking"] = 1] = "Attacking";
    AttackMissionState[AttackMissionState["Retreating"] = 2] = "Retreating";
})(AttackMissionState || (AttackMissionState = {}));
const NO_TARGET_RETARGET_TICKS = 450;
const NO_TARGET_IDLE_TIMEOUT_TICKS = 900;
const ATTACK_MISSION_PRIORITY_RAMP = 1.01;
const ATTACK_MISSION_MAX_PRIORITY = 50;
// While preparing the squad, how many ticks to wait before dropping one unit from the desired squad size. If the squad size drops below the minimum, the attack mission is aborted.
const REQUESTED_UNIT_COUNT_DECAY_TICKS = 240;
/**
 * A mission that tries to attack a certain area.
 */
class AttackMission extends Mission {
    constructor(uniqueName, priority, rallyArea, attackArea, radius, composition, logger) {
        super(uniqueName, logger);
        this.priority = priority;
        this.attackArea = attackArea;
        this.radius = radius;
        this.composition = composition;
        this.lastTargetSeenAt = 0;
        this.hasPickedNewTarget = false;
        this.state = AttackMissionState.Preparing;
        this.lastRequestedUnitCountDecayAt = null;
        this.squad = new CombatSquad(rallyArea, attackArea, radius);
        this.requestedUnitCount = composition.maximumUnits;
    }
    _onAiUpdate(context) {
        switch (this.state) {
            case AttackMissionState.Preparing:
                return this.handlePreparingState(context);
            case AttackMissionState.Attacking:
                return this.handleAttackingState(context);
            case AttackMissionState.Retreating:
                return this.handleRetreatingState(context);
        }
    }
    handlePreparingState(context) {
        const { game } = context;
        this.decayDesiredCompositionIfNeeded(game);
        if (this.requestedUnitCount < this.composition.minimumUnits) {
            return disbandMission(AttackFailReason.UnableToAcquireUnits);
        }
        const desiredComposition = this.getDesiredComposition();
        const missingUnits = this.getMissingUnits(game, desiredComposition);
        if (missingUnits.length > 0) {
            this.priority = Math.min(this.priority * ATTACK_MISSION_PRIORITY_RAMP, ATTACK_MISSION_MAX_PRIORITY);
            // distribute the priority among the amount of missing units of each type
            const totalMissingUnits = missingUnits.reduce((sum, [, numMissing]) => sum + numMissing, 0);
            const unitPriorities = Object.fromEntries(missingUnits.map(([unitName, numMissing]) => [
                unitName,
                (this.priority * numMissing) / totalMissingUnits,
            ]));
            return requestUnits(unitPriorities);
        }
        else {
            this.priority = ATTACK_MISSION_INITIAL_PRIORITY;
            this.state = AttackMissionState.Attacking;
            return noop();
        }
    }
    handleAttackingState(context) {
        const { game, matchAwareness, actionBatcher } = context;
        const playerData = game.getPlayerData(context.player.name);
        if (this.getUnitIds().length === 0) {
            // TODO: disband directly (we no longer retreat when losing)
            this.state = AttackMissionState.Retreating;
            return noop();
        }
        const foundTargets = matchAwareness
            .getHostilesNearPoint2d(this.attackArea, this.radius)
            .map((unit) => game.getUnitData(unit.unitId))
            .filter((unit) => !isOwnedByNeutral(unit));
        const update = this.squad.onAiUpdate(context, this, this.logger);
        if (update.type !== "noop") {
            return update;
        }
        if (foundTargets.length > 0) {
            this.lastTargetSeenAt = game.getCurrentTick();
            this.hasPickedNewTarget = false;
        }
        else if (game.getCurrentTick() > this.lastTargetSeenAt + NO_TARGET_IDLE_TIMEOUT_TICKS) {
            return disbandMission(AttackFailReason.NoTargets);
        }
        else if (!this.hasPickedNewTarget &&
            game.getCurrentTick() > this.lastTargetSeenAt + NO_TARGET_RETARGET_TICKS) {
            const newTarget = generateTarget(game, playerData, matchAwareness);
            if (newTarget) {
                this.squad.setAttackArea(newTarget);
                this.hasPickedNewTarget = true;
            }
        }
        return noop();
    }
    handleRetreatingState(context) {
        const { game, actionBatcher, matchAwareness } = context;
        this.getUnits(game).forEach((unitId) => {
            actionBatcher.push(manageMoveMicro(unitId, matchAwareness.getMainRallyPoint()));
        });
        // Note: probably should just disband rather than have a retreating state
        return disbandMission(AttackFailReason.OutOfUnits);
    }
    getGlobalDebugText() {
        return this.squad.getGlobalDebugText() ?? "<none>";
    }
    getState() {
        return this.state;
    }
    // This mission can give up its units while preparing.
    isUnitsLocked() {
        return this.state !== AttackMissionState.Preparing;
    }
    getPriority() {
        return this.priority;
    }
    decayDesiredCompositionIfNeeded(game) {
        const currentTick = game.getCurrentTick();
        if (this.lastRequestedUnitCountDecayAt === null) {
            this.lastRequestedUnitCountDecayAt = currentTick;
            return;
        }
        if (currentTick <= this.lastRequestedUnitCountDecayAt + REQUESTED_UNIT_COUNT_DECAY_TICKS) {
            return;
        }
        this.lastRequestedUnitCountDecayAt = currentTick;
        this.requestedUnitCount--;
    }
    getDesiredComposition() {
        const compositionWeights = this.composition.composition;
        const totalWeights = Object.values(compositionWeights).reduce((a, b) => a + b, 0);
        if (totalWeights <= 0) {
            return {};
        }
        return Object.fromEntries(Object.entries(compositionWeights).map(([unitName, weight]) => [
            unitName,
            Math.round((weight * this.requestedUnitCount) / totalWeights),
        ]));
    }
}
// Calculates the weight for initiating an attack on the position of a unit or building.
// This is separate from unit micro; the squad will be ordered to attack in the vicinity of the point.
// [enhanced] smarter target selection: prioritize production/power buildings, prefer weakly-defended sectors.
const getTargetWeight = (unitData, tryFocusHarvester, sectorThreat) => {
    if (tryFocusHarvester && unitData.rules.harvester) {
        return 100000;
    }
    let weight;
    if (unitData.type === a.Building) {
        weight = unitData.maxHitPoints * 10;
        if (unitData.rules.constructionYard || unitData.rules.weaponsFactory || unitData.rules.factory !== F.None) {
            // Cripple their ability to rebuild: hit production buildings first.
            weight *= 3;
        }
        else if (unitData.rules.power > 0) {
            // Knocking out power slows their production and disables base defenses.
            weight *= 2;
        }
    }
    else {
        weight = unitData.maxHitPoints;
    }
    // Prefer attacking where the enemy is weak: dampen the weight by local sector threat.
    if (sectorThreat !== null && sectorThreat > 0) {
        weight /= 1 + sectorThreat / 1000;
    }
    return weight;
};
function generateTarget(gameApi, playerData, matchAwareness, includeBaseLocations = false) {
    // Randomly decide between harvester and base.
    try {
        const tryFocusHarvester = gameApi.generateRandomInt(0, 1) === 0;
        const enemyUnits = gameApi
            .getVisibleUnits(playerData.name, "enemy")
            .map((unitId) => gameApi.getUnitData(unitId))
            .filter((u) => !!u && gameApi.getPlayerData(u.owner).isCombatant);
        // [enhanced] weigh targets by the threat of the sector they're in, so we attack the weak spots.
        const sectorCache = matchAwareness.getSectorCache();
        const maxUnit = maxBy(enemyUnits, (u) => {
            const sector = sectorCache.getCell(u.tile.rx, u.tile.ry);
            return getTargetWeight(u, tryFocusHarvester, sector?.value.threatLevel ?? null);
        });
        if (maxUnit) {
            return new V(maxUnit.tile.rx, maxUnit.tile.ry);
        }
        if (includeBaseLocations) {
            const mapApi = gameApi.mapApi;
            const enemyPlayers = gameApi
                .getPlayers()
                .map((p) => gameApi.getPlayerData(p))
                .filter((otherPlayer) => !gameApi.areAlliedPlayers(playerData.name, otherPlayer.name));
            const unexploredEnemyLocations = enemyPlayers.filter((otherPlayer) => {
                const tile = mapApi.getTile(otherPlayer.startLocation.x, otherPlayer.startLocation.y);
                if (!tile) {
                    return false;
                }
                return !mapApi.isVisibleTile(tile, playerData.name);
            });
            if (unexploredEnemyLocations.length > 0) {
                const idx = gameApi.generateRandomInt(0, unexploredEnemyLocations.length - 1);
                return unexploredEnemyLocations[idx].startLocation;
            }
        }
    }
    catch (err) {
        // There's a crash here when accessing a building that got destroyed. Will catch and ignore or now.
        return null;
    }
    return null;
}
// [enhanced] Attack cadence/cash-gate/concurrency knobs moved to DifficultyProfile
// (attackCooldownTicks, baseAttackCooldownTicks, attackCashGate, maxConcurrentPreparingAttacks).
const ATTACK_MISSION_INITIAL_PRIORITY = 1;
class AttackMissionFactory {
    constructor(lastAttackAt = -1e9) {
        this.lastAttackAt = lastAttackAt;
    }
    getName() {
        return "AttackMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger, composition) {
        const { game, matchAwareness, profile } = context;
        const playerData = game.getPlayerData(context.player.name);
        if (!composition) {
            return;
        }
        if (game.getCurrentTick() < this.lastAttackAt + profile.attackCooldownTicks) {
            return;
        }
        // [enhanced] cash gate: constant tank production was starving base development
        // (refineries/radar/tech all lost the queue to attack waves). Broke = build economy first.
        if (playerData.credits < profile.attackCashGate) {
            return;
        }
        // can only have a limited number of attacks 'preparing' at once.
        const preparingCount = missionController
            .getMissions()
            .filter((mission) => mission instanceof AttackMission && mission.getState() === AttackMissionState.Preparing).length;
        if (preparingCount >= profile.maxConcurrentPreparingAttacks) {
            return;
        }
        const attackRadius = 10;
        const includeEnemyBases = game.getCurrentTick() > this.lastAttackAt + profile.baseAttackCooldownTicks;
        const attackArea = generateTarget(game, playerData, matchAwareness, includeEnemyBases);
        if (!attackArea) {
            return;
        }
        const squadName = "attack_" + game.getCurrentTick();
        const tryAttack = missionController.addMission(new AttackMission(squadName, ATTACK_MISSION_INITIAL_PRIORITY, matchAwareness.getMainRallyPoint(), attackArea, attackRadius, composition, logger).withOnFinish((unitIds, reason) => {
            logger(`Attack ${squadName} (${JSON.stringify(composition)}) with ${unitIds.length} units finished with reason: ${reason}`);
            missionController.addMission(new RetreatMission("retreat-from-" + squadName + game.getCurrentTick(), matchAwareness.getMainRallyPoint(), unitIds, logger));
        }));
        if (tryAttack) {
            this.lastAttackAt = game.getCurrentTick();
        }
    }
}

const MAX_PRIORITY = 100;
/**
 * A mission that tries to defend a certain area.
 */
class DefenceMission extends Mission {
    constructor(uniqueName, priority, rallyArea, defenceArea, // [enhanced] protected: subclasses (harvester escort) update this to follow their charge
    radius, logger) {
        super(uniqueName, logger);
        this.priority = priority;
        this.defenceArea = defenceArea;
        this.radius = radius;
        this.squad = new CombatSquad(rallyArea, defenceArea, radius);
    }
    _onAiUpdate(context) {
        const { game, matchAwareness } = context;
        // Dispatch missions.
        const foundTargets = matchAwareness
            .getHostilesNearPoint2d(this.defenceArea, this.radius)
            .map((unit) => game.getUnitData(unit.unitId))
            .filter((unit) => !isOwnedByNeutral(unit));
        const update = this.squad.onAiUpdate(context, this, this.logger);
        if (update.type !== "noop") {
            return update;
        }
        if (foundTargets.length === 0) {
            this.priority = 0;
            if (this.getUnitIds().length > 0) {
                this.logger(`(Defence Mission ${this.getUniqueName()}): No targets found, releasing units.`);
                return releaseUnits(this.getUnitIds());
            }
            else {
                return noop();
            }
        }
        const targetUnit = foundTargets[0];
        this.logger(`(Defence Mission ${this.getUniqueName()}): Focused on target ${targetUnit?.name} (${foundTargets.length} found in area ${this.radius})`);
        this.squad.setAttackArea(new V(foundTargets[0].tile.rx, foundTargets[0].tile.ry));
        this.priority = MAX_PRIORITY;
        return grabCombatants(this.defenceArea, this.priority);
    }
    getGlobalDebugText() {
        return this.squad.getGlobalDebugText() ?? "<none>";
    }
    getPriority() {
        return this.priority;
    }
}
// [enhanced] Defence responsiveness knobs moved to DifficultyProfile
// (defenceCheckTicks, defenceStartingRadius, defenceInitialPriority).
// Every game tick, we increase the defendable area by this amount.
const DEFENCE_RADIUS_INCREASE_PER_GAME_TICK = 0.0001;
class DefenceMissionFactory {
    constructor() {
        this.lastDefenceCheckAt = 0;
    }
    getName() {
        return "DefenceMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger) {
        const { game, matchAwareness, profile } = context;
        if (game.getCurrentTick() < this.lastDefenceCheckAt + profile.defenceCheckTicks) {
            return;
        }
        this.lastDefenceCheckAt = game.getCurrentTick();
        const defendablePoints = this.getDefendablePoints(context);
        const defendableRadius = profile.defenceStartingRadius + DEFENCE_RADIUS_INCREASE_PER_GAME_TICK * game.getCurrentTick();
        for (const defendablePoint of defendablePoints) {
            const enemiesNearPoint = matchAwareness
                .getHostilesNearPoint2d(defendablePoint, defendableRadius)
                .map((unit) => game.getUnitData(unit.unitId))
                .filter((unit) => !isOwnedByNeutral(unit));
            if (enemiesNearPoint.length > 0) {
                logger(`Starting defence mission, ${enemiesNearPoint.length} found in radius ${defendableRadius} (tick ${game.getCurrentTick()})`);
                missionController.addMission(new DefenceMission(`globalDefence.${defendablePoint.x}.${defendablePoint.y}`, profile.defenceInitialPriority, // [enhanced] from difficulty profile
                matchAwareness.getMainRallyPoint(), defendablePoint, defendableRadius, logger));
            }
        }
    }
    getDefendablePoints(context) {
        const { game, player } = context;
        // [enhanced] defendable points = conyards + MCVs (rule-driven, mod-safe)
        const baseUnits = game.getGeneralRules().baseUnit;
        return game
            .getVisibleUnits(player.name, "self", (r) => r.constructionYard || baseUnits.includes(r.name))
            .map((unitId) => game.getGameObjectData(unitId))
            .filter((unit) => unit != null)
            .map((unit) => toVector2(unit.tile));
    }
}

/**
 * [enhanced] A defence mission that escorts a single harvester: the defended point
 * follows the harvester, and the mission disbands when the harvester is gone.
 * Reuses all of DefenceMission's behaviour (grab nearby combatants, release when clear).
 */
class HarvesterDefenceMission extends DefenceMission {
    constructor(uniqueName, priority, rallyArea, defenceArea, radius, harvesterId, logger) {
        super(uniqueName, priority, rallyArea, defenceArea, radius, logger);
        this.harvesterId = harvesterId;
    }
    _onAiUpdate(context) {
        const harvester = context.game.getGameObjectData(this.harvesterId);
        if (!harvester) {
            // The harvester is dead (or left the game), nothing left to protect.
            return disbandMission();
        }
        // Follow the harvester as it shuttles between the ore field and the refinery.
        this.defenceArea = toVector2(harvester.tile);
        return super._onAiUpdate(context);
    }
}
// Radius around a threatened harvester that triggers an escort response.
const HARVESTER_DEFENCE_RADIUS = 12;
// How often to check whether any harvester is under threat.
const HARVESTER_DEFENCE_CHECK_TICKS = 15;
// Higher than the global defence mission (30): losing miners is what kills the economy.
const HARVESTER_DEFENCE_INITIAL_PRIORITY = 40;
class HarvesterDefenceMissionFactory {
    constructor() {
        this.lastCheckAt = -HARVESTER_DEFENCE_CHECK_TICKS;
    }
    getName() {
        return "HarvesterDefenceMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger) {
        const { game, matchAwareness, player } = context;
        if (game.getCurrentTick() < this.lastCheckAt + HARVESTER_DEFENCE_CHECK_TICKS) {
            return;
        }
        this.lastCheckAt = game.getCurrentTick();
        const harvesters = game.getVisibleUnits(player.name, "self", (r) => r.harvester);
        for (const unitId of harvesters) {
            const gameObjectData = game.getGameObjectData(unitId);
            if (!gameObjectData) {
                continue;
            }
            const position = toVector2(gameObjectData.tile);
            const enemiesNearHarvester = matchAwareness
                .getHostilesNearPoint2d(position, HARVESTER_DEFENCE_RADIUS)
                .map((unit) => game.getUnitData(unit.unitId))
                .filter((unit) => !!unit && !isOwnedByNeutral(unit));
            if (enemiesNearHarvester.length === 0) {
                continue;
            }
            // addMission rejects duplicate names, so one mission per harvester at a time.
            const created = missionController.addMission(new HarvesterDefenceMission(`harvesterDefence.${unitId}`, HARVESTER_DEFENCE_INITIAL_PRIORITY, matchAwareness.getMainRallyPoint(), position, HARVESTER_DEFENCE_RADIUS, unitId, logger));
            if (created) {
                logger(`Harvester ${unitId} under threat (${enemiesNearHarvester.length} hostiles), dispatching escort.`);
            }
        }
    }
}

/**
 * [enhanced] Hit-and-run harassment: small fast squads that go after exposed enemy
 * harvesters/refineries, forcing the opponent to split their attention and army.
 * Only enabled by the "max" difficulty profile.
 */
// Fast raider squads per side.
const HARASS_COMPOSITIONS = {
    soviet: {
        composition: { HTK: 1 },
        minimumUnits: 2,
        maximumUnits: 4,
    },
    allied: {
        composition: { FV: 1 },
        minimumUnits: 2,
        maximumUnits: 4,
    },
};
// Ticks between harassment attempts.
const HARASS_COOLDOWN_TICKS = 600; // experiment: was 900
// [enhanced] Only harass from a position of surplus: raiders compete with the main army
// for the Vehicles queue, so skip entirely unless we're floating plenty of cash.
const HARASS_MIN_CREDITS = 3000;
const HARASS_ATTACK_RADIUS = 10;
class HarassmentMissionFactory {
    constructor() {
        this.lastHarassAt = -HARASS_COOLDOWN_TICKS;
    }
    getName() {
        return "HarassmentMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger, composition) {
        const { game, matchAwareness } = context;
        if (game.getCurrentTick() < this.lastHarassAt + HARASS_COOLDOWN_TICKS) {
            return;
        }
        if (game.getPlayerData(context.player.name).credits < HARASS_MIN_CREDITS) {
            return;
        }
        // Only pounce on a visible, exposed target — harassment without intel is suicide.
        const enemyHarvesters = game
            .getVisibleUnits(context.player.name, "enemy")
            .map((unitId) => game.getUnitData(unitId))
            .filter((unit) => !!unit &&
            !isOwnedByNeutral(unit) &&
            unit.rules.harvester &&
            game.getPlayerData(unit.owner).isCombatant);
        if (enemyHarvesters.length === 0) {
            return;
        }
        const target = enemyHarvesters[game.generateRandomInt(0, enemyHarvesters.length - 1)];
        const targetPos = new V(target.tile.rx, target.tile.ry);
        const squadName = "harass_" + game.getCurrentTick();
        const created = missionController.addMission(new AttackMission(squadName, 1, matchAwareness.getMainRallyPoint(), targetPos, HARASS_ATTACK_RADIUS, composition, logger).withOnFinish((unitIds, reason) => {
            logger(`Harassment ${squadName} finished with reason: ${reason}`);
            // No retreat mission: survivors are released back to the pool.
        }));
        if (created) {
            logger(`Harassment squad dispatched against enemy harvester at ${targetPos.x},${targetPos.y}`);
            this.lastHarassAt = game.getCurrentTick();
        }
    }
}

const CAPTURE_COOLDOWN_TICKS = 30;
var EngineerMissionState;
(function (EngineerMissionState) {
    EngineerMissionState[EngineerMissionState["Preparing"] = 0] = "Preparing";
    EngineerMissionState[EngineerMissionState["Capturing"] = 1] = "Capturing";
})(EngineerMissionState || (EngineerMissionState = {}));
const LOST_ENGINEER = "lost_engineer";
const NO_PATH = "no_path";
/**
 * A mission that tries to send an engineer into a building (e.g. to capture tech building or repair bridge)
 */
class EngineerMission extends Mission {
    constructor(uniqueName, priority, captureTargetId, escortLevel, logger) {
        super(uniqueName, logger);
        this.priority = priority;
        this.captureTargetId = captureTargetId;
        this.escortLevel = escortLevel;
        this.state = EngineerMissionState.Preparing;
        this.lastCaptureAttemptTick = -1;
    }
    get targetId() {
        return this.captureTargetId;
    }
    // [enhanced] Composition from rules, not names: 1 engineer + escorts scaled by escort level
    // (cheap combatant at low levels, strongest combatant added at level 3+).
    buildComposition(context) {
        const { player } = context;
        const available = [
            ...player.production.getAvailableObjects(Q.Infantry),
            ...player.production.getAvailableObjects(Q.Vehicles),
        ];
        const composition = {};
        const engineer = available.find((r) => r.engineer);
        if (engineer) {
            composition[engineer.name] = 1;
        }
        const combatants = available
            .filter((r) => !r.engineer && r.isSelectableCombatant && !r.harvester)
            .sort((a, b) => a.cost - b.cost);
        const cheap = combatants[0];
        const strong = combatants[combatants.length - 1];
        if (cheap && this.escortLevel >= 2) {
            composition[cheap.name] = this.escortLevel - 1;
        }
        if (strong && this.escortLevel >= 3 && strong.name !== cheap?.name) {
            composition[strong.name] = 1;
        }
        return composition;
    }
    _onAiUpdate(context) {
        const { game } = context;
        const actionsApi = context.player.actions;
        const playerData = game.getPlayerData(context.player.name);
        // [enhanced] rule-driven engineer detection (mod-safe, any faction's engineer unit)
        const engineers = this.getUnitsMatchingByRule(game, (r) => r.engineer)
            .map((id) => game.getUnitData(id))
            .filter((u) => !!u);
        const target = game.getGameObjectData(this.captureTargetId);
        if (!target || target.owner === playerData.name) {
            // Target gone or already captured, disband.
            return disbandMission();
        }
        if (engineers.length === 0 && this.state === EngineerMissionState.Capturing) {
            // Engineer died and we already tried to capture
            return disbandMission(LOST_ENGINEER);
        }
        if (this.state === EngineerMissionState.Preparing) {
            // [enhanced] build the composition from whatever the faction actually offers:
            // 1 engineer + escorts chosen by rules (cheap fast combatants), not hardcoded names.
            const composition = this.buildComposition(context);
            const missingUnits = this.getMissingUnits(game, composition);
            if (missingUnits.length > 0) {
                return requestUnitsWithSamePriority(missingUnits.map(([unitName]) => unitName), this.priority);
            }
            this.state = EngineerMissionState.Capturing;
        }
        if (this.state === EngineerMissionState.Capturing &&
            game.getCurrentTick() > this.lastCaptureAttemptTick + CAPTURE_COOLDOWN_TICKS) {
            const engineer = engineers[0];
            if (!canReachStructure(game, engineer, target)) {
                return disbandMission(NO_PATH);
            }
            actionsApi.orderUnits([engineer.id], O.Capture, this.captureTargetId);
            // [enhanced] escort = any of the mission's non-engineer combatants.
            const escortUnits = this.getUnitsMatchingByRule(game, (r) => !r.engineer && r.isSelectableCombatant)
                .map((id) => game.getUnitData(id))
                .filter((u) => !!u);
            if (escortUnits.length > 0) {
                actionsApi.orderUnits(escortUnits.map((u) => u.id), O.Guard, engineer.id);
            }
            // Add a cooldown to deploy attempts.
            this.lastCaptureAttemptTick = game.getCurrentTick();
        }
        return noop();
    }
    getGlobalDebugText() {
        return undefined;
    }
    getPriority() {
        return this.priority;
    }
}
function canReachStructure(gameApi, engineer, target) {
    const reachabilityMap = gameApi.map.getReachabilityMap(e.Foot, true);
    // unfortunately we have to test tiles around the target, because the target blocks pathing
    const range = computeAdjacentRect(toVector2(target.tile), target.foundation, 1);
    const adjacentTiles = getAdjacentTiles(gameApi, range, false);
    for (const tile of adjacentTiles) {
        if (reachabilityMap.isReachable(toPathNode(engineer.tile, engineer.onBridge ?? false), toPathNode(tile, false))) {
            return true;
        }
    }
    return false;
}
const TECH_CHECK_INTERVAL_TICKS = 150; // experiment: was 300
const MAX_CAPTURE_ATTEMPT_COUNT = 3;
class EngineerMissionFactory {
    constructor() {
        this.lastCheckAt = 0;
        this.lostEngineerCounts = {};
        this.noPathCounts = {};
    }
    getName() {
        return "EngineerMissionFactory";
    }
    maybeCreateMissions(context, missionController, logger) {
        const { game } = context;
        const playerData = game.getPlayerData(context.player.name);
        if (!(game.getCurrentTick() > this.lastCheckAt + TECH_CHECK_INTERVAL_TICKS)) {
            return;
        }
        this.lastCheckAt = game.getCurrentTick();
        const eligibleTechBuildings = game.getVisibleUnits(playerData.name, "hostile", (r) => r.capturable && r.produceCashAmount > 0);
        eligibleTechBuildings.forEach((techBuildingId) => {
            if (this.lostEngineerCounts[techBuildingId] >= MAX_CAPTURE_ATTEMPT_COUNT ||
                this.noPathCounts[techBuildingId] >= MAX_CAPTURE_ATTEMPT_COUNT) {
                return;
            }
            const escortLevel = (this.lostEngineerCounts[techBuildingId] ?? 0) + 1;
            missionController.addMission(new EngineerMission("capture-" + techBuildingId, 100, techBuildingId, escortLevel, logger).withOnFinish((unitIds, reason) => {
                if (reason === LOST_ENGINEER) {
                    this.lostEngineerCounts[techBuildingId] =
                        (this.lostEngineerCounts[techBuildingId] ?? 0) + 1;
                }
                else if (reason === NO_PATH) {
                    this.noPathCounts[techBuildingId] = (this.noPathCounts[techBuildingId] ?? 0) + 1;
                }
            }));
        });
    }
}

// Returns the compositions that the player can actually build right now.
function getValidCompositions(context, compositions) {
    const availableObjects = new Set(context.player.production.getAvailableObjects().map((o) => o.name));
    return Object.keys(compositions).filter((compositionName) => {
        const composition = compositions[compositionName];
        return Object.keys(composition.composition).every((unitName) => availableObjects.has(unitName));
    });
}

// These could be loaded from ai.ini
const DEFAULT_COMPOSITIONS = {
    conscripts: {
        composition: {
            E2: 1,
        },
        minimumUnits: 5,
        maximumUnits: 10,
    },
    gis: {
        composition: {
            E1: 1,
        },
        minimumUnits: 5,
        maximumUnits: 10,
    },
    sovietTanks: {
        composition: {
            HTNK: 5,
            HTK: 1,
        },
        minimumUnits: 4,
        maximumUnits: 20,
    },
    alliedTanks: {
        composition: {
            MTNK: 5,
            FV: 1,
        },
        minimumUnits: 4,
        maximumUnits: 20,
    },
    kirovs: {
        composition: {
            KIROV: 1,
        },
        minimumUnits: 1,
        maximumUnits: 3,
    },
    rocketeers: {
        composition: {
            JUMPJET: 1,
        },
        minimumUnits: 3,
        maximumUnits: 6,
    },
    heavySovietTanks: {
        composition: {
            APOC: 2,
            HTNK: 1,
        },
        minimumUnits: 3,
        maximumUnits: 10,
    },
    heavyAlliedTanks: {
        composition: {
            MTNK: 2,
            MGTK: 1,
        },
        minimumUnits: 3,
        maximumUnits: 10,
    },
    sovietArtillery: {
        composition: {
            V3: 2,
            HTNK: 1,
        },
        minimumUnits: 4,
        maximumUnits: 10,
    },
    alliedArtillery: {
        composition: {
            SREF: 2,
            MTNK: 1,
        },
        minimumUnits: 4,
        maximumUnits: 10,
    },
    // [enhanced] Naval compositions. getValidCompositions only enables these once every
    // listed unit is buildable, i.e. after a naval yard exists — pure land maps never see them.
    alliedNavy: {
        composition: {
            DEST: 3,
            AEGIS: 1,
        },
        minimumUnits: 3,
        maximumUnits: 8,
    },
    sovietNavy: {
        composition: {
            SUB: 3,
            HYD: 1,
        },
        minimumUnits: 3,
        maximumUnits: 8,
    },
};
class DefaultStrategy {
    constructor() {
        this.expansionFactory = new ExpansionMissionFactory();
        this.scoutingFactory = new ScoutingMissionFactory();
        this.attackFactory = new AttackMissionFactory();
        this.defenceFactory = new DefenceMissionFactory();
        this.harvesterDefenceFactory = new HarvesterDefenceMissionFactory(); // [enhanced] escort threatened miners
        this.harassmentFactory = new HarassmentMissionFactory(); // [enhanced] hit-and-run raiders (max tier)
        this.engineerFactory = new EngineerMissionFactory();
    }
    onAiUpdate(context, missionController, logger) {
        const { profile } = context; // [enhanced]
        this.expansionFactory.maybeCreateMissions(context, missionController, logger);
        this.scoutingFactory.maybeCreateMissions(context, missionController, logger);
        const composition = this.selectRandomAttackComposition(context, logger) ?? this.selectFallbackComposition(context, logger);
        if (composition) {
            this.attackFactory.maybeCreateMissions(context, missionController, logger, composition);
        }
        // [enhanced] hit-and-run raiders, only on tiers that enable it.
        if (profile.harassment) {
            const side = context.game.getPlayerData(context.player.name).country?.side;
            // SideType.Nod is the legacy name for the Soviet side.
            const harassComposition = side === b.Nod ? HARASS_COMPOSITIONS.soviet : HARASS_COMPOSITIONS.allied;
            // Skip when the raider unit isn't buildable (mod without HTK/FV).
            const raiderName = Object.keys(harassComposition.composition)[0];
            const available = context.player.production
                .getAvailableObjects(Q.Vehicles)
                .some((r) => r.name === raiderName);
            if (available) {
                this.harassmentFactory.maybeCreateMissions(context, missionController, logger, harassComposition);
            }
        }
        this.defenceFactory.maybeCreateMissions(context, missionController, logger);
        // [enhanced] harvester escort, per tier.
        if (profile.harvesterDefence) {
            this.harvesterDefenceFactory.maybeCreateMissions(context, missionController, logger);
        }
        this.engineerFactory.maybeCreateMissions(context, missionController, logger);
        return this;
    }
    selectRandomAttackComposition(context, logger) {
        const playerData = context.game.getPlayerData(context.player.name);
        const side = playerData.country?.side;
        if (side === undefined) {
            return null;
        }
        const validCompositions = getValidCompositions(context, DEFAULT_COMPOSITIONS);
        if (validCompositions.length === 0) {
            return null;
        }
        logger(`Valid compositions: ${validCompositions.join(", ")}`);
        const randomIndex = context.game.generateRandomInt(0, validCompositions.length - 1);
        const compositionId = validCompositions[randomIndex];
        return DEFAULT_COMPOSITIONS[compositionId];
    }
    /**
     * [enhanced] Mod-safe fallback: when no named composition is fully buildable (a mod with
     * different unit names), attack with squads of the strongest available combat unit instead.
     */
    selectFallbackComposition(context, logger) {
        const available = [
            ...context.player.production.getAvailableObjects(Q.Vehicles),
            ...context.player.production.getAvailableObjects(Q.Infantry),
        ].filter((r) => r.isSelectableCombatant && !r.harvester && !r.engineer);
        if (available.length === 0) {
            return null;
        }
        const best = available.sort((a, b) => b.cost - a.cost)[0];
        logger(`No named composition available, falling back to generic squad of ${best.name}`);
        return {
            composition: { [best.name]: 1 },
            minimumUnits: 4,
            maximumUnits: 12,
        };
    }
}

const getStaticDefencePlacement = (game, playerData, technoRules) => {
    // Prefer front towards enemy.
    const { startLocation, name: currentName } = playerData;
    const allNames = game.getPlayers();
    // Create a list of positions that point roughly towards hostile player start locatoins.
    const candidates = allNames
        .filter((otherName) => otherName !== currentName && !game.areAlliedPlayers(otherName, currentName))
        .map((otherName) => {
        const enemyPlayer = game.getPlayerData(otherName);
        return getPointTowardsOtherPoint(game, startLocation, enemyPlayer.startLocation, 4, 16, 1.5);
    });
    if (candidates.length === 0) {
        return undefined;
    }
    const selectedLocation = candidates[Math.floor(game.generateRandom() * candidates.length)];
    return getDefaultPlacementLocation(game, playerData, selectedLocation, technoRules, false, 2);
};

class AntiGroundStaticDefence {
    constructor(basePriority, baseAmount, groundStrength, limit) {
        this.basePriority = basePriority;
        this.baseAmount = baseAmount;
        this.groundStrength = groundStrength;
        this.limit = limit;
    }
    getPlacementLocation(game, playerData, technoRules) {
        return getStaticDefencePlacement(game, playerData, technoRules);
    }
    getPriority(game, playerData, technoRules, threatCache) {
        const numOwned = numBuildingsOwnedOfType(game, playerData, technoRules);
        if (numOwned >= this.limit) {
            return 0;
        }
        // If the enemy's ground power is increasing we should try to keep up.
        if (threatCache) {
            let denominator = threatCache.totalAvailableAntiGroundFirepower + threatCache.totalDefensivePower + this.groundStrength;
            if (threatCache.totalOffensiveLandThreat > denominator * 1.1) {
                return this.basePriority * (threatCache.totalOffensiveLandThreat / Math.max(1, denominator));
            }
            else {
                return 0;
            }
        }
        const strengthPerCost = (this.groundStrength / technoRules.cost) * 1000;
        return this.basePriority * (1.0 - numOwned / this.baseAmount) * strengthPerCost;
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return null;
    }
}

class ArtilleryUnit {
    constructor(basePriority, artilleryPower, antiGroundPower, baseAmount) {
        this.basePriority = basePriority;
        this.artilleryPower = artilleryPower;
        this.antiGroundPower = antiGroundPower;
        this.baseAmount = baseAmount;
    }
    getPlacementLocation(game, playerData, technoRules) {
        return undefined;
    }
    getPriority(game, playerData, technoRules, threatCache) {
        // Units aren't built automatically, but are instead requested by missions.
        return 0;
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return null;
    }
}

class BasicAirUnit {
    constructor(basePriority, baseAmount, antiGroundPower = 1, // boolean for now, but will eventually be used in weighting.
    antiAirPower = 0) {
        this.basePriority = basePriority;
        this.baseAmount = baseAmount;
        this.antiGroundPower = antiGroundPower;
        this.antiAirPower = antiAirPower;
    }
    getPlacementLocation(game, playerData, technoRules) {
        return undefined;
    }
    getPriority(game, playerData, technoRules, threatCache) {
        // Units aren't built automatically, but are instead requested by missions.
        return 0;
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return null;
    }
}

class BasicBuilding {
    constructor(basePriority, maxNeeded, onlyBuildWhenFloatingCreditsAmount) {
        this.basePriority = basePriority;
        this.maxNeeded = maxNeeded;
        this.onlyBuildWhenFloatingCreditsAmount = onlyBuildWhenFloatingCreditsAmount;
    }
    getPlacementLocation(game, playerData, technoRules) {
        // Prefer spawning close to conyard
        const conyardVectors = game
            .getVisibleUnits(playerData.name, "self", (r) => r.constructionYard)
            .map((r) => game.getGameObjectData(r)?.tile)
            .filter((t) => !!t)
            .map((t) => new V(t.rx, t.ry));
        if (conyardVectors.length === 0) {
            return undefined;
        }
        return getDefaultPlacementLocation(game, playerData, conyardVectors[0], technoRules);
    }
    getPriority(game, playerData, technoRules, threatCache) {
        const numOwned = numBuildingsOwnedOfType(game, playerData, technoRules);
        const calcMaxCount = this.getMaxCount(game, playerData, technoRules, threatCache);
        const max = calcMaxCount ?? this.maxNeeded;
        if (numOwned >= max) {
            return -100;
        }
        const priority = this.basePriority * (1.0 - numOwned / max);
        if (this.onlyBuildWhenFloatingCreditsAmount && playerData.credits < this.onlyBuildWhenFloatingCreditsAmount) {
            return priority * (playerData.credits / this.onlyBuildWhenFloatingCreditsAmount);
        }
        return priority;
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return this.maxNeeded;
    }
}

class BasicGroundUnit {
    constructor(basePriority, baseAmount, antiGroundPower = 1, // boolean for now, but will eventually be used in weighting.
    antiAirPower = 0) {
        this.basePriority = basePriority;
        this.baseAmount = baseAmount;
        this.antiGroundPower = antiGroundPower;
        this.antiAirPower = antiAirPower;
    }
    getPlacementLocation(game, playerData, technoRules) {
        return undefined;
    }
    getPriority(game, playerData, technoRules, threatCache) {
        // Units aren't built automatically, but are instead requested by missions.
        return 0;
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return null;
    }
}

class PowerPlant {
    getPlacementLocation(game, playerData, technoRules) {
        return getDefaultPlacementLocation(game, playerData, playerData.startLocation, technoRules);
    }
    getPriority(game, playerData, technoRules) {
        if (playerData.power.total < playerData.power.drain) {
            return 100;
        }
        else if (playerData.power.total < playerData.power.drain + technoRules.power / 2) {
            return 20;
        }
        else {
            return 0;
        }
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return null;
    }
}

const NO_REFINERY_DISTANCE = 10;
// [enhanced] hard limit moved to DifficultyProfile.refineryHardLimit
class ResourceCollectionBuilding extends BasicBuilding {
    constructor(basePriority, maxNeeded, onlyBuildWhenFloatingCreditsAmount) {
        super(basePriority, maxNeeded, onlyBuildWhenFloatingCreditsAmount);
    }
    getPlacementLocation(game, playerData, technoRules) {
        // Prefer spawning close to ore.
        const conyardVectors = game
            .getVisibleUnits(playerData.name, "self", (r) => r.constructionYard)
            .map((r) => game.getGameObjectData(r)?.tile)
            .filter((t) => !!t)
            .map((t) => new V(t.rx, t.ry));
        if (conyardVectors.length === 0) {
            return undefined;
        }
        var closeOre;
        var closeOreDist;
        let selectedLocation = conyardVectors[0];
        for (const conyard of conyardVectors) {
            let allTileResourceData = game.mapApi.getAllTilesResourceData();
            for (let i = 0; i < allTileResourceData.length; ++i) {
                let tileResourceData = allTileResourceData[i];
                if (tileResourceData.spawnsOre) {
                    let dist = G.sqrt((conyard.x - tileResourceData.tile.rx) ** 2 + (conyard.y - tileResourceData.tile.ry) ** 2);
                    if (closeOreDist == undefined || dist < closeOreDist) {
                        closeOreDist = dist;
                        closeOre = tileResourceData.tile;
                    }
                }
            }
        }
        if (closeOre) {
            selectedLocation = new V(closeOre.rx, closeOre.ry);
        }
        return getDefaultPlacementLocation(game, playerData, selectedLocation, technoRules);
    }
    // Don't build/start selling these if we don't have any harvesters
    getMaxCount(game, playerData, technoRules, threatCache, profile = STANDARD_PROFILE) {
        const harvesters = game.getVisibleUnits(playerData.name, "self", (r) => r.harvester).length;
        // if there is no refinery within distance of a conyard, that conyard wants an expansion
        const conyardBoxes = game
            .getVisibleUnits(playerData.name, "self", (r) => r.constructionYard)
            .map((r) => game.getGameObjectData(r)?.tile)
            .filter((t) => !!t)
            .map((t) => new V(t.rx, t.ry))
            .map((v) => new B(v.clone().subScalar(NO_REFINERY_DISTANCE), v.clone().addScalar(NO_REFINERY_DISTANCE)));
        const conyardsWithRefineries = conyardBoxes
            .map((b) => game.getUnitsInArea(b))
            .filter((unitIds) => unitIds.some((unitId) => getCachedTechnoRules(game, unitId)?.refinery));
        const conyardsWithoutRefineries = conyardBoxes.length - conyardsWithRefineries.length;
        return Math.max(1, Math.min(profile.refineryHardLimit, 2 * harvesters * (conyardsWithoutRefineries + 1)));
    }
}

// [enhanced] harvesters-per-refinery and total cap moved to DifficultyProfile
// (idealHarvestersPerRefinery, maxHarvestersTotal).
const MAX_HARVESTERS_PER_REFINERY = 4;
class Harvester extends BasicGroundUnit {
    constructor(basePriority, baseAmount, minNeeded) {
        super(basePriority, baseAmount, 0, 0);
        this.minNeeded = minNeeded;
    }
    // Priority goes up when we have fewer than this many refineries.
    getPriority(game, playerData, technoRules, threatCache, profile = STANDARD_PROFILE) {
        const refineries = game.getVisibleUnits(playerData.name, "self", (r) => r.refinery).length;
        const harvesters = game.getVisibleUnits(playerData.name, "self", (r) => r.harvester).length;
        const boost = harvesters < this.minNeeded ? 3 : harvesters > refineries * MAX_HARVESTERS_PER_REFINERY ? 0 : 1;
        // [enhanced] when cash is tight, getting miners out becomes urgent.
        const cashBoost = playerData.credits < 800 ? 2 : 1;
        return (this.basePriority *
            (refineries / Math.max(harvesters / profile.idealHarvestersPerRefinery, 1)) *
            boost *
            cashBoost);
    }
    getMaxCount(game, playerData, technoRules, threatCache, profile = STANDARD_PROFILE) {
        return profile.maxHarvestersTotal;
    }
}

class AntiAirStaticDefence {
    constructor(basePriority, baseAmount, airStrength) {
        this.basePriority = basePriority;
        this.baseAmount = baseAmount;
        this.airStrength = airStrength;
    }
    getPlacementLocation(game, playerData, technoRules) {
        // Prefer front towards enemy.
        let startLocation = playerData.startLocation;
        let players = game.getPlayers();
        let enemyFacingLocationCandidates = [];
        for (let i = 0; i < players.length; ++i) {
            let playerName = players[i];
            if (playerName == playerData.name) {
                continue;
            }
            let enemyPlayer = game.getPlayerData(playerName);
            enemyFacingLocationCandidates.push(getPointTowardsOtherPoint(game, startLocation, enemyPlayer.startLocation, 4, 16, 1.5));
        }
        let selectedLocation = enemyFacingLocationCandidates[Math.floor(game.generateRandom() * enemyFacingLocationCandidates.length)];
        return getDefaultPlacementLocation(game, playerData, selectedLocation, technoRules, false, 0);
    }
    getPriority(game, playerData, technoRules, threatCache) {
        if (threatCache) {
            let denominator = threatCache.totalAvailableAntiAirFirepower + this.airStrength;
            if (threatCache.totalOffensiveAirThreat > denominator * 1.1) {
                return this.basePriority * (threatCache.totalOffensiveAirThreat / Math.max(1, denominator));
            }
            else {
                return 0;
            }
        }
        const strengthPerCost = (this.airStrength / technoRules.cost) * 1000;
        const numOwned = numBuildingsOwnedOfType(game, playerData, technoRules);
        return this.basePriority * (1.0 - numOwned / this.baseAmount) * strengthPerCost;
    }
    getMaxCount(game, playerData, technoRules, threatCache) {
        return null;
    }
}

/**
 * [enhanced] Naval yard: enables ship production. Placed on water, near a conyard.
 * On maps without water no valid placement exists, so it simply never gets built.
 */
class NavalYard extends BasicBuilding {
    getPlacementLocation(game, playerData, technoRules) {
        const conyardVectors = game
            .getVisibleUnits(playerData.name, "self", (r) => r.constructionYard)
            .map((r) => game.getGameObjectData(r)?.tile)
            .filter((t) => !!t)
            .map((t) => new V(t.rx, t.ry));
        if (conyardVectors.length === 0) {
            return undefined;
        }
        return getDefaultPlacementLocation(game, playerData, conyardVectors[0], technoRules, true);
    }
}

function numBuildingsOwnedOfType(game, playerData, technoRules) {
    return game.getVisibleUnits(playerData.name, "self", (r) => r == technoRules).length;
}
function getAdjacencyTiles(game, playerData, technoRules, onWater, minimumSpace) {
    const placementRules = game.getBuildingPlacementData(technoRules.name);
    const { width: newBuildingWidth, height: newBuildingHeight } = placementRules.foundation;
    const tiles = [];
    const buildings = game.getVisibleUnits(playerData.name, "self", (r) => r.type === a.Building);
    const removedTiles = new Set();
    for (let buildingId of buildings) {
        const building = game.getUnitData(buildingId);
        if (!building?.rules?.baseNormal) {
            // This building is not considered for adjacency checks.
            continue;
        }
        const { foundation, tile } = building;
        const buildingBase = new V(tile.rx, tile.ry);
        const buildingSize = {
            width: foundation?.width,
            height: foundation?.height,
        };
        const range = computeAdjacentRect(buildingBase, buildingSize, technoRules.adjacent, placementRules.foundation);
        const adjacentTiles = getAdjacentTiles(game, range, onWater);
        if (adjacentTiles.length === 0) {
            continue;
        }
        tiles.push(...adjacentTiles);
        // Prevent placing the new building on tiles that would cause it to overlap with this building.
        const modifiedBase = new V(buildingBase.x - (newBuildingWidth - 1), buildingBase.y - (newBuildingHeight - 1));
        const modifiedSize = {
            width: buildingSize.width + (newBuildingWidth - 1),
            height: buildingSize.height + (newBuildingHeight - 1),
        };
        const blockedRect = computeAdjacentRect(modifiedBase, modifiedSize, minimumSpace);
        const buildingTiles = adjacentTiles.filter((tile) => {
            return (tile.rx >= blockedRect.x &&
                tile.rx < blockedRect.x + blockedRect.width &&
                tile.ry >= blockedRect.y &&
                tile.ry < blockedRect.y + blockedRect.height);
        });
        buildingTiles.forEach((buildingTile) => removedTiles.add(buildingTile.id));
    }
    // Remove duplicate tiles.
    const withDuplicatesRemoved = uniqBy(tiles, (tile) => tile.id);
    // Remove tiles containing buildings and potentially area around them removed as well.
    return withDuplicatesRemoved.filter((tile) => !removedTiles.has(tile.id));
}
function getTileDistances(startPoint, tiles) {
    return tiles
        .map((tile) => ({
        tile,
        distance: distance(tile.rx, tile.ry, startPoint.x, startPoint.y),
    }))
        .sort((a, b) => {
        return a.distance - b.distance;
    });
}
function distance(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    let tmp = dx * dx + dy * dy;
    if (0 === tmp) {
        return 0;
    }
    return G.sqrt(tmp);
}
function getDefaultPlacementLocation(game, playerData, idealPoint, technoRules, onWater = false, minSpace = 1) {
    // Closest possible location near `startPoint`.
    const size = game.getBuildingPlacementData(technoRules.name);
    if (!size) {
        return undefined;
    }
    const tiles = getAdjacencyTiles(game, playerData, technoRules, onWater, minSpace);
    const tileDistances = getTileDistances(idealPoint, tiles);
    for (let tileDistance of tileDistances) {
        if (tileDistance.tile && game.canPlaceBuilding(playerData.name, technoRules.name, tileDistance.tile)) {
            return tileDistance.tile;
        }
    }
    return undefined;
}
const DEFAULT_BUILDING_PRIORITY = 0;
/**
 * [enhanced] Classify buildings by their rules when the unit name isn't in
 * BUILDING_NAME_TO_RULES — mods (e.g. 共和国之辉's China faction) use different names
 * for power plants/refineries/etc., and the AI must still know how to build them.
 * Returns null for things we should never auto-build (conyards) or don't understand.
 */
const MOD_FALLBACK_POWER_PLANT = new PowerPlant();
function classifyBuildingByRules(rules) {
    if (rules.constructionYard) {
        return null; // comes from deploying an MCV, never queue-built
    }
    if (rules.power > 0) {
        return MOD_FALLBACK_POWER_PLANT;
    }
    if (rules.refinery) {
        return new ResourceCollectionBuilding(10, 3);
    }
    if (rules.weaponsFactory) {
        return new BasicBuilding(15, 3);
    }
    if (rules.factory === F.InfantryType) {
        return new BasicBuilding(12, 1); // barracks-equivalent
    }
    if (rules.radar) {
        return new BasicBuilding(10, 1, 500);
    }
    if (rules.dock.length > 0) {
        return new BasicBuilding(1, 1, 5000); // service depot equivalent
    }
    if (rules.turret) {
        return new AntiGroundStaticDefence(2, 1, 7.5, 5); // armed static defence
    }
    if (rules.techLevel >= 8) {
        return new BasicBuilding(20, 1, 4000); // battle lab / high-tech equivalent
    }
    return null;
}
const BUILDING_NAME_TO_RULES = new Map([
    // Allied
    ["GAPOWR", new PowerPlant()],
    ["GAREFN", new ResourceCollectionBuilding(10, 3)],
    ["GAWEAP", new BasicBuilding(15, 3)],
    ["GAPILE", new BasicBuilding(12, 1)],
    ["CMIN", new Harvester(15, 4, 4)],
    ["GADEPT", new BasicBuilding(1, 1, 5000)],
    ["GAAIRC", new BasicBuilding(10, 1, 500)],
    ["AMRADR", new BasicBuilding(10, 1, 500)],
    ["GATECH", new BasicBuilding(20, 1, 4000)],
    ["GAYARD", new NavalYard(8, 1, 2000)],
    // [enhanced] Allied ships (built via Ships queue when requested by missions)
    ["DEST", new BasicGroundUnit(10, 2, 2, 0)],
    ["AEGIS", new BasicGroundUnit(5, 1, 0, 2)],
    ["CARRIER", new BasicGroundUnit(8, 1, 4, 0)],
    ["DLPH", new BasicGroundUnit(5, 1, 1, 0)],
    ["SAPC", new BasicGroundUnit(0, 0)],
    ["GAPILL", new AntiGroundStaticDefence(2, 1, 7.5, 5)],
    ["ATESLA", new AntiGroundStaticDefence(2, 1, 10, 3)],
    ["NASAM", new AntiAirStaticDefence(1, 1, 7.5)],
    ["GAWALL", new AntiGroundStaticDefence(0, 0, 0, 0)],
    ["E1", new BasicGroundUnit(2, 2, 0.2, 0)],
    ["ENGINEER", new BasicGroundUnit(1, 0, 0)],
    ["MTNK", new BasicGroundUnit(10, 3, 2, 0)],
    ["MGTK", new BasicGroundUnit(10, 1, 2.5, 0)],
    ["FV", new BasicGroundUnit(5, 2, 0.5, 1)],
    ["JUMPJET", new BasicAirUnit(10, 1, 1, 1)],
    ["ORCA", new BasicAirUnit(7, 1, 2, 0)],
    ["SREF", new ArtilleryUnit(10, 5, 3, 3)],
    ["CLEG", new BasicGroundUnit(0, 0)],
    ["SHAD", new BasicGroundUnit(0, 0)],
    // Soviet
    ["NAPOWR", new PowerPlant()],
    ["NAREFN", new ResourceCollectionBuilding(10, 3)],
    ["NAWEAP", new BasicBuilding(15, 3)],
    ["NAHAND", new BasicBuilding(12, 1)],
    ["HARV", new Harvester(15, 4, 4)],
    ["NADEPT", new BasicBuilding(1, 1, 5000)],
    ["NARADR", new BasicBuilding(10, 1, 500)],
    ["NANRCT", new PowerPlant()],
    ["NAYARD", new NavalYard(8, 1, 2000)],
    // [enhanced] Soviet ships (built via Ships queue when requested by missions)
    ["SUB", new BasicGroundUnit(10, 2, 2, 0)],
    ["HYD", new BasicGroundUnit(5, 1, 0, 2)],
    ["DRED", new BasicGroundUnit(8, 1, 4, 0)],
    ["SQD", new BasicGroundUnit(5, 1, 1, 0)],
    ["NATECH", new BasicBuilding(20, 1, 4000)],
    ["NALASR", new AntiGroundStaticDefence(2, 1, 7.5, 5)],
    ["NAFLAK", new AntiAirStaticDefence(1, 1, 7.5)],
    ["TESLA", new AntiGroundStaticDefence(2, 1, 10, 3)],
    ["NAWALL", new AntiGroundStaticDefence(0, 0, 0, 0)],
    ["E2", new BasicGroundUnit(2, 2, 0.2, 0)],
    ["SENGINEER", new BasicGroundUnit(1, 0, 0)],
    ["FLAKT", new BasicGroundUnit(2, 2, 0.1, 0.3)],
    ["YURI", new BasicGroundUnit(1, 1, 1, 0)],
    ["DOG", new BasicGroundUnit(1, 1, 0, 0)],
    ["HTNK", new BasicGroundUnit(10, 3, 3, 0)],
    ["APOC", new BasicGroundUnit(6, 1, 5, 0)],
    ["HTK", new BasicGroundUnit(5, 2, 0.33, 1.5)],
    ["ZEP", new BasicAirUnit(5, 1, 5, 1)],
    ["V3", new ArtilleryUnit(9, 10, 0, 3)], // V3 Rocket Launcher
]);

// [enhanced] While the scripted opening is incomplete, its current step gets this priority.
const OPENING_STEP_PRIORITY = 1000;
// Legacy mission encompassing the old "build queue" logic.
class BaseBuildingMission extends Mission {
    constructor(queueType, logger, openingBook) {
        super(`building-mission-${queueTypeToName(queueType)}`, logger);
        this.queueType = queueType;
        this.openingBook = openingBook;
    }
    _onAiUpdate(context) {
        const options = context.player.production.getAvailableObjects(this.queueType);
        const playerData = context.game.getPlayerData(context.player.name);
        if (options.length === 0) {
            return noop();
        }
        const { game, matchAwareness } = context;
        const threatCache = matchAwareness.getThreatCache();
        // [enhanced] scripted opening: force the next step of the build order while it is incomplete.
        if (this.openingBook) {
            this.openingBook.update(game, playerData);
            const step = this.openingBook.getCurrentStep();
            if (step) {
                const stepOption = options.find((option) => step.matches(option));
                if (stepOption) {
                    const location = this.getBestLocationForStructure(game, playerData, stepOption);
                    if (location) {
                        return buildStructureAtLocation(stepOption.name, OPENING_STEP_PRIORITY, location.rx, location.ry);
                    }
                }
                // Step not available yet (tech locked) or unplaceable: fall through to normal priorities.
            }
        }
        const optionWithPriority = options.map((option) => {
            return {
                option,
                priority: this.getPriorityForBuildingOption(option, game, playerData, threatCache, context.profile),
            };
        });
        const bestOption = maxBy(optionWithPriority, (option) => option.priority);
        if (!bestOption || bestOption.priority === 0) {
            return noop();
        }
        const bestLocation = this.getBestLocationForStructure(game, playerData, bestOption.option);
        if (!bestLocation) {
            return noop();
        }
        return buildStructureAtLocation(bestOption.option.name, bestOption.priority, bestLocation.rx, bestLocation.ry);
    }
    getGlobalDebugText() {
        return undefined;
    }
    getPriority() {
        return 0;
    }
    getPriorityForBuildingOption(option, game, playerStatus, threatCache, profile) {
        if (BUILDING_NAME_TO_RULES.has(option.name)) {
            let logic = BUILDING_NAME_TO_RULES.get(option.name);
            return logic.getPriority(game, playerStatus, option, threatCache, profile);
        }
        else {
            // [enhanced] mod-safe: classify unknown (mod) buildings by their rules
            const logic = classifyBuildingByRules(option);
            if (logic) {
                return logic.getPriority(game, playerStatus, option, threatCache, profile);
            }
            // Fallback priority when there are no rules.
            return (DEFAULT_BUILDING_PRIORITY - game.getVisibleUnits(playerStatus.name, "self", (r) => r == option).length);
        }
    }
    getBestLocationForStructure(game, playerData, objectReady) {
        const logic = BUILDING_NAME_TO_RULES.get(objectReady.name) ?? classifyBuildingByRules(objectReady); // [enhanced] mod-safe
        if (logic) {
            return logic.getPlacementLocation(game, playerData, objectReady);
        }
        else {
            // fallback placement logic
            return getDefaultPlacementLocation(game, playerData, playerData.startLocation, objectReady);
        }
    }
    handleBuildingReady(context, objectReady) {
        const { game, player } = context;
        const { actions: actionsApi } = player;
        const playerData = game.getPlayerData(player.name);
        let location = this.getBestLocationForStructure(game, playerData, objectReady);
        if (location !== undefined) {
            this.logger(`Completed (${queueTypeToName(this.queueType)}): ${objectReady.name}, placing at ${location.rx},${location.ry}`);
            actionsApi.placeBuilding(objectReady.name, location.rx, location.ry);
        }
        else {
            this.logger(`Completed (${queueTypeToName(this.queueType)}): ${objectReady.name} but nowhere to place it`);
        }
    }
}

const OPENING_SEQUENCE = [
    { description: "power plant", matches: (r) => r.power > 0, count: 1 },
    { description: "barracks", matches: (r) => r.factory === F.InfantryType, count: 1 },
    { description: "refinery", matches: (r) => r.refinery, count: 1 },
    { description: "war factory", matches: (r) => r.weaponsFactory, count: 1 },
    { description: "second refinery", matches: (r) => r.refinery, count: 2 },
];
class OpeningBook {
    constructor() {
        this.stepIndex = 0;
    }
    /**
     * Advance past any steps the player already satisfies. Call once per update.
     */
    update(game, playerData) {
        while (this.stepIndex < OPENING_SEQUENCE.length) {
            const step = OPENING_SEQUENCE[this.stepIndex];
            const owned = game.getVisibleUnits(playerData.name, "self", step.matches).length;
            if (owned >= step.count) {
                this.stepIndex++;
            }
            else {
                break;
            }
        }
    }
    /**
     * The step we should currently be building, or null once the opening is complete.
     */
    getCurrentStep() {
        return this.stepIndex < OPENING_SEQUENCE.length ? OPENING_SEQUENCE[this.stepIndex] : null;
    }
}

const DEBUG_STATE_UPDATE_INTERVAL_SECONDS = 6;
const DEBUG_MESSAGES_BUFFER_LENGTH = 20;
// Number of ticks per second at the base speed.
const NATURAL_TICK_RATE = 15;
class SupalosaBot extends _ {
    constructor(name, country, tryAllyWith = [], enableLogging = true, strategy = new DefaultStrategy(), 
    // [enhanced] difficulty tier; defaults to the bundle-injected profile (standard in headless).
    profile = getBundleProfile()) {
        super(name, country);
        this.tryAllyWith = tryAllyWith;
        this.enableLogging = enableLogging;
        this.strategy = strategy;
        this.profile = profile;
        this.tickOfLastAttackOrder = 0;
        this.missionController = null;
        this.matchAwareness = null;
        // Messages to display in visualisation mode only.
        this._debugMessages = [];
        this._globalDebugText = "";
        this._debugGridCaches = [];
        this.queueController = new QueueController();
    }
    onGameStart(game) {
        const gameRate = game.getTickRate();
        // [enhanced] APM budget comes from the difficulty profile.
        const botApm = this.profile.apm;
        const botRate = botApm / 60;
        this.tickRatio = Math.ceil(gameRate / botRate);
        const myPlayer = game.getPlayerData(this.name);
        if (!myPlayer.country) {
            throw new Error(`Player ${this.name} has no country`);
        }
        this.missionController = new MissionController((message, sayInGame) => this.logBotStatus(message, sayInGame));
        // TODO: Strategy should have an onGameStart call which sets up the initial missions.
        this.missionController.addMission(new BaseBuildingMission(Q.Structures, (message, sayInGame) => this.logBotStatus(message, sayInGame), 
        // [enhanced] scripted opening build order (per difficulty profile)
        this.profile.openingBook ? new OpeningBook() : undefined));
        this.missionController.addMission(new BaseBuildingMission(Q.Armory, (message, sayInGame) => this.logBotStatus(message, sayInGame)));
        this.matchAwareness = new MatchAwarenessImpl(game, myPlayer, null, myPlayer.startLocation, (message, sayInGame) => this.logBotStatus(message, sayInGame), this.profile);
        this._debugGridCaches = [
            { grid: this.matchAwareness.getSectorCache(), tag: "sector-cache" },
            { grid: this.matchAwareness.getBuildSpaceCache()._cache, tag: "build-cache" },
        ];
        this.matchAwareness.onGameStart(game, myPlayer);
        // [enhanced] Announce ourselves in the in-game chat so it's obvious which tier is playing.
        this.actionsApi.sayAll(`[增强版AI] ${this.profile.displayName} 已加载。祝你好运！`);
        this.tryAllyWith
            .filter((playerName) => playerName !== this.name)
            .forEach((playerName) => this.actionsApi.toggleAlliance(playerName, true));
    }
    onGameTick(game) {
        if (!this.matchAwareness || !this.missionController || !this.strategy) {
            return;
        }
        const threatCache = this.matchAwareness.getThreatCache();
        if ((game.getCurrentTick() / NATURAL_TICK_RATE) % DEBUG_STATE_UPDATE_INTERVAL_SECONDS === 0) {
            this.updateDebugState(game);
        }
        if (game.getCurrentTick() % this.tickRatio === 0) {
            this.matchAwareness.onAiUpdate(this.context);
            const fullContext = {
                ...this.context,
                matchAwareness: this.matchAwareness,
                profile: this.profile, // [enhanced]
            };
            // hacky resign condition
            const armyUnits = game.getVisibleUnits(this.name, "self", (r) => r.isSelectableCombatant);
            const mcvUnits = game.getVisibleUnits(this.name, "self", (r) => !!r.deploysInto && game.getGeneralRules().baseUnit.includes(r.name));
            const productionBuildings = game.getVisibleUnits(this.name, "self", (r) => r.type == a.Building && r.factory != F.None);
            if (armyUnits.length == 0 && productionBuildings.length == 0 && mcvUnits.length == 0) {
                this.logBotStatus(`No army or production left, quitting.`);
                this.context.player.actions.quitGame();
            }
            // Mission/strategy logic every 3 ticks.
            if (this.context.game.getCurrentTick() % 3 === 0) {
                this.missionController.onAiUpdate(fullContext);
                this.strategy = this.strategy.onAiUpdate(fullContext, this.missionController, (message, sayInGame) => this.logBotStatus(message, sayInGame));
            }
            const unitTypeRequests = this.missionController.getRequestedUnitTypes();
            // Queue-controller logic.
            this.queueController.onAiUpdate(fullContext, threatCache, unitTypeRequests, (message) => this.logBotStatus(message));
        }
    }
    getHumanTimestamp(game) {
        return formatTimeDuration(game.getCurrentTick() / NATURAL_TICK_RATE);
    }
    logBotStatus(message, sayInGame = false) {
        if (!this.enableLogging) {
            return;
        }
        this.logger.info(message);
        const timestamp = this.getHumanTimestamp(this.gameApi);
        if (sayInGame) {
            this.actionsApi.sayAll(`${timestamp}: ${message}`);
        }
        this.pushDebugMessage(`${timestamp}: ${message}`);
    }
    updateDebugState(game) {
        if (!this.getDebugMode() || !this.missionController) {
            return;
        }
        // Update the global debug text.
        const myPlayer = game.getPlayerData(this.name);
        const harvesters = game.getVisibleUnits(this.name, "self", (r) => r.harvester).length;
        let globalDebugText = `Cash: ${myPlayer.credits} | Harvesters: ${harvesters}\n`;
        globalDebugText += this.queueController.getGlobalDebugText(this.gameApi, this.productionApi);
        globalDebugText += this.missionController.getGlobalDebugText(this.gameApi);
        globalDebugText += this.matchAwareness?.getGlobalDebugText();
        this.missionController.updateDebugText(this.actionsApi);
        // Tag enemy units with IDs
        game.getVisibleUnits(this.name, "enemy").forEach((unitId) => {
            this.actionsApi.setUnitDebugText(unitId, unitId.toString());
        });
        this.actionsApi.setGlobalDebugText(globalDebugText);
        this._globalDebugText = globalDebugText;
    }
    onGameEvent(ev) {
        switch (ev.type) {
            case d.ObjectDestroy: {
                // Add to the stalemate detection.
                if (ev.attackerInfo?.playerName == this.name) {
                    this.tickOfLastAttackOrder += (this.gameApi.getCurrentTick() - this.tickOfLastAttackOrder) / 2;
                }
                break;
            }
        }
    }
    pushDebugMessage(message) {
        if (this._debugMessages.length + 1 > DEBUG_MESSAGES_BUFFER_LENGTH) {
            this._debugMessages.shift();
        }
        this._debugMessages.push(message);
    }
}

// Entry for the ra2web-compatible bot bundle.
// Re-exports the enhanced bot in the exact shape the client expects: { SupalosaBot, buildInfo, version }.
// The difficulty tier is injected per output file by rollup (@rollup/plugin-replace).

const tier = "standard" ;

const version = "0.87.0";

const buildInfo = Object.freeze({
    generation: 1,
    sourceCommit: "local-enhanced",
    sourceRole: "enhanced-tier-" + tier,
    artifactSource: "local-build",
    naval: true,
});

export { SupalosaBot, buildInfo, version };
