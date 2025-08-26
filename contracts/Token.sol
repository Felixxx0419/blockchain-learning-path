//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);

    modifier onlyOwner() {
      require(msg.sender == owner, "Only owner can call this");
      _;
    }

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply) {
      name = _name;
      symbol = _symbol;
      decimals = _decimals;
      owner = msg.sender;
      mint(msg.sender, _initialSupply);

    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
      require(balanceOf[msg.sender] >= _value, "Insufficient balance");
      require(_to != address(0), "Invalid recipient");

      balanceOf[msg.sender] -= _value;
      balanceOf[_to] += _value;

      emit Transfer(msg.sender, _to, _value);
      return true;
    }

    function mint(address _to, uint256 _value) public onlyOwner {
      balanceOf[_to] += _value;
      totalSupply += _value;
      emit Mint(_to, _value);
      emit Transfer(address(0), _to, _value);
    }
}
