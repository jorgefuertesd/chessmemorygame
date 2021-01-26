const App = {
    state: {
        currentPiece: null,
        currentBox: null,
        showMoves: false,
        boxes: document.querySelectorAll('.box button'),
        pieces: document.querySelectorAll('.pieces button'),
    },
    init: () => {
        for (let piece of App.state.pieces) {
            piece.addEventListener('click', App.setPiece);
        }

        for (let box of App.state.boxes) {
            box.addEventListener('click', App.setBox);
        }

        const flipBtn = document.querySelector('#flip-board');
        flipBtn.addEventListener('change', App.flipBoard);

        const showMovesBtn = document.querySelector('#show-moves');
        showMovesBtn.addEventListener('change', App.toggleMoves);
    },
    setPiece: (event) => {
        let self = event.target;

        App.clearPieces();
        App.state.currentPiece = self.dataset.piece;
        self.parentElement.classList.add('active');
    },
    setBox: (event) =>  {
        const self = event.target;

        App.showMoves(self.dataset.name, App.state.currentPiece);

        if(self.dataset.piece !== '' && App.state.currentPiece === 'rm') {
            App.currentPieceBtn(self.dataset.piece).disabled = false;
            self.dataset.piece = '';
            return;
        }

        if (self.dataset.piece) {
            return;
        }

        if ( !App.state.currentPiece || !App.isValidPieceQty(App.state.currentPiece) ) {
            return;
        }

        App.state.currentBox = self.dataset.name;
        self.dataset.piece = App.state.currentPiece;

        if (!App.isValidPieceQty(App.state.currentPiece)) {
            App.currentPieceBtn().disabled = true;
            App.clearPieces();
        }
    },
    showMoves: (box, piece) => {
        if (!piece) return;

        const info = getPieceInfo(piece);
        const moves = Rules.moves[info.name](box, info);

        App.clearMoves();
        for (const move of moves) {
            let box = document.querySelector('.box [data-name="' + move + '"]');
            let currentPiece = box.dataset.piece;

            if (currentPiece) {
                let cpInfo = getPieceInfo(currentPiece)
                if( cpInfo.color !== info.color ) {
                    box.classList.add('danger');
                }
                continue;
            }

            box.classList.add('highlight');
        }
    },
    clearPieces: () => {
        for (let piece of App.state.pieces) {
            piece.parentElement.classList.remove('active');
            App.state.currentPiece = null;
        }
    },
    clearBoard: () => {
        const boxes = document.querySelectorAll('.box button');
        const pieces = document.querySelectorAll('.piece button');

        for (let box of boxes) {
            box.dataset.piece = '';
        }

        for (let piece of pieces) {
            piece.disabled = false;
        }
    },
    clearMoves: () => {
        for (let box of App.state.boxes) {
            box.classList.remove('highlight');
            box.classList.remove('danger');
        }
    },
    flipBoard: (e) => {
        const board = document.querySelector('.board');
        if (e.target.checked) {
            board.classList.add('flip');
        } else {
            board.classList.remove('flip');
        }
    },
    toggleMoves: (e) => {
        const board = document.querySelector('.board');
        if (e.target.checked) {
            board.classList.add('show-moves');
        } else {
            board.classList.remove('show-moves');
        }
    },
    currentPieceBtn: (piece = false) => {
        const selector = piece ? piece : App.state.currentPiece;

        if (!selector) {
            return {};
        }

        return document.querySelector('.piece [data-piece="' + selector +'"]')
    },
    isValidPieceQty: (piece) => {
        const current = document.querySelectorAll(`[data-piece="${piece}"]`);
        const pieceInfo = getPieceInfo(piece);

        if (current.length <= Rules.sets[pieceInfo.name] || piece == 'rm') {
            return true;
        }
    },
};

const Game = {
    state: {
        currentLevel: 1,
        currentPosition: [],
        history: [],
        taken: [],
        board: virtualBoard(),
    },
    level: {
        //Keep kings at the end.
        1: ['rw','nw','bb','kw','kb'],
        2: ['rw','nw','bw','rb','nb','kw','kb'],
        3: ['qw','nw','pw','pw','pw','pb','pb','pw','bw','rb','nb','kw','kb']
    },
    init: () => {
        Game.setBoard(Game.getRandomBoard());
    },
    setBoard: (positions) => {
        App.clearBoard();
        for (const position of positions) {
            let box = document.querySelector(`[data-name="${position.box}"]`);
            box.dataset.piece = position.piece
        }
    },
    getRandomBoard: () => {
        Game.state.taken = [];

        const positions = [];

        for(const piece of Game.level[Game.state.currentLevel]) {
            let box = Game.getRandomBox(piece);
            positions.push({
                piece: piece,
                box: box,
            });
        }

        Game.state.history.push(positions);
        Game.state.currentPosition = positions;

        return positions;
    },
    getRandomBox: (piece) => {
        let box = getRandom(Game.state.board);
        let pInfo = getPieceInfo(piece);

        if (Game.state.taken.length === 64) {
            return '';
        }

        if (Game.state.taken.indexOf(box) > -1 || (pInfo.name === 'p' && isBorderBox(box)) ) {
            return Game.getRandomBox(piece);
        }

        if (pInfo.name === 'k') {
            Game.state.taken = Game.state.taken.concat(Rules.moves['k'](box))
        }

        Game.state.taken.push(box);
        return box;
    },
}

/**
 * Rules
 */
const Rules = {
    sets: {
        k: 1,
        q: 1,
        b: 2,
        n: 2,
        r: 2,
        p: 8,
    },
    moves: {
        b: (box) => {
            const x = getX(box);
            const y = getY(box);
            let boxes = [];

            let startX = x - (y-1);
            let startY = y + (x-1);

            for (let i = 0; i <= 8; i++) {
                let posX = startX + i;
                let posY = 1 + i;

                if (!reachLimit(posX, posY)) {
                    boxes.push(`${getLetter(posX)}${posY}`);
                }

                posX = 1 + i;
                posY = startY - i;

                if (!reachLimit(posX, posY)) {
                    boxes.push(`${getLetter(posX)}${posY}`);
                }

            }

            return boxes;
        },
        r: (box) => {
            const x = getX(box);
            const y = getY(box);
            let boxes = [];

            for (let i = 0; i <= 8; i++) {
                let posX = 1 + i;
                let posY = y;

                if (!reachLimit(posX, posY)) {
                    boxes.push(`${getLetter(posX)}${posY}`);
                }

                posX = x;
                posY = 1 + i;

                if (!reachLimit(posX, posY)) {
                    boxes.push(`${getLetter(posX)}${posY}`);
                }
            }

            return boxes;
        },
        n: (box) => {
            const x = getX(box);
            const y = getY(box);

            const coordinates = [
                [x+1, y+2],
                [x+2, y+1],
                [x+2, y-1],
                [x+1, y-2],
                [x-1, y-2],
                [x-2, y-1],
                [x-2, y+1],
                [x-1, y+2],
            ];

            return coordinates
                .filter(c => !reachLimit(c[0], c[1]))
                .map(c => `${getLetter(c[0])}${c[1]}`);
        },
        q: (box) => {
            return Rules.moves.r(box).concat(Rules.moves.b(box));
        },
        k: (box) => {
            const x = getX(box);
            const y = getY(box);

            const coordinates = [
                [x, y+1],
                [x+1, y+1],
                [x+1, y],
                [x+1, y-1],
                [x, y-1],
                [x-1, y-1],
                [x-1, y],
                [x-1, y+1],
            ];

            return coordinates
                .filter(c => !reachLimit(c[0], c[1]))
                .map(c => `${getLetter(c[0])}${c[1]}`);
        },
        p: (box, info) => {
            const x = getX(box);
            const y = getY(box);
            let coordinates;

            if (info.color === 'w') {
                coordinates = [
                    [x, y+1],
                ];

                if (y === 2) {
                    coordinates.push([x, y+2]);
                }
            }

            if (info.color === 'b') {
                coordinates = [
                    [x, y-1],
                ];

                if (y === 7) {
                    coordinates.push([x, y-2]);
                }
            }

            return coordinates
                .filter(c => !reachLimit(c[0], c[1]))
                .map(c => `${getLetter(c[0])}${c[1]}`);
        },
    }
}

/**
 * Helpers
 */
function getX(box) {
    const position = box[0];
    const map = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7,
        h: 8,
    }
    return map[position];
}

function getY(box) {
    return parseInt(box[1]);
}

function getLetter(x) {
    const map = {
        1 : 'a',
        2 : 'b',
        3 : 'c',
        4 : 'd',
        5 : 'e',
        6 : 'f',
        7 : 'g',
        8 : 'h',
    }
    return map[x];
}

function virtualBoard() {
    const boxes = [];0

    for (let i = 1; i <= 8; i++) {
        let letter = getLetter(i);
        for (let z = 1; z <= 8; z++) {
            boxes.push(`${letter}${z}`)
        }
    }

    return boxes;
}

function reachLimit(x, y)
{
    return x < 1 || x > 8 || y < 1 || y > 8;
}

function getPieceInfo(piece) {
    return {
        name: piece[0],
        color: piece[1],
    }
}

function getRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function isBorderBox(box) {
    return box.indexOf('1') > -1 || box.indexOf('8') > -1;
}

App.init();
