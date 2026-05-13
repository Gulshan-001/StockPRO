import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { AlertService } from './features/alerts/services/alert.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showNav = false;

  constructor(private authService: AuthService, private router: Router, private alertService: AlertService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  ngOnInit() {
    if (this.isLoggedIn) {
      this.alertService.registerRecipient().subscribe();
    }

    this.router.events.subscribe(() => {
      const url = this.router.url;
      // Hide nav if on dashboard or login pages
      this.showNav = !url.includes('dashboard') && !url.includes('auth') && url !== '/';
    });
  }

  logout() {
    this.authService.logout();
  }
}
