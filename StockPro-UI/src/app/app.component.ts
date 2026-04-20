import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="global-logo">StockPro</div>
    <router-outlet></router-outlet>
  `,
  styles: ['']
})
export class AppComponent {}
