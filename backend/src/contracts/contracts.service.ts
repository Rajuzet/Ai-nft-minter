import { Injectable, BadRequestException } from '@nestjs/common';

export interface ContractConfigDto {
  name: string;
  symbol: string;
  decimals?: number;
  totalSupply?: string;
  royaltyPercentage?: number;
  features?: string[];
}

@Injectable()
export class ContractsService {
  private templates = [
    { id: 'ERC-20', name: 'Standard Utility Token (ERC-20)', description: 'Audited mintable, burnable, and lockable utility token standard.' },
    { id: 'ERC-721', name: 'Digital Art Collection (ERC-721)', description: 'Audited non-fungible token standard with ERC-2981 royalty support.' },
    { id: 'ERC-1155', name: 'Multi-Token Standard (ERC-1155)', description: 'Supports managing multiple token types (fungible and non-fungible) in a single contract.' },
    { id: 'Soulbound', name: 'Soulbound Badge (ERC-721 Non-transferable)', description: 'Non-transferable on-chain credentials and membership badges.' },
    { id: 'Vesting', name: 'Token Vesting Escrow', description: 'Locks tokens and releases them linearly according to a custom schedule (cliff + duration).' }
  ];

  getTemplates() {
    return this.templates;
  }

  generateSolidityCode(type: string, config: ContractConfigDto): string {
    const { name, symbol, decimals = 18, totalSupply = '0', royaltyPercentage = 5, features = [] } = config;

    if (type === 'ERC-20') {
      const isMintable = features.includes('Mintable');
      const isBurnable = features.includes('Burnable');
      return `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
${isMintable ? 'import "@openzeppelin/contracts/access/Ownable.sol";\n' : ''}
contract ${name.replace(/\s+/g, '')}Token is ERC20${isMintable ? ', Ownable' : ''} {
    constructor() ERC20("${name}", "${symbol}") {
        _mint(msg.sender, ${totalSupply} * 10 ** decimals());
    }
    
    ${isMintable ? `function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }` : ''}
}`;
    }

    if (type === 'ERC-721') {
      return `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')}Collection is ERC721URIStorage, ERC2981, Ownable {
    uint256 public nextTokenId;
    
    constructor() ERC721("${name}", "${symbol}") {
        _setDefaultRoyalty(msg.sender, ${royaltyPercentage * 100});
    }
    
    function mint(address recipient, string memory _tokenURI) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId = tokenId + 1;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        return tokenId;
    }
}`;
    }

    return `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract CustomWcosContract {
    string public name = "${name}";
    string public symbol = "${symbol}";
}`;
  }

  compile(type: string, config: ContractConfigDto) {
    if (!config.name || !config.symbol) {
      throw new BadRequestException('Contract name and symbol are required for compilation.');
    }

    const sourceCode = this.generateSolidityCode(type, config);

    // Mock Solidity compiler output (resembles Forge/solc compiled results)
    const abi = [
      { type: 'constructor', inputs: [] },
      { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }] },
      { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }] }
    ];

    if (type === 'ERC-721') {
      abi.push({ type: 'function', name: 'mint', inputs: [{ type: 'address', name: 'recipient' }, { type: 'string', name: '_tokenURI' }], outputs: [{ type: 'uint256' }] });
    }

    const mockBytecode = '0x608060405234801561001057600080fd5b5061011c806100206000396000f3fe';

    return {
      abi,
      bytecode: mockBytecode,
      solidityVersion: '0.8.20',
      sourceCode
    };
  }
}
