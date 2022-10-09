// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract zkShips is
    OwnableUpgradeable
{
    uint256 public constant FiledSize = 5;
    uint256 public constant ShipsCount = 3;

    enum Status{ CREATED, INPROGRESS, CANCELED, FINISHED }
    enum StepType {SHOT, MOVING, SKIPPING}

    struct Player {
        address addr;
        bool [FiledSize][FiledSize] shipPositions;
        uint256 shipsLeft;
    }

    struct Game {
        Status status;
        Player creator;
        Player competitor;
        Player winner;
        bool isStepOfCreator;
        bool isExist;
    }

    mapping(uint256 => Game) public games; 
    uint256 gameCount;
    mapping(uint256 => address) private owners;

    function initialize(string memory name_, string memory symbol_)
        public
        initializer
    {
        __Ownable_init();
    }

    function createGame(bool[FiledSize][FiledSize] memory _shipPositions) public returns (uint256) {
        //todo create that user haven't active games
        uint256 gameId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        games[gameId].status = Status.CREATED;
        games[gameId].creator.addr = msg.sender;
        games[gameId].creator.shipPositions = _shipPositions;
        games[gameId].creator.shipsLeft = ShipsCount;
        games[gameId].isExist=true;
        owners[gameId] = msg.sender;
        gameCount++;
        return gameId;
    }

    function getGames(Status _status) public view returns(Game[] memory filteredGames) {
    Game[] memory gamesTemp = new Game[](gameCount);
    uint count;
    for(uint i = 0; i<gameCount; i++){
      if (games[i].status == _status) {
        gamesTemp[count] = games[i];
        count += 1;
      }
    }

    filteredGames = new Game[](count);
    for(uint i = 0; i<count; i++){
      filteredGames[i] = gamesTemp[i];
    }
  }

    function join (uint256 _gameId, bool[FiledSize][FiledSize] memory _shipPositions) public returns (bool) {
        require(_exists(_gameId));
        if (games[_gameId].status != Status.CREATED) return false;
        games[_gameId].status = Status.INPROGRESS;
        games[_gameId].competitor.addr = msg.sender;
        games[_gameId].competitor.shipPositions = _shipPositions;
        games[_gameId].competitor.shipsLeft = ShipsCount;
        games[_gameId].isStepOfCreator = true;
        return true;
    }

    function _exists(uint256 _gameId) internal view virtual returns (bool) {
        return games[_gameId].isExist;
    }

    function _checkStep(uint256 _gameId, address _sender) private view returns (bool){
        if (games[_gameId].isStepOfCreator && _sender == games[_gameId].creator.addr) {
            return true;
        }
        if (!games[_gameId].isStepOfCreator && _sender == games[_gameId].competitor.addr) {
            return true;
        }
        return false;
    }

    function _changeStep(uint256 _gameId) private {
        games[_gameId].isStepOfCreator = !games[_gameId].isStepOfCreator;
    }

    function _finish (uint256 _gameId, Player memory _winner) private {
        games[_gameId].status = Status.FINISHED;
        games[_gameId].winner = _winner;
    }

    function _checkMove (bool[FiledSize][FiledSize] memory _oldPositions, bool[FiledSize][FiledSize] memory _newPositions) private view returns (bool){
        //todo add step check
        return true;
    }

    function finish (uint256 _gameId) public {
        require(_exists(_gameId));
        if (_checkStep(_gameId, msg.sender))
        
        if (msg.sender == games[_gameId].creator.addr) {
            _finish(_gameId, games[_gameId].competitor);
        }
        else  {
            _finish(_gameId, games[_gameId].creator);
        }
    }



    function moving (uint256 _gameId, bool[FiledSize][FiledSize] memory _shipPositions) public {
        //проверка хода
        require(_exists(_gameId));
        if (_checkStep(_gameId, msg.sender))
        {
            if (msg.sender == games[_gameId].creator.addr) {
                if (_checkMove( games[_gameId].creator.shipPositions, _shipPositions)) {
                    games[_gameId].creator.shipPositions = _shipPositions;
                }
            }
            else  {
                if (_checkMove( games[_gameId].competitor.shipPositions, _shipPositions)) {
                    games[_gameId].competitor.shipPositions = _shipPositions;
                }
            }
            _changeStep(_gameId);
        }
        
    }

    function shotting (uint256 _gameId, uint256 x, uint256 y) public {
        if (_checkStep(_gameId, msg.sender))
        {
            if (msg.sender == games[_gameId].creator.addr) {
                if(games[_gameId].competitor.shipPositions[x][y]) {
                    games[_gameId].competitor.shipPositions[x][y]=false;
                    games[_gameId].competitor.shipsLeft--;
                    if(games[_gameId].competitor.shipsLeft == 0) {
                        _finish(_gameId, games[_gameId].creator);
                    }
                }
                else {
                    games[_gameId].creator.shipPositions[x][y]=false;
                    games[_gameId].creator.shipsLeft--;
                    if(games[_gameId].creator.shipsLeft == 0) {
                        _finish(_gameId, games[_gameId].competitor);
                    }
                }
            }
            else  {
                if(games[_gameId].creator.shipPositions[x][y]) {
                    games[_gameId].creator.shipPositions[x][y]=false;
                    games[_gameId].creator.shipsLeft--;
                    if(games[_gameId].creator.shipsLeft == 0) {
                        _finish(_gameId, games[_gameId].competitor);
                    }
                }
                else {
                    games[_gameId].competitor.shipPositions[x][y]=false;
                    games[_gameId].competitor.shipsLeft--;
                    if(games[_gameId].competitor.shipsLeft == 0) {
                        _finish(_gameId, games[_gameId].creator);
                    }
                }
            }
            _changeStep(_gameId);
        }
    }

    function skipping (uint256 _gameId) public {
        if (_checkStep(_gameId, msg.sender)) {
            _changeStep(_gameId);
        }
    }

    function getStatus (uint256 _gameId) public view  {
        require(_exists(_gameId));
        if (msg.sender == games[_gameId].creator.addr) {
            games[_gameId].competitor.shipsLeft;
        }
        else {
            games[_gameId].creator.shipsLeft;
        }
    }
}
