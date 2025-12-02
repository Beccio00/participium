"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportStatus = exports.ReportCategory = void 0;
var ReportCategory;
(function (ReportCategory) {
    ReportCategory["WATER_SUPPLY_DRINKING_WATER"] = "WATER_SUPPLY_DRINKING_WATER";
    ReportCategory["ARCHITECTURAL_BARRIERS"] = "ARCHITECTURAL_BARRIERS";
    ReportCategory["SEWER_SYSTEM"] = "SEWER_SYSTEM";
    ReportCategory["PUBLIC_LIGHTING"] = "PUBLIC_LIGHTING";
    ReportCategory["WASTE"] = "WASTE";
    ReportCategory["ROAD_SIGNS_TRAFFIC_LIGHTS"] = "ROAD_SIGNS_TRAFFIC_LIGHTS";
    ReportCategory["ROADS_URBAN_FURNISHINGS"] = "ROADS_URBAN_FURNISHINGS";
    ReportCategory["PUBLIC_GREEN_AREAS_PLAYGROUNDS"] = "PUBLIC_GREEN_AREAS_PLAYGROUNDS";
    ReportCategory["OTHER"] = "OTHER";
})(ReportCategory || (exports.ReportCategory = ReportCategory = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    ReportStatus["ASSIGNED"] = "ASSIGNED";
    ReportStatus["REJECTED"] = "REJECTED";
    ReportStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ReportStatus["SUSPENDED"] = "SUSPENDED";
    ReportStatus["RESOLVED"] = "RESOLVED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
