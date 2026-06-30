export interface ContractConfigDto {
    name: string;
    symbol: string;
    decimals?: number;
    totalSupply?: string;
    royaltyPercentage?: number;
    features?: string[];
}
export declare class ContractsService {
    private templates;
    getTemplates(): {
        id: string;
        name: string;
        description: string;
    }[];
    generateSolidityCode(type: string, config: ContractConfigDto): string;
    compile(type: string, config: ContractConfigDto): {
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
