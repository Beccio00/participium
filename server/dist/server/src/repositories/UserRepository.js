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
exports.UserRepository = void 0;
const AppDataSource_1 = require("../utils/AppDataSource");
const User_1 = require("../entities/User");
class UserRepository {
    constructor() {
        this.repository = AppDataSource_1.AppDataSource.getRepository(User_1.User);
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({ where: { email } });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({ where: { id } });
        });
    }
    findByIds(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findByIds(ids);
        });
    }
    findByRoles(roles) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.find({
                where: roles.map(role => ({ role }))
            });
        });
    }
    countByRole(role) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.count({ where: { role } });
        });
    }
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = this.repository.create(userData);
            return yield this.repository.save(user);
        });
    }
    update(id, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.update(id, userData);
            return yield this.findById(id);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.repository.delete(id);
            return result.affected !== 0;
        });
    }
    findWithPhoto(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.findOne({
                where: { id },
                relations: ["photo"]
            });
        });
    }
}
exports.UserRepository = UserRepository;
