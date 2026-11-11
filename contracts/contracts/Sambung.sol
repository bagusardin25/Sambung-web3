// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title Sambung — chain stories written one line at a time
/// @notice A story is opened with a title and a first line. Other wallets continue it,
///         one line per turn. Nobody may write twice in a row and nobody may write more
///         than a third of a story, so every finished story has at least three authors.
///         When the last line lands the story is sealed for good.
/// @dev    Holds no funds and has no payable entry point. The public BOT Chain RPC does
///         not serve eth_getLogs, so every piece of state the app needs is readable
///         through view functions; events exist for explorers only.
contract Sambung {
    // ───────────────────────────── Limits ─────────────────────────────

    uint8 public constant GENRE_COUNT = 7;
    uint256 public constant MIN_TITLE_BYTES = 3;
    uint256 public constant MAX_TITLE_BYTES = 64;
    uint256 public constant MAX_LINE_BYTES = 280;
    uint256 public constant MAX_PEN_NAME_BYTES = 32;
    uint256 public constant MAX_PAGE_SIZE = 50;

    /// @dev writeStatus() codes
    uint8 public constant CAN_WRITE = 0;
    uint8 public constant STATUS_NOT_FOUND = 1;
    uint8 public constant STATUS_SEALED = 2;
    uint8 public constant STATUS_WROTE_LAST = 3;
    uint8 public constant STATUS_QUOTA_REACHED = 4;
    uint8 public constant STATUS_HIDDEN = 5;

    // ───────────────────────────── Storage ─────────────────────────────

    struct Story {
        // slot 1
        address starter;
        uint40 createdAt;
        uint40 sealedAt; // 0 while the story is still open
        uint8 genre;
        uint8 maxLines;
        // slot 2
        address lastAuthor;
        uint32 applause;
        uint8 lineCount;
        uint8 authorCount;
        bool hidden;
        // slot 3+
        string title;
    }

    struct Line {
        address author;
        uint40 writtenAt;
        string text;
    }

    struct Profile {
        uint32 linesWritten;
        uint32 storiesStarted;
        uint32 storiesJoined;
        string penName;
    }

    /// @notice Everything a list card or a story header needs, in one read.
    struct StoryView {
        uint256 id;
        address starter;
        address lastAuthor;
        uint40 createdAt;
        uint40 sealedAt;
        uint32 applause;
        uint8 genre;
        uint8 maxLines;
        uint8 lineCount;
        uint8 authorCount;
        bool hidden;
        string title;
        string opening;
        string latest;
    }

    address public owner;

    uint256 public storyCount;
    uint256 public sealedCount;
    uint256 public totalLines;
    uint256 public totalAuthors;
    uint256 public totalApplause;

    mapping(uint256 => Story) private _stories; // ids start at 1
    mapping(uint256 => Line[]) private _lines;
    mapping(uint256 => mapping(address => uint8)) private _linesBy;
    mapping(uint256 => mapping(address => bool)) private _applauded;
    mapping(address => Profile) private _profiles;
    mapping(address => uint256[]) private _storiesOf;

    // ───────────────────────────── Events ─────────────────────────────

    event StoryStarted(uint256 indexed storyId, address indexed starter, uint8 genre, uint8 maxLines, string title);
    event LineAdded(uint256 indexed storyId, uint256 indexed lineIndex, address indexed author);
    event StorySealed(uint256 indexed storyId, uint8 authorCount);
    event Applauded(uint256 indexed storyId, address indexed reader);
    event PenNameSet(address indexed author, string penName);
    event StoryHiddenSet(uint256 indexed storyId, bool hidden);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ───────────────────────────── Errors ─────────────────────────────

    error NotOwner();
    error ZeroAddress();
    error StoryNotFound();
    error StoryIsSealed();
    error StoryStillOpen();
    error StoryIsHidden();
    error NotYourTurn();
    error QuotaReached();
    error InvalidTitle();
    error InvalidGenre();
    error InvalidLength();
    error InvalidLine();
    error InvalidPenName();
    error AuthorsCannotApplaud();
    error AlreadyApplauded();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ───────────────────────────── Writing ─────────────────────────────

    /// @notice Open a new story. The opening line counts as the starter's first line.
    /// @param maxLines 6 (short), 12 (classic) or 18 (long)
    function startStory(
        string calldata title,
        uint8 genre,
        uint8 maxLines,
        string calldata openingLine
    ) external returns (uint256 storyId) {
        uint256 titleLen = bytes(title).length;
        if (titleLen < MIN_TITLE_BYTES || titleLen > MAX_TITLE_BYTES) revert InvalidTitle();
        if (genre >= GENRE_COUNT) revert InvalidGenre();
        if (maxLines != 6 && maxLines != 12 && maxLines != 18) revert InvalidLength();
        _checkLine(openingLine);

        storyId = ++storyCount;

        Story storage s = _stories[storyId];
        s.starter = msg.sender;
        s.createdAt = uint40(block.timestamp);
        s.genre = genre;
        s.maxLines = maxLines;
        s.title = title;

        _profiles[msg.sender].storiesStarted += 1;
        emit StoryStarted(storyId, msg.sender, genre, maxLines, title);

        _write(storyId, s, openingLine);
    }

    /// @notice Continue an open story with one line.
    function addLine(uint256 storyId, string calldata text) external {
        Story storage s = _stories[storyId];
        if (s.starter == address(0)) revert StoryNotFound();
        if (s.hidden) revert StoryIsHidden();
        if (s.sealedAt != 0) revert StoryIsSealed();
        if (s.lastAuthor == msg.sender) revert NotYourTurn();
        if (_linesBy[storyId][msg.sender] >= s.maxLines / 3) revert QuotaReached();
        _checkLine(text);

        _write(storyId, s, text);
    }

    /// @notice Applaud a finished story. One per wallet; its authors cannot applaud it.
    function applaud(uint256 storyId) external {
        Story storage s = _stories[storyId];
        if (s.starter == address(0)) revert StoryNotFound();
        if (s.hidden) revert StoryIsHidden();
        if (s.sealedAt == 0) revert StoryStillOpen();
        if (_linesBy[storyId][msg.sender] != 0) revert AuthorsCannotApplaud();
        if (_applauded[storyId][msg.sender]) revert AlreadyApplauded();

        _applauded[storyId][msg.sender] = true;
        s.applause += 1;
        totalApplause += 1;
        emit Applauded(storyId, msg.sender);
    }

    /// @notice Set the name shown next to your lines. An empty string clears it.
    function setPenName(string calldata penName) external {
        if (bytes(penName).length > MAX_PEN_NAME_BYTES) revert InvalidPenName();
        _profiles[msg.sender].penName = penName;
        emit PenNameSet(msg.sender, penName);
    }

    // ───────────────────────────── Owner ─────────────────────────────

    /// @notice Flag a story so the app stops listing it. The text itself cannot be
    ///         edited or removed by anyone, including the owner.
    function setHidden(uint256 storyId, bool hidden) external onlyOwner {
        Story storage s = _stories[storyId];
        if (s.starter == address(0)) revert StoryNotFound();
        s.hidden = hidden;
        emit StoryHiddenSet(storyId, hidden);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ───────────────────────────── Reading ─────────────────────────────

    function getStory(uint256 storyId) external view returns (StoryView memory) {
        if (_stories[storyId].starter == address(0)) revert StoryNotFound();
        return _view(storyId);
    }

    /// @notice Newest-first page of stories.
    /// @param cursor  id to start from; pass 0 to start at the newest story
    /// @param limit   page size, capped at MAX_PAGE_SIZE
    /// @return page        the stories, newest first
    /// @return nextCursor  pass this back to get the next page; 0 when there is none
    function getStories(
        uint256 cursor,
        uint256 limit
    ) external view returns (StoryView[] memory page, uint256 nextCursor) {
        uint256 from = (cursor == 0 || cursor > storyCount) ? storyCount : cursor;
        if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
        uint256 size = from < limit ? from : limit;

        page = new StoryView[](size);
        for (uint256 i = 0; i < size; ++i) {
            page[i] = _view(from - i);
        }
        nextCursor = from - size; // 0 once id 1 has been returned
    }

    /// @notice Stories by id, skipping ids that do not exist.
    function getStoriesByIds(uint256[] calldata ids) external view returns (StoryView[] memory page) {
        uint256 n = ids.length > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : ids.length;
        page = new StoryView[](n);
        for (uint256 i = 0; i < n; ++i) {
            if (_stories[ids[i]].starter != address(0)) page[i] = _view(ids[i]);
        }
    }

    function getLines(uint256 storyId) external view returns (Line[] memory) {
        return _lines[storyId];
    }

    /// @notice Why `wallet` can or cannot write the next line of a story.
    /// @return One of CAN_WRITE, STATUS_NOT_FOUND, STATUS_SEALED, STATUS_WROTE_LAST,
    ///         STATUS_QUOTA_REACHED, STATUS_HIDDEN
    function writeStatus(uint256 storyId, address wallet) external view returns (uint8) {
        Story storage s = _stories[storyId];
        if (s.starter == address(0)) return STATUS_NOT_FOUND;
        if (s.hidden) return STATUS_HIDDEN;
        if (s.sealedAt != 0) return STATUS_SEALED;
        if (s.lastAuthor == wallet) return STATUS_WROTE_LAST;
        if (_linesBy[storyId][wallet] >= s.maxLines / 3) return STATUS_QUOTA_REACHED;
        return CAN_WRITE;
    }

    function linesBy(uint256 storyId, address wallet) external view returns (uint8) {
        return _linesBy[storyId][wallet];
    }

    /// @notice How many lines `wallet` has written in each of the given stories.
    function linesByMany(uint256[] calldata storyIds, address wallet) external view returns (uint8[] memory counts) {
        counts = new uint8[](storyIds.length);
        for (uint256 i = 0; i < storyIds.length; ++i) {
            counts[i] = _linesBy[storyIds[i]][wallet];
        }
    }

    function hasApplauded(uint256 storyId, address wallet) external view returns (bool) {
        return _applauded[storyId][wallet];
    }

    function profileOf(
        address wallet
    )
        external
        view
        returns (string memory penName, uint32 linesWritten, uint32 storiesStarted, uint32 storiesJoined)
    {
        Profile storage p = _profiles[wallet];
        return (p.penName, p.linesWritten, p.storiesStarted, p.storiesJoined);
    }

    function getPenNames(address[] calldata wallets) external view returns (string[] memory names) {
        names = new string[](wallets.length);
        for (uint256 i = 0; i < wallets.length; ++i) {
            names[i] = _profiles[wallets[i]].penName;
        }
    }

    /// @notice Ids of every story `wallet` has written in, oldest first.
    function storiesOf(address wallet) external view returns (uint256[] memory) {
        return _storiesOf[wallet];
    }

    function stats()
        external
        view
        returns (uint256 stories, uint256 sealedStories, uint256 lines, uint256 authors, uint256 applause)
    {
        return (storyCount, sealedCount, totalLines, totalAuthors, totalApplause);
    }

    // ───────────────────────────── Internal ─────────────────────────────

    function _checkLine(string calldata text) private pure {
        uint256 len = bytes(text).length;
        if (len == 0 || len > MAX_LINE_BYTES) revert InvalidLine();
    }

    function _write(uint256 storyId, Story storage s, string calldata text) private {
        uint256 lineIndex = s.lineCount;
        _lines[storyId].push(Line({author: msg.sender, writtenAt: uint40(block.timestamp), text: text}));

        if (_linesBy[storyId][msg.sender] == 0) {
            s.authorCount += 1;
            _storiesOf[msg.sender].push(storyId);
            _profiles[msg.sender].storiesJoined += 1;
        }
        _linesBy[storyId][msg.sender] += 1;

        Profile storage p = _profiles[msg.sender];
        if (p.linesWritten == 0) totalAuthors += 1;
        p.linesWritten += 1;

        s.lastAuthor = msg.sender;
        s.lineCount = uint8(lineIndex + 1);
        totalLines += 1;
        emit LineAdded(storyId, lineIndex, msg.sender);

        if (s.lineCount == s.maxLines) {
            s.sealedAt = uint40(block.timestamp);
            sealedCount += 1;
            emit StorySealed(storyId, s.authorCount);
        }
    }

    function _view(uint256 storyId) private view returns (StoryView memory v) {
        Story storage s = _stories[storyId];
        Line[] storage lines = _lines[storyId];

        v.id = storyId;
        v.starter = s.starter;
        v.lastAuthor = s.lastAuthor;
        v.createdAt = s.createdAt;
        v.sealedAt = s.sealedAt;
        v.applause = s.applause;
        v.genre = s.genre;
        v.maxLines = s.maxLines;
        v.lineCount = s.lineCount;
        v.authorCount = s.authorCount;
        v.hidden = s.hidden;
        v.title = s.title;
        v.opening = lines[0].text;
        v.latest = lines[lines.length - 1].text;
    }
}
