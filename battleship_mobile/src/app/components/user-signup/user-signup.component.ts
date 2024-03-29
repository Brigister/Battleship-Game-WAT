import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router'

@Component({
  selector: 'app-user-signup',
  templateUrl: './user-signup.component.html',
  styleUrls: ['./user-signup.component.css']
})
export class UserSignupComponent implements OnInit {

  signupData = {}
  constructor(private _auth: AuthService,
              private _router: Router) { }

  ngOnInit() {
  }

  // Esegue la registrazione dell'utente
  registerUser() {
    this._auth.registerUser(this.signupData)
    .subscribe(
      res => {
        this._router.navigate(['/login'])
      },
      err => { console.log(err)
      document.getElementById("fail").innerText="I dati inseriti non sono corretti"
      }
    )      
  }


}