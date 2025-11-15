// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OnePerWalletNFT is ERC721Enumerable, Ownable {
    string private _commonTokenURI; // same URI for everyone

    mapping(address => bool) public hasMinted;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory commonTokenURI_ // full IPFS URI to the metadata JSON
    )
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {
        _commonTokenURI = commonTokenURI_;
    }

    function mint() external {
        require(!hasMinted[msg.sender], "Already minted");

        uint256 tokenId = totalSupply() + 1;
        hasMinted[msg.sender] = true;
        _safeMint(msg.sender, tokenId);
    }

    // 🔑 Same metadata for all tokens
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId); // or: require(_exists(tokenId), "Nonexistent token");
        return _commonTokenURI;
    }

    // Optional: change the common metadata URI later
    function setCommonTokenURI(string memory newURI) external onlyOwner {
        _commonTokenURI = newURI;
    }
}