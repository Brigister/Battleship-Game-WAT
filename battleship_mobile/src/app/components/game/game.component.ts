import { Component } from '@angular/core';
import { BoardService } from '../../services/board.service'
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import io from 'socket.io-client';
import { Player } from '../../player';
import { Board } from '../../board'
import { Router } from '@angular/router'

const board_size: number = 10;
const max_ship_lenght: number = 5;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  providers: [BoardService]
})

export class GameComponent {

  players: boolean = false;
  myBoard: object[];
  gameOver : boolean = false;
  ver: boolean = false;
  score: number = 0;

  // Array delle barche
  ship_array: any [] = [2, 2, 2, 2, 3, 3, 4, 4, 5];
  //ship_array: any [] = [2, 3, 4];
  ship_duplicate = this.ship_array.slice(0);

  gamedata: any = {
    socket: null,
    player: "",
    turno : "",
    sent: false,
    received: false,
    alone :false
    
  };

  horPos : Function;
  verPos : Function;
  positionCheck: Function;
  shipPositioning: Function;
  onPlayerClick: Function;
  submitPlayerClick: Function;
  onSunkCheck : Function;
  //handleReload : Function;
  

  username: string = this.authService.getUsername();
  id: string = this.authService.getId();
  
  constructor(
    private boardService: BoardService,
    private authService: AuthService,
    public dataService : DataService,
    private _router: Router
  ) {}

  
  ngOnInit(): void {    

    var self = this;


   /*  window.addEventListener('beforeunload', function(event){
      event.returnValue = 'Stai per ricaricare la pagina, ciò porterà ad una sconfitta';
      self.gamedata.socket.emit('on leaving');
      self.dataService.patchDefeat(self.username);
    }) */


    self.gamedata.turno = "1";

    self.gamedata.socket = io.connect('http://10.0.2.2:3000');

    self.gamedata.socket.on('connect', () => {
      console.log('loggato');
    })

    // Crea la lobby > il primo giocatore è il numero 1 
    self.gamedata.socket.on('create lobby', function (data) {
      self.gamedata.gameId = data;
      console.log("Lobby creata, gameId: " + self.gamedata.gameId);
      self.gamedata.player = "1";
      console.log(self.gamedata.player);
      self.gamedata.alone = true;

      console.log(self.gamedata.alone);
    });

    // Joina una lobby esistente > ha numero giocatore =2
    self.gamedata.socket.on('entering lobby', function (data) {
      self.gamedata.gameId = data;
      console.log("Lobby trovata, connessione alla partita: " + self.gamedata.gameId);
      if (self.gamedata.player == "") {
        self.gamedata.player = "2";
        console.log(self.gamedata.player);
        self.gamedata.socket.emit('on start');
      }
    });


    // Creazione boards
    self.gamedata.socket.on('on game start', function() {
      self.players = true;
      self.gamedata.alone = false;
      console.log("La partita è cominciata!");
      this.myBoard = self.boardService.createBoard();
      console.log(this.myBoard);
    
    });

    // Ricezione board Avversario > aggiunta alla fine di Boards[]
    self.gamedata.socket.on('receive board', function(data){
      console.log('ricevo board');
      let board = new Board({
        Player : new Player ({id: self.id, username: self.username}),
        tiles: data
      });
      self.boardService.boards.push(board);
      console.log(data);
      self.gamedata.received = true;
    })

    // Cambio turno da ricezione evento server
    self.gamedata.socket.on('change turn', function(newTurn) {
      self.gamedata.turno = newTurn;
      console.log('Turno' + self.gamedata.turno);
    }) 

    // Partita persa
    self.gamedata.socket.on('on loss', function(data){
      console.log(data + ' ha vinto la partita');
      self.gameOver = true;
      self.dataService.patchDefeat(self.username);
    })
    
    // Partita vinta per resa
    self.gamedata.socket.on('win by quit', function(data){
      console.log('Il tuo avversario ha abbandonato la partita');
      self.gameOver = true;
      self.score = 1000;
      self.dataService.patchVictory(self.username);
    })

    // Cambio posizionamento navi
    self.verPos = function(click: any){
      if (this.ver == false) {
        this.ver = true;
        document.getElementById("cambio").innerText="Stai posizionando in: Verticale";
      }
      else {
        this.ver = false;
        document.getElementById("cambio").innerText="Stai posizionando in: Orizzontale";
      }
    }

    // Controlla che le navi vengano inserite secondo le regole
    self.positionCheck = function(row : number, col : number, ship : number) {
      var _row : number = row;
      var _col : number = col;
      var rules = true;   

      if(this.ver){
        // Posizionamenti verticali all'interno del reticolo ed adiacenza ai lati
        for (var i = 0; i<ship; i++) {
          if (_row > (board_size-1)) {
              rules = false;
          }
          if(col == 0 && rules == true){
            if (this.boards[0].tiles[_row][col+1].value == 1 || this.boards[0].tiles[_row][col].value == 1){
              rules = false;
            }
          }else {
              if(col == (board_size-1) && rules == true){
                 if (this.boards[0].tiles[_row][col-1].value == 1 || this.boards[0].tiles[_row][col].value == 1){
                rules = false;
                  }
              }else{
                  if (rules == true){
                    if (this.boards[0].tiles[_row][col-1].value == 1 || this.boards[0].tiles[_row][col+1].value == 1 || this.boards[0].tiles[_row][col].value == 1){
                      rules = false;
                    }
                  }
                }
            }
        _row++;
        }
      
        if(row > 0 && rules == true){
          //controllo posizionamento verticale : barche sopra e sotto
          if (this.boards[0].tiles[row-1][col].value == 1){
            rules = false;
           }   
        }

        if (rules == true && (row+ship) < board_size && this.boards[0].tiles[row+ship][col].value == 1){
          rules = false;
        }  

      }
      else{
        // Controllo posizionamento orizzontale : rimanere all'interno del reticolo
        for (var i = 0; i<ship; i++) {
          if (_col > (board_size-1)) {
            rules = false;
          }
          console.log(_row + col);
          if(rules == true && row == 0 ){
            if (this.boards[0].tiles[row+1][_col].value == 1 || this.boards[0].tiles[row][_col].value == 1){
              rules = false;
            }
          }else{
              if(rules == true && row == (board_size-1)){
                if (this.boards[0].tiles[row-1][_col].value == 1 || this.boards[0].tiles[row][_col].value == 1){
                  rules = false;
                }
              }else{
                  if (rules == true){
                    if (this.boards[0].tiles[row-1][_col].value == 1 || this.boards[0].tiles[row+1][_col].value == 1 || this.boards[0].tiles[row][_col].value == 1){
                      rules = false;
                    }
                  }
                }     
             }
        _col++;
        }
  
        if(rules == true && col > 0){
          // Controllo posizionamento verticale : barche sopra e sotto
          if (this.boards[0].tiles[row][col-1].value == 1){
            rules = false;
         }   
        }

        if (rules == true && (col+ship) < board_size && this.boards[0].tiles[row][col+ship].value == 1){
          rules = false;
        }    
      }
      return rules;
    } 
   
    // Posiziona le barche nella board del Giocatore
    self.shipPositioning = function(click: any) {
      
      let id = click.target.id,
        boardId = 0,
        row = <number>id.substring(2, 3), col = <number>id.substring(3, 4),
        tile = this.boards[boardId].tiles[row][col];
    
      if (this.ship_array.length == 0) {
        console.log("barche esaurite");
        return;
      }

      if(this.positionCheck(+ row, + col, this.ship_array[0])){
          for (let i= 0; i < this.ship_array[0]; i++) {
          
          if (this.ver == true){
            this.boards[boardId].tiles[row++][col].value = 1;
          }
          else {
            this.boards[boardId].tiles[row][col++].value = 1;
          }
          
        }
        this.ship_array.splice(0,1);
        
      }
      else {
        alert("Non ti è consentito mettere una barca qui");
      }
    }

    // Controlla se una nave è stata affondata e in caso setta il tile.value = 2
    self.onSunkCheck = function(row : number, col : number) {
      var i = 1;
      var sunked: any[] = [this.boards[1].tiles[row][col]]

      debugger;
      //sotto
      while ( row+i < board_size && this.boards[1].tiles[row+i][col].value == 1 ) {
        if (this.boards[1].tiles[row+i][col].status == 'hit'){
          sunked.push(this.boards[1].tiles[row+i][col]);
          i++;
        }
        else return;
      }
      i = 1;

      //sopra
      while ( row-i >= 0 && this.boards[1].tiles[row-i][col].value == 1) {
        if (this.boards[1].tiles[row-i][col].status == 'hit'){
          sunked.push(this.boards[1].tiles[row-i][col]);
          i++;
        }
        else return;
      }
      i = 1;
      //destra 
      while ( col+i < board_size && this.boards[1].tiles[row][col+i].value == 1 ) {
        if (this.boards[1].tiles[row][col+i].status == 'hit'){
          sunked.push(this.boards[1].tiles[row][col+i]);
          i++;
        }
        else return;
      }
      i = 1;

      //sinistra 
      while ( col-i >= 0 && this.boards[1].tiles[row][col-i].value == 1 ) {
        if (this.boards[1].tiles[row][col-i].status == 'hit'){
          sunked.push(this.boards[1].tiles[row][col-i]);
          i++;
        }
        else return;
      }
      i = 1;
      
      
        //sotto
/*       if ( _row+1 < board_size && this.boards[1].tiles[row+1][col].value == 1 )  {
        for (let i = 1; i < max_ship_lenght; i++) {
          if (row+i < board_size) {
            if ( this.boards[1].tiles[row+i][col].value == 1 && this.boards[1].tiles[row+i][col].status == 'hit') {
                sunked.push(this.boards[1].tiles[row+i][col])
            } else {
                    if ( this.boards[1].tiles[row+i][col].value == 1 && this.boards[1].tiles[row+i][col].status != 'hit') {
                      return
                    }
            }
          }
        }
      } 
      
      //sopra
      if ( _row-1 >= 0 && this.boards[1].tiles[row-1][col].value == 1 )  {
        for (let i = 1; i < max_ship_lenght; i++) {
          if (row-i >= 0) {
            if ( this.boards[1].tiles[row-i][col].value == 1 && this.boards[1].tiles[row-i][col].status == 'hit') {
                sunked.push(this.boards[1].tiles[row-i][col])
            } else {
                    if ( this.boards[1].tiles[row-i][col].value == 1 && this.boards[1].tiles[row-i][col].status != 'hit') {
                      return
                    }
            }
          }
        }
      }

      //sinistra
      if ( _col-1 >= 0 && this.boards[1].tiles[row][col-1].value == 1 )  {
        for (let i = 1; i < max_ship_lenght; i++) {
          if (col-i >= 0) {
            if ( this.boards[1].tiles[row][col-i].value == 1 && this.boards[1].tiles[row][col-i].status == 'hit') {
                sunked.push(this.boards[1].tiles[row][col-i])
            } else {
                    if ( this.boards[1].tiles[row][col-i].value == 1 && this.boards[1].tiles[row][col-i].status != 'hit') {
                      return
                    }
            }
          }
        }
      }

      //destra
      if ( _col+1 < board_size && this.boards[1].tiles[row][col+1].value == 1 )  {
        for (let i = 1; i < max_ship_lenght; i++) {
          if (col+i < board_size ) {
            if ( this.boards[1].tiles[row][col+i].value == 1 && this.boards[1].tiles[row][col+i].status == 'hit') {
                sunked.push(this.boards[1].tiles[row][col+i])
            } else {
                    if ( this.boards[1].tiles[row][col+i].value == 1 && this.boards[1].tiles[row][col+i].status != 'hit') {
                      return
                    }
            }
          }
        }
      }
      */
        
      for (let i = 0; i < sunked.length; i++) {
        sunked[i].value = 2;
        }
    }

    // Gestisce il click del Giocatore sulla board Avversaria
    self.onPlayerClick = function(click:any) {
      
      let id = click.target.id,
      row = id.substring(2,3), col = id.substring(3,4),
      tile = this.boards[1].tiles[row][col];
      console.log(tile);
      this.gamedata.socket.emit('on fire', id);

      if (this.checkValidHit(tile)) {
        if (self.gamedata.turno == self.gamedata.player) {
          self.gamedata.socket.emit('click tile', self.gamedata.turno);
          // Cambia il turno di colui che ha cliccato e manda l'evento all'altro
          self.gamedata.turno = self.gamedata.turno == "1" ? "2" : "1";
          console.log("Turno di " + self.gamedata.turno)

          // Nave Colpita
          if (tile.value == 1) {
            this.boards[1].tiles[row][col].status = 'hit';
            self.onSunkCheck(+ row,+ col);
            this.score++;
            // Controlla se il giocatore ha vinto
            if(this.score == 27){
              self.gamedata.socket.emit('on victory', this.username);
              self.dataService.patchVictory(this.username);
              this.gameOver = true;
            }
          // Nave non Colpita
          } else {
              this.boards[1].tiles[row][col].status = 'miss' 
            }       
        } else {
            alert ("Non è il tuo turno.")
          }
      } else {
          alert ("Stai cliccando su una casella che hai già cliccato, riprova") 
        }
        
    }

    // Gestione colpo per la board avversaria
    self.submitPlayerClick = function(click:any) {
      
      let id = click,
      row = id.substring(2,3), col = id.substring(3,4),
      tile = this.boards[0].tiles[row][col];
      console.log(click);

      if (self.gamedata.turno != self.gamedata.player) {
        if (!this.checkValidHit(tile)) {
            return;
        }
        // Nave Colpita
        if (tile.value == 1) {
          this.boards[0].tiles[row][col].status = 'hit';
          // Nave mancata
        } else {
              this.boards[0].tiles[row][col].status = 'miss' 
          }
      } 
    }

    // Visualizza il colpo sulla board dell'avversario
    self.gamedata.socket.on('fire in the hole', function(data) {
      self.submitPlayerClick(data);
      console.log(data);
    })
  
  }

  // Resetta la board in Fase di Posizionamento
  resetBoard(){
    this.boards.shift();
    this.myBoard=this.boardService.createBoard()
    var fleet = this.ship_duplicate.slice(0);
    this.ship_array = fleet;
    console.log(this.ship_duplicate);  
  }

  // Invio board all'avversario
  submitBoard(){
    this.myBoard = this.boards[0].tiles;
    this.gamedata.socket.emit('submit board', this.boards[0].tiles);
    this.gamedata.sent = true;
    console.log(this.boards)
    return;
   }

  // Controlla se una tile è già stata cliccata
  checkValidHit(tile: any) : boolean {
    var clickable = true;

    if (tile.status == 'hit' || tile.status == 'miss') {
      clickable = false;
    }
    if (tile.value == 3 ) {
      clickable = false
    }
    return clickable;
  }

  // Ritorna Boards[]
  get boards () : Board[] {
    return this.boardService.getBoards()
  } 

  // Gestione dell'uscita dal Game Component
  canDeactivate() {
    console.log(this.gamedata.alone);
    if (this.gamedata.alone) {
      if(window.confirm('Stai abbandonando la coda, sei sicuro? La tua room verrà distrutta.')){
        this.gamedata.socket.emit('on leaving queue');
        return true;
      }
      else return false;
      
    } 
    if (!this.gameOver) {
      console.log(this.gamedata.gameId);
      if(window.confirm('Stai abbandonando la partita, sei sicuro? Ciò porterà ad una sconfitta.')){
        console.log(this.gamedata.gameId);
        this.gamedata.socket.emit('on leaving');
        this.dataService.patchDefeat(this.username);
        return true
      }
    } 
    else return true;
  }



}