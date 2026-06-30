"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStudioModule = void 0;
const common_1 = require("@nestjs/common");
const ai_studio_controller_1 = require("./ai-studio.controller");
const ai_studio_service_1 = require("./ai-studio.service");
const storage_service_1 = require("../storage/storage.service");
let AiStudioModule = class AiStudioModule {
};
exports.AiStudioModule = AiStudioModule;
exports.AiStudioModule = AiStudioModule = __decorate([
    (0, common_1.Module)({
        controllers: [ai_studio_controller_1.AiStudioController],
        providers: [ai_studio_service_1.AiStudioService, storage_service_1.StorageService],
        exports: [ai_studio_service_1.AiStudioService],
    })
], AiStudioModule);
//# sourceMappingURL=ai-studio.module.js.map