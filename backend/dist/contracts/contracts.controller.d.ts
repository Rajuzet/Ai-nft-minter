import { ContractsService, ContractConfigDto } from './contracts.service';
declare class CompileRequestDto {
    type: string;
    config: ContractConfigDto;
}
export declare class ContractsController {
    private readonly contractsService;
    constructor(contractsService: ContractsService);
    getTemplates(): {
        id: string;
        name: string;
        description: string;
    }[];
    compile(body: CompileRequestDto): {
        abi: ({
            type: string;
            inputs: any[];
            name?: undefined;
            outputs?: undefined;
        } | {
            type: string;
            name: string;
            inputs: any[];
            outputs: {
                type: string;
            }[];
        })[];
        bytecode: string;
        solidityVersion: string;
        sourceCode: string;
    };
}
export {};
