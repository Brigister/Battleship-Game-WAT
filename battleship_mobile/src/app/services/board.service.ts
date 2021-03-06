import { Injectable } from '@angular/core';
import { Board } from '../board'
import { Player } from '../player'
import { AuthService } from './auth.service'


@Injectable()
export class BoardService {

  boards: Board[] = [];
  
  constructor(private authService: AuthService) { }

  // Costruisce la board 
  createBoard(size: number = 10): Board[] {
    let tiles = [];
    for (let i = 0; i < size; i++) {
      tiles[i] = [];
      for (let j = 0; j < size; j++) {
        tiles[i][j] = {value: 0, status: ''};
      }
    }

    let board = new Board({
      Player: new Player({ id: this.authService.getId(), username: this.authService.getUsername() }),
      tiles: tiles
    });
    this.boards.unshift(board);
    console.log(this.boards)
    return tiles;
  }

  // Ritorna le board
  getBoards(): Board[] {
    return this.boards;
  }
}
