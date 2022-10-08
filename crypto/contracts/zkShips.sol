// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract zkShips is
    Ownable
{
    uint256 public constant FiledSize = 5;
    uint256 public constant ShipsCount = 3;

    enum Status{ CREATED, INPROGRESS, CANCELED, FINISHED }

    struct Field {
        bool[FiledSize][FiledSize] shipPositions;
        uint256 shipsLeft;
    }

    struct Player {
        address addr;
        Field field;
    }

    struct Game {
        Status status;
        Player creator;
        Player competitor;
    }

    mapping(uint256 => Game[]) public games; 
    mapping(Status => Game[]) public gameStatuses;

    function initialize(string memory name_, string memory symbol_)
        public
        initializer
    {
        __Ownable_init();
    }

    function createGame() public returns (uint256) {
        //проверить что у пользователя нет активных игр
        uint256 gameId = uint256(keccak256(msg.sender, block.blockhash(block.number - 1)));
        games[gameId].status = Status.CREATED;
        games[gameId].creator.addr = msg.sender;
    }

    function getGames(Status _status) 
        public
        view 
        returns (Game[] memoty) 
    {
        require(_status);
        //добавить фильтрацию
        return games;
    }
}
