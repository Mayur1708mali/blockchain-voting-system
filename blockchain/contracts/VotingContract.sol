// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VotingContract
 * @dev A blockchain-based voting system that ensures one-person-one-vote
 *      and tamper-proof vote storage with results hidden until election close.
 */
contract VotingContract is Ownable {
    enum ElectionStatus {
        Active,
        Closed
    }

    enum ElectionType {
        SingleChoice,
        MultiChoice
    }

    struct Election {
        uint256 candidateCount;
        ElectionStatus status;
        ElectionType electionType;
        bool exists;
    }

    // electionId => Election
    mapping(uint256 => Election) public elections;

    // electionId => candidateIndex => voteCount
    mapping(uint256 => mapping(uint256 => uint256)) private voteCounts;

    // electionId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // electionId => total votes
    mapping(uint256 => uint256) public totalVotes;

    // Events
    event ElectionCreated(
        uint256 indexed electionId,
        uint256 candidateCount,
        uint8 electionType
    );
    event VoteCast(
        uint256 indexed electionId,
        address indexed voter,
        uint256 candidateIndex
    );
    event ElectionClosed(uint256 indexed electionId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new election
     * @param electionId Unique identifier for the election
     * @param candidateCount Number of candidates
     * @param electionType 0 = SingleChoice, 1 = MultiChoice
     */
    function createElection(
        uint256 electionId,
        uint256 candidateCount,
        uint8 electionType
    ) external onlyOwner {
        require(!elections[electionId].exists, "Election already exists");
        require(candidateCount >= 2, "At least 2 candidates required");
        require(electionType <= 1, "Invalid election type");

        elections[electionId] = Election({
            candidateCount: candidateCount,
            status: ElectionStatus.Active,
            electionType: ElectionType(electionType),
            exists: true
        });

        emit ElectionCreated(electionId, candidateCount, electionType);
    }

    /**
     * @dev Cast a vote in an election
     * @param electionId The election to vote in
     * @param candidateIndex The candidate to vote for (0-indexed)
     */
    function castVote(uint256 electionId, uint256 candidateIndex) external {
        Election storage election = elections[electionId];

        require(election.exists, "Election does not exist");
        require(
            election.status == ElectionStatus.Active,
            "Election is not active"
        );
        require(
            candidateIndex < election.candidateCount,
            "Invalid candidate index"
        );
        require(
            !hasVoted[electionId][msg.sender],
            "You have already voted in this election"
        );

        hasVoted[electionId][msg.sender] = true;
        voteCounts[electionId][candidateIndex]++;
        totalVotes[electionId]++;

        emit VoteCast(electionId, msg.sender, candidateIndex);
    }

    /**
     * @dev Close an election (only owner)
     * @param electionId The election to close
     */
    function closeElection(uint256 electionId) external onlyOwner {
        Election storage election = elections[electionId];

        require(election.exists, "Election does not exist");
        require(
            election.status == ElectionStatus.Active,
            "Election is not active"
        );

        election.status = ElectionStatus.Closed;

        emit ElectionClosed(electionId);
    }

    /**
     * @dev Get election results (only available after election is closed)
     * @param electionId The election to get results for
     * @return results Array of vote counts per candidate
     */
    function getResults(
        uint256 electionId
    ) external view returns (uint256[] memory) {
        Election storage election = elections[electionId];

        require(election.exists, "Election does not exist");
        require(
            election.status == ElectionStatus.Closed,
            "Election is still active - results hidden"
        );

        uint256[] memory results = new uint256[](election.candidateCount);
        for (uint256 i = 0; i < election.candidateCount; i++) {
            results[i] = voteCounts[electionId][i];
        }

        return results;
    }

    /**
     * @dev Get election status
     * @param electionId The election to check
     * @return status 0 = Active, 1 = Closed
     */
    function getElectionStatus(
        uint256 electionId
    ) external view returns (ElectionStatus) {
        require(elections[electionId].exists, "Election does not exist");
        return elections[electionId].status;
    }

    /**
     * @dev Check if a voter has voted in an election
     * @param electionId The election to check
     * @param voter The voter address to check
     * @return bool Whether the voter has voted
     */
    function checkHasVoted(
        uint256 electionId,
        address voter
    ) external view returns (bool) {
        return hasVoted[electionId][voter];
    }

    /**
     * @dev Get total votes cast in an election
     * @param electionId The election to check
     * @return uint256 Total number of votes
     */
    function getTotalVotes(
        uint256 electionId
    ) external view returns (uint256) {
        require(elections[electionId].exists, "Election does not exist");
        return totalVotes[electionId];
    }
}
