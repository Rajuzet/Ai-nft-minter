"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const contracts_service_1 = require("./contracts.service");
const class_validator_1 = require("class-validator");
class CompileRequestDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The smart contract standard type (ERC-20, ERC-721, ERC-1155, Soulbound, Vesting)', example: 'ERC-20' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompileRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Contract details' }),
    __metadata("design:type", Object)
], CompileRequestDto.prototype, "config", void 0);
let ContractsController = class ContractsController {
    constructor(contractsService) {
        this.contractsService = contractsService;
    }
    getTemplates() {
        return this.contractsService.getTemplates();
    }
    compile(body) {
        return this.contractsService.compile(body.type, body.config);
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'List all audited smart contract templates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('compile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate and compile Solidity code for a configured template' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CompileRequestDto]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "compile", null);
exports.ContractsController = ContractsController = __decorate([
    (0, swagger_1.ApiTags)('Contract Builder'),
    (0, common_1.Controller)('api/v1/contracts'),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map