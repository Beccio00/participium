"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenPhotoRepository = void 0;
const AppDataSource_1 = require("../utils/AppDataSource");
const CitizenPhoto_1 = require("../entities/CitizenPhoto");
class CitizenPhotoRepository {
    constructor() {
        this.repository = AppDataSource_1.AppDataSource.getRepository(CitizenPhoto_1.CitizenPhoto);
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({ where: { userId } });
        });
    }
    create(photoData) {
        return __awaiter(this, void 0, void 0, function* () {
            const photo = this.repository.create(photoData);
            return yield this.repository.save(photo);
        });
    }
    updateByUserId(userId, photoData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.update({ userId }, photoData);
            return yield this.findByUserId(userId);
        });
    }
    deleteByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.repository.delete({ userId });
            return result.affected !== 0;
        });
    }
}
exports.CitizenPhotoRepository = CitizenPhotoRepository;
