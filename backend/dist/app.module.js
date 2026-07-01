"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const ai_studio_module_1 = require("./ai-studio/ai-studio.module");
const contracts_module_1 = require("./contracts/contracts.module");
const collections_module_1 = require("./collections/collections.module");
const marketplace_module_1 = require("./marketplace/marketplace.module");
const defi_module_1 = require("./defi/defi.module");
const dao_module_1 = require("./dao/dao.module");
const ai_orchestrator_module_1 = require("./ai-orchestrator/ai-orchestrator.module");
const analytics_module_1 = require("./analytics/analytics.module");
const profile_module_1 = require("./profile/profile.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ai_studio_module_1.AiStudioModule,
            contracts_module_1.ContractsModule,
            collections_module_1.CollectionsModule,
            marketplace_module_1.MarketplaceModule,
            defi_module_1.DefiModule,
            dao_module_1.DaoModule,
            ai_orchestrator_module_1.AiOrchestratorModule,
            analytics_module_1.AnalyticsModule,
            profile_module_1.ProfileModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map