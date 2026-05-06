import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'StockPro-UI';
  isLoggedIn = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Basic check for UI state
    this.isLoggedIn = !!localStorage.getItem('token');
    
    // Listen for storage changes
    window.addEventListener('storage', () => {
      this.isLoggedIn = !!localStorage.getItem('token');
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }
}
